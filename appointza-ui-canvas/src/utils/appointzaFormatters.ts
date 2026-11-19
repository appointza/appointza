/** Shared IST-facing date/time/money formatters for Appointza UI. */

const IST = "Asia/Kolkata";

function asDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "Thu, 19 Nov 2026" */
export function formatAppointzaDate(value: Date | string | number | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** e.g. "3:00 PM" — accepts Date, ISO, or "15:00:00" / "15:00" time strings. */
export function formatAppointzaTime(value: Date | string | number | null | undefined): string {
  if (value == null || value === "") return "";

  if (typeof value === "string") {
    const timeOnly = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeOnly) {
      const hours = Number(timeOnly[1]);
      const minutes = Number(timeOnly[2]);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const d = new Date(2000, 0, 1, hours, minutes, 0);
        return new Intl.DateTimeFormat("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(d);
      }
    }
  }

  const date = asDate(value);
  if (!date) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** e.g. "Thu, 19 Nov 2026 · 3:00 PM" */
export function formatAppointzaDateTime(value: Date | string | number | null | undefined): string {
  const date = asDate(value);
  if (!date) return "";
  return `${formatAppointzaDate(date)} · ${formatAppointzaTime(date)}`;
}

/** Always shows ₹, Indian grouping. */
export function formatAppointzaInr(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : Number(amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `₹${safe.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
