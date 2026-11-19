import type { OrganisationRoom, RoomStayRecord } from "@/models/hospitality.model";
import { statusLabel } from "@/models/hospitality.model";

const INACTIVE_BOOKING_STATUSES = new Set(["available", "maintenance", "blocked"]);

export function roomHasActiveBooking(room: OrganisationRoom): boolean {
  if (room.has_active_booking) return true;
  const hasGuest = Boolean(room.guest?.name?.trim() || room.guest?.phone?.trim());
  const status = (room.status || "").toLowerCase();
  return hasGuest || !INACTIVE_BOOKING_STATUSES.has(status);
}

function collectStays(room: OrganisationRoom): RoomStayRecord[] {
  const stored = room.booking?.stays;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.filter((s) => Boolean(s?.check_in?.trim() && s?.check_out?.trim()));
  }
  if (room.booking?.check_in?.trim() && room.booking?.check_out?.trim()) {
    return [
      {
        booking_id: room.booking.booking_id || "",
        booking_guid: "",
        check_in: room.booking.check_in,
        check_out: room.booking.check_out,
        nights: room.booking.nights || 0,
        guest: room.guest,
        payment: room.payment,
        package_ids: [],
        closed: false,
        status: room.status || "reserved",
      } as RoomStayRecord,
    ];
  }
  return [];
}

function phoneMatches(a: string, b: string): boolean {
  const left = (a || "").replace(/\D/g, "");
  const right = (b || "").replace(/\D/g, "");
  if (!left || !right) return false;
  if (left.length >= 10 && right.length >= 10) {
    return left.slice(-10) === right.slice(-10);
  }
  return left === right || left.endsWith(right) || right.endsWith(left);
}

/** Expand room stay history into one display row per matching stay for a customer. */
export function expandClientRoomStays(
  rooms: OrganisationRoom[],
  client: { mobile?: string; room_id?: number },
): OrganisationRoom[] {
  const phone = client.mobile || "";
  const rows: OrganisationRoom[] = [];

  for (const room of rooms) {
    const stays = collectStays(room);
    for (const stay of stays) {
      const stayPhone = stay.guest?.phone || room.guest?.phone || "";
      const matchedByRoom = client.room_id && room.id === client.room_id;
      const matchedByPhone = phoneMatches(phone, stayPhone);
      if (!matchedByRoom && !matchedByPhone) continue;

      rows.push({
        ...room,
        guest: stay.guest ?? room.guest,
        payment: stay.payment ?? room.payment,
        booking: {
          booking_id: stay.booking_id || room.booking?.booking_id || "",
          check_in: stay.check_in,
          check_out: stay.check_out,
          nights: stay.nights || 0,
          stays: room.booking?.stays ?? stays,
        },
        status: stay.closed
          ? stay.status || "checked_out"
          : stay.status || room.status || "reserved",
        has_active_booking: !stay.closed && (stay.status || "") !== "cancelled",
      } as OrganisationRoom);
    }
  }

  return rows.sort((a, b) => {
    const aIn = a.booking?.check_in || "";
    const bIn = b.booking?.check_in || "";
    return bIn.localeCompare(aIn);
  });
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
