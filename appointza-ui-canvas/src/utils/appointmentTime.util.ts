import { Weeks } from "@/models/organisationservicetiming.model";

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

export function formatAppointmentTime(timeValue: unknown): string {
  const ms = parseDotNetTimeSpanToMilliseconds(timeValue);
  if (ms == null || !Number.isFinite(ms)) return "—";
  const d = new Date(new Date(1970, 0, 1).getTime() + ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** UTC midnight for API date fields (matches booking flow). */
export function sendAppointmentDateToApi(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
}

/** Monday=1 … Sunday=7 for OrganisationServiceTimingSelectReq. */
export function getAppointmentDayNumber(date: Date): number {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  return Weeks[dayName as keyof typeof Weeks] ?? 1;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseAppointmentDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}
