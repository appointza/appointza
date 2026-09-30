import type { OrganisationRoom } from "@/models/hospitality.model";
import { statusLabel } from "@/models/hospitality.model";

const INACTIVE_BOOKING_STATUSES = new Set(["available", "maintenance", "blocked"]);

export function roomHasActiveBooking(room: OrganisationRoom): boolean {
  if (room.has_active_booking) return true;
  const hasGuest = Boolean(room.guest?.name?.trim() || room.guest?.phone?.trim());
  const status = (room.status || "").toLowerCase();
  return hasGuest || !INACTIVE_BOOKING_STATUSES.has(status);
}

export function getRoomBookingStartDate(room: OrganisationRoom): Date | null {
  const checkIn = room.booking?.check_in?.trim();
  if (!checkIn) return null;
  const date = new Date(`${checkIn}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRoomBookingEndDate(room: OrganisationRoom): Date | null {
  const checkOut = room.booking?.check_out?.trim();
  if (!checkOut) return null;
  const date = new Date(`${checkOut}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function roomBookingLabel(room: OrganisationRoom): string {
  const number = room.room_number?.trim() || "—";
  const name = room.room_name?.trim();
  return name ? `Room ${number} — ${name}` : `Room ${number}`;
}

export function roomGuestName(room: OrganisationRoom): string {
  return room.guest?.name?.trim() || "Guest";
}

export function roomGuestPhone(room: OrganisationRoom): string {
  return room.guest?.phone?.trim() || "—";
}

export function roomBookingReference(room: OrganisationRoom): string {
  return room.booking?.booking_id?.trim() || "—";
}

export function roomIsPaid(room: OrganisationRoom): boolean {
  const total = room.payment?.total ?? 0;
  const paid = room.payment?.paid ?? 0;
  if (total <= 0) return paid > 0;
  return paid >= total;
}

export function roomPaymentSummary(room: OrganisationRoom): string {
  const total = room.payment?.total ?? 0;
  const paid = room.payment?.paid ?? 0;
  const balance = room.payment?.balance ?? Math.max(0, total - paid);
  if (total <= 0) return "—";
  if (balance <= 0) return `Paid · ₹${paid.toLocaleString("en-IN")}`;
  return `₹${paid.toLocaleString("en-IN")} paid · ₹${balance.toLocaleString("en-IN")} due`;
}

export function roomStatusDisplay(room: OrganisationRoom): string {
  return statusLabel(room.status);
}

export function roomMatchesSearch(room: OrganisationRoom, searchTerm: string): boolean {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    roomGuestName(room),
    roomGuestPhone(room),
    room.guest?.email,
    room.room_number,
    room.room_name,
    room.booking?.booking_id,
    room.status,
    roomStatusDisplay(room),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
