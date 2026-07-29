/** Shape expected by EventBookingPage dynamic form. */
export type EventBookingFormField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  /** Lower numbers appear first on the booking form (PascalCase in stored JSON). */
  DisplayOrder?: number;
};

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function isValidEventBookingFieldKey(key: string): boolean {
  return KEY_PATTERN.test(key.trim());
}

/** Build a valid internal key from a human label (Latin). For non-Latin labels, uses a stable random `field_*` id. */
export function slugifyEventBookingFieldKey(label: string): string {
  const strippedCombining = label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const ascii = strippedCombining
    .replace(/[^A-Za-z0-9_\s-]+/g, " ")
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
  let base = ascii.replace(/^_+|_+$/g, "").replace(/^[0-9_]+/, "");
  if (!base.length || !/^[a-zA-Z]/.test(base)) {
    base = `field_${Math.random().toString(36).slice(2, 10)}`;
  }
  if (!isValidEventBookingFieldKey(base)) {
    base = `field_${Math.random().toString(36).slice(2, 12)}`;
  }
  return base.slice(0, 80);
}

export function ensureUniqueEventBookingFieldKey(fields: EventBookingFormField[], key: string): string {
  const k0 = key.trim();
  let candidate = k0;
  let n = 2;
  while (fields.some((f) => f.key.toLowerCase() === candidate.toLowerCase())) {
    candidate = `${k0}_${n}`;
    n += 1;
  }
  return candidate;
}

export function parseEventBookingFormFieldsFromNotes(notes: string): EventBookingFormField[] {
  try {
    const trimmed = notes?.trim();
    if (!trimmed) return [];
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return normalizeFields(parsed);
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { fields?: unknown }).fields)) {
      return normalizeFields((parsed as { fields: unknown[] }).fields);
    }
  } catch {
    /* leave empty */
  }
  return [];
}

function readRawDisplayOrder(x: Record<string, unknown>): number | undefined {
  const raw = x.DisplayOrder ?? x.displayOrder;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseInt(raw.trim(), 10);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function normalizeFields(raw: unknown[]): EventBookingFormField[] {
  const mapped = raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => ({
      key: String(x.key ?? "").trim(),
      label: String(x.label ?? "").trim(),
      type: (String(x.type ?? "string").trim() || "string").toLowerCase(),
      required: Boolean(x.required),
      DisplayOrder: readRawDisplayOrder(x),
    }))
    .filter((f) => f.key.length > 0 && f.label.length > 0);

  return mapped.map((f, i) => ({
    ...f,
    DisplayOrder:
      typeof f.DisplayOrder === "number" && Number.isFinite(f.DisplayOrder) && f.DisplayOrder >= 1
        ? f.DisplayOrder
        : (i + 1) * 10,
  }));
}

/** Sort order for booking form (missing treated as very large). */
export function readEventBookingFieldDisplayOrder(f: EventBookingFormField): number {
  const d = f.DisplayOrder;
  if (typeof d === "number" && Number.isFinite(d) && d >= 1) return d;
  return 1_000_000_000;
}

export function sortEventBookingFormFieldsByDisplayOrder(fields: EventBookingFormField[]): EventBookingFormField[] {
  return [...fields].sort((a, b) => {
    const da = readEventBookingFieldDisplayOrder(a);
    const db = readEventBookingFieldDisplayOrder(b);
    if (da !== db) return da - db;
    return a.key.localeCompare(b.key);
  });
}

export function nextEventBookingFieldDisplayOrder(fields: EventBookingFormField[]): number {
  let max = 0;
  for (const f of fields) {
    const d = f.DisplayOrder;
    if (typeof d === "number" && Number.isFinite(d) && d >= 1 && d < 1_000_000_000) {
      max = Math.max(max, d);
    }
  }
  return max > 0 ? max + 10 : 10;
}

export function serializeEventBookingFormFields(fields: EventBookingFormField[]): string {
  const sorted = sortEventBookingFormFieldsByDisplayOrder(fields);
  const cleaned = sorted
    .map((f, i) => {
      let ord = f.DisplayOrder;
      if (typeof ord !== "number" || !Number.isFinite(ord) || ord < 1) {
        ord = (i + 1) * 10;
      }
      return {
        key: f.key.trim(),
        label: f.label.trim(),
        type: (f.type || "string").trim().toLowerCase() || "string",
        required: Boolean(f.required),
        DisplayOrder: ord,
      };
    })
    .filter((f) => f.key.length > 0 && f.label.length > 0);
  return JSON.stringify({ fields: cleaned });
}

export function validateEventBookingFormFields(fields: EventBookingFormField[]): { ok: true } | { ok: false; message: string } {
  if (!fields.length) {
    return { ok: false, message: "Add at least one form field." };
  }
  const keys = new Set<string>();
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (!f.label.trim()) {
      return { ok: false, message: `Field ${i + 1}: enter a label.` };
    }
    if (!f.key.trim()) {
      return { ok: false, message: `Field ${i + 1}: enter a key (e.g. date_of_birth).` };
    }
    if (!KEY_PATTERN.test(f.key.trim())) {
      return {
        ok: false,
        message: `Field "${f.label}": key must start with a letter and use only letters, numbers, and underscores.`,
      };
    }
    const k = f.key.trim().toLowerCase();
    if (keys.has(k)) {
      return { ok: false, message: `Duplicate key "${f.key.trim()}". Keys must be unique.` };
    }
    keys.add(k);
  }
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const d = f.DisplayOrder;
    if (d !== undefined && d !== null && (typeof d !== "number" || !Number.isFinite(d) || d < 1)) {
      return {
        ok: false,
        message: `Field "${f.label}": display order must be a positive number.`,
      };
    }
  }
  return { ok: true };
}

export const EVENT_BOOKING_FIELD_TYPES = [
  "string",
  "text",
  "number",
  "integer",
  "date",
  "datetime",
  "time",
  "boolean",
] as const;
