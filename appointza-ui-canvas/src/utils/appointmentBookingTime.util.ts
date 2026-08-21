import { isToday } from "date-fns";

/** Parses .NET TimeSpan JSON (e.g. "23:15:00", "1.00:00:00") into milliseconds from midnight. */
export function parseDotNetTimeSpanToMilliseconds(span: unknown): number | null {
  if (span == null) return null;
  const s = String(span).trim();
  if (!s) return null;
  const withDays = /^(-?)(\d+)\.(\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (withDays) {
    const sign = withDays[1] === "-" ? -1 : 1;
    const days = parseInt(withDays[2], 10);
    const hh = parseInt(withDays[3], 10);
    const mm = parseInt(withDays[4], 10);
    const ss = parseInt(withDays[5], 10);
    return sign * ((days * 24 + hh) * 3600 + mm * 60 + ss) * 1000;
  }
  const hms = /^(-?)(\d{1,2}):(\d{2}):(\d{2})/.exec(s);
  if (hms) {
    const sign = hms[1] === "-" ? -1 : 1;
    const hh = parseInt(hms[2], 10);
    const mm = parseInt(hms[3], 10);
    const ss = parseInt(hms[4], 10);
    return sign * (hh * 3600 + mm * 60 + ss) * 1000;
  }
  return null;
}

/** Start instant of a slot on the given calendar day (local), using the same time encoding as the API. */
export function getSlotStartOnCalendarDay(
  selectedDate: Date,
  fromtime: string | undefined | null,
): Date | null {
  const day = new Date(selectedDate);
  day.setHours(0, 0, 0, 0);

  if (fromtime == null || String(fromtime).trim() === "") return null;

  const ms = parseDotNetTimeSpanToMilliseconds(fromtime);
  if (ms != null && Number.isFinite(ms)) {
    return new Date(day.getTime() + ms);
  }

  const s = String(fromtime).trim();
  const hms = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (hms) {
    const d = new Date(day);
    d.setHours(
      parseInt(hms[1], 10),
      parseInt(hms[2], 10),
      parseInt(hms[3] || "0", 10),
      0,
    );
    return d;
  }

  return null;
}

/** True when the selected day is today (local) and the slot start is not after "now". */
export function isTimeSlotInPastForToday(
  selectedDate: Date,
  fromtime: string | undefined | null,
  now: Date = new Date(),
): boolean {
  if (!fromtime || !isToday(selectedDate)) return false;
  const start = getSlotStartOnCalendarDay(selectedDate, fromtime);
  if (!start) return false;
  return start.getTime() <= now.getTime();
}
