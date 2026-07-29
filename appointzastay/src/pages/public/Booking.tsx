import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stayApi } from "@/services/stay.service";
import { keysToCamelCase } from "@/models/organisationProfile";
import { formatStayDateTime, formatTimeLabel, normalizeTimeInput } from "@/models/staffBooking";
import { BOOKING_ROOM_NONE } from "@/utils/bookingLinks";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Minus, Plus, Users } from "lucide-react";
import { loadScript } from "@/utils/razorpay.util";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const schema = z
  .object({
    roomId: z.string().optional().default(""),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    checkInTime: z.string().min(1),
    checkOutTime: z.string().min(1),
    guestName: z.string().min(1),
    guestPhone: z.string().min(1),
    guestEmail: z.string().email().optional().or(z.literal("")),
    persons: z.coerce.number().min(1).default(2),
  })
  .refine(
    (data) => {
      const start = new Date(`${data.checkIn}T${data.checkInTime}`);
      const end = new Date(`${data.checkOut}T${data.checkOutTime}`);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
    },
    { message: "Check-out must be after check-in (date and time).", path: ["checkOutTime"] }
  )
  .refine(
    (data) => data.checkIn >= todayIsoLocal(),
    { message: "Check-in cannot be in the past.", path: ["checkIn"] }
  )
  .refine(
    (data) => data.checkOut >= todayIsoLocal(),
    { message: "Check-out cannot be in the past.", path: ["checkOut"] }
  );

type BookingForm = z.infer<typeof schema>;

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function clampDateToTodayOrLater(value: string): string {
  const trimmed = value.trim();
  const today = todayIsoLocal();
  if (!trimmed) return "";
  return trimmed < today ? today : trimmed;
}

const nativeSelectClass =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:h-10 sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const nativeCheckboxClass =
  "mt-1 h-5 w-5 sm:mt-0.5 sm:h-4 sm:w-4 shrink-0 rounded border border-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type GuestServiceOption = {
  id: string;
  name: string;
  price: string;
  description?: string;
  icon?: string;
  category?: string;
};

type PackageOption = {
  id: string;
  name: string;
  price: string;
  description?: string;
  badge?: string;
  kind?: string;
  includesRoom: boolean;
  roomType?: string;
  includes?: string[];
  addOns?: string[];
  minimumNights?: number;
  maxGuests?: number;
  includedGuests?: number;
  extraGuestCharge?: number;
  validFrom?: string;
  validTo?: string;
  imageUrl?: string;
};

type BookingQuote = {
  bookingType?: string;
  nights?: number;
  hours?: number;
  duration?: number;
  durationLabel?: string;
  roomTotal?: number;
  extraBedTotal?: number;
  extraGuestTotal?: number;
  packagesTotal?: number;
  packages?: { name?: string; priceLabel?: string; total?: number }[];
  servicesTotal?: number;
  services?: { name?: string; priceLabel?: string; total?: number }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  maxExtraBeds?: number;
  maxPersons?: number;
  extraBedChargePerNight?: number;
  pricePerHour?: number;
  minimumHours?: number;
};

function pickNum(obj: Record<string, unknown> | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== "") return Number(val);
  }
  return 0;
}

function pickStr(obj: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null) return String(val);
  }
  return "";
}

function roomCapacity(room: Record<string, unknown>) {
  const cap = (room.capacity ?? room.Capacity) as Record<string, unknown> | undefined;
  return {
    totalGuests: pickNum(cap, "totalGuests", "TotalGuests") || 2,
    extraBedsAllowed: pickNum(cap, "extraBedsAllowed", "ExtraBedsAllowed"),
  };
}

function roomPricing(room: Record<string, unknown>) {
  const pricing = (room.pricing ?? room.Pricing) as Record<string, unknown> | undefined;
  return {
    extraBedCharge: pickNum(pricing, "extraBedCharge", "ExtraBedCharge"),
    extraGuestCharge: pickNum(pricing, "extraGuestCharge", "ExtraGuestCharge"),
  };
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizePackages(source: Record<string, unknown>[]): PackageOption[] {
  return source
    .map((item) => keysToCamelCase(item) as Record<string, unknown>)
    .filter((p) => p.isActive !== false && pickStr(p, "name"))
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((p) => {
      const name = pickStr(p, "name");
      const kind = pickStr(p, "kind") || "stay";
      const includes = Array.isArray(p.includes)
        ? (p.includes as unknown[]).map(String).filter(Boolean)
        : [];
      const addOns = Array.isArray(p.addOns)
        ? (p.addOns as unknown[]).map(String).filter(Boolean)
        : [];
      return {
        id: pickStr(p, "id") || `name:${name.trim().toLowerCase()}`,
        name,
        price: pickStr(p, "price"),
        description: pickStr(p, "description") || undefined,
        badge: pickStr(p, "badge") || undefined,
        kind,
        includesRoom: kind.toLowerCase() !== "addon",
        roomType: pickStr(p, "roomType") || undefined,
        includes,
        addOns,
        minimumNights: Number(p.minimumNights ?? 0) || undefined,
        maxGuests: Number(p.maxGuests ?? 0) || undefined,
        includedGuests: Number(p.includedGuests ?? 0) || undefined,
        extraGuestCharge: Number(p.extraGuestCharge ?? 0) || undefined,
        validFrom: pickStr(p, "validFrom") || undefined,
        validTo: pickStr(p, "validTo") || undefined,
        imageUrl: pickStr(p, "imageUrl") || undefined,
      };
    });
}

function normalizeGuestServices(org: Record<string, unknown>): GuestServiceOption[] {
  const raw = (org.guestServices ?? org.GuestServices) as Record<string, unknown>[] | undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => keysToCamelCase(item) as Record<string, unknown>)
    .filter((s) => s.isActive !== false && pickStr(s, "name"))
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((s) => {
      const name = pickStr(s, "name");
      return {
        id: pickStr(s, "id") || `name:${name.trim().toLowerCase()}`,
        name,
        price: pickStr(s, "price"),
        description: pickStr(s, "description") || undefined,
        icon: pickStr(s, "icon") || undefined,
        category: pickStr(s, "category") || undefined,
      };
    });
}

export default function BookingPage() {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [extraBeds, setExtraBeds] = useState(0);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [editOvernightTimes, setEditOvernightTimes] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    bookingCode?: string;
    total?: number;
    checkIn?: string;
    checkOut?: string;
    checkInTime?: string;
    checkOutTime?: string;
    paid?: boolean;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-index", params.get("roomId"), params.get("packageId")],
    queryFn: () =>
      stayApi.booking.index({
        roomId: params.get("roomId") || undefined,
        packageId: params.get("packageId") || undefined,
        checkIn: params.get("checkIn") || undefined,
        checkOut: params.get("checkOut") || undefined,
      }),
  });

  const form = useForm<BookingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomId: params.get("roomId") || "",
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      persons: 2,
    },
  });

  const page = useMemo(() => keysToCamelCase(data ?? {}) as Record<string, unknown>, [data]);
  const organisation = useMemo(
    () => (page.organisation as Record<string, unknown>) ?? {},
    [page.organisation]
  );
  const orgPayment = useMemo(
    () => (organisation.payment as Record<string, unknown>) ?? {},
    [organisation]
  );
  const onlinePaymentsEnabled = Boolean(orgPayment.onlineEnabled);
  const isHourlyBooking =
    String(organisation.bookingType || "").toLowerCase() === "hourly";
  const overnightTimesDynamic =
    !isHourlyBooking &&
    String(organisation.overnightTimeMode || "fixed").toLowerCase() === "dynamic";
  const guestServices = useMemo(() => normalizeGuestServices(organisation), [organisation]);
  const propertySlots = useMemo(() => {
    const list = (organisation.slots as Record<string, unknown>[]) ?? [];
    const kind = isHourlyBooking ? "hourly" : "overnight";
    return list
      .filter((s) => s && s.isActive !== false)
      .filter((s) => {
        const k = String(s.kind || kind).toLowerCase();
        return k === kind || k === "";
      })
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [organisation.slots, isHourlyBooking]);
  const propertyClosures = useMemo(
    () => ((organisation.closures as Record<string, unknown>[]) ?? []),
    [organisation.closures],
  );
  const packages = useMemo(() => {
    const fromPage = (page.packages as Record<string, unknown>[]) ?? [];
    const fromOrg = (organisation.packages as Record<string, unknown>[]) ?? [];
    return normalizePackages(fromPage.length > 0 ? fromPage : fromOrg);
  }, [page.packages, organisation]);

  const policyCheckInTime = useMemo(
    () =>
      normalizeTimeInput(
        pickStr(organisation, "checkInTime"),
        isHourlyBooking ? "14:00" : "14:00"
      ),
    [organisation, isHourlyBooking]
  );
  const policyCheckOutTime = useMemo(
    () =>
      normalizeTimeInput(
        pickStr(organisation, "checkOutTime"),
        isHourlyBooking ? "17:00" : "11:00"
      ),
    [organisation, isHourlyBooking]
  );

  const hydratedRef = useRef(false);
  const policyTimesRef = useRef(false);
  const deepLinkedRoomId = (params.get("roomId") || "").trim();

  useEffect(() => {
    if (isLoading || policyTimesRef.current) return;
    policyTimesRef.current = true;
    form.setValue("checkInTime", policyCheckInTime);
    form.setValue("checkOutTime", policyCheckOutTime);
  }, [isLoading, policyCheckInTime, policyCheckOutTime, form]);

  useEffect(() => {
    if (isLoading || hydratedRef.current) return;
    const hasDeepLink =
      page.checkIn || page.selectedRoomId || page.selectedPackageId || deepLinkedRoomId;
    if (!hasDeepLink) return;

    hydratedRef.current = true;
    // Prefer URL roomId so Book now from property page always pre-selects that room.
    const initialRoom = deepLinkedRoomId || String(page.selectedRoomId ?? "");
    const needsRoomFromPackage = Boolean(page.selectedPackageId);
    form.reset({
      roomId: initialRoom || (needsRoomFromPackage ? "" : BOOKING_ROOM_NONE),
      checkIn: clampDateToTodayOrLater(String(page.checkIn ?? "")),
      checkOut: clampDateToTodayOrLater(String(page.checkOut ?? "")),
      checkInTime: policyCheckInTime,
      checkOutTime: policyCheckOutTime,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      persons: 2,
    });
    if (page.selectedPackageId) {
      setSelectedPackages([String(page.selectedPackageId)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, page.checkIn, page.selectedRoomId, page.selectedPackageId, policyCheckInTime, policyCheckOutTime, deepLinkedRoomId]);

  const roomIdRaw = form.watch("roomId");
  const roomId = roomIdRaw && roomIdRaw !== BOOKING_ROOM_NONE ? roomIdRaw : "";
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const checkInTime = form.watch("checkInTime");
  const checkOutTime = form.watch("checkOutTime");
  const persons = form.watch("persons");

  const minBookingDate = todayIsoLocal();
  const minCheckOutDate = useMemo(() => {
    if (!checkIn || checkIn < minBookingDate) return minBookingDate;
    return checkIn;
  }, [checkIn, minBookingDate]);

  useEffect(() => {
    if (!isHourlyBooking && checkIn && checkOut && checkOut < checkIn) {
      form.setValue("checkOut", checkIn);
    }
    if (checkIn && checkIn < minBookingDate) {
      form.setValue("checkIn", minBookingDate);
    }
    if (checkOut && checkOut < minBookingDate) {
      form.setValue("checkOut", minBookingDate);
    }
  }, [isHourlyBooking, checkIn, checkOut, minBookingDate, form]);

  const slotsForSelectedDay = useMemo(() => {
    if (!checkIn || propertySlots.length === 0) return propertySlots;
    const dow = new Date(`${checkIn}T12:00:00`).getDay();
    return propertySlots.filter((s) => {
      const days = Array.isArray(s.daysOfWeek) ? (s.daysOfWeek as number[]) : [];
      return days.length === 0 || days.includes(dow);
    });
  }, [propertySlots, checkIn]);

  const closureNotice = useMemo(() => {
    if (!checkIn) return null;
    const inDate = checkIn;
    const outDate = isHourlyBooking ? checkIn : checkOut || checkIn;
    for (const c of propertyClosures) {
      const from = String(c.fromDate || "");
      const to = String(c.toDate || c.fromDate || "");
      if (!from) continue;
      if (inDate <= to && outDate >= from) {
        const reason = String(c.reason || "closed");
        const note = String(c.note || "").trim();
        const range = to && to !== from ? `${from} → ${to}` : from;
        return `Property is ${reason} on ${range}${note ? ` — ${note}` : ""}. Please choose other dates.`;
      }
    }
    return null;
  }, [checkIn, checkOut, isHourlyBooking, propertyClosures]);

  const applySlot = (slotId: string) => {
    const slot = slotsForSelectedDay.find((s) => String(s.id) === slotId)
      || propertySlots.find((s) => String(s.id) === slotId);
    if (!slot) return;
    form.setValue("checkInTime", normalizeTimeInput(String(slot.startTime || ""), policyCheckInTime));
    form.setValue("checkOutTime", normalizeTimeInput(String(slot.endTime || ""), policyCheckOutTime));
  };

  useEffect(() => {
    if (!isHourlyBooking || !checkIn) return;
    if (checkOut !== checkIn) form.setValue("checkOut", checkIn);
  }, [isHourlyBooking, checkIn, checkOut, form]);

  useEffect(() => {
    if (!overnightTimesDynamic) {
      setEditOvernightTimes(false);
      form.setValue("checkInTime", policyCheckInTime);
      form.setValue("checkOutTime", policyCheckOutTime);
    }
  }, [overnightTimesDynamic, policyCheckInTime, policyCheckOutTime, form]);

  const { data: availabilityData, isFetching: isAvailabilityFetching } = useQuery({
    queryKey: ["booking-rooms", checkIn, checkOut, checkInTime, checkOutTime],
    queryFn: () =>
      stayApi.booking.index({
        checkIn,
        checkOut,
        checkInTime,
        checkOutTime,
        roomId: params.get("roomId") || undefined,
        packageId: params.get("packageId") || undefined,
      }),
    enabled: Boolean(checkIn && checkOut && checkInTime && checkOutTime),
  });

  const rooms = useMemo(() => {
    // Prefer availability query (date+time filtered). Fall back to initial page load.
    const source = availabilityData ?? data;
    const pageData = keysToCamelCase(source ?? {}) as Record<string, unknown>;
    return ((pageData.rooms as Record<string, unknown>[]) ?? []).map(
      (r) => keysToCamelCase(r) as Record<string, unknown>
    );
  }, [availabilityData, data]);

  // API already filters by selected check-in / check-out date and time.
  const roomOptions = rooms;

  const requestedRoomUnavailable = useMemo(() => {
    const wanted = deepLinkedRoomId.trim();
    if (!wanted) return false;
    if (!availabilityData && !data) return false;
    return !rooms.some((r) => String(r.id) === wanted);
  }, [deepLinkedRoomId, rooms, availabilityData, data]);

  const selectedRoom = roomOptions.find((r) => String(r.id) === roomId);
  const capacity = selectedRoom ? roomCapacity(selectedRoom) : { totalGuests: 2, extraBedsAllowed: 0 };
  const pricing = selectedRoom
    ? roomPricing(selectedRoom)
    : { extraBedCharge: 0, extraGuestCharge: 0 };
  const maxExtraBeds = capacity.extraBedsAllowed;

  useEffect(() => {
    if (extraBeds > maxExtraBeds) setExtraBeds(maxExtraBeds);
  }, [maxExtraBeds, extraBeds]);

  const selectedPackageIds = useMemo(
    () => selectedPackages.filter((id) => id.trim().length > 0),
    [selectedPackages]
  );

  const selectedStayPackages = useMemo(
    () => packages.filter((p) => selectedPackageIds.includes(p.id) && p.includesRoom),
    [packages, selectedPackageIds]
  );

  const primaryPackage = selectedStayPackages[0];
  const includedGuests = Math.max(
    1,
    primaryPackage?.includedGuests || capacity.totalGuests || 1,
  );
  const maxGuestsAllowed = Math.max(
    includedGuests,
    primaryPackage?.maxGuests || capacity.totalGuests + maxExtraBeds || includedGuests,
  );
  const extraGuestUnitPrice = Math.max(
    0,
    primaryPackage?.extraGuestCharge ?? pricing.extraGuestCharge ?? 0,
  );
  const extraPeopleCount = Math.max(0, Number(persons || 0) - includedGuests);
  const estimatedExtraGuestFee = extraPeopleCount * extraGuestUnitPrice;

  const setPersons = (next: number) => {
    const clamped = Math.min(maxGuestsAllowed, Math.max(1, next));
    form.setValue("persons", clamped, { shouldValidate: true, shouldDirty: true });
  };

  // When package/room capacity loads, bump default guests to included count once.
  useEffect(() => {
    if (!includedGuests) return;
    if (Number(persons) < includedGuests && Number(persons) <= 2) {
      form.setValue("persons", includedGuests);
    }
  }, [includedGuests]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsRoomForPackage = selectedStayPackages.length > 0;

  // Keep deep-linked room selected only while it remains free for the selected date/time.
  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) return;
    if (rooms.length === 0 && !availabilityData) return;
    if (rooms.some((r) => String(r.id) === roomId)) return;
    form.setValue("roomId", needsRoomForPackage ? "" : BOOKING_ROOM_NONE);
  }, [roomId, checkIn, checkOut, rooms, needsRoomForPackage, form, availabilityData]);

  const roomFieldValue = useMemo(() => {
    const raw = (roomIdRaw ?? "").trim();
    if (raw && raw !== BOOKING_ROOM_NONE) return raw;
    return needsRoomForPackage ? "" : BOOKING_ROOM_NONE;
  }, [roomIdRaw, needsRoomForPackage]);

  const selectedServiceIds = useMemo(
    () => selectedServices.filter((id) => id.trim().length > 0),
    [selectedServices]
  );

  const localPackageLines = useMemo(
    () =>
      packages
        .filter((p) => selectedPackageIds.includes(p.id))
        .map((p) => ({ name: p.name, priceLabel: p.price, total: parseMoney(p.price) })),
    [packages, selectedPackageIds]
  );

  const localServiceLines = useMemo(
    () =>
      guestServices
        .filter((s) => selectedServiceIds.includes(s.id))
        .map((s) => ({ name: s.name, priceLabel: s.price, total: parseMoney(s.price) })),
    [guestServices, selectedServiceIds]
  );

  const loadQuote = useCallback(async () => {
    if (!checkIn || !checkOut) return;
    if (!roomId && selectedPackageIds.length === 0 && selectedServiceIds.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const q = keysToCamelCase(
        await stayApi.booking.quote(checkIn, checkOut, {
          roomId: roomId || undefined,
          persons,
          extraBeds,
          packageIds: selectedPackageIds,
          guestServiceIds: selectedServiceIds,
          checkInTime,
          checkOutTime,
        })
      ) as BookingQuote;
      setQuote(q);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setQuote(null);
      setQuoteError(err?.response?.data?.error || "Could not calculate quote");
    } finally {
      setQuoteLoading(false);
    }
  }, [roomId, checkIn, checkOut, checkInTime, checkOutTime, persons, extraBeds, selectedPackageIds, selectedServiceIds]);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    const timer = window.setTimeout(() => void loadQuote(), 400);
    return () => window.clearTimeout(timer);
  }, [roomId, checkIn, checkOut, checkInTime, checkOutTime, persons, extraBeds, selectedPackageIds, selectedServiceIds, loadQuote]);

  const togglePackage = (packageId: string, checked: boolean) => {
    setSelectedPackages((prev) =>
      checked ? [...prev, packageId] : prev.filter((id) => id !== packageId)
    );
    if (checked) {
      const pkg = packages.find((p) => p.id === packageId);
      if (pkg?.includesRoom) {
        const current = form.getValues("roomId");
        if (!current || current === BOOKING_ROOM_NONE) {
          form.setValue("roomId", "");
        }
      }
    }
  };

  const toggleService = (serviceId: string, checked: boolean) => {
    setSelectedServices((prev) =>
      checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
    );
  };

  const onSubmit = async (values: BookingForm) => {
    const hasRoom = Boolean(values.roomId && values.roomId !== BOOKING_ROOM_NONE);
    if (needsRoomForPackage && !hasRoom) {
      toast({
        title: "Room required",
        description: "Stay packages include your room — please select a room for your dates.",
        variant: "destructive",
      });
      return;
    }
    if (!hasRoom && selectedPackageIds.length === 0 && selectedServiceIds.length === 0) {
      toast({
        title: "Nothing selected",
        description: "Choose a room, package, or add-on service to continue.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = keysToCamelCase(
        await stayApi.booking.create({
          RoomId: hasRoom ? values.roomId : undefined,
          GuestName: values.guestName,
          Phone: values.guestPhone,
          Email: values.guestEmail || undefined,
          CheckIn: values.checkIn,
          CheckOut: isHourlyBooking ? values.checkIn : values.checkOut,
          CheckInTime: values.checkInTime,
          CheckOutTime: values.checkOutTime,
          Persons: values.persons,
          ExtraBeds: extraBeds,
          PackageIds: selectedPackageIds,
          GuestServiceIds: selectedServiceIds,
        })
      ) as Record<string, unknown>;

      const bookingId = pickStr(result, "bookingId");
      const bookingCode = pickStr(result, "bookingCode");
      const total = pickNum((result.quote as Record<string, unknown>) ?? result, "total");
      // Server decides: Razorpay Enabled + Collect at booking + amount > 0
      const needsOnlinePay = Boolean(result.onlinePaymentRequired);

      const finish = (paid: boolean) => {
        setConfirmed({
          bookingCode,
          total,
          checkIn: pickStr(result, "checkIn") || values.checkIn,
          checkOut: pickStr(result, "checkOut") || values.checkOut,
          checkInTime: pickStr(result, "checkInTime") || values.checkInTime,
          checkOutTime: pickStr(result, "checkOutTime") || values.checkOutTime,
          paid,
        });
        toast({
          title: paid ? "Booking paid" : "Booking confirmed!",
          description: `Reference: ${bookingCode}`,
        });
      };

      const abandonUnpaid = async (reason: string) => {
        if (bookingId) {
          try {
            await stayApi.booking.cancelUnpaid(bookingId);
          } catch {
            /* best-effort cancel */
          }
        }
        toast({
          title: "Payment required",
          description: reason || "Booking was not confirmed. Please try again and complete payment.",
          variant: "destructive",
        });
      };

      if (needsOnlinePay && bookingId && total > 0) {
        try {
          const orderRaw = keysToCamelCase(
            await stayApi.booking.createPaymentOrder(bookingId)
          ) as Record<string, unknown>;
          await loadScript("https://checkout.razorpay.com/v1/checkout.js");
          if (!window.Razorpay) throw new Error("Razorpay checkout failed to load.");

          await new Promise<void>((resolve, reject) => {
            const rzp = new window.Razorpay!({
              key: pickStr(orderRaw, "key"),
              amount: Math.round(pickNum(orderRaw, "amount") * 100),
              currency: pickStr(orderRaw, "currency") || "INR",
              name: pickStr(orderRaw, "propertyName") || "AppointzaStay",
              description: `Booking ${bookingCode}`,
              order_id: pickStr(orderRaw, "orderId"),
              prefill: {
                name: pickStr(orderRaw, "guestName") || values.guestName,
                email: pickStr(orderRaw, "guestEmail") || values.guestEmail || "",
                contact: pickStr(orderRaw, "guestPhone") || values.guestPhone,
              },
              theme: { color: "#0f766e" },
              handler: async (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
              }) => {
                try {
                  await stayApi.booking.verifyPayment({
                    bookingId,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  });
                  finish(true);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              },
              modal: {
                ondismiss: () => {
                  void abandonUnpaid("Payment was cancelled. Your room was not reserved.");
                  resolve();
                },
              },
            });
            rzp.open();
          });
        } catch (payErr) {
          await abandonUnpaid(
            (payErr as { response?: { data?: { error?: string } }; message?: string })?.response?.data
              ?.error ||
              (payErr as Error)?.message ||
              "Payment could not be started."
          );
        }
      } else {
        finish(false);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast({
        title: "Booking failed",
        description: err?.response?.data?.error || err?.message || "Could not complete booking",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-dvh bg-slate-50 py-6 sm:py-8 px-3 sm:px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto w-full">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">
                {confirmed.paid ? "Payment successful" : "Booking confirmed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              <p className="text-sm text-muted-foreground">
                {confirmed.paid
                  ? "Your reservation is confirmed and paid. Save your reference number:"
                  : "Your reservation has been created. Save your reference number:"}
              </p>
              <p className="text-xl sm:text-2xl font-semibold tracking-wide break-all">{confirmed.bookingCode}</p>
              {confirmed.checkIn && (
                <div className="text-sm space-y-1 rounded-md border bg-muted/30 p-3">
                  <p>
                    <span className="text-muted-foreground">Check-in: </span>
                    {formatStayDateTime(confirmed.checkIn, confirmed.checkInTime)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Check-out: </span>
                    {formatStayDateTime(confirmed.checkOut ?? "", confirmed.checkOutTime)}
                  </p>
                </div>
              )}
              {confirmed.total != null && confirmed.total > 0 && (
                <p className="text-sm">Total: {formatInr(confirmed.total)}</p>
              )}
              <Button asChild className="w-full mt-4 h-11">
                <Link to="/property">Back to property</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 py-6 sm:py-8 px-3 sm:px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto w-full">
        <Link
          to="/property"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4 sm:mb-6 min-h-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to property
        </Link>

        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6 space-y-1">
            <CardTitle className="text-xl sm:text-2xl">
              {isHourlyBooking ? "Book your slot" : "Book your stay"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isHourlyBooking
                ? "Pick a date, start time, and end time."
                : "Choose dates and how many people are coming."}
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {closureNotice ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {closureNotice}
                  </div>
                ) : null}
                {isHourlyBooking ? (
                  <div className="space-y-3 rounded-lg border bg-white p-3">
                    <div className="space-y-1.5">
                      <Label>Booking date</Label>
                      <Input
                        type="date"
                        min={minBookingDate}
                        className="h-11 text-base sm:h-10 sm:text-sm"
                        {...form.register("checkIn", {
                          onChange: (e) => {
                            form.setValue("checkOut", e.target.value);
                          },
                        })}
                      />
                    </div>
                    {propertySlots.length > 0 ? (
                      <div className="space-y-1.5">
                        <Label>Select slot</Label>
                        <select
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
                          value={
                            slotsForSelectedDay.find(
                              (s) =>
                                normalizeTimeInput(String(s.startTime || ""), "") ===
                                  normalizeTimeInput(checkInTime, "") &&
                                normalizeTimeInput(String(s.endTime || ""), "") ===
                                  normalizeTimeInput(checkOutTime, ""),
                            )
                              ? String(
                                  slotsForSelectedDay.find(
                                    (s) =>
                                      normalizeTimeInput(String(s.startTime || ""), "") ===
                                        normalizeTimeInput(checkInTime, "") &&
                                      normalizeTimeInput(String(s.endTime || ""), "") ===
                                        normalizeTimeInput(checkOutTime, ""),
                                  )?.id ?? "",
                                )
                              : ""
                          }
                          onChange={(e) => applySlot(e.target.value)}
                        >
                          <option value="">Choose a slot</option>
                          {slotsForSelectedDay.map((s) => (
                            <option key={String(s.id)} value={String(s.id)}>
                              {String(s.name)} ({formatTimeLabel(String(s.startTime))}–
                              {formatTimeLabel(String(s.endTime))})
                            </option>
                          ))}
                        </select>
                        {checkIn && slotsForSelectedDay.length === 0 ? (
                          <p className="text-xs text-destructive">No slots on this day.</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Start time</Label>
                          <Input
                            type="time"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...form.register("checkInTime")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>End time</Label>
                          <Input
                            type="time"
                            className="h-11 text-base sm:h-10 sm:text-sm"
                            {...form.register("checkOutTime")}
                          />
                        </div>
                      </div>
                    )}
                    {quote?.durationLabel && (
                      <p className="text-sm text-muted-foreground">
                        Duration: <span className="font-medium text-foreground">{quote.durationLabel}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5 rounded-lg border bg-white p-3">
                        <Label>Check-in date</Label>
                        <Input
                          type="date"
                          min={minBookingDate}
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...form.register("checkIn")}
                        />
                      </div>
                      <div className="space-y-1.5 rounded-lg border bg-white p-3">
                        <Label>Check-out date</Label>
                        <Input
                          type="date"
                          min={minCheckOutDate}
                          className="h-11 text-base sm:h-10 sm:text-sm"
                          {...form.register("checkOut")}
                        />
                      </div>
                    </div>

                    {propertySlots.length > 0 ? (
                      <div className="space-y-1.5 rounded-lg border bg-white p-3">
                        <Label>Stay slot</Label>
                        <select
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
                          value={
                            slotsForSelectedDay.find(
                              (s) =>
                                normalizeTimeInput(String(s.startTime || ""), "") ===
                                  normalizeTimeInput(checkInTime, "") &&
                                normalizeTimeInput(String(s.endTime || ""), "") ===
                                  normalizeTimeInput(checkOutTime, ""),
                            )
                              ? String(
                                  slotsForSelectedDay.find(
                                    (s) =>
                                      normalizeTimeInput(String(s.startTime || ""), "") ===
                                        normalizeTimeInput(checkInTime, "") &&
                                      normalizeTimeInput(String(s.endTime || ""), "") ===
                                        normalizeTimeInput(checkOutTime, ""),
                                  )?.id ?? "",
                                )
                              : ""
                          }
                          onChange={(e) => applySlot(e.target.value)}
                        >
                          <option value="">Choose check-in / check-out times</option>
                          {slotsForSelectedDay.map((s) => (
                            <option key={String(s.id)} value={String(s.id)}>
                              {String(s.name)} (in {formatTimeLabel(String(s.startTime))} · out{" "}
                              {formatTimeLabel(String(s.endTime))})
                            </option>
                          ))}
                        </select>
                        {checkIn && slotsForSelectedDay.length === 0 ? (
                          <p className="text-xs text-destructive">No overnight slots on check-in day.</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {overnightTimesDynamic ? "Standard times" : "Fixed check-in / check-out"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Check-in {formatTimeLabel(policyCheckInTime)} · Check-out{" "}
                            {formatTimeLabel(policyCheckOutTime)}
                            {overnightTimesDynamic
                              ? !editOvernightTimes
                                ? " (from property policy)"
                                : ""
                              : " — set by the property"}
                          </p>
                        </div>
                        {overnightTimesDynamic && (
                          <button
                            type="button"
                            className="text-xs font-medium text-primary underline-offset-2 hover:underline shrink-0"
                            onClick={() => {
                              if (editOvernightTimes) {
                                form.setValue("checkInTime", policyCheckInTime);
                                form.setValue("checkOutTime", policyCheckOutTime);
                                setEditOvernightTimes(false);
                              } else {
                                setEditOvernightTimes(true);
                              }
                            }}
                          >
                            {editOvernightTimes ? "Use standard times" : "Change times"}
                          </button>
                        )}
                      </div>

                      {overnightTimesDynamic && editOvernightTimes ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Check-in time</Label>
                            <Input
                              type="time"
                              className="h-11 text-base sm:h-10 sm:text-sm bg-background"
                              {...form.register("checkInTime")}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Check-out time</Label>
                            <Input
                              type="time"
                              className="h-11 text-base sm:h-10 sm:text-sm bg-background"
                              {...form.register("checkOutTime")}
                            />
                          </div>
                          <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                            Early check-in or late check-out may incur extra charges as per property policy.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-md bg-background border px-3 py-2">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Check-in</p>
                            <p className="font-medium">{formatTimeLabel(checkInTime || policyCheckInTime)}</p>
                          </div>
                          <div className="rounded-md bg-background border px-3 py-2">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Check-out</p>
                            <p className="font-medium">{formatTimeLabel(checkOutTime || policyCheckOutTime)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{isHourlyBooking ? "Hall / room" : "Room"}</Label>
                  <p className="text-xs text-muted-foreground">
                    Showing rooms free for your selected date and time
                    {isAvailabilityFetching ? " (updating…)" : ""}.
                  </p>
                  <select
                    className={nativeSelectClass}
                    value={roomFieldValue}
                    onChange={(e) => form.setValue("roomId", e.target.value)}
                  >
                    {needsRoomForPackage ? (
                      <option value="" disabled>
                        {isHourlyBooking ? "Select a hall / room" : "Select a room"}
                      </option>
                    ) : (
                      <option value={BOOKING_ROOM_NONE}>No room — add-ons only</option>
                    )}
                    {roomOptions.map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        Room {pickStr(r, "roomNumber")} — {pickStr(r, "roomName") || pickStr(r, "roomType")}
                      </option>
                    ))}
                  </select>
                  {requestedRoomUnavailable ? (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      That room is not free for the selected date and time. Pick another room or change dates.
                    </p>
                  ) : null}
                  {roomOptions.length === 0 && checkIn && checkOut ? (
                    <p className="text-sm text-muted-foreground">
                      No rooms are free for these dates and times. Try different dates or times.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label className="text-base">How many people?</Label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-foreground disabled:opacity-40"
                      onClick={() => setPersons(Number(persons || 1) - 1)}
                      disabled={Number(persons || 1) <= 1}
                      aria-label="Remove person"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <p className="text-3xl font-semibold tabular-nums">{persons || 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(persons || 1) === 1 ? "person" : "people"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-foreground disabled:opacity-40"
                      onClick={() => setPersons(Number(persons || 1) + 1)}
                      disabled={Number(persons || 1) >= maxGuestsAllowed}
                      aria-label="Add person"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Included</span>
                      <span className="font-medium">{includedGuests} people</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Extra people</span>
                      <span className="font-medium">
                        {extraPeopleCount}
                        {extraGuestUnitPrice > 0 ? ` × ₹${extraGuestUnitPrice}` : ""}
                      </span>
                    </div>
                    {extraPeopleCount > 0 && extraGuestUnitPrice > 0 && (
                      <div className="flex justify-between gap-2 border-t pt-1 font-semibold text-primary">
                        <span>Extra people charge</span>
                        <span>{formatInr(estimatedExtraGuestFee)}</span>
                      </div>
                    )}
                    {extraGuestUnitPrice <= 0 && extraPeopleCount > 0 && (
                      <p className="text-xs text-amber-700">
                        Extra people are allowed, but no extra charge is set yet.
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Max {maxGuestsAllowed} people
                      {primaryPackage ? ` for ${primaryPackage.name}` : selectedRoom ? " for this room" : ""}
                    </p>
                  </div>
                </div>

                {roomId && maxExtraBeds > 0 && (
                  <div className="space-y-2">
                    <Label>Extra beds</Label>
                    <select
                      className={nativeSelectClass}
                      value={String(extraBeds)}
                      onChange={(e) => setExtraBeds(Number(e.target.value))}
                    >
                      {Array.from({ length: maxExtraBeds + 1 }, (_, n) => (
                        <option key={n} value={String(n)}>
                          {n === 0
                            ? "No extra bed"
                            : `${n} extra bed${n === 1 ? "" : "s"}${
                                pricing.extraBedCharge > 0
                                  ? ` — ${formatInr(pricing.extraBedCharge)}/night each`
                                  : ""
                              }`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {packages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Package (optional)</Label>
                    <div className="space-y-2">
                      {packages.map((pkg) => {
                        const checked = selectedPackageIds.includes(pkg.id);
                        const inputId = `pkg-${pkg.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                        return (
                          <label
                            key={pkg.id}
                            htmlFor={inputId}
                            className={`flex flex-col gap-2 sm:flex-row sm:items-start rounded-lg border p-3 cursor-pointer ${
                              checked ? "border-primary bg-primary/5" : "bg-white hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                id={inputId}
                                checked={checked}
                                onChange={(e) => togglePackage(pkg.id, e.target.checked)}
                                className={nativeCheckboxClass}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{pkg.name}</p>
                                {pkg.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                                )}
                                {(pkg.includedGuests || pkg.extraGuestCharge) && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Includes {pkg.includedGuests || "—"} people
                                    {pkg.extraGuestCharge
                                      ? ` · +₹${pkg.extraGuestCharge} each extra`
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-medium sm:whitespace-nowrap pl-8 sm:pl-0">{pkg.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {guestServices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Add-ons (optional)</Label>
                    <div className="space-y-2">
                      {guestServices.map((service) => {
                        const checked = selectedServiceIds.includes(service.id);
                        const inputId = `guest-service-${service.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                        return (
                          <label
                            key={service.id}
                            htmlFor={inputId}
                            className={`flex flex-col gap-2 sm:flex-row sm:items-start rounded-lg border p-3 cursor-pointer ${
                              checked ? "border-primary bg-primary/5" : "bg-white hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                id={inputId}
                                checked={checked}
                                onChange={(e) => toggleService(service.id, e.target.checked)}
                                className={nativeCheckboxClass}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">
                                  {service.icon ? `${service.icon} ` : ""}
                                  {service.name}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-medium sm:whitespace-nowrap pl-8 sm:pl-0">{service.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(quote || quoteLoading || quoteError || localPackageLines.length > 0 || localServiceLines.length > 0) && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Price summary</span>
                      {quoteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    {quoteError && <p className="text-destructive text-xs">{quoteError}</p>}
                    {quote && !quoteError && (
                      <div className="space-y-1.5">
                        {quote.nights != null && quote.nights > 0 && (quote.roomTotal ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Room ({quote.nights} night{quote.nights === 1 ? "" : "s"})</span>
                            <span>{formatInr(quote.roomTotal ?? 0)}</span>
                          </div>
                        )}
                        {(quote.hours ?? 0) > 0 && (quote.roomTotal ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span>
                              Venue ({quote.durationLabel || `${quote.hours} hour${quote.hours === 1 ? "" : "s"}`})
                            </span>
                            <span>{formatInr(quote.roomTotal ?? 0)}</span>
                          </div>
                        )}
                        {(quote.extraBedTotal ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Extra beds</span>
                            <span>{formatInr(quote.extraBedTotal ?? 0)}</span>
                          </div>
                        )}
                        {(quote.extraGuestTotal ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Extra people ({extraPeopleCount})</span>
                            <span>{formatInr(quote.extraGuestTotal ?? 0)}</span>
                          </div>
                        )}
                        {((quote.packages ?? []).length > 0 ? quote.packages! : localPackageLines).map((line, i) => (
                          <div key={`pkg-${i}`} className="flex justify-between">
                            <span>{line.name}</span>
                            <span>{line.priceLabel || formatInr(line.total ?? 0)}</span>
                          </div>
                        ))}
                        {((quote.services ?? []).length > 0 ? quote.services! : localServiceLines).map((line, i) => (
                          <div key={`svc-${i}`} className="flex justify-between">
                            <span>{line.name}</span>
                            <span>{line.priceLabel || formatInr(line.total ?? 0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span>
                            {formatInr(
                              (quote.total ?? 0) > 0
                                ? (quote.total ?? 0)
                                : (quote.roomTotal ?? 0) +
                                    (quote.extraBedTotal ?? 0) +
                                    (quote.extraGuestTotal ?? 0) +
                                    (quote.packagesTotal ?? 0) -
                                    (quote.discount ?? 0) +
                                    localPackageLines.reduce((sum, line) => sum + (line.total ?? 0), 0) +
                                    localServiceLines.reduce((sum, line) => sum + (line.total ?? 0), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <Label>Your name</Label>
                    <Input className="h-11 text-base sm:h-10 sm:text-sm" {...form.register("guestName")} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" {...form.register("guestPhone")} />
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <Input type="email" className="h-11 text-base sm:h-10 sm:text-sm" {...form.register("guestEmail")} />
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={submitting || quoteLoading || !!closureNotice || (!!quoteError && !localPackageLines.length && !localServiceLines.length)}
                  >
                    {submitting
                      ? onlinePaymentsEnabled
                        ? "Processing…"
                        : "Booking..."
                      : onlinePaymentsEnabled
                        ? "Pay & confirm booking"
                        : "Confirm booking"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
