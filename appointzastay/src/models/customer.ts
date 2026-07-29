import { getStatusMeta } from "@/config/roomCatalog";

export interface CustomerBooking {
  Id: string;
  BookingId: string;
  RoomId: string;
  RoomNumber: string;
  RoomName: string;
  FloorNumber: number;
  CheckIn: string;
  CheckOut: string;
  Nights: number;
  Total: number;
  Paid: number;
  Balance: number;
  BookingStatus: string;
  RoomStatus: string;
}

export interface CustomerSummary {
  Key: string;
  Name: string;
  Phone: string;
  Email?: string;
  UserAccountId?: string;
  HasUserAccount: boolean;
  TotalBookings: number;
  ActiveBookings: number;
  TotalSpent: number;
  OutstandingBalance: number;
  Bookings: CustomerBooking[];
  CurrentStay?: CustomerBooking | null;
}

export interface CustomerSelectPayload {
  customers: CustomerSummary[];
  selected: CustomerSummary | null;
  search?: string;
}

function normalizeRoomStatus(value: unknown): string {
  if (typeof value === "string") return value;
  const names = [
    "available",
    "reserved",
    "occupied",
    "checkout_pending",
    "cleaning",
    "maintenance",
    "blocked",
    "hold",
  ];
  if (typeof value === "number" && names[value]) return names[value];
  return String(value ?? "");
}

function normalizeBooking(raw: Record<string, unknown>): CustomerBooking {
  return {
    Id: String(raw.Id ?? ""),
    BookingId: String(raw.BookingId ?? ""),
    RoomId: String(raw.RoomId ?? ""),
    RoomNumber: String(raw.RoomNumber ?? ""),
    RoomName: String(raw.RoomName ?? ""),
    FloorNumber: Number(raw.FloorNumber ?? 0),
    CheckIn: String(raw.CheckIn ?? ""),
    CheckOut: String(raw.CheckOut ?? ""),
    Nights: Number(raw.Nights ?? 0),
    Total: Number(raw.Total ?? 0),
    Paid: Number(raw.Paid ?? 0),
    Balance: Number(raw.Balance ?? 0),
    BookingStatus: String(raw.BookingStatus ?? "active"),
    RoomStatus: normalizeRoomStatus(raw.RoomStatus),
  };
}

export function normalizeCustomerSummary(raw: Record<string, unknown>): CustomerSummary {
  const bookings = Array.isArray(raw.Bookings)
    ? (raw.Bookings as Record<string, unknown>[]).map(normalizeBooking)
    : [];
  const currentStay =
    bookings.find(
      (b) =>
        b.BookingStatus === "active" &&
        (b.RoomStatus === "occupied" || b.RoomStatus === "reserved")
    ) ?? null;

  return {
    Key: String(raw.Key ?? ""),
    Name: String(raw.Name ?? ""),
    Phone: String(raw.Phone ?? ""),
    Email: raw.Email ? String(raw.Email) : undefined,
    UserAccountId: raw.UserAccountId ? String(raw.UserAccountId) : undefined,
    HasUserAccount: Boolean(raw.HasUserAccount),
    TotalBookings: Number(raw.TotalBookings ?? bookings.length),
    ActiveBookings: Number(raw.ActiveBookings ?? 0),
    TotalSpent: Number(raw.TotalSpent ?? 0),
    OutstandingBalance: Number(raw.OutstandingBalance ?? 0),
    Bookings: bookings,
    CurrentStay: currentStay,
  };
}

export function formatCustomerDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function bookingStatusLabel(b: CustomerBooking): string {
  if (b.BookingStatus === "completed") return "Completed";
  if (b.BookingStatus === "active") {
    if (b.RoomStatus === "occupied") return "Checked In";
    if (b.RoomStatus === "reserved") return "Reserved";
    if (b.RoomStatus === "checkout_pending") return "Check-out Pending";
  }
  return "Active";
}

export function bookingStatusBadgeClass(b: CustomerBooking): string {
  if (b.BookingStatus === "completed") return "bg-muted text-muted-foreground";
  if (b.RoomStatus === "occupied") return "bg-orange-100 text-orange-800";
  if (b.RoomStatus === "reserved") return "bg-blue-100 text-blue-800";
  if (b.RoomStatus === "checkout_pending") return "bg-purple-100 text-purple-800";
  return "bg-emerald-100 text-emerald-800";
}

export function currentStayStatusLabel(b: CustomerBooking): string {
  return bookingStatusLabel(b);
}

export function roomStatusDisplay(status: string) {
  return getStatusMeta(status);
}
