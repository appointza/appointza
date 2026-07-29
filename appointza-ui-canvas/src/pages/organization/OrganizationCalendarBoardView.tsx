import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import {
  CalendarBookingOverviewItem,
  CalendarDayOverview,
  CalendarSlotOverviewItem,
} from "@/models/organisationservicetiming.model";
import {
  formatAppointmentTime,
  parseAppointmentDate,
  parseDotNetTimeSpanToMilliseconds,
  toDateKey,
} from "@/utils/appointmentTime.util";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type OrganizationCalendarBoardViewProps = {
  calendarMonth: Date;
  selectedDate: Date;
  locationLabel: string;
  monthDays: CalendarDayOverview[];
  isLoading: boolean;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
};

function findBookingForSlot(
  slot: CalendarSlotOverviewItem,
  bookings: CalendarBookingOverviewItem[],
): CalendarBookingOverviewItem | undefined {
  const slotMs = parseDotNetTimeSpanToMilliseconds(slot.fromtime);
  if (slotMs == null) return undefined;
  return bookings.find((b) => {
    const bookingMs = parseDotNetTimeSpanToMilliseconds(b.fromtime);
    return bookingMs != null && bookingMs === slotMs;
  });
}

function dayOverviewByKey(days: CalendarDayOverview[]): Map<string, CalendarDayOverview> {
  const map = new Map<string, CalendarDayOverview>();
  for (const day of days) {
    const parsed = parseAppointmentDate(day.date);
    if (parsed) map.set(toDateKey(parsed), day);
  }
  return map;
}

const OrganizationCalendarBoardView = ({
  calendarMonth,
  selectedDate,
  locationLabel,
  monthDays,
  isLoading,
  onMonthChange,
  onSelectDate,
}: OrganizationCalendarBoardViewProps) => {
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const overviewByKey = dayOverviewByKey(monthDays);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(org.btnOutline, "h-9 w-9 shrink-0")}
            onClick={() => onMonthChange(subMonths(calendarMonth, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-lg font-semibold text-appointza-navy">
            {format(calendarMonth, "MMMM yyyy")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(org.btnOutline, "h-9 w-9 shrink-0")}
            onClick={() => onMonthChange(addMonths(calendarMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
          {locationLabel ? (
            <span className="font-medium text-appointza-navy">{locationLabel}</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-300" />
            Booked
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className={cn(org.card, "flex items-center justify-center gap-2 py-24 text-sm text-stone-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-[#E85D4C]" />
          Loading calendar…
        </div>
      ) : (
        <div className={cn(org.card, "overflow-hidden p-2 sm:p-3")}>
          <div className="grid grid-cols-7 border-b border-stone-100 pb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-500"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-stone-100">
            {gridDays.map((day) => {
              const key = toDateKey(day);
              const overview = overviewByKey.get(key);
              const inMonth = isSameMonth(day, calendarMonth);
              const isSelected = isSameDay(day, selectedDate);
              const slots = overview?.slots ?? [];
              const bookings = overview?.bookings ?? [];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    "flex min-h-[9.5rem] flex-col bg-white p-1.5 text-left transition-colors sm:min-h-[11rem] sm:p-2",
                    !inMonth && "bg-stone-50/80 opacity-60",
                    isSelected && "ring-2 ring-inset ring-[#E85D4C] z-[1]",
                    isToday(day) && !isSelected && "bg-[#FFF8F6]",
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday(day)
                          ? "bg-[#E85D4C] text-white"
                          : inMonth
                            ? "text-appointza-navy"
                            : "text-stone-400",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {overview && (overview.available_count > 0 || overview.booked_slot_count > 0) ? (
                      <span className="text-[10px] tabular-nums text-stone-500">
                        <span className="text-emerald-700">{overview.available_count}</span>
                        <span className="text-stone-300"> / </span>
                        <span className="text-stone-600">{overview.booked_slot_count}</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {slots.length === 0 ? (
                      inMonth ? (
                        <p className="text-[10px] leading-tight text-stone-400">No slots</p>
                      ) : null
                    ) : (
                      slots.map((slot, index) => {
                        const isAvailable =
                          slot.statuscode?.toLowerCase() === "available";
                        const booking = !isAvailable
                          ? findBookingForSlot(slot, bookings)
                          : undefined;

                        return (
                          <div
                            key={`${slot.fromtime}-${index}`}
                            className={cn(
                              "rounded-md border px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
                              isAvailable
                                ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                                : "border-stone-200 bg-stone-100 text-stone-700",
                            )}
                          >
                            <div className="font-semibold tabular-nums">
                              {formatAppointmentTime(slot.fromtime)}
                              <span className="font-normal text-stone-500">
                                {" "}
                                · {isAvailable ? "Open" : "Booked"}
                              </span>
                            </div>
                            {!isAvailable && booking ? (
                              <div className="truncate font-medium text-appointza-navy">
                                {booking.username || "Customer"}
                              </div>
                            ) : null}
                            {!isAvailable && booking?.servicenames ? (
                              <div className="truncate text-stone-500">{booking.servicenames}</div>
                            ) : null}
                          </div>
                        );
                      })
                    )}

                    {bookings.length > 0 && slots.length === 0 ? (
                      <div className="space-y-0.5">
                        {bookings.map((b) => (
                          <div
                            key={b.id}
                            className="rounded-md border border-[#FFD4CC] bg-[#FFF0EB] px-1 py-0.5 text-[10px] sm:text-[11px]"
                          >
                            <div className="font-semibold tabular-nums text-stone-700">
                              {formatAppointmentTime(b.fromtime)}
                            </div>
                            <div className="truncate font-medium text-appointza-navy">
                              {b.username || "Customer"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-500">
        Full month view — each day shows all time slots (green = available, gray = booked) and who
        booked. Tap a day to highlight it. Counts show available / booked slots.
      </p>
    </div>
  );
};

export default OrganizationCalendarBoardView;
