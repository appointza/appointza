import { ROOM_STATUSES } from "@/config/roomCatalog";
import type { RoomDefinition } from "@/models/room";
import { normalizeRoom } from "@/models/room";

export interface CleaningStaffMember {
  Id: string;
  Name: string;
  Phone: string;
}

export interface RoomStatusPayload {
  today: string;
  asOf?: string;
  selectedId?: string;
  counts: Record<string, number>;
  floors: { floor: number; rooms: RoomDefinition[] }[];
  cleaningStaff: CleaningStaffMember[];
}

const STATUS_ORDER = ROOM_STATUSES.map((s) => s.value);

export function parseCounts(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const idx = Number(k);
    const key = !Number.isNaN(idx) && STATUS_ORDER[idx] ? STATUS_ORDER[idx] : k;
    result[key] = Number(v);
  }
  return result;
}

export function parseFloors(raw: unknown): { floor: number; rooms: RoomDefinition[] }[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((group) => {
        let items: Record<string, unknown>[] = [];
        if (Array.isArray(group)) {
          items = group as Record<string, unknown>[];
        } else if (group && typeof group === "object") {
          const g = group as Record<string, unknown>;
          const nested = g.Key !== undefined ? (Object.values(g).find(Array.isArray) as unknown[]) : null;
          if (Array.isArray(nested)) items = nested as Record<string, unknown>[];
          else if (Array.isArray(g.Items)) items = g.Items as Record<string, unknown>[];
        }
        const rooms = items.map(normalizeRoom);
        const floor = rooms[0]?.FloorNumber ?? Number((group as { Key?: number })?.Key ?? 0);
        return { floor, rooms };
      })
      .filter((g) => g.rooms.length > 0)
      .sort((a, b) => a.floor - b.floor);
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown[]>)
      .map(([k, v]) => ({
        floor: Number(k),
        rooms: (Array.isArray(v) ? v : []).map((r) => normalizeRoom(r as Record<string, unknown>)),
      }))
      .filter((g) => g.rooms.length > 0)
      .sort((a, b) => a.floor - b.floor);
  }

  return [];
}

export function parseCleaningStaff(raw: unknown): CleaningStaffMember[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => {
    const user = u as Record<string, unknown>;
    return {
      Id: String(user.Id ?? ""),
      Name: String(user.Name ?? ""),
      Phone: String(user.Phone ?? ""),
    };
  });
}

export function findRoomInFloors(
  floors: { floor: number; rooms: RoomDefinition[] }[],
  id: string
): RoomDefinition | null {
  for (const group of floors) {
    const room = group.rooms.find((r) => r.Id === id);
    if (room) return room;
  }
  return null;
}

export function floorSummary(rooms: RoomDefinition[]): string {
  const parts: string[] = [];
  for (const s of ROOM_STATUSES) {
    const count = rooms.filter((r) => r.Status === s.value).length;
    if (count > 0) parts.push(`${count} ${s.label.toLowerCase()}`);
  }
  return parts.join(" · ");
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayDateOnly(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function stayHint(room: RoomDefinition, asOf?: string): string {
  if (!room.Booking) return "";
  const checkIn = parseDateOnly(room.Booking.CheckIn);
  const checkOut = parseDateOnly(room.Booking.CheckOut);
  if (!checkIn || !checkOut) return "";

  const view = asOf ? parseDateOnly(asOf) : todayDateOnly();
  if (!view) return "";
  view.setHours(0, 0, 0, 0);
  const ci = checkIn.getTime();
  const co = checkOut.getTime();
  const t = view.getTime();

  if (t === ci) return "Arriving this day";
  if (t === co) return "Checkout this day";
  if (t > co) return "Overdue checkout";
  if (t < ci) return `Arrives ${checkIn.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
  const tomorrow = new Date(checkOut);
  tomorrow.setDate(tomorrow.getDate() - 1);
  if (tomorrow.setHours(0, 0, 0, 0) === t) return "Checkout next day";
  return `Out ${checkOut.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}

export function needsCleaningAssignment(status: string): boolean {
  return status === "checkout_pending" || status === "cleaning";
}

export function hasGuestBlock(room: RoomDefinition): boolean {
  return (
    Boolean(room.Guest && room.Booking) &&
    (room.Status === "occupied" || room.Status === "reserved" || room.Status === "checkout_pending")
  );
}

export const STATUS_MEANINGS: Record<string, string> = {
  available: "Room is ready for booking",
  reserved: "Booking confirmed but guest not checked in",
  occupied: "Guest currently staying",
  checkout_pending: "Guest left, cleaning required",
  cleaning: "Housekeeping cleaning the room",
  maintenance: "Room unavailable due to repair",
  blocked: "Temporarily unavailable",
  hold: "Temporarily reserved",
};

export const LEGEND_ICON_BG: Record<string, string> = {
  available: "bg-emerald-500",
  reserved: "bg-indigo-500",
  occupied: "bg-orange-500",
  checkout_pending: "bg-purple-500",
  cleaning: "bg-amber-400",
  maintenance: "bg-red-500",
  blocked: "bg-slate-400",
  hold: "bg-yellow-400",
};

export const CARD_BADGE_CLASS: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-700",
  reserved: "bg-indigo-500/10 text-indigo-700",
  occupied: "bg-orange-500/10 text-orange-700",
  checkout_pending: "bg-purple-500/10 text-purple-700",
  cleaning: "bg-amber-500/10 text-amber-700",
  maintenance: "bg-red-500/10 text-red-700",
  blocked: "bg-slate-500/10 text-slate-600",
  hold: "bg-yellow-500/10 text-yellow-700",
};

export const CARD_ICON_SYMBOL: Record<string, string> = {
  available: "✓",
  checkout_pending: "!",
  maintenance: "⚠",
  blocked: "⚠",
  cleaning: "🧹",
  occupied: "●",
  reserved: "○",
  hold: "⏳",
};

export const LEGEND_COUNT_COLOR: Record<string, string> = {
  available: "text-emerald-600",
  reserved: "text-indigo-600",
  occupied: "text-orange-600",
  checkout_pending: "text-purple-600",
  cleaning: "text-amber-600",
  maintenance: "text-red-600",
  blocked: "text-slate-500",
  hold: "text-yellow-600",
};
