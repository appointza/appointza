export const ROOM_TYPES = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "twin", label: "Twin" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Family Room" },
  { value: "dormitory", label: "Dormitory" },
] as const;

export type RoomTypeValue = (typeof ROOM_TYPES)[number]["value"];

export const ROOM_STATUSES = [
  { value: "available", label: "Available", emoji: "🟢", badgeClass: "bg-emerald-100 text-emerald-800" },
  { value: "reserved", label: "Reserved", emoji: "🔵", badgeClass: "bg-blue-100 text-blue-800" },
  { value: "occupied", label: "Occupied", emoji: "🟠", badgeClass: "bg-orange-100 text-orange-800" },
  { value: "checkout_pending", label: "Check-out Pending", emoji: "🟣", badgeClass: "bg-purple-100 text-purple-800" },
  { value: "cleaning", label: "Cleaning", emoji: "🧹", badgeClass: "bg-teal-100 text-teal-800" },
  { value: "maintenance", label: "Maintenance", emoji: "🔴", badgeClass: "bg-red-100 text-red-800" },
  { value: "blocked", label: "Out of Service", emoji: "⚫", badgeClass: "bg-gray-200 text-gray-800" },
  { value: "hold", label: "Hold", emoji: "🟡", badgeClass: "bg-yellow-100 text-yellow-800" },
] as const;

export type RoomStatusValue = (typeof ROOM_STATUSES)[number]["value"];

const ROOM_STATUS_BY_INDEX = ROOM_STATUSES.map((s) => s.value);

/** API may send status as enum name or numeric index. */
export function normalizeRoomStatus(raw: unknown): RoomStatusValue {
  if (typeof raw === "string" && raw.trim()) {
    const text = raw.trim();
    if (ROOM_STATUSES.some((s) => s.value === text)) return text as RoomStatusValue;
    const asNum = Number(text);
    if (!Number.isNaN(asNum) && ROOM_STATUS_BY_INDEX[asNum]) {
      return ROOM_STATUS_BY_INDEX[asNum] as RoomStatusValue;
    }
  }
  if (typeof raw === "number" && ROOM_STATUS_BY_INDEX[raw]) {
    return ROOM_STATUS_BY_INDEX[raw] as RoomStatusValue;
  }
  return "available";
}

export const AMENITY_CATEGORIES = [
  { id: "room", label: "Room Amenities", order: 1 },
  { id: "bathroom", label: "Bathroom Amenities", order: 2 },
  { id: "technology", label: "Technology", order: 3 },
  { id: "comfort", label: "Comfort", order: 4 },
  { id: "food_beverage", label: "Food & Beverage", order: 5 },
  { id: "safety", label: "Safety", order: 6 },
  { id: "property", label: "Property Facilities", order: 7 },
  { id: "extra_services", label: "Extra Services", order: 8 },
] as const;

export const AMENITIES = [
  { id: "bed-king", name: "King Bed", icon: "🛏", category: "room" },
  { id: "bed-queen", name: "Queen Bed", icon: "🛏", category: "room" },
  { id: "bed-single", name: "Single Bed", icon: "🛏", category: "room" },
  { id: "wardrobe", name: "Wardrobe", icon: "🚪", category: "room" },
  { id: "sofa", name: "Sofa", icon: "🛋", category: "room" },
  { id: "mirror", name: "Mirror", icon: "🪞", category: "room" },
  { id: "curtains", name: "Curtains", icon: "🪟", category: "room" },
  { id: "balcony", name: "Balcony", icon: "🌅", category: "room" },
  { id: "safe-locker", name: "Safe Locker", icon: "🔐", category: "room" },
  { id: "attached-bathroom", name: "Attached Bathroom", icon: "🚿", category: "bathroom" },
  { id: "hot-water", name: "Hot Water", icon: "♨", category: "bathroom" },
  { id: "shower", name: "Shower", icon: "🚿", category: "bathroom" },
  { id: "bathtub", name: "Bathtub", icon: "🛁", category: "bathroom" },
  { id: "towels", name: "Towels", icon: "🧺", category: "bathroom" },
  { id: "hair-dryer", name: "Hair Dryer", icon: "💨", category: "bathroom" },
  { id: "wifi", name: "Wi-Fi", icon: "📶", category: "technology" },
  { id: "smart-tv", name: "Smart TV", icon: "📺", category: "technology" },
  { id: "work-desk", name: "Work Desk", icon: "💻", category: "technology" },
  { id: "bluetooth-speaker", name: "Bluetooth Speaker", icon: "🔊", category: "technology" },
  { id: "telephone", name: "Telephone", icon: "📞", category: "technology" },
  { id: "air-conditioning", name: "Air Conditioning", icon: "❄", category: "comfort" },
  { id: "fan", name: "Fan", icon: "🌀", category: "comfort" },
  { id: "room-service", name: "Room Service", icon: "🍽", category: "food_beverage" },
  { id: "breakfast-included", name: "Breakfast Included", icon: "🥐", category: "food_beverage" },
  { id: "mini-fridge", name: "Mini Fridge", icon: "🧊", category: "food_beverage" },
  { id: "tea-coffee-maker", name: "Tea/Coffee Maker", icon: "☕", category: "food_beverage" },
  { id: "mini-bar", name: "Mini Bar", icon: "🍷", category: "food_beverage" },
  { id: "toiletries", name: "Toiletries", icon: "🧴", category: "bathroom" },
  { id: "cctv", name: "CCTV", icon: "📹", category: "safety" },
  { id: "fire-alarm", name: "Fire Alarm", icon: "🚨", category: "safety" },
  { id: "parking", name: "Parking", icon: "🅿", category: "property" },
  { id: "swimming-pool", name: "Swimming Pool", icon: "🏊", category: "property" },
  { id: "housekeeping", name: "Housekeeping", icon: "🧹", category: "extra_services" },
] as const;

export function getTypeLabel(type: string): string {
  return ROOM_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getStatusMeta(status: string) {
  return (
    ROOM_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      emoji: "❓",
      badgeClass: "bg-gray-100 text-gray-800",
    }
  );
}

export function amenitiesByCategory(categoryId: string) {
  return AMENITIES.filter((a) => a.category === categoryId);
}

export function resolveAmenities(ids: string[]) {
  return ids.map((id) => AMENITIES.find((a) => a.id === id)).filter(Boolean);
}
