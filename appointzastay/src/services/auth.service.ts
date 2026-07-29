import apiClient from "./api.service";
import type { ActionRes, AppointzaStayAuthRes } from "@/models/stay";
import { clearManagedOrganisation } from "@/utils/platformAdminContext";

export interface StayLoginReq {
  login: string;
  password: string;
}

export interface StaySignupReq {
  accountType: "Guest" | "Organisation";
  name: string;
  phone: string;
  email: string;
  password: string;
}

const AUTH_TOKEN_KEY = "auth_token";
const STAY_USER_KEY = "appointzastay_user";

export function getStayUser(): AppointzaStayAuthRes | null {
  const raw = localStorage.getItem(STAY_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppointzaStayAuthRes;
  } catch {
    return null;
  }
}

export function setStaySession(session: AppointzaStayAuthRes): void {
  localStorage.setItem(AUTH_TOKEN_KEY, session.accesstoken);
  localStorage.setItem(STAY_USER_KEY, JSON.stringify(session));
}

export function clearStaySession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(STAY_USER_KEY);
  clearManagedOrganisation();
}

class AuthService {
  async login(data: StayLoginReq): Promise<AppointzaStayAuthRes> {
    const response = await apiClient.post<ActionRes<AppointzaStayAuthRes>>(
      "/Auth/AppointzaStayLogin",
      { item: data }
    );
    const session = response.data.item;
    setStaySession(session);
    return session;
  }

  async register(data: StaySignupReq): Promise<AppointzaStayAuthRes> {
    const response = await apiClient.post<ActionRes<AppointzaStayAuthRes>>(
      "/Auth/AppointzaStayRegister",
      {
        item: {
          accountType: data.accountType === "Organisation" ? 1 : 0,
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
        },
      }
    );
    const session = response.data.item;
    setStaySession(session);
    return session;
  }

  logout(): void {
    clearStaySession();
  }
}

export const authService = new AuthService();
