/** Calendar date helpers for event_date / from_date / to_date (no timezone shift). */

/** Parse API date or datetime as local calendar date using the YYYY-MM-DD portion only. */
export function parseApiDateOnly(raw: Date | string | null | undefined): Date | null {
  if (raw == null || raw === "") return null;

  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), 0, 0, 0, 0);
  }

  const match = String(raw).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

/** `<input type="date">` must use the local civil calendar. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse `YYYY-MM-DD` from a date input as local midnight (not UTC). */
export function parseDateInputValue(ymd: string): Date {
  const [y, m, day] = ymd.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !day) return new Date(NaN);
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

/** Format any event date value as YYYY-MM-DD (for inputs, API, and storage). */
export function toDateOnlyString(raw: Date | string | null | undefined): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = raw instanceof Date ? raw : parseApiDateOnly(raw);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return toDateInputValue(parsed);
}

/** Today as YYYY-MM-DD in the user's local calendar. */
export function todayDateOnlyString(): string {
  return toDateInputValue(new Date());
}

/** True when `ymd` is strictly after today (local calendar). */
export function isDateOnlyAfterToday(ymd: string): boolean {
  return ymd > todayDateOnlyString();
}

/** Compare two calendar dates (YYYY-MM-DD safe lexicographic compare). */
export function compareDateOnly(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): number {
  const aStr = toDateOnlyString(a);
  const bStr = toDateOnlyString(b);
  if (!aStr && !bStr) return 0;
  if (!aStr) return -1;
  if (!bStr) return 1;
  if (aStr < bStr) return -1;
  if (aStr > bStr) return 1;
  return 0;
}

/** True when `day` falls within [from, to] inclusive. */
export function isDateOnlyInRange(
  day: Date | string | null | undefined,
  from: Date | string | null | undefined,
  to: Date | string | null | undefined
): boolean {
  const d = toDateOnlyString(day);
  const f = toDateOnlyString(from);
  const t = toDateOnlyString(to);
  if (!d || !f || !t) return false;
  return d >= f && d <= t;
}

/** Format for display (e.g. card meta line). */
export function formatEventDateOnly(
  raw: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  const d = parseApiDateOnly(raw);
  if (!d) return "";
  return d.toLocaleDateString(undefined, options);
}

/** Long display format — e.g. "July 1, 2026". */
export function formatEventDateLong(raw: Date | string | null | undefined): string {
  const formatted = formatEventDateOnly(raw, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formatted || "N/A";
}

export function normalizeEventDatesFromApi<T extends {
  event_date?: Date | string | null;
  from_date?: Date | string | null;
  to_date?: Date | string | null;
}>(event: T): T {
  return {
    ...event,
    event_date: event.event_date != null ? toDateOnlyString(event.event_date) : null,
    from_date: event.from_date != null ? toDateOnlyString(event.from_date) : null,
    to_date: event.to_date != null ? toDateOnlyString(event.to_date) : null,
  };
}

/** Send date-only strings to the API so JSON does not shift the calendar day via UTC. */
export function normalizeEventDatesForApi<T extends {
  event_date?: Date | string | null;
  from_date?: Date | string | null;
  to_date?: Date | string | null;
}>(event: T): T {
  return {
    ...event,
    event_date: event.event_date != null ? toDateOnlyString(event.event_date) : null,
    from_date: event.from_date != null ? toDateOnlyString(event.from_date) : null,
    to_date: event.to_date != null ? toDateOnlyString(event.to_date) : null,
  };
}
