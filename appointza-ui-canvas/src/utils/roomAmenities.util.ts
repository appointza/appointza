import type { OrganisationRoom } from "@/models/hospitality.model";
import {
  RoomBookingRulesData,
  RoomCapacityData,
  RoomPricingData,
} from "@/models/hospitality.model";

export type RoomAmenityOption = {
  id: string;
  label: string;
  emoji: string;
};

export type RoomAmenityGroup = {
  title: string;
  items: RoomAmenityOption[];
};

export const ROOM_AMENITY_GROUPS: RoomAmenityGroup[] = [
  {
    title: "Room Amenities",
    items: [
      { id: "king_bed", label: "King Bed", emoji: "🛏" },
      { id: "queen_bed", label: "Queen Bed", emoji: "🛏" },
      { id: "single_bed", label: "Single Bed", emoji: "🛏" },
      { id: "wardrobe", label: "Wardrobe", emoji: "🚪" },
      { id: "sofa", label: "Sofa", emoji: "🛋" },
      { id: "mirror", label: "Mirror", emoji: "🪞" },
      { id: "curtains", label: "Curtains", emoji: "🪟" },
      { id: "balcony", label: "Balcony", emoji: "🌅" },
      { id: "safe_locker", label: "Safe Locker", emoji: "🔐" },
    ],
  },
  {
    title: "Bathroom Amenities",
    items: [
      { id: "attached_bathroom", label: "Attached Bathroom", emoji: "🚿" },
      { id: "hot_water", label: "Hot Water", emoji: "♨" },
      { id: "shower", label: "Shower", emoji: "🚿" },
      { id: "bathtub", label: "Bathtub", emoji: "🛁" },
      { id: "towels", label: "Towels", emoji: "🧺" },
      { id: "hair_dryer", label: "Hair Dryer", emoji: "💨" },
      { id: "toiletries", label: "Toiletries", emoji: "🧴" },
    ],
  },
  {
    title: "Technology",
    items: [
      { id: "wifi", label: "Wi-Fi", emoji: "📶" },
      { id: "smart_tv", label: "Smart TV", emoji: "📺" },
      { id: "work_desk", label: "Work Desk", emoji: "💻" },
      { id: "bluetooth_speaker", label: "Bluetooth Speaker", emoji: "🔊" },
      { id: "telephone", label: "Telephone", emoji: "📞" },
    ],
  },
  {
    title: "Comfort",
    items: [
      { id: "air_conditioning", label: "Air Conditioning", emoji: "❄" },
      { id: "fan", label: "Fan", emoji: "🌀" },
    ],
  },
  {
    title: "Food & Beverage",
    items: [
      { id: "room_service", label: "Room Service", emoji: "🍽" },
      { id: "breakfast_included", label: "Breakfast Included", emoji: "🥐" },
      { id: "mini_fridge", label: "Mini Fridge", emoji: "🧊" },
      { id: "tea_coffee", label: "Tea/Coffee Maker", emoji: "☕" },
      { id: "mini_bar", label: "Mini Bar", emoji: "🍷" },
    ],
  },
  {
    title: "Safety",
    items: [
      { id: "cctv", label: "CCTV", emoji: "📹" },
      { id: "fire_alarm", label: "Fire Alarm", emoji: "🚨" },
    ],
  },
  {
    title: "Property Facilities",
    items: [
      { id: "parking", label: "Parking", emoji: "🅿" },
      { id: "swimming_pool", label: "Swimming Pool", emoji: "🏊" },
    ],
  },
  {
    title: "Extra Services",
    items: [{ id: "housekeeping", label: "Housekeeping", emoji: "🧹" }],
  },
];

export const ROOM_AMENITY_LOOKUP = Object.fromEntries(
  ROOM_AMENITY_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item])),
) as Record<string, RoomAmenityOption>;

export const ROOM_STATUS_EMOJI: Record<string, string> = {
  available: "🟢",
  reserved: "🔵",
  occupied: "🟠",
  checkout_pending: "🟣",
  cleaning: "🧹",
  maintenance: "🔴",
  blocked: "⚫",
  hold: "🟡",
};

export function formatRoomTypeLabel(type: string): string {
  if (!type) return "Room";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function amenityLabels(ids: string[]): string[] {
  return ids.map((id) => {
    const item = ROOM_AMENITY_LOOKUP[id];
    return item ? `${item.emoji} ${item.label}` : id;
  });
}

export function defaultRoomCode(roomNumber: string): string {
  const slug = roomNumber.trim().toLowerCase().replace(/\s+/g, "-");
  return slug ? `room-${slug}` : "";
}

export function cloneRoom(room: OrganisationRoom): OrganisationRoom {
  const capacity = room.capacity ?? new RoomCapacityData();
  const pricing = room.pricing ?? new RoomPricingData();
  const bookingRules = room.booking_rules ?? new RoomBookingRulesData();
  return {
    ...room,
    capacity: { ...capacity },
    pricing: { ...pricing },
    booking_rules: { ...bookingRules },
    amenities: [...(room.amenities ?? [])],
    gallery_photos: [...(room.gallery_photos ?? [])],
    guest: room.guest ? { ...room.guest } : null,
    booking: room.booking ? { ...room.booking } : null,
    payment: room.payment ? { ...room.payment } : null,
    cleaning_assignment: room.cleaning_assignment ? { ...room.cleaning_assignment } : null,
  };
}

export type RoomCalendarDay = {
  label: string;
  state: string;
};

/** Parse yyyy-MM-dd (or ISO prefix) as local calendar date — avoids UTC timezone shifts. */
export function parseDateOnlyLocal(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function startOfLocalDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** True when `day` is a booked night (or same-day hourly stay). */
function isDateWithinStay(day: Date, checkIn: Date, checkOut: Date): boolean {
  const dayTime = day.getTime();
  const inTime = checkIn.getTime();
  const outTime = checkOut.getTime();
  if (inTime === outTime) return dayTime === inTime;
  return dayTime >= inTime && dayTime < outTime;
}

function isCheckoutDay(day: Date, checkOut: Date): boolean {
  return day.getTime() === checkOut.getTime();
}

export function buildRoomCalendar(room: OrganisationRoom): RoomCalendarDay[] {
  const days: RoomCalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    days.push({ label, state: getRoomAvailabilityState(room, date) });
  }

  return days;
}

/** Availability label for a room on a specific calendar day (from status + stay dates). */
export function getRoomAvailabilityState(room: OrganisationRoom, date: Date): string {
  const day = startOfLocalDay(date);

  if (room.status === "maintenance" || room.status === "blocked") return "Unavailable";
  if (room.status === "cleaning") return "Cleaning";

  const checkIn = parseDateOnlyLocal(room.booking?.check_in);
  const checkOut = parseDateOnlyLocal(room.booking?.check_out);

  if (checkIn && checkOut) {
    if (isDateWithinStay(day, checkIn, checkOut)) {
      return room.status === "reserved" ? "Reserved" : "Occupied";
    }
    if (
      isCheckoutDay(day, checkOut) &&
      (room.status === "checkout_pending" || room.status === "occupied")
    ) {
      return room.status === "checkout_pending" ? "Check-out" : "Occupied";
    }
    return "Available";
  }

  const today = startOfLocalDay(new Date());
  const isToday = day.getTime() === today.getTime();
  if (!isToday) return "Available";

  if (room.status === "occupied") return "Occupied";
  if (room.status === "reserved") return "Reserved";
  if (room.status === "checkout_pending") return "Check-out";
  if (room.status === "hold") return "Hold";

  return "Available";
}

export function roomAvailabilityClassName(state: string): string {
  switch (state) {
    case "Available":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Occupied":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "Reserved":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "Check-out":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "Cleaning":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "Unavailable":
      return "bg-stone-100 text-stone-600 border-stone-200";
    case "Hold":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    default:
      return "bg-stone-50 text-stone-700 border-stone-200";
  }
}
