import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  barClass,
  computeBookingBars,
  dayIso,
  maxLane,
} from "@/components/bookings/bookingCalendar.util";
import {
  formatCompactTimeRange,
  type StaffBookingItem,
  type StaffRoomRow,
} from "@/models/staffBooking";

const DAY_COL_MIN = 40;
const ROOM_COL_WIDTH_MOBILE = 88;
const ROOM_COL_WIDTH_DESKTOP = 132;
const LANE_HEIGHT = 26;
const ROW_PAD = 8;

type RoomBookingCalendarProps = {
  monthLabel: string;
  days: Date[];
  today: string;
  rooms: StaffRoomRow[];
  bookingsByRoom: Map<string, StaffBookingItem[]>;
  noRoomBookings: StaffBookingItem[];
  selectedId: string | null;
  onSelect: (booking: StaffBookingItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

function bookingKey(booking: StaffBookingItem) {
  return booking.id || booking.bookingCode;
}

function bookingTooltip(booking: StaffBookingItem) {
  const time = formatCompactTimeRange(booking.checkInTime, booking.checkOutTime);
  const guest = booking.guestName || "Guest";
  const code = booking.bookingCode ? ` · ${booking.bookingCode}` : "";
  return time ? `${guest}${code} · ${time}` : `${guest}${code}`;
}

function RoomTimelineRow({
  label,
  subLabel,
  muted,
  dayIsos,
  bookings,
  today,
  selectedId,
  onSelect,
  roomColWidth,
}: {
  label: string;
  subLabel?: string;
  muted?: boolean;
  dayIsos: string[];
  bookings: StaffBookingItem[];
  today: string;
  selectedId: string | null;
  onSelect: (booking: StaffBookingItem) => void;
  roomColWidth: number;
}) {
  const bars = computeBookingBars(bookings, dayIsos);
  const lanes = maxLane(bars) + 1;
  const rowHeight = Math.max(48, lanes * LANE_HEIGHT + ROW_PAD * 2);

  return (
    <div className="relative border-b last:border-b-0" style={{ height: rowHeight }}>
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `${roomColWidth}px repeat(${dayIsos.length}, minmax(${DAY_COL_MIN}px, 1fr))`,
        }}
      >
        <div
          className={`sticky left-0 z-20 border-r px-2 sm:px-3 py-2 flex flex-col justify-center ${
            muted ? "bg-muted/40 text-muted-foreground" : "bg-card"
          }`}
        >
          <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
          {subLabel && <span className="text-[10px] text-muted-foreground truncate">{subLabel}</span>}
        </div>

        {dayIsos.map((iso) => (
          <div
            key={iso}
            className={`border-r last:border-r-0 h-full ${
              iso === today ? "bg-primary/5" : muted ? "bg-muted/10" : "bg-background"
            }`}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute top-0 bottom-0"
        style={{ left: roomColWidth, right: 0 }}
      >
        <div className="relative h-full w-full">
          {bars.map((bar) => {
            const key = bookingKey(bar.booking);
            const selected = selectedId === key;
            return (
              <button
                key={key}
                type="button"
                title={bookingTooltip(bar.booking)}
                onClick={() => onSelect(bar.booking)}
                className={`pointer-events-auto absolute rounded-md px-1 sm:px-1.5 text-[10px] font-medium truncate leading-tight transition-opacity hover:opacity-90 ${barClass(
                  bar.kind,
                  selected
                )}`}
                style={{
                  left: `calc(${bar.leftPercent}% + 2px)`,
                  width: `calc(${bar.widthPercent}% - 4px)`,
                  top: ROW_PAD + bar.lane * LANE_HEIGHT,
                  height: LANE_HEIGHT - 4,
                }}
              >
                <span className="block truncate">
                  {bar.booking.guestName.split(" ")[0]}
                  {bar.booking.roomNumber ? ` · R${bar.booking.roomNumber}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RoomBookingCalendar({
  monthLabel,
  days,
  today,
  rooms,
  bookingsByRoom,
  noRoomBookings,
  selectedId,
  onSelect,
  onPrev,
  onNext,
  onToday,
}: RoomBookingCalendarProps) {
  const dayIsos = days.map(dayIso);
  const [roomColWidth, setRoomColWidth] = useState(ROOM_COL_WIDTH_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () =>
      setRoomColWidth(mq.matches ? ROOM_COL_WIDTH_MOBILE : ROOM_COL_WIDTH_DESKTOP);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="flex flex-col min-h-0 min-w-0 w-full flex-1 rounded-lg border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b shrink-0">
        <h2 className="text-sm sm:text-base font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 px-3 sm:h-8" onClick={onToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={onNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-auto overscroll-contain touch-pan-x">
        <div className="min-w-max w-max">
          <div
            className="grid sticky top-0 z-30 bg-muted/95 backdrop-blur-sm border-b"
            style={{
              gridTemplateColumns: `${roomColWidth}px repeat(${dayIsos.length}, minmax(${DAY_COL_MIN}px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-40 bg-muted/95 border-r px-2 sm:px-3 py-2 text-xs font-medium">
              Room
            </div>
            {days.map((d) => {
              const iso = dayIso(d);
              const isToday = iso === today;
              return (
                <div
                  key={iso}
                  className={`border-r last:border-r-0 px-0.5 py-2 text-center text-xs font-medium ${
                    isToday ? "bg-primary/15 text-primary" : ""
                  }`}
                >
                  <div>{format(d, "d")}</div>
                  <div className="text-[9px] font-normal text-muted-foreground">{format(d, "EEE")}</div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {rooms.map((room) => (
              <div key={room.id} className="relative">
                <RoomTimelineRow
                  label={`R${room.roomNumber}`}
                  subLabel={room.roomName || undefined}
                  dayIsos={dayIsos}
                  bookings={bookingsByRoom.get(room.id) ?? []}
                  today={today}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  roomColWidth={roomColWidth}
                />
              </div>
            ))}

            {noRoomBookings.length > 0 && (
              <div className="relative">
                <RoomTimelineRow
                  label="Add-ons"
                  subLabel="No room"
                  muted
                  dayIsos={dayIsos}
                  bookings={noRoomBookings}
                  today={today}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  roomColWidth={roomColWidth}
                />
              </div>
            )}

            {rooms.length === 0 && noRoomBookings.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No rooms or bookings for this month.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2 border-t flex flex-wrap gap-2 sm:gap-3 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-600 border-l-2 border-l-emerald-400 border-r-2 border-r-amber-300" />{" "}
          Multi-night
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-fuchsia-600" /> Same-day
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary/20 ring-1 ring-primary/40" /> Today
        </span>
        <span className="sm:hidden text-muted-foreground/80">Swipe sideways for all days</span>
      </div>
    </div>
  );
}
