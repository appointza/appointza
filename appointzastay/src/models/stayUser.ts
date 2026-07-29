import { permissionsObjectFromKeys, permissionKeysFromObject } from "@/config/userCatalog";

export interface UserPermissions {
  ViewRooms: boolean;
  CreateBooking: boolean;
  CheckIn: boolean;
  Checkout: boolean;
  Payment: boolean;
  Reports: boolean;
}

export interface StayUser {
  Id: string;
  OrganisationId?: string;
  Name: string;
  Phone: string;
  Email: string;
  Password: string;
  Role: string;
  Department: string;
  Status: string;
  Permissions: UserPermissions;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface UserSelectPayload {
  users: StayUser[];
  selected: StayUser | null;
  create: boolean;
}

export interface RoleDefaultsPayload {
  department: string;
  permissions: string[];
}

export function emptyUser(): StayUser {
  return {
    Id: "",
    Name: "",
    Phone: "",
    Email: "",
    Password: "",
    Role: "receptionist",
    Department: "front_office",
    Status: "active",
    Permissions: permissionsObjectFromKeys(["ViewRooms", "CreateBooking", "CheckIn", "Checkout"]),
  };
}

export function normalizeUser(raw: Record<string, unknown>): StayUser {
  const perms = (raw.Permissions as UserPermissions) ?? {};
  return {
    Id: String(raw.Id ?? ""),
    OrganisationId: raw.OrganisationId ? String(raw.OrganisationId) : undefined,
    Name: String(raw.Name ?? ""),
    Phone: String(raw.Phone ?? ""),
    Email: String(raw.Email ?? ""),
    Password: String(raw.Password ?? ""),
    Role: String(raw.Role ?? "receptionist"),
    Department: String(raw.Department ?? "none"),
    Status: String(raw.Status ?? "active"),
    Permissions: {
      ViewRooms: Boolean(perms.ViewRooms),
      CreateBooking: Boolean(perms.CreateBooking),
      CheckIn: Boolean(perms.CheckIn),
      Checkout: Boolean(perms.Checkout),
      Payment: Boolean(perms.Payment),
      Reports: Boolean(perms.Reports),
    },
    CreatedAt: raw.CreatedAt ? String(raw.CreatedAt) : undefined,
    UpdatedAt: raw.UpdatedAt ? String(raw.UpdatedAt) : undefined,
  };
}

export function userPermissionKeys(user: StayUser): string[] {
  return permissionKeysFromObject(user.Permissions as unknown as Record<string, boolean>);
}
