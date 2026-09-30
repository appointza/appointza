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
    booking: room.booking
      ? { ...room.booking, stays: [...(room.booking.stays ?? [])] }
      : null,
    payment: room.payment ? { ...room.payment } : null,
    cleaning_assignment: room.cleaning_assignment ? { ...room.cleaning_assignment } : null,
  };
}

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

/** Bind `availability_state` from GetStatusBoard. */
export function getRoomAvailabilityState(room: OrganisationRoom, _date?: Date): string {
  return (room.availability_state || "").trim() || "Available";
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
