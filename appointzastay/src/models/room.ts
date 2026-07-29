import { normalizeRoomStatus } from "@/config/roomCatalog";

export interface RoomCapacity {
  AdultsAllowed: number;
  ChildrenAllowed: number;
  TotalGuests: number;
  ExtraBedsAllowed: number;
}

export interface RoomPricing {
  PricePerNight: number;
  PricePerHour: number;
  WeekendPrice: number;
  HolidayPrice: number;
  SeasonalPrice: number;
  ExtraGuestCharge: number;
  ExtraBedCharge: number;
  EarlyCheckInCharge: number;
  LateCheckOutCharge: number;
  TaxPercentage: number;
  Discount: number;
}

export interface RoomBookingRules {
  CheckInTime: string;
  CheckOutTime: string;
  CancellationPolicy: string;
  MinimumStay: number;
  MaximumStay: number;
  MinimumHours: number;
  MaximumHours: number;
}

export interface RoomGuest {
  Name: string;
  Phone: string;
  Email?: string;
  IdProof?: string;
}

export interface RoomBooking {
  BookingId: string;
  CheckIn: string;
  CheckOut: string;
  CheckInTime?: string;
  CheckOutTime?: string;
  Nights: number;
}

export interface RoomPayment {
  Total: number;
  Paid: number;
  Balance: number;
}

export interface CleaningAssignment {
  UserId: string;
  UserName: string;
  AssignedAt: string;
}

export interface RoomDefinition {
  Id: string;
  OrganisationId?: string;
  RoomNumber: string;
  RoomName: string;
  RoomType: string;
  FloorNumber: number;
  BuildingWing: string;
  Capacity: RoomCapacity;
  Pricing: RoomPricing;
  Amenities: string[];
  MainPhoto: string;
  GalleryPhotos: string[];
  RoomVideo: string;
  Status: string;
  Guest?: RoomGuest | null;
  Booking?: RoomBooking | null;
  Payment?: RoomPayment | null;
  CleaningAssignment?: CleaningAssignment | null;
  BookingRules: RoomBookingRules;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface PickableImage {
  Id: string;
  Title: string;
  Url: string;
  CategoryLabel: string;
  Source: string;
}

export function normalizePickableImage(raw: Record<string, unknown>): PickableImage {
  return {
    Id: String(raw.Id ?? raw.id ?? ""),
    Title: String(raw.Title ?? raw.title ?? ""),
    Url: String(raw.Url ?? raw.url ?? ""),
    CategoryLabel: String(raw.CategoryLabel ?? raw.categoryLabel ?? ""),
    Source: String(raw.Source ?? raw.source ?? ""),
  };
}

export interface RoomSelectPayload {
  rooms: RoomDefinition[];
  selected: RoomDefinition | null;
  pickableImages: PickableImage[];
  create: boolean;
}

export function emptyRoom(): RoomDefinition {
  return {
    Id: "",
    RoomNumber: "",
    RoomName: "",
    RoomType: "double",
    FloorNumber: 1,
    BuildingWing: "",
    Capacity: { AdultsAllowed: 2, ChildrenAllowed: 1, TotalGuests: 3, ExtraBedsAllowed: 0 },
    Pricing: {
      PricePerNight: 0,
      PricePerHour: 0,
      WeekendPrice: 0,
      HolidayPrice: 0,
      SeasonalPrice: 0,
      ExtraGuestCharge: 0,
      ExtraBedCharge: 0,
      EarlyCheckInCharge: 0,
      LateCheckOutCharge: 0,
      TaxPercentage: 12,
      Discount: 0,
    },
    Amenities: ["wifi", "attached-bathroom", "hot-water"],
    MainPhoto: "",
    GalleryPhotos: [],
    RoomVideo: "",
    Status: "available",
    BookingRules: {
      CheckInTime: "14:00",
      CheckOutTime: "11:00",
      CancellationPolicy: "Free cancellation up to 24 hours before check-in.",
      MinimumStay: 1,
      MaximumStay: 30,
      MinimumHours: 0,
      MaximumHours: 12,
    },
  };
}

export function normalizeRoom(raw: Record<string, unknown>): RoomDefinition {
  const cap = (raw.Capacity as RoomCapacity) ?? {};
  const pricing = (raw.Pricing as RoomPricing) ?? {};
  const rules = (raw.BookingRules as RoomBookingRules) ?? {};
  return {
    Id: String(raw.Id ?? ""),
    OrganisationId: raw.OrganisationId ? String(raw.OrganisationId) : undefined,
    RoomNumber: String(raw.RoomNumber ?? ""),
    RoomName: String(raw.RoomName ?? ""),
    RoomType: String(raw.RoomType ?? "double"),
    FloorNumber: Number(raw.FloorNumber ?? 1),
    BuildingWing: String(raw.BuildingWing ?? ""),
    Capacity: {
      AdultsAllowed: Number(cap.AdultsAllowed ?? 2),
      ChildrenAllowed: Number(cap.ChildrenAllowed ?? 1),
      TotalGuests: Number(cap.TotalGuests ?? 3),
      ExtraBedsAllowed: Number(cap.ExtraBedsAllowed ?? 0),
    },
    Pricing: {
      PricePerNight: Number(pricing.PricePerNight ?? 0),
      PricePerHour: Number(pricing.PricePerHour ?? 0),
      WeekendPrice: Number(pricing.WeekendPrice ?? 0),
      HolidayPrice: Number(pricing.HolidayPrice ?? 0),
      SeasonalPrice: Number(pricing.SeasonalPrice ?? 0),
      ExtraGuestCharge: Number(pricing.ExtraGuestCharge ?? 0),
      ExtraBedCharge: Number(pricing.ExtraBedCharge ?? 0),
      EarlyCheckInCharge: Number(pricing.EarlyCheckInCharge ?? 0),
      LateCheckOutCharge: Number(pricing.LateCheckOutCharge ?? 0),
      TaxPercentage: Number(pricing.TaxPercentage ?? 12),
      Discount: Number(pricing.Discount ?? 0),
    },
    Amenities: Array.isArray(raw.Amenities) ? (raw.Amenities as string[]) : [],
    MainPhoto: String(raw.MainPhoto ?? ""),
    GalleryPhotos: Array.isArray(raw.GalleryPhotos) ? (raw.GalleryPhotos as string[]) : [],
    RoomVideo: String(raw.RoomVideo ?? ""),
    Status: normalizeRoomStatus(raw.Status),
    Guest: (raw.Guest as RoomGuest) ?? null,
    Booking: (raw.Booking as RoomBooking) ?? null,
    Payment: (raw.Payment as RoomPayment) ?? null,
    CleaningAssignment: (raw.CleaningAssignment as CleaningAssignment) ?? null,
    BookingRules: {
      CheckInTime: String(rules.CheckInTime ?? "14:00"),
      CheckOutTime: String(rules.CheckOutTime ?? "11:00"),
      CancellationPolicy: String(rules.CancellationPolicy ?? ""),
      MinimumStay: Number(rules.MinimumStay ?? 1),
      MaximumStay: Number(rules.MaximumStay ?? 30),
      MinimumHours: Number(rules.MinimumHours ?? 0),
      MaximumHours: Number(rules.MaximumHours ?? 12),
    },
    CreatedAt: raw.CreatedAt ? String(raw.CreatedAt) : undefined,
    UpdatedAt: raw.UpdatedAt ? String(raw.UpdatedAt) : undefined,
  };
}

export function formatDisplayDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function parseDateOnly(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
