import { createContext } from "react";
import { UsersPermissionData } from "@/models/users.model";

export interface AuthUser {
  id: number;
  mobile: string;
  organisationid: number;
  locationid: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  username?: string;
  imageid?: number;
  userpermission?: UsersPermissionData;
  isStaff?: boolean;
  /** Mirrors users.isfactory. Display hint only; the API enforces it from the database. */
  isSuperAdmin?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  /** False until localStorage auth has been read (avoids redirect flash on reload). */
  authReady: boolean;
  userType: "user" | "organization" | null;
  user: AuthUser | null;
  /** True for users with users.isfactory = true (login flag, confirmed by api/Auth/SuperAdminStatus). */
  isSuperAdmin: boolean;
  mobile: string | null;
  canSwitchMode: boolean;
  setUserType: (type: "user" | "organization") => void;
  setMobile: (mobile: string) => void;
  switchToMode: (mode: "user" | "organization") => void;
  logout: () => void;
  refreshAuth: () => void;
}

/** Stable context object — keep this file free of components so HMR cannot recreate it. */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
