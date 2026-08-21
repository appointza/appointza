import type { OrganisationType } from "./organisation.model";

export type { OrganisationType };

export class OrganisationHospitalityProfile {
  organisation_id: number = 0;
  organisation_type: OrganisationType = "service";
  property_type: string = "hotel";
  booking_type: string = "overnight";
  minimum_hours: number = 2;
  checkin_time: string = "14:00";
  checkout_time: string = "11:00";
  overnight_time_mode: string = "fixed";
  cancellation_policy: string = "";
  payment_policy: string = "";
  packages: HospitalityPackage[] = [];
  food_menu: HospitalityFoodItem[] = [];
  nearby_places: HospitalityNearbyPlace[] = [];
  guest_services: HospitalityGuestService[] = [];
}

export class HospitalityProfileSelectReq {
  organisation_id: number = 0;
}

export class HospitalityProfileSettingsReq {
  organisation_id: number = 0;
  organisation_type: OrganisationType = "service";
  property_type: string = "hotel";
  booking_type: string = "overnight";
  minimum_hours: number = 2;
  checkin_time: string = "14:00";
  checkout_time: string = "11:00";
  overnight_time_mode: string = "fixed";
  cancellation_policy: string = "";
  payment_policy: string = "";
}

export class HospitalityContentSaveReq {
  organisation_id: number = 0;
  packages?: HospitalityPackage[];
  food_menu?: HospitalityFoodItem[];
  nearby_places?: HospitalityNearbyPlace[];
  guest_services?: HospitalityGuestService[];
}

export class HospitalityPackage {
  id: string = "";
  name: string = "";
  price: string = "";
  description: string = "";
  badge?: string;
  kind: string = "stay";
  is_active: boolean = true;
  sort_order: number = 0;
  image_url: string = "";
  includes: string[] = [];
  add_ons: string[] = [];
  valid_from: string = "";
  valid_to: string = "";
  minimum_nights: number = 1;
  max_guests: number = 2;
  included_guests: number = 0;
  extra_guest_charge: number = 0;
  room_type: string = "";
}

export class HospitalityFoodItem {
  meal: string = "";
  title: string = "";
  description: string = "";
  cuisines: string[] = [];
}

export class HospitalityNearbyPlace {
  name: string = "";
  distance: string = "";
  travel_time?: string;
  icon?: string;
  image_url?: string;
  map_url?: string;
}

export class HospitalityGuestService {
  id: string = "";
  name: string = "";
  price: string = "";
  description: string = "";
  category: string = "other";
  icon: string = "";
  is_active: boolean = true;
  sort_order: number = 0;
}

export class OrganisationRoom {
  id: number = 0;
  organisation_id: number = 0;
  organisation_location_id: number = 0;
  room_number: string = "";
  room_name: string = "";
  room_type: string = "double";
  floor_number: number = 1;
  building_wing: string = "";
  status: string = "available";
  capacity: RoomCapacityData = new RoomCapacityData();
  pricing: RoomPricingData = new RoomPricingData();
  amenities: string[] = [];
  main_photo: string = "";
  gallery_photos: string[] = [];
  booking_rules: RoomBookingRulesData = new RoomBookingRulesData();
  guest?: RoomGuestData | null;
  booking?: RoomBookingData | null;
  payment?: RoomPaymentData | null;
  cleaning_assignment?: RoomCleaningAssignmentData | null;
  isactive: boolean = true;
}

export class RoomCapacityData {
  adults_allowed: number = 2;
  children_allowed: number = 1;
  total_guests: number = 3;
  extra_beds_allowed: number = 0;
}

export class RoomPricingData {
  price_per_night: number = 0;
  price_per_hour: number = 0;
  weekend_price: number = 0;
  extra_guest_charge: number = 0;
  tax_percentage: number = 12;
}

export class RoomBookingRulesData {
  room_code: string = "";
  video_url: string = "";
  check_in_time: string = "14:00";
  check_out_time: string = "11:00";
  cancellation_policy: string = "Free cancellation up to 24 hours before check-in.";
  minimum_stay: number = 1;
  maximum_stay: number = 30;
  minimum_hours: number = 0;
  maximum_hours: number = 12;
}

export class RoomGuestData {
  name: string = "";
  phone: string = "";
  email?: string;
}

export class RoomBookingData {
  booking_id: string = "";
  check_in: string = "";
  check_out: string = "";
  nights: number = 0;
}

export class RoomPaymentData {
  total: number = 0;
  paid: number = 0;
  balance: number = 0;
}

export class RoomCleaningAssignmentData {
  staff_id: number = 0;
  staff_name: string = "";
  assigned_at: string = "";
}

export class OrganisationRoomSelectReq {
  id: number = 0;
  organisation_id: number = 0;
  organisation_location_id: number = 0;
}

export class OrganisationRoomDeleteReq {
  id: number = 0;
  organisation_id: number = 0;
}

export class OrganisationRoomStatusReq {
  organisation_id: number = 0;
  organisation_location_id: number = 0;
  room_id?: number;
  date?: string;
}

export class OrganisationRoomStatusUpdateReq {
  id: number = 0;
  organisation_id: number = 0;
  status: string = "available";
  source: string = "api";
  notes: string = "";
}

export class OrganisationRoomIdReq {
  id: number = 0;
  organisation_id: number = 0;
}

export class OrganisationRoomStatusEvent {
  id: number = 0;
  organisation_id: number = 0;
  organisation_location_id: number = 0;
  organisation_room_id: number = 0;
  booking_id: string = "";
  from_status: string = "";
  to_status: string = "";
  event_type: string = "";
  changed_by_user_id?: number | null;
  changed_by_name: string = "";
  source: string = "api";
  notes: string = "";
  occurred_at: string = "";
  created_at: string = "";
}

export class OrganisationRoomStatusEventSelectReq {
  organisation_id: number = 0;
  organisation_room_id: number = 0;
  booking_id: string = "";
  limit: number = 50;
}

/** Canonical stay funnel steps for admin timeline. */
export const ROOM_STATUS_FUNNEL = [
  { event_type: "booked", label: "Booked / Reserved", status: "reserved" },
  { event_type: "checkin", label: "Check-in", status: "occupied" },
  { event_type: "checkout", label: "Check-out", status: "checkout_pending" },
  { event_type: "cleaning", label: "Cleaning", status: "cleaning" },
  { event_type: "clean", label: "Clean / Available", status: "available" },
] as const;

export function roomStatusEventLabel(eventType: string, toStatus?: string): string {
  const type = (eventType || "").toLowerCase();
  const funnel = ROOM_STATUS_FUNNEL.find((s) => s.event_type === type);
  if (funnel) return funnel.label;
  return statusLabel(toStatus || type);
}

export class OrganisationRoomStatusBoardRes {
  organisation_id: number = 0;
  today: string = "";
  as_of: string = "";
  selected_id?: number;
  selected_room?: OrganisationRoom | null;
  counts: Record<string, number> = {};
  /** Server-computed chips for the as_of date — UI only renders these. */
  status_summary: OrganisationRoomStatusSummaryItem[] = [];
  floors: OrganisationRoomStatusFloorGroup[] = [];
  rooms: OrganisationRoom[] = [];
}

export class OrganisationRoomStatusSummaryItem {
  value: string = "";
  label: string = "";
  count: number = 0;
}

export class OrganisationRoomStatusFloorGroup {
  floor_number: number = 0;
  label: string = "";
  rooms: OrganisationRoom[] = [];
}

export const ROOM_STATUSES = [
  { value: "available", label: "Available", className: "bg-emerald-100 text-emerald-800" },
  { value: "reserved", label: "Reserved", className: "bg-blue-100 text-blue-800" },
  { value: "occupied", label: "Occupied", className: "bg-orange-100 text-orange-800" },
  { value: "checkout_pending", label: "Check-out pending", className: "bg-purple-100 text-purple-800" },
  { value: "cleaning", label: "Cleaning", className: "bg-teal-100 text-teal-800" },
  { value: "maintenance", label: "Maintenance", className: "bg-red-100 text-red-800" },
  { value: "blocked", label: "Out of Service", className: "bg-gray-200 text-gray-800" },
  { value: "hold", label: "Hold", className: "bg-yellow-100 text-yellow-800" },
] as const;

export const ROOM_TYPES = [
  "single",
  "double",
  "twin",
  "deluxe",
  "suite",
  "family",
  "dormitory",
] as const;

export function statusLabel(status: string): string {
  return ROOM_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusClassName(status: string): string {
  return ROOM_STATUSES.find((s) => s.value === status)?.className ?? "bg-gray-100 text-gray-800";
}

export function emptyRoom(organisationId: number, locationId = 0): OrganisationRoom {
  const room = new OrganisationRoom();
  room.organisation_id = organisationId;
  room.organisation_location_id = locationId;
  room.booking_rules.cancellation_policy = "Free cancellation up to 24 hours before check-in.";
  room.booking_rules.maximum_hours = 12;
  return room;
}

/** Ensure API/plain JSON rooms have numeric ids and nested defaults for safe editing. */
export function normalizeOrganisationRoom(raw: OrganisationRoom | Record<string, unknown>): OrganisationRoom {
  const source = raw as Record<string, unknown>;
  const room = new OrganisationRoom();
  room.id = Number(source.id) || 0;
  room.organisation_id = Number(source.organisation_id) || 0;
  room.organisation_location_id = Number(source.organisation_location_id) || 0;
  room.room_number = String(source.room_number ?? "");
  room.room_name = String(source.room_name ?? "");
  room.room_type = String(source.room_type ?? "double");
  room.floor_number = Number(source.floor_number) || 1;
  room.building_wing = String(source.building_wing ?? "");
  room.status = String(source.status ?? "available");
  room.main_photo = String(source.main_photo ?? "");
  room.isactive = source.isactive !== false;
  room.capacity = {
    ...new RoomCapacityData(),
    ...((source.capacity as RoomCapacityData | undefined) ?? {}),
  };
  room.pricing = {
    ...new RoomPricingData(),
    ...((source.pricing as RoomPricingData | undefined) ?? {}),
  };
  room.booking_rules = {
    ...new RoomBookingRulesData(),
    ...((source.booking_rules as RoomBookingRulesData | undefined) ?? {}),
  };
  room.amenities = Array.isArray(source.amenities) ? [...(source.amenities as string[])] : [];
  room.gallery_photos = Array.isArray(source.gallery_photos) ?
    [...(source.gallery_photos as string[])]
  : [];
  room.guest = source.guest ? { ...new RoomGuestData(), ...(source.guest as RoomGuestData) } : null;
  room.booking = source.booking ? { ...new RoomBookingData(), ...(source.booking as RoomBookingData) } : null;
  room.payment = source.payment ? { ...new RoomPaymentData(), ...(source.payment as RoomPaymentData) } : null;
  room.cleaning_assignment = source.cleaning_assignment ?
    { ...new RoomCleaningAssignmentData(), ...(source.cleaning_assignment as RoomCleaningAssignmentData) }
  : null;
  return room;
}
