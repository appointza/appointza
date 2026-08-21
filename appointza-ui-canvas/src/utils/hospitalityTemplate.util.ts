import type {
  HospitalityFoodItem,
  HospitalityGuestService,
  HospitalityNearbyPlace,
  HospitalityPackage,
  OrganisationHospitalityProfile,
  OrganisationRoom,
} from "@/models/hospitality.model";
import type { SiteDetailsItem } from "@/models/sitedetail.model";
import { defaultRoomCode } from "@/utils/roomAmenities.util";
import { buildRoomBookPath, buildPackageBookPath } from "@/utils/templateBookingNav.util";

export type TemplateRoomItem = {
  id: string;
  room_number: string;
  room_name: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
  main_photo: string;
  video_url: string;
  status: string;
  status_label: string;
  is_available: boolean;
  ROOM_BOOK_URL: string;
};

export type TemplatePackageItem = {
  id: string;
  name: string;
  price: string;
  description: string;
  badge: string;
  image_url: string;
  minimum_nights: number;
  max_guests: number;
  room_type: string;
  includes: string;
  PACKAGE_BOOK_URL: string;
};

export type TemplateFoodItem = {
  meal: string;
  title: string;
  description: string;
  cuisines: string;
};

export type TemplateNearbyItem = {
  name: string;
  distance: string;
  travel_time: string;
  icon: string;
  image_url: string;
  map_url: string;
};

export type TemplateGuestServiceItem = {
  name: string;
  price: string;
  description: string;
  category: string;
  icon: string;
};

const PUBLIC_BLOCKED_STATUSES = new Set(["maintenance", "blocked"]);

function resolveMediaUrl(value: string, filesApiBaseUrl: string, fallback: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const id = Number(trimmed);
  if (Number.isFinite(id) && id > 0) return `${filesApiBaseUrl}/api/Files/Get?id=${id}`;
  return trimmed;
}

function roomCode(room: OrganisationRoom): string {
  const code = room.booking_rules?.room_code?.trim();
  if (code) return code;
  return defaultRoomCode(room.room_number) || `room-${room.id}`;
}

export function extractHospitalityFromSite(siteData: SiteDetailsItem) {
  const profile =
    siteData.hospitality_profile ??
    (siteData as { hospitalityProfile?: OrganisationHospitalityProfile }).hospitalityProfile ??
    null;
  const rooms =
    siteData.hospitality_rooms ??
    (siteData as { hospitalityRooms?: OrganisationRoom[] }).hospitalityRooms ??
    [];
  return { profile, rooms };
}

export function buildTemplateRooms(
  rooms: OrganisationRoom[],
  organisationId: number,
  locationId: number,
  filesApiBaseUrl: string,
  fallbackImageUrl: string,
): TemplateRoomItem[] {
  return rooms
    .filter((room) => room.isactive !== false)
    .filter((room) => !PUBLIC_BLOCKED_STATUSES.has((room.status || "").toLowerCase()))
    .map((room) => {
      const code = roomCode(room);
      const name = room.room_name?.trim() || `Room ${room.room_number}`;
      // Public site always offers Book — availability is checked on the booking page by dates.
      return {
        id: code,
        room_number: room.room_number,
        room_name: room.room_name,
        name,
        type: room.room_type,
        capacity: room.capacity?.total_guests ?? 2,
        price: room.pricing?.price_per_night ?? 0,
        main_photo: resolveMediaUrl(room.main_photo, filesApiBaseUrl, fallbackImageUrl),
        video_url: room.booking_rules?.video_url ?? "",
        status: "available",
        status_label: "Available",
        is_available: true,
        ROOM_BOOK_URL: buildRoomBookPath(organisationId, locationId, code),
      };
    });
}

export function buildTemplatePackages(
  packages: HospitalityPackage[],
  organisationId: number,
  locationId: number,
  filesApiBaseUrl: string,
): TemplatePackageItem[] {
  return (packages || [])
    .filter((pkg) => pkg.is_active !== false && pkg.name?.trim())
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((pkg) => {
      const id = pkg.id?.trim() || `name:${pkg.name.trim().toLowerCase()}`;
      return {
        id,
        name: pkg.name,
        price: pkg.price,
        description: pkg.description,
        badge: pkg.badge ?? "",
        image_url: resolveMediaUrl(pkg.image_url, filesApiBaseUrl, ""),
        minimum_nights: pkg.minimum_nights ?? 1,
        max_guests: pkg.max_guests ?? 2,
        room_type: pkg.room_type ?? "",
        includes: (pkg.includes ?? []).join(" · "),
        PACKAGE_BOOK_URL: buildPackageBookPath(organisationId, locationId, id),
      };
    });
}

export function buildTemplateFoodMenu(items: HospitalityFoodItem[]): TemplateFoodItem[] {
  return (items || [])
    .filter((item) => item.title?.trim() || item.meal?.trim())
    .map((item) => ({
      meal: item.meal,
      title: item.title,
      description: item.description,
      cuisines: (item.cuisines ?? []).join(", "),
    }));
}

export function buildTemplateNearbyPlaces(items: HospitalityNearbyPlace[]): TemplateNearbyItem[] {
  return (items || [])
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name,
      distance: item.distance,
      travel_time: item.travel_time ?? "",
      icon: item.icon ?? "",
      image_url: item.image_url ?? "",
      map_url: item.map_url ?? "",
    }));
}

export function buildTemplateGuestServices(items: HospitalityGuestService[]): TemplateGuestServiceItem[] {
  return (items || [])
    .filter((item) => item.is_active !== false && item.name?.trim())
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => ({
      name: item.name,
      price: item.price ?? "",
      description: item.description ?? "",
      category: item.category ?? "other",
      icon: item.icon ?? "",
    }));
}

export function buildHospitalityPolicyTokens(profile: OrganisationHospitalityProfile | null) {
  return {
    cancellation_policy: profile?.cancellation_policy ?? "",
    payment_policy: profile?.payment_policy ?? "",
    check_in_time: profile?.checkin_time ?? "14:00",
    check_out_time: profile?.checkout_time ?? "11:00",
    booking_type: profile?.booking_type ?? "overnight",
  };
}
