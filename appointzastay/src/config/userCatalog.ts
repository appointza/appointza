export const USER_DEPARTMENTS = [
  { value: "front_office", label: "Front Office" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "maintenance", label: "Maintenance" },
  { value: "finance", label: "Finance" },
  { value: "none", label: "— None —" },
] as const;

export const USER_PERMISSIONS = [
  { key: "ViewRooms", label: "View Rooms" },
  { key: "CreateBooking", label: "Create Booking" },
  { key: "CheckIn", label: "Check-in" },
  { key: "Checkout", label: "Checkout" },
  { key: "Payment", label: "Payment" },
  { key: "Reports", label: "Reports" },
] as const;

export type PermissionKey = (typeof USER_PERMISSIONS)[number]["key"];

export const MVP_ROLES = [
  { id: "owner", label: "Hotel Owner", description: "Manage hotel, rooms, bookings, staff, reports" },
  { id: "manager", label: "Manager", description: "Daily operations, bookings, check-in/check-out" },
  { id: "receptionist", label: "Receptionist / Front Desk", description: "Guest handling, reservations, room allocation" },
  { id: "housekeeping", label: "Housekeeping Staff", description: "Room cleaning status, maintenance requests" },
  { id: "accountant", label: "Accountant / Finance", description: "Payments, invoices, expenses, reports" },
  { id: "customer", label: "Guest / Customer", description: "View rooms, bookings, payments, profile" },
] as const;

export const USER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  owner: "Hotel Owner",
  manager: "Manager",
  receptionist: "Receptionist / Front Desk",
  reservation_staff: "Reservation Staff",
  housekeeping: "Housekeeping Staff",
  maintenance: "Maintenance Staff",
  accountant: "Accountant / Finance",
  chef: "Chef / Restaurant Staff",
  security: "Security",
  staff: "Staff",
  customer: "Guest / Customer",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function getRoleDescription(role: string): string {
  return MVP_ROLES.find((r) => r.id === role)?.description ?? "";
}

export function getDepartmentLabel(dept: string): string {
  if (!dept || dept === "none") return "—";
  return USER_DEPARTMENTS.find((d) => d.value === dept)?.label ?? dept.replace(/_/g, " ");
}

export function permissionKeysFromObject(perms: Record<string, boolean> | undefined): PermissionKey[] {
  if (!perms) return [];
  return USER_PERMISSIONS.filter((p) => perms[p.key]).map((p) => p.key);
}

export function permissionsObjectFromKeys(keys: string[]): Record<PermissionKey, boolean> {
  const set = new Set(keys);
  return {
    ViewRooms: set.has("ViewRooms"),
    CreateBooking: set.has("CreateBooking"),
    CheckIn: set.has("CheckIn"),
    Checkout: set.has("Checkout"),
    Payment: set.has("Payment"),
    Reports: set.has("Reports"),
  };
}
