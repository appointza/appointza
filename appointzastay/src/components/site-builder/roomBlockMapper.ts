export interface LiveRoomCard {
  id: string;
  name: string;
  roomNumber: string;
  roomType: string;
  floor: string;
  wing: string;
  photo: string;
  capacity: string;
  price: string;
  per: string;
  status: string;
  statusLabel: string;
  amenities: string[];
  features: string[];
  bookUrl: string;
  available: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  checkout_pending: "Check-out pending",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  blocked: "Out of service",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  single: "Single",
  double: "Double",
  twin: "Twin",
  deluxe: "Deluxe",
  suite: "Suite",
  family: "Family room",
  dormitory: "Dormitory",
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function formatAmenity(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

import { bookUrl } from "@/utils/bookingLinks";

/** Map API room records (camelCase or PascalCase) to site block cards. */
export function mapRoomsToCards(rooms: unknown[]): LiveRoomCard[] {
  return rooms.map((raw) => {
    const room = asRecord(raw);
    const id = str(room.id ?? room.Id);
    const capacity = asRecord(room.capacity ?? room.Capacity);
    const pricing = asRecord(room.pricing ?? room.Pricing);
    const adults = Number(capacity.adultsAllowed ?? capacity.AdultsAllowed ?? 0);
    const children = Number(capacity.childrenAllowed ?? capacity.ChildrenAllowed ?? 0);
    const totalGuests = Number(capacity.totalGuests ?? capacity.TotalGuests ?? adults + children);
    const pricePerNight = Number(pricing.pricePerNight ?? pricing.PricePerNight ?? 0);

    const roomTypeRaw = str(room.roomType ?? room.RoomType).toLowerCase();
    const statusRaw = str(room.status ?? room.Status).toLowerCase();
    const amenities = Array.isArray(room.amenities ?? room.Amenities)
      ? (room.amenities ?? room.Amenities) as unknown[]
      : [];

    const name =
      str(room.roomName ?? room.RoomName) ||
      str(room.roomNumber ?? room.RoomNumber) ||
      "Room";

    const features: string[] = [];
    const floor = Number(room.floorNumber ?? room.FloorNumber ?? 0);
    const wing = str(room.buildingWing ?? room.BuildingWing);
    if (floor > 0) features.push(`Floor ${floor}`);
    if (wing) features.push(wing);

    return {
      id,
      name,
      roomNumber: str(room.roomNumber ?? room.RoomNumber),
      roomType: ROOM_TYPE_LABELS[roomTypeRaw] || roomTypeRaw || "Room",
      floor: floor > 0 ? String(floor) : "",
      wing,
      photo: str(room.mainPhoto ?? room.MainPhoto),
      capacity: totalGuests > 0 ? `${totalGuests} guest${totalGuests === 1 ? "" : "s"}` : "—",
      price: pricePerNight > 0 ? `₹${pricePerNight.toLocaleString("en-IN")}` : "—",
      per: "/night",
      status: statusRaw,
      statusLabel: STATUS_LABELS[statusRaw] || statusRaw || "—",
      amenities: amenities.map((a) => formatAmenity(str(a))).filter(Boolean).slice(0, 6),
      features,
      bookUrl: statusRaw === "available" && id ? bookUrl({ roomId: id }) : "#",
      available: statusRaw === "available",
    };
  });
}
