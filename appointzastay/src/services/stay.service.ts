import apiClient from "./api.service";
import type { ActionReq, ActionRes } from "@/models/stay";
import type { RoomDefinition, RoomSelectPayload } from "@/models/room";
import type { RoomStatusPayload } from "@/models/roomStatus";
import type { RoleDefaultsPayload, StayUser, UserSelectPayload } from "@/models/stayUser";
import type { CustomerSelectPayload } from "@/models/customer";
import { normalizeOrganisationPagePayload } from "@/models/organisationProfile";
import { normalizePropertyPayload } from "@/components/site-builder/normalizePropertyPayload";
import { normalizeStaffBooking, normalizeStaffCalendar } from "@/models/staffBooking";

const STAY = "/appointzastay";

async function get<T>(path: string, params?: Record<string, string | boolean | undefined>) {
  const { data } = await apiClient.get<ActionRes<T>>(`${STAY}${path}`, { params });
  const payload = data as ActionRes<T> & { Item?: T };
  return (payload.item ?? payload.Item) as T;
}

async function post<T>(path: string, item?: unknown) {
  const { data } = await apiClient.post<ActionRes<T>>(`${STAY}${path}`, item ? { item } : undefined);
  return data.item;
}

export const stayApi = {
  dashboard: {
    index: () => get<{
      organisation: Record<string, unknown>;
      stats: { rooms: number; users: number; customers: number; packages: number };
      onboarding: Record<string, unknown>;
    }>("/Dashboard/Index"),
    onboarding: () => get<{ organisation: Record<string, unknown>; onboarding: Record<string, unknown>; roomCount?: number }>(
      "/Dashboard/Onboarding"
    ),
    dismissBanner: () => post<boolean>("/Dashboard/DismissOnboardingBanner"),
    markStep: (stepId: string, skipped = false) =>
      post<{ onboarding: Record<string, unknown> }>("/Dashboard/MarkOnboardingStep", { stepId, skipped }),
    setStep: (stepId: string) =>
      post<{ onboarding: Record<string, unknown> }>("/Dashboard/SetOnboardingStep", { stepId, skipped: false }),
  },
  rooms: {
    status: (id?: string, date?: string) =>
      get<RoomStatusPayload>("/Rooms/Status", {
        id,
        date: date || undefined,
      }),
    select: (id?: string, create?: boolean) =>
      get<RoomSelectPayload>("/Rooms/Select", { id, create }),
    updateStatus: (id: string, status: string) => post("/Rooms/UpdateStatus", { id, status }),
    checkout: (id: string) => post("/Rooms/Checkout", { id }),
    markClean: (id: string) => post("/Rooms/MarkClean", { id }),
    assignCleaning: (id: string, staffId: string, moveToCleaning: boolean) =>
      post("/Rooms/AssignCleaning", { id, staffId, moveToCleaning }),
    clearCleaning: (id: string) => post("/Rooms/ClearCleaning", { id }),
    extendStay: (id: string) => post("/Rooms/ExtendStay", { id }),
    addCharges: (id: string) => post("/Rooms/AddCharges", { id }),
    save: (room: RoomDefinition, selectedAmenities?: string[], galleryPhotos?: string[]) =>
      post<RoomDefinition>("/Rooms/Save", { room, selectedAmenities, galleryPhotos }),
    delete: (id: string) => post("/Rooms/Delete", { id }),
  },
  packages: {
    select: (id?: string, create?: boolean) => get<Record<string, unknown>>("/Packages/Select", { id, create }),
    save: (pkg: Record<string, unknown>) => post("/Packages/Save", pkg),
    delete: (id: string) => post("/Packages/Delete", { id }),
  },
  customers: {
    select: (search?: string, id?: string) => get<CustomerSelectPayload>("/Customers/Select", { search, id }),
  },
  users: {
    select: (id?: string, create?: boolean) => get<UserSelectPayload>("/Users/Select", { id, create }),
    save: (user: StayUser, permissions?: string[]) => post<StayUser>("/Users/Save", { user, permissions }),
    delete: (id: string) => post("/Users/Delete", { id }),
    roleDefaults: (role: string) => get<RoleDefaultsPayload>("/Users/RoleDefaults", { role }),
  },
  credits: {
    index: () => get<Record<string, unknown>>("/Credits/Index"),
    changePlan: (planId: string) => post("/Credits/ChangePlan", { id: planId }),
    setBillingMode: (mode: "subscription" | "credit_wallet") =>
      post("/Credits/SetBillingMode", { mode }),
    /** @deprecated Direct recharge disabled — use createWalletRechargeOrder + verifyWalletRecharge */
    rechargeWallet: (packId: string) => post("/Credits/RechargeWallet", { id: packId }),
    createWalletRechargeOrder: (packId: string) =>
      post<Record<string, unknown>>("/Credits/CreateWalletRechargeOrder", { packId, id: packId }),
    verifyWalletRecharge: (payload: {
      rechargeId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => post<Record<string, unknown>>("/Credits/VerifyWalletRecharge", payload),
    walletPacks: () => get<Record<string, unknown>>("/Credits/WalletPacks"),
    referral: () => get<Record<string, unknown>>("/Credits/Referral"),
    applyReferral: (referralCode: string) => post("/Credits/ApplyReferral", { referralCode }),
  },
  organisation: {
    index: async (section?: string, edit?: string, saved?: string) => {
      const item = await get<import("@/models/organisationProfile").OrganisationPagePayload>(
        "/OrganisationDetail/Index",
        { section, edit, saved }
      );
      return normalizeOrganisationPagePayload(item);
    },
    saveBasic: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveBasic", payload),
    saveLocation: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveLocation", payload),
    saveContact: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveContact", payload),
    savePolicies: (payload: Record<string, unknown>) => post("/OrganisationDetail/SavePolicies", payload),
    saveWebsite: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveWebsite", payload),
    saveSeo: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveSeo", payload),
    saveMessaging: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveMessaging", payload),
    savePaymentGateway: (payload: Record<string, unknown>) => post("/OrganisationDetail/SavePaymentGateway", payload),
    saveWeather: (payload: Record<string, unknown>) => post("/OrganisationDetail/SaveWeather", payload),
    saveHighlights: (items: unknown[]) => post("/OrganisationDetail/SaveHighlights", items),
    saveAmenities: (items: unknown[]) => post("/OrganisationDetail/SaveAmenities", items),
    savePackages: (items: unknown[]) => post("/OrganisationDetail/SavePackages", items),
    saveGuestServices: (items: unknown[]) => post("/OrganisationDetail/SaveGuestServices", items),
    saveOffers: (items: unknown[]) => post("/OrganisationDetail/SaveOffers", items),
    saveImages: (items: unknown[]) => post("/OrganisationDetail/SaveImages", items),
    saveNearby: (items: unknown[]) => post("/OrganisationDetail/SaveNearby", items),
    saveSlots: (items: unknown[]) => post("/OrganisationDetail/SaveSlots", items),
    saveClosures: (items: unknown[]) => post("/OrganisationDetail/SaveClosures", items),
    saveActivities: (items: unknown[]) => post("/OrganisationDetail/SaveActivities", items),
    saveReviews: (items: unknown[]) => post("/OrganisationDetail/SaveReviews", items),
    saveFoodMenu: (items: unknown[]) => post("/OrganisationDetail/SaveFoodMenu", items),
    saveTravel: (items: unknown[]) => post("/OrganisationDetail/SaveTravel", items),
    saveFaq: (items: unknown[]) => post("/OrganisationDetail/SaveFaq", items),
    uploadLogo: (form: FormData) => apiClient.post(`${STAY}/OrganisationDetail/UploadLogo`, form),
    uploadImages: (form: FormData) => apiClient.post(`${STAY}/OrganisationDetail/UploadImages`, form),
    removeImageAsset: (id: string) => post("/OrganisationDetail/RemoveImageAsset", { id }),
    clearLogo: () => post("/OrganisationDetail/ClearLogo"),
    setLogoAsset: (logoAssetId: string) => post("/OrganisationDetail/SetLogoAsset", { logoAssetId }),
    addImageUrl: (payload: Record<string, unknown>) => post("/OrganisationDetail/AddImageUrl", payload),
  },
  assets: {
    list: () => apiClient.get(`${STAY}/Assets/List`).then((r) => r.data),
    upload: async (file: File, title: string, category = "gallery") => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("category", category);
      const { data } = await apiClient.post<ActionRes<Record<string, unknown>>>(
        `${STAY}/Assets/Upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return (data.item ?? (data as { Item?: Record<string, unknown> }).Item) as Record<string, unknown>;
    },
  },
  siteBuilder: {
    index: () => get<Record<string, unknown>>("/SiteBuilder/Index"),
    preview: () => get<Record<string, unknown>>("/SiteBuilder/Preview"),
    syncFromProfile: () => post<Record<string, unknown>>("/SiteBuilder/SyncFromProfile"),
    saveBlocks: (page: unknown) => apiClient.post(`${STAY}/SiteBuilder/SaveBlocks`, page),
    renderHtmlPreview: (html: string) =>
      post<string>("/SiteBuilder/RenderHtmlPreview", { html }),
  },
  home: {
    property: async () => normalizePropertyPayload(await get<Record<string, unknown>>("/Home/Property")),
    resolve: () => get<Record<string, unknown>>("/Home/Resolve"),
    context: () => get<{ isStaff: boolean; user: unknown; organisation: Record<string, unknown> }>("/Home/Context"),
  },
  booking: {
    index: (params?: {
      roomId?: string;
      packageId?: string;
      checkIn?: string;
      checkOut?: string;
      checkInTime?: string;
      checkOutTime?: string;
    }) => get<Record<string, unknown>>("/Booking/Index", params as Record<string, string>),
    quote: (
      checkIn: string,
      checkOut: string,
      options: {
        roomId?: string;
        persons?: number;
        extraBeds?: number;
        packageIds?: string[];
        guestServiceIds?: string[];
        checkInTime?: string;
        checkOutTime?: string;
      } = {}
    ) =>
      get<Record<string, unknown>>("/Booking/Quote", {
        checkIn,
        checkOut,
        roomId: options.roomId || undefined,
        persons: String(options.persons ?? 2),
        extraBeds: String(options.extraBeds ?? 0),
        packageIds: options.packageIds?.filter((id) => id.trim()).join(",") || undefined,
        serviceIds: options.guestServiceIds?.filter((id) => id.trim()).join(",") || undefined,
        checkInTime: options.checkInTime || undefined,
        checkOutTime: options.checkOutTime || undefined,
      }),
    create: (req: {
      RoomId?: string;
      GuestName: string;
      Phone: string;
      Email?: string;
      CheckIn: string;
      CheckOut: string;
      CheckInTime?: string;
      CheckOutTime?: string;
      Persons: number;
      ExtraBeds: number;
      PackageIds: string[];
      GuestServiceIds: string[];
    }) => post<Record<string, unknown>>("/Booking/Create", req),
    createPaymentOrder: (bookingId: string) =>
      post<Record<string, unknown>>("/Booking/CreatePaymentOrder", { bookingId }),
    verifyPayment: (payload: {
      bookingId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => post<Record<string, unknown>>("/Booking/VerifyPayment", payload),
    cancelUnpaid: (bookingId: string) =>
      post<boolean>("/Booking/CancelUnpaid", { bookingId }),
  },
  bookings: {
    calendar: async (year?: number, month?: number) =>
      normalizeStaffCalendar(
        (await get<Record<string, unknown>>("/Bookings/Calendar", {
          year: year != null ? String(year) : undefined,
          month: month != null ? String(month) : undefined,
        })) ?? {}
      ),
    detail: async (id: string) =>
      normalizeStaffBooking((await get<Record<string, unknown>>("/Bookings/Detail", { id })) ?? {}),
  },
};
