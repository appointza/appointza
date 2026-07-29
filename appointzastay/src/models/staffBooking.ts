import { keysToCamelCase } from "@/models/organisationProfile";

export type StaffPackageLine = {
  name?: string;
  priceLabel?: string;
  total?: number;
  kind?: string;
  includesRoom?: boolean;
};

export type StaffServiceLine = {
  name?: string;
  priceLabel?: string;
  total?: number;
};

export type StaffBookingItem = {
  id: string;
  bookingCode: string;
  customerId: string;
  guestName: string;
  phone: string;
  email?: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  floorNumber: number;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  nights: number;
  persons: number;
  extraBeds: number;
  status: string;
  total: number;
  paid: number;
  balance: number;
  packages: StaffPackageLine[];
  guestServices: StaffServiceLine[];
  createdAt: string;
};

export type StaffRoomRow = {
  id: string;
  roomNumber: string;
  roomName: string;
  floorNumber: number;
  status: string;
};

export type StaffBookingCalendar = {
  today: string;
  year: number;
  month: number;
  monthStart: string;
  monthEnd: string;
  rooms: StaffRoomRow[];
  bookings: StaffBookingItem[];
  todayArrivals: StaffBookingItem[];
  todayDepartures: StaffBookingItem[];
  todayInHouse: StaffBookingItem[];
  todayNewBookings: StaffBookingItem[];
};

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== "") return Number(val);
  }
  return 0;
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null) return String(val);
  }
  return "";
}

function pickArray(obj: Record<string, unknown>, ...keys: string[]): Record<string, unknown>[] {
  for (const key of keys) {
    const val = obj[key];
    if (Array.isArray(val)) return val as Record<string, unknown>[];
  }
  return [];
}

function normalizePackageLine(raw: Record<string, unknown>): StaffPackageLine {
  const p = keysToCamelCase(raw) as Record<string, unknown>;
  return {
    name: pickStr(p, "name"),
    priceLabel: pickStr(p, "priceLabel"),
    total: pickNum(p, "total"),
    kind: pickStr(p, "kind") || "stay",
    includesRoom: p.includesRoom === true || p.includesRoom === "true",
  };
}

function normalizeServiceLine(raw: Record<string, unknown>): StaffServiceLine {
  const s = keysToCamelCase(raw) as Record<string, unknown>;
  return {
    name: pickStr(s, "name"),
    priceLabel: pickStr(s, "priceLabel"),
    total: pickNum(s, "total"),
  };
}

export function normalizeStaffBooking(raw: Record<string, unknown>): StaffBookingItem {
  const b = keysToCamelCase(raw) as Record<string, unknown>;
  const packages = (pickArray(raw, "packages", "Packages").length > 0
    ? pickArray(raw, "packages", "Packages")
    : pickArray(b, "packages")
  ).map(normalizePackageLine);
  const guestServices = (pickArray(raw, "guestServices", "GuestServices").length > 0
    ? pickArray(raw, "guestServices", "GuestServices")
    : pickArray(b, "guestServices")
  ).map(normalizeServiceLine);
  return {
    id: pickStr(b, "id"),
    bookingCode: pickStr(b, "bookingCode"),
    customerId: pickStr(b, "customerId"),
    guestName: pickStr(b, "guestName"),
    phone: pickStr(b, "phone"),
    email: pickStr(b, "email") || undefined,
    roomId: pickStr(b, "roomId"),
    roomNumber: pickStr(b, "roomNumber"),
    roomName: pickStr(b, "roomName"),
    floorNumber: pickNum(b, "floorNumber"),
    checkIn: pickStr(b, "checkIn"),
    checkOut: pickStr(b, "checkOut"),
    checkInTime: pickStr(b, "checkInTime") || "14:00",
    checkOutTime: pickStr(b, "checkOutTime") || "11:00",
    nights: pickNum(b, "nights"),
    persons: pickNum(b, "persons") || 2,
    extraBeds: pickNum(b, "extraBeds"),
    status: pickStr(b, "status") || "active",
    total: pickNum(b, "total"),
    paid: pickNum(b, "paid"),
    balance: pickNum(b, "balance"),
    packages,
    guestServices,
    createdAt: pickStr(b, "createdAt"),
  };
}

export function normalizeStaffRoom(raw: Record<string, unknown>): StaffRoomRow {
  const r = keysToCamelCase(raw) as Record<string, unknown>;
  return {
    id: pickStr(r, "id"),
    roomNumber: pickStr(r, "roomNumber"),
    roomName: pickStr(r, "roomName"),
    floorNumber: pickNum(r, "floorNumber"),
    status: pickStr(r, "status"),
  };
}

export function normalizeStaffCalendar(raw: Record<string, unknown>): StaffBookingCalendar {
  const c = keysToCamelCase(raw) as Record<string, unknown>;
  const mapBookings = (list: unknown) =>
    ((list as Record<string, unknown>[]) ?? []).map((b) => normalizeStaffBooking(b));
  return {
    today: pickStr(c, "today"),
    year: pickNum(c, "year") || new Date().getFullYear(),
    month: pickNum(c, "month") || new Date().getMonth() + 1,
    monthStart: pickStr(c, "monthStart"),
    monthEnd: pickStr(c, "monthEnd"),
    rooms: ((c.rooms as Record<string, unknown>[]) ?? []).map(normalizeStaffRoom),
    bookings: mapBookings(c.bookings),
    todayArrivals: mapBookings(c.todayArrivals),
    todayDepartures: mapBookings(c.todayDepartures),
    todayInHouse: mapBookings(c.todayInHouse),
    todayNewBookings: mapBookings(c.todayNewBookings),
  };
}

export function formatBookingDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** HH:mm → 2:00 PM */
export function formatTimeLabel(hhmm?: string) {
  if (!hhmm?.trim()) return "";
  const parts = hhmm.trim().split(":");
  const h = Number(parts[0]);
  const m = parts[1] ?? "00";
  if (!Number.isFinite(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.padStart(2, "0")} ${ampm}`;
}

export function formatStayDateTime(dateIso: string, timeHhmm?: string) {
  const datePart = formatBookingDate(dateIso);
  const timePart = formatTimeLabel(timeHhmm);
  return timePart ? `${datePart} at ${timePart}` : datePart;
}

/** Normalize org policy time to input[type=time] value */
export function normalizeTimeInput(value: string | undefined, fallback = "14:00") {
  if (!value?.trim()) return fallback;
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return fallback;
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Human-readable tags for what the guest booked */
export function bookingIncludeTags(booking: StaffBookingItem): string[] {
  const tags: string[] = [];
  if (booking.roomNumber) {
    tags.push(`Room ${booking.roomNumber}${booking.roomName ? ` (${booking.roomName})` : ""}`);
  }
  if (booking.nights > 0) {
    tags.push(`${booking.nights} night${booking.nights === 1 ? "" : "s"}`);
  }
  if (booking.checkInTime) {
    tags.push(`Check-in ${formatTimeLabel(booking.checkInTime)}`);
  }
  if (booking.checkOutTime) {
    tags.push(`Check-out ${formatTimeLabel(booking.checkOutTime)}`);
  }
  tags.push(`${booking.persons} guest${booking.persons === 1 ? "" : "s"}`);
  if (booking.extraBeds > 0) {
    tags.push(`${booking.extraBeds} extra bed${booking.extraBeds === 1 ? "" : "s"}`);
  }
  for (const p of booking.packages) {
    if (p.name) {
      const kind = p.kind && p.kind !== "stay" && p.kind !== "standard" ? ` [${p.kind}]` : "";
      const inc = p.includesRoom ? " · incl. room" : "";
      tags.push(`Package: ${p.name}${kind}${inc}`);
    }
  }
  for (const s of booking.guestServices) {
    if (s.name) tags.push(`Service: ${s.name}`);
  }
  if (tags.length === 0) tags.push("Booking");
  return tags;
}

/** Compact time range for calendar cells, e.g. "2p–5p" */
export function formatCompactTimeRange(checkInTime?: string, checkOutTime?: string): string {
  const compact = (hhmm?: string) => {
    if (!hhmm?.trim()) return "";
    const parts = hhmm.trim().split(":");
    const h = Number(parts[0]);
    const m = parts[1] ?? "00";
    if (!Number.isFinite(h)) return "";
    const suffix = h >= 12 ? "p" : "a";
    const h12 = h % 12 || 12;
    return m === "00" ? `${h12}${suffix}` : `${h12}:${m}${suffix}`;
  };
  const start = compact(checkInTime);
  const end = compact(checkOutTime);
  if (start && end) return `${start}–${end}`;
  return start || end;
}

/** All bookings that touch a calendar day */
export function bookingsOccupyingDay(bookings: StaffBookingItem[], dayIso: string): StaffBookingItem[] {
  return bookings.filter((b) => bookingOccupiesDay(b, dayIso));
}

/** Occupies calendar day: multi-night stays use [check-in, check-out); same-day stays occupy check-in only */
export function bookingOccupiesDay(booking: StaffBookingItem, dayIso: string): boolean {
  if (!booking.checkIn || !booking.checkOut) return false;
  if (booking.checkIn === booking.checkOut) return booking.checkIn === dayIso;
  return booking.checkIn <= dayIso && dayIso < booking.checkOut;
}
