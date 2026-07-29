import { format } from "date-fns";
import type { StaffBookingItem } from "@/models/staffBooking";

export type CalendarBarKind = "same-day" | "multi-night";

export type CalendarBar = {
  booking: StaffBookingItem;
  leftPercent: number;
  widthPercent: number;
  kind: CalendarBarKind;
  lane: number;
};

export function dayIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Visible booking bars for a room row within the month grid. */
export function computeBookingBars(bookings: StaffBookingItem[], dayIsos: string[]): CalendarBar[] {
  if (dayIsos.length === 0) return [];

  const monthFirst = dayIsos[0];
  const monthLast = dayIsos[dayIsos.length - 1];
  const total = dayIsos.length;

  const raw: Omit<CalendarBar, "lane">[] = [];

  for (const booking of bookings) {
    if (!booking.checkIn || !booking.checkOut) continue;
    if (booking.checkOut <= monthFirst || booking.checkIn > monthLast) continue;

    if (booking.checkIn === booking.checkOut) {
      const idx = dayIsos.indexOf(booking.checkIn);
      if (idx < 0) continue;
      raw.push({
        booking,
        leftPercent: (idx / total) * 100,
        widthPercent: (1 / total) * 100,
        kind: "same-day",
      });
      continue;
    }

    const startIso = booking.checkIn < monthFirst ? monthFirst : booking.checkIn;
    let startIdx = dayIsos.indexOf(startIso);
    if (startIdx < 0) startIdx = 0;

    let endIdx: number;
    if (booking.checkOut > monthLast) {
      endIdx = total;
    } else {
      const checkoutIdx = dayIsos.indexOf(booking.checkOut);
      endIdx = checkoutIdx >= 0 ? checkoutIdx + 1 : total;
    }

    if (endIdx <= startIdx) continue;

    raw.push({
      booking,
      leftPercent: (startIdx / total) * 100,
      widthPercent: ((endIdx - startIdx) / total) * 100,
      kind: "multi-night",
    });
  }

  return assignLanes(raw);
}

function assignLanes(bars: Omit<CalendarBar, "lane">[]): CalendarBar[] {
  const sorted = [...bars].sort((a, b) => a.leftPercent - b.leftPercent || b.widthPercent - a.widthPercent);
  const laneEnds: number[] = [];

  return sorted.map((bar) => {
    const barEnd = bar.leftPercent + bar.widthPercent;
    let lane = laneEnds.findIndex((end) => end <= bar.leftPercent + 0.01);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(barEnd);
    } else {
      laneEnds[lane] = barEnd;
    }
    return { ...bar, lane };
  });
}

export function maxLane(bars: CalendarBar[]): number {
  if (bars.length === 0) return 0;
  return Math.max(...bars.map((b) => b.lane));
}

export function barClass(kind: CalendarBarKind, selected: boolean): string {
  if (selected) return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 shadow-sm";
  if (kind === "same-day") return "bg-fuchsia-600 text-white";
  return "bg-blue-600 text-white border-l-4 border-l-emerald-400 border-r-4 border-r-amber-300";
}
