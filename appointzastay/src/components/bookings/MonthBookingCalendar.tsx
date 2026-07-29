import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCompactTimeRange,
  type StaffBookingItem,
} from "@/models/staffBooking";

const WEEK_STARTS_ON = 1 as const; // Monday
const MAX_VISIBLE_LANES = 3;
const LANE_HEIGHT = 22;
const DAY_HEADER_H = 28;

export type MonthCalendarViewMode = "month" | "list";

type MonthBookingCalendarProps = {
  monthDate: Date;
  todayIso: string;
  bookings: StaffBookingItem[];
  selectedId: string | null;
  viewMode: MonthCalendarViewMode;
  onViewModeChange: (mode: MonthCalendarViewMode) => void;
  onSelect: (booking: StaffBookingItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDayClick?: (iso: string) => void;
};

type WeekSegment = {
  booking: StaffBookingItem;
  startCol: number; // 0-6
  span: number; // days
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

function bookingKey(booking: StaffBookingItem) {
  return booking.id || booking.bookingCode;
}

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Inclusive stay nights: check-in day through day before check-out (overnight). Same-day stays occupy check-in only. */
function bookingOccupiesDay(booking: StaffBookingItem, dayIso: string): boolean {
  if (!booking.checkIn) return false;
  if (!booking.checkOut || booking.checkOut === booking.checkIn) {
    return booking.checkIn === dayIso;
  }
  return booking.checkIn <= dayIso && dayIso < booking.checkOut;
}

function bookingEndExclusive(booking: StaffBookingItem): string {
  if (!booking.checkOut || booking.checkOut === booking.checkIn) {
    // same-day: occupy one day → exclusive end = next day
    const d = parseIso(booking.checkIn);
    return toIso(addDays(d, 1));
  }
  return booking.checkOut;
}

function colorForBooking(booking: StaffBookingItem): string {
  const status = (booking.status || "").toLowerCase();
  if (status.includes("cancel")) return "bg-slate-400 text-white";
  if (status.includes("check") || status.includes("inhouse") || status.includes("in_house")) {
    return "bg-sky-600 text-white";
  }
  if (status.includes("pending") || status.includes("hold")) return "bg-violet-600 text-white";
  if ((booking.balance ?? 0) > 0) return "bg-amber-600 text-white";

  // Stable accent from room / code for visual variety
  const seed = `${booking.roomNumber || ""}${booking.bookingCode || booking.id}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const palette = [
    "bg-teal-600 text-white",
    "bg-indigo-600 text-white",
    "bg-emerald-600 text-white",
    "bg-blue-600 text-white",
    "bg-fuchsia-600 text-white",
    "bg-cyan-700 text-white",
  ];
  return palette[hash % palette.length];
}

function labelForBooking(booking: StaffBookingItem) {
  const time = formatCompactTimeRange(booking.checkInTime, booking.checkOutTime);
  const guest = booking.guestName?.split(" ")[0] || "Guest";
  const room = booking.roomNumber ? ` R${booking.roomNumber}` : "";
  return time ? `${time} ${guest}${room}` : `${guest}${room}`;
}

function assignLanes(segments: Omit<WeekSegment, "lane">[]): WeekSegment[] {
  const sorted = [...segments].sort((a, b) => a.startCol - b.startCol || b.span - a.span);
  const laneEnds: number[] = [];
  return sorted.map((seg) => {
    const end = seg.startCol + seg.span;
    let lane = laneEnds.findIndex((e) => e <= seg.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { ...seg, lane };
  });
}

function buildWeekSegments(weekDays: Date[], bookings: StaffBookingItem[]): WeekSegment[] {
  const weekStartIso = toIso(weekDays[0]);
  const weekEndExclusive = toIso(addDays(weekDays[6], 1));
  const raw: Omit<WeekSegment, "lane">[] = [];

  for (const booking of bookings) {
    if (!booking.checkIn) continue;
    const start = booking.checkIn;
    const endEx = bookingEndExclusive(booking);
    if (endEx <= weekStartIso || start >= weekEndExclusive) continue;

    const segStart = start < weekStartIso ? weekStartIso : start;
    const segEndEx = endEx > weekEndExclusive ? weekEndExclusive : endEx;

    const startCol = weekDays.findIndex((d) => toIso(d) === segStart);
    if (startCol < 0) continue;

    let span = 0;
    for (let i = startCol; i < 7; i++) {
      const iso = toIso(weekDays[i]);
      if (iso >= segEndEx) break;
      span++;
    }
    if (span <= 0) continue;

    raw.push({
      booking,
      startCol,
      span,
      continuesBefore: start < weekStartIso,
      continuesAfter: endEx > weekEndExclusive,
    });
  }

  return assignLanes(raw);
}

function WeekRow({
  weekDays,
  monthDate,
  todayIso,
  bookings,
  selectedId,
  onSelect,
  onDayClick,
}: {
  weekDays: Date[];
  monthDate: Date;
  todayIso: string;
  bookings: StaffBookingItem[];
  selectedId: string | null;
  onSelect: (booking: StaffBookingItem) => void;
  onDayClick?: (iso: string) => void;
}) {
  const segments = buildWeekSegments(weekDays, bookings);
  const visible = segments.filter((s) => s.lane < MAX_VISIBLE_LANES);
  const overflowByDay = weekDays.map((day) => {
    const iso = toIso(day);
    const dayBookings = bookings.filter((b) => bookingOccupiesDay(b, iso));
    const shown = new Set(
      visible
        .filter((s) => {
          const start = s.startCol;
          const end = s.startCol + s.span;
          const col = weekDays.findIndex((d) => toIso(d) === iso);
          return col >= start && col < end;
        })
        .map((s) => bookingKey(s.booking))
    );
    return Math.max(0, dayBookings.length - shown.size);
  });

  const maxLaneUsed = visible.reduce((m, s) => Math.max(m, s.lane), -1);
  const eventsHeight = Math.max(1, maxLaneUsed + 1) * LANE_HEIGHT + 4;
  const rowMinHeight = DAY_HEADER_H + eventsHeight + 18;

  return (
    <div
      className="grid grid-cols-7 border-b last:border-b-0 relative"
      style={{ minHeight: rowMinHeight }}
    >
      {weekDays.map((day, col) => {
        const iso = toIso(day);
        const inMonth = isSameMonth(day, monthDate);
        const today = iso === todayIso || isToday(day);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onDayClick?.(iso)}
            className={`relative border-r last:border-r-0 text-left align-top px-1 pt-1 pb-8 transition-colors ${
              today ? "bg-sky-50" : inMonth ? "bg-card hover:bg-muted/30" : "bg-muted/20"
            }`}
            style={{ minHeight: rowMinHeight }}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                today
                  ? "bg-sky-600 text-white"
                  : inMonth
                    ? "text-foreground"
                    : "text-muted-foreground/60"
              }`}
            >
              {format(day, "d")}
            </span>
            {overflowByDay[col] > 0 && (
              <span className="absolute bottom-1 left-1 text-[10px] text-muted-foreground font-medium">
                +{overflowByDay[col]} more
              </span>
            )}
          </button>
        );
      })}

      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{ top: DAY_HEADER_H, height: eventsHeight }}
      >
        {visible.map((seg) => {
          const key = bookingKey(seg.booking);
          const selected = selectedId === key;
          const left = (seg.startCol / 7) * 100;
          const width = (seg.span / 7) * 100;
          return (
            <button
              key={`${key}-${seg.startCol}-${seg.lane}`}
              type="button"
              title={labelForBooking(seg.booking)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(seg.booking);
              }}
              className={`pointer-events-auto absolute truncate px-1.5 text-[10px] sm:text-[11px] font-medium leading-[18px] shadow-sm transition-opacity hover:opacity-90 ${
                selected ? "ring-2 ring-offset-1 ring-sky-500 z-10" : ""
              } ${colorForBooking(seg.booking)} ${
                seg.continuesBefore ? "rounded-l-none" : "rounded-l-md"
              } ${seg.continuesAfter ? "rounded-r-none" : "rounded-r-md"}`}
              style={{
                left: `calc(${left}% + 2px)`,
                width: `calc(${width}% - 4px)`,
                top: seg.lane * LANE_HEIGHT,
                height: LANE_HEIGHT - 3,
              }}
            >
              {labelForBooking(seg.booking)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  monthDate,
  bookings,
  selectedId,
  onSelect,
}: {
  monthDate: Date;
  bookings: StaffBookingItem[];
  selectedId: string | null;
  onSelect: (booking: StaffBookingItem) => void;
}) {
  const monthStart = toIso(startOfMonth(monthDate));
  const monthEnd = toIso(endOfMonth(monthDate));
  const list = bookings
    .filter((b) => b.checkIn && b.checkIn <= monthEnd && (bookingEndExclusive(b) > monthStart))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.guestName.localeCompare(b.guestName));

  if (list.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        No bookings in {format(monthDate, "MMMM yyyy")}.
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto divide-y">
      {list.map((b) => {
        const key = bookingKey(b);
        const selected = selectedId === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(b)}
            className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
              selected ? "bg-sky-50" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${colorForBooking(b).split(" ")[0]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{b.guestName || "Guest"}</p>
                <p className="text-xs text-muted-foreground">
                  {b.checkIn}
                  {b.checkOut && b.checkOut !== b.checkIn ? ` → ${b.checkOut}` : ""}
                  {b.roomNumber ? ` · Room ${b.roomNumber}` : ""}
                  {formatCompactTimeRange(b.checkInTime, b.checkOutTime)
                    ? ` · ${formatCompactTimeRange(b.checkInTime, b.checkOutTime)}`
                    : ""}
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0">{b.bookingCode}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function MonthBookingCalendar({
  monthDate,
  todayIso,
  bookings,
  selectedId,
  viewMode,
  onViewModeChange,
  onSelect,
  onPrev,
  onNext,
  onToday,
  onDayClick,
}: MonthBookingCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const calendarEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: WEEK_STARTS_ON });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const weekdayLabels = eachDayOfInterval({
    start: calendarStart,
    end: addDays(calendarStart, 6),
  }).map((d) => format(d, "EEE"));

  return (
    <div className="flex flex-col min-h-0 min-w-0 w-full flex-1 rounded-lg border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bg-sky-50/80 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm sm:text-base font-semibold min-w-[9rem] text-center">
            {format(monthDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hidden sm:inline">View:</span>
          <Button
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "month" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange("month")}
            aria-label="Month view"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <ListView
          monthDate={monthDate}
          bookings={bookings}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 overflow-auto">
          <div className="grid grid-cols-7 border-b bg-muted/40 sticky top-0 z-10">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="px-1 py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="min-w-[640px] sm:min-w-0">
            {weeks.map((weekDays) => (
              <WeekRow
                key={toIso(weekDays[0])}
                weekDays={weekDays}
                monthDate={monthDate}
                todayIso={todayIso}
                bookings={bookings}
                selectedId={selectedId}
                onSelect={onSelect}
                onDayClick={onDayClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function bookingsForDay(bookings: StaffBookingItem[], dayIso: string) {
  return bookings.filter((b) => bookingOccupiesDay(b, dayIso));
}

export function isSameCalendarDay(a: Date, b: Date) {
  return isSameDay(a, b);
}
