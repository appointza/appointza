import { ReferenceValue } from "@/models/referencevalue.model";

const MISSING_ORDER_SENTINEL = 2_000_000_000;

/** Explicit DisplayOrder from attributes only (no sentinel). */
export function readReferenceValueDisplayOrder(rv: ReferenceValue): number | undefined {
  const attrs = rv.attributes as Record<string, unknown> | undefined;
  if (!attrs || typeof attrs !== "object") return undefined;
  const raw = attrs.DisplayOrder ?? attrs.displayOrder;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/** Sort key: explicit DisplayOrder first, then stable fallback (identifier). */
export function getReferenceValueSortKey(rv: ReferenceValue): number {
  const o = readReferenceValueDisplayOrder(rv);
  if (o !== undefined) return o;
  return MISSING_ORDER_SENTINEL;
}

export function sortReferenceValuesByDisplayOrder(values: ReferenceValue[]): ReferenceValue[] {
  return [...values].sort((a, b) => {
    const ka = getReferenceValueSortKey(a);
    const kb = getReferenceValueSortKey(b);
    if (ka !== kb) return ka - kb;
    const idCmp = (a.identifier || "").localeCompare(b.identifier || "");
    if (idCmp !== 0) return idCmp;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

export function nextReferenceValueDisplayOrder(existing: ReferenceValue[]): number {
  let max = 0;
  for (const v of existing) {
    const o = readReferenceValueDisplayOrder(v);
    if (o !== undefined && o > max) max = o;
  }
  return max + 1;
}

export function mergeReferenceValueAttributes(
  rv: ReferenceValue,
  patch: Record<string, unknown>
): ReferenceValue.AttributesData {
  const base =
    rv.attributes && typeof rv.attributes === "object"
      ? { ...(rv.attributes as Record<string, unknown>) }
      : {};
  return { ...base, ...patch } as ReferenceValue.AttributesData;
}
