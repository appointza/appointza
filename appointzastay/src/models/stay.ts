export interface ActionRes<T> {
  item: T;
  error?: string;
}

export interface ActionReq<T> {
  item: T;
}

export interface AppointzaStayAuthRes {
  userId: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  accesstoken: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface DashboardStats {
  rooms: number;
  users: number;
  customers: number;
  packages: number;
}

export interface OnboardingProgress {
  percent: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  steps?: { id: string; label: string; done: boolean }[];
}

export interface Room {
  id: string;
  roomNumber: string;
  floor?: string;
  status: string;
  type?: string;
  [key: string]: unknown;
}

export interface PropertyPackage {
  id: string;
  name: string;
  price: string;
  description?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface StayUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status?: string;
  [key: string]: unknown;
}

export interface CustomerSummary {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface GuestBookingRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  persons?: number;
  extraBeds?: number;
}

export type ProfileSectionId =
  | "basic" | "location" | "contact" | "policies" | "schedule"
  | "website" | "uploads" | "seo"
  | "messaging" | "payments" | "weather"
  | "highlights" | "amenities" | "packages" | "guest-services" | "offers" | "images"
  | "nearby" | "activities" | "reviews" | "food" | "travel" | "faq";

export const PROFILE_SECTIONS: { id: ProfileSectionId; label: string; group: string }[] = [
  { id: "basic", label: "Basic information", group: "General" },
  { id: "location", label: "Location", group: "General" },
  { id: "contact", label: "Contact", group: "General" },
  { id: "policies", label: "Check-in & policies", group: "General" },
  { id: "schedule", label: "Slots & closures", group: "General" },
  { id: "website", label: "Website & domain", group: "Website" },
  { id: "uploads", label: "Images & assets", group: "Website" },
  { id: "seo", label: "SEO", group: "Website" },
  { id: "messaging", label: "SMS & WhatsApp", group: "Settings" },
  { id: "payments", label: "Payments (Razorpay)", group: "Settings" },
  { id: "weather", label: "Weather", group: "Settings" },
  { id: "highlights", label: "Highlights", group: "Content" },
  { id: "amenities", label: "Amenities", group: "Content" },
  { id: "packages", label: "Packages", group: "Content" },
  { id: "guest-services", label: "Guest services", group: "Content" },
  { id: "offers", label: "Offers", group: "Content" },
  { id: "images", label: "Property images", group: "Content" },
  { id: "nearby", label: "Nearby places", group: "Content" },
  { id: "activities", label: "Activities", group: "Content" },
  { id: "reviews", label: "Reviews", group: "Content" },
  { id: "food", label: "Food menu", group: "Content" },
  { id: "travel", label: "Travel information", group: "Content" },
  { id: "faq", label: "FAQ", group: "Content" },
];

export function isStaffRole(role?: string): boolean {
  const r = (role || "").toLowerCase();
  return r !== "" && r !== "customer";
}

export function isPlatformAdminRole(role?: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "super_admin";
}

/** Where to send the user after login, based on their role in the users table. */
export function getLoginRedirectPath(role?: string): string {
  if (isPlatformAdminRole(role)) return "/platform/organisations";
  if (isStaffRole(role)) return "/staff/dashboard";
  return "/property";
}
