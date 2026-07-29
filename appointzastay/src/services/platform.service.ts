import apiClient from "./api.service";
import type { ActionRes } from "@/models/stay";

const STAY = "/appointzastay";

export interface PlatformOrganisationRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  walletCreditBalance: number;
  bookingCredits: number;
  userCount: number;
  customerCount: number;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface PlatformTodayBookingsRes {
  date: string;
  bookings: PlatformBookingRow[];
  total: number;
}

export interface PlatformBookingRow {
  id: string;
  bookingCode: string;
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  total: number;
  paid: number;
  balance: number;
  bookedToday: boolean;
  arrivalToday: boolean;
  createdAt: string;
}

export interface PlatformOrganisationListRes {
  organisations: PlatformOrganisationRow[];
  total: number;
}

async function get<T>(path: string) {
  const { data } = await apiClient.get<ActionRes<T>>(`${STAY}${path}`);
  const payload = data as ActionRes<T> & { Item?: T };
  return (payload.item ?? payload.Item) as T;
}

async function post<T>(path: string, item: unknown) {
  const { data } = await apiClient.post<ActionRes<T>>(`${STAY}${path}`, { item });
  return data.item;
}

export const platformApi = {
  listOrganisations: () => get<PlatformOrganisationListRes>("/PlatformAdmin/Organisations"),
  listTodayBookings: (date?: string) =>
    get<PlatformTodayBookingsRes>(`/PlatformAdmin/TodayBookings${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  setVerification: (organisationId: string, verified: boolean) =>
    post<PlatformOrganisationRow>("/PlatformAdmin/SetVerification", { organisationId, verified }),
};
