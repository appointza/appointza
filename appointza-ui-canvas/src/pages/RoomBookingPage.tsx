import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Loader2, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  GuestHospitalityBookingService,
  type HospitalityBookingQuote,
} from "@/services/guestHospitalityBooking.service";
import { parseRoomBookingSearchParams } from "@/utils/roomBookingLinks.util";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCurrentAppPath,
  redirectToLogin,
} from "@/utils/authNavigation.util";

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const schema = z
  .object({
    roomId: z.string().optional().default(""),
    checkIn: z.string().min(1, "Check-in date is required"),
    checkOut: z.string().min(1, "Check-out date is required"),
    checkInTime: z.string().min(1),
    checkOutTime: z.string().min(1),
    guestName: z.string().min(1, "Guest name is required"),
    guestPhone: z.string().min(1, "Phone number is required"),
    guestEmail: z.string().email().optional().or(z.literal("")),
    persons: z.coerce.number().min(1).default(2),
  })
  .refine(
    (data) => {
      const start = new Date(`${data.checkIn}T${data.checkInTime}`);
      const end = new Date(`${data.checkOut}T${data.checkOutTime}`);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
    },
    { message: "Check-out must be after check-in.", path: ["checkOut"] },
  );

type BookingForm = z.infer<typeof schema>;

type PublicRoom = {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity?: { total_guests?: number; extra_beds_allowed?: number };
  pricing?: { price_per_night?: number; price_per_hour?: number };
  main_photo?: string;
  available_for_dates?: boolean;
};

function pickRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null) return String(val);
  }
  return "";
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== "") return Number(val);
  }
  return 0;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function normalizeTime(value: string, fallback: string): string {
  const trimmed = (value || fallback).trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
  return fallback;
}

const nativeSelectClass =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:h-10 sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function RoomBookingPage() {
  const [searchParams] = useSearchParams();
  const parsed = useMemo(() => parseRoomBookingSearchParams(searchParams), [searchParams]);
  const bookingService = useMemo(() => new GuestHospitalityBookingService(), []);
  const { toast } = useToast();
  const { isAuthenticated, authReady, user, mobile } = useAuth();

  const [quote, setQuote] = useState<HospitalityBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [extraBeds, setExtraBeds] = useState(0);
  const [confirmed, setConfirmed] = useState<{
    bookingCode?: string;
    total?: number;
    checkIn?: string;
    checkOut?: string;
  } | null>(null);

  const scopeReady = parsed.organisationId > 0 && parsed.organisationLocationId > 0;
  const preferredRoomId = (parsed.roomId || "").trim();
  const preferredPackageId = (parsed.packageId || "").trim();

  const form = useForm<BookingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomId: "",
      checkIn: parsed.checkIn || "",
      checkOut: parsed.checkOut || "",
      checkInTime: parsed.checkInTime || "14:00",
      checkOutTime: parsed.checkOutTime || "11:00",
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      persons: 2,
    },
  });

  const roomId = form.watch("roomId");
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const checkInTime = form.watch("checkInTime");
  const checkOutTime = form.watch("checkOutTime");
  const persons = form.watch("persons");

  const datesReady = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    const start = new Date(`${checkIn}T${checkInTime || "14:00"}`);
    const end = new Date(`${checkOut}T${checkOutTime || "11:00"}`);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  }, [checkIn, checkOut, checkInTime, checkOutTime]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      redirectToLogin(getCurrentAppPath());
    }
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    const name =
      [user.firstname, user.lastname].filter(Boolean).join(" ").trim() ||
      user.username ||
      "";
    if (name && !form.getValues("guestName")) {
      form.setValue("guestName", name);
    }
    const phone = (user.mobile || mobile || "").trim();
    if (phone && !form.getValues("guestPhone")) {
      form.setValue("guestPhone", phone);
    }
    if (user.email && !form.getValues("guestEmail")) {
      form.setValue("guestEmail", user.email);
    }
  }, [user, mobile, form]);

  // Property / policy bootstrap (no room list until dates are chosen).
  const {
    data: bootstrapData,
    isLoading: bootstrapLoading,
    error: bootstrapError,
  } = useQuery({
    queryKey: ["room-booking-bootstrap", parsed.organisationId, parsed.organisationLocationId],
    enabled: scopeReady,
    queryFn: () =>
      bookingService.index({
        organisationId: parsed.organisationId,
        organisationLocationId: parsed.organisationLocationId,
        packageId: parsed.packageId || undefined,
      }),
  });

  // Rooms for the selected stay window only.
  const {
    data: availabilityData,
    isLoading: roomsLoading,
    error: roomsError,
  } = useQuery({
    queryKey: [
      "room-booking-availability",
      parsed.organisationId,
      parsed.organisationLocationId,
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
    ],
    enabled: scopeReady && datesReady,
    queryFn: () =>
      bookingService.index({
        organisationId: parsed.organisationId,
        organisationLocationId: parsed.organisationLocationId,
        roomId: preferredRoomId || undefined,
        packageId: parsed.packageId || undefined,
        checkIn,
        checkOut,
        checkInTime,
        checkOutTime,
      }),
  });

  const page = useMemo(
    () => pickRecord(availabilityData ?? bootstrapData),
    [availabilityData, bootstrapData],
  );
  const organisation = useMemo(() => pickRecord(page.organisation), [page.organisation]);
  const isHourlyBooking = pickStr(organisation, "booking_type", "bookingType").toLowerCase() === "hourly";
  const policyCheckInTime = normalizeTime(pickStr(organisation, "check_in_time", "checkInTime"), "14:00");
  const policyCheckOutTime = normalizeTime(pickStr(organisation, "check_out_time", "checkOutTime"), "11:00");

  const preferredPackage = useMemo(() => {
    if (!preferredPackageId) return null;
    const packages = (pickRecord(bootstrapData).packages as unknown[]) ??
      (pickRecord(organisation).packages as unknown[]) ??
      [];
    return (
      packages
        .map((item) => pickRecord(item))
        .find((pkg) => pickStr(pkg, "id") === preferredPackageId) ?? null
    );
  }, [bootstrapData, organisation, preferredPackageId]);

  const packageRoomType = pickStr(preferredPackage ?? {}, "room_type", "roomType").toLowerCase();

  const availableRooms = useMemo(() => {
    if (!datesReady || !availabilityData) return [];
    const raw = (pickRecord(availabilityData).rooms as unknown[]) ?? [];
    const mapped = raw
      .map((item) => {
        const r = pickRecord(item);
        const cap = pickRecord(r.capacity);
        const pricing = pickRecord(r.pricing);
        const availableRaw = r.available_for_dates ?? r.availableForDates;
        return {
          id: pickStr(r, "id"),
          room_number: pickStr(r, "room_number", "roomNumber"),
          room_name: pickStr(r, "room_name", "roomName"),
          room_type: pickStr(r, "room_type", "roomType"),
          capacity: {
            total_guests: pickNum(cap, "total_guests", "totalGuests") || 2,
            extra_beds_allowed: pickNum(cap, "extra_beds_allowed", "extraBedsAllowed"),
          },
          pricing: {
            price_per_night: pickNum(pricing, "price_per_night", "pricePerNight"),
            price_per_hour: pickNum(pricing, "price_per_hour", "pricePerHour"),
          },
          main_photo: pickStr(r, "main_photo", "mainPhoto"),
          available_for_dates: availableRaw === false ? false : true,
        } satisfies PublicRoom;
      })
      .filter((room) => room.id && room.available_for_dates !== false);

    if (!packageRoomType) return mapped;
    const typed = mapped.filter((room) => room.room_type.toLowerCase() === packageRoomType);
    // Never empty the list solely due to package room_type mismatch.
    return typed.length > 0 ? typed : mapped;
  }, [availabilityData, datesReady, packageRoomType]);

  const policyHydratedRef = useRef(false);
  const selectedRoom = availableRooms.find((r) => r.id === roomId) ?? null;
  const minBookingDate = todayIsoLocal();
  const minCheckOutDate = checkIn && checkIn >= minBookingDate ? checkIn : minBookingDate;

  // Apply property check-in/out times once; leave dates empty so the guest chooses first.
  useEffect(() => {
    if (bootstrapLoading || policyHydratedRef.current) return;
    policyHydratedRef.current = true;
    form.setValue("checkInTime", policyCheckInTime);
    form.setValue("checkOutTime", policyCheckOutTime);
    if (!form.getValues("checkIn") && parsed.checkIn) {
      form.setValue("checkIn", parsed.checkIn);
    }
    if (!form.getValues("checkOut") && parsed.checkOut) {
      form.setValue("checkOut", parsed.checkOut);
    }
  }, [
    bootstrapLoading,
    policyCheckInTime,
    policyCheckOutTime,
    parsed.checkIn,
    parsed.checkOut,
    form,
  ]);

  // When dates change, clear room until availability returns; then prefer URL room if free.
  useEffect(() => {
    if (!datesReady) {
      if (roomId) form.setValue("roomId", "");
      return;
    }
    if (roomsLoading) return;

    const stillValid = availableRooms.some((r) => r.id === roomId);
    if (roomId && stillValid) return;

    const preferred =
      preferredRoomId && availableRooms.some((r) => r.id === preferredRoomId)
        ? preferredRoomId
        : availableRooms[0]?.id || "";
    form.setValue("roomId", preferred);
  }, [datesReady, roomsLoading, availableRooms, roomId, preferredRoomId, form]);

  // Keep check-out at least one night after check-in for overnight.
  useEffect(() => {
    if (!checkIn || isHourlyBooking) return;
    if (!checkOut || checkOut <= checkIn) {
      form.setValue("checkOut", addDaysIso(checkIn, 1));
    }
  }, [checkIn, checkOut, isHourlyBooking, form]);

  const refreshQuote = useCallback(async () => {
    if (!scopeReady || !datesReady || !roomId) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const result = await bookingService.quote({
        organisationId: parsed.organisationId,
        organisationLocationId: parsed.organisationLocationId,
        checkIn,
        checkOut,
        roomId,
        persons,
        extraBeds,
        packageIds: preferredPackageId ? [preferredPackageId] : undefined,
        checkInTime,
        checkOutTime,
      });
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setQuoteError(err instanceof Error ? err.message : "Could not calculate price.");
    } finally {
      setQuoteLoading(false);
    }
  }, [
    scopeReady,
    datesReady,
    bookingService,
    parsed.organisationId,
    parsed.organisationLocationId,
    checkIn,
    checkOut,
    roomId,
    persons,
    extraBeds,
    preferredPackageId,
    checkInTime,
    checkOutTime,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshQuote();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [refreshQuote]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to confirm your booking. You will be redirected to the login page.",
        variant: "destructive",
      });
      redirectToLogin(getCurrentAppPath());
      return;
    }
    if (!datesReady) {
      toast({
        title: "Choose dates",
        description: "Pick check-in and check-out before selecting a room.",
        variant: "destructive",
      });
      return;
    }
    if (!roomId) {
      toast({
        title: "Select a room",
        description: "Choose an available room for your dates.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await bookingService.create({
        organisation_id: parsed.organisationId,
        organisation_location_id: parsed.organisationLocationId,
        room_id: roomId,
        guest_name: values.guestName.trim(),
        phone: values.guestPhone.trim(),
        email: values.guestEmail?.trim() || undefined,
        check_in: values.checkIn,
        check_out: values.checkOut,
        check_in_time: values.checkInTime,
        check_out_time: values.checkOutTime,
        persons: values.persons,
        extra_beds: extraBeds,
        package_ids: preferredPackageId ? [preferredPackageId] : [],
        guest_service_ids: [],
      });

      if (!result) throw new Error("Booking failed.");

      setConfirmed({
        bookingCode: result.booking_code,
        total: result.quote?.total,
        checkIn: result.check_in,
        checkOut: result.check_out,
      });
      toast({
        title: "Booking confirmed",
        description: `Reference ${result.booking_code}`,
      });
    } catch (err) {
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  });

  if (!scopeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Room booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              Add <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">organisationId</code> and{" "}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">locationId</code> to the URL.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <Card className="w-full max-w-lg border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">Booking confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Reference: <span className="font-semibold">{confirmed.bookingCode}</span>
            </p>
            {confirmed.checkIn && confirmed.checkOut ? (
              <p>
                Stay: {confirmed.checkIn} → {confirmed.checkOut}
              </p>
            ) : null}
            {confirmed.total != null ? <p className="font-medium">{formatInr(confirmed.total)}</p> : null}
            <Button asChild variant="outline" className="mt-2">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgName = pickStr(organisation, "name") || "Property";
  const locationName = pickStr(organisation, "location_name", "locationName");
  const preferredUnavailable =
    datesReady &&
    !roomsLoading &&
    !!preferredRoomId &&
    !availableRooms.some((r) => r.id === preferredRoomId);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Book a room</h1>
            <p className="text-sm text-stone-500">
              {orgName}
              {locationName ? ` · ${locationName}` : ""}
            </p>
          </div>
        </div>
      </div>

      {authReady && !isAuthenticated ? (
        <div className="border-b border-orange-200 bg-orange-50">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-orange-600" />
            <p className="text-sm text-orange-800">
              You need to be logged in to book a room.{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-orange-600 underline"
                onClick={() => redirectToLogin(getCurrentAppPath())}
              >
                Click here to login
              </Button>
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-6">
          {bootstrapLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading property…
            </div>
          ) : bootstrapError ? (
            <Card className="border-red-200">
              <CardContent className="pt-6 text-sm text-red-700">
                Could not load booking details. Check organisation and location IDs.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    1. {isHourlyBooking ? "Choose date & time" : "Choose stay dates"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {preferredPackageId ? (
                    <p className="rounded-lg border border-orange-100 bg-orange-50/80 p-3 text-sm text-stone-700">
                      Package booking
                      {pickStr(preferredPackage ?? {}, "name")
                        ? `: ${pickStr(preferredPackage ?? {}, "name")}`
                        : ""}
                      . Choose dates, then pick an available room.
                    </p>
                  ) : preferredRoomId ? (
                    <p className="text-sm text-stone-500">
                      Preferred room <strong>{preferredRoomId}</strong> will be selected if it’s free
                      for your dates.
                    </p>
                  ) : (
                    <p className="text-sm text-stone-500">
                      Pick your dates first. We’ll then show rooms available for that stay.
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{isHourlyBooking ? "Start date" : "Check-in"}</Label>
                      <Input type="date" min={minBookingDate} {...form.register("checkIn")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{isHourlyBooking ? "End date" : "Check-out"}</Label>
                      <Input type="date" min={minCheckOutDate} {...form.register("checkOut")} />
                      {form.formState.errors.checkOut ? (
                        <p className="text-xs text-red-600">{form.formState.errors.checkOut.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Check-in time</Label>
                      <Input type="time" {...form.register("checkInTime")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Check-out time</Label>
                      <Input type="time" {...form.register("checkOutTime")} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {datesReady ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">2. Select a room</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {roomsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
                      </div>
                    ) : roomsError ? (
                      <p className="text-sm text-red-600">Could not check room availability. Try again.</p>
                    ) : availableRooms.length === 0 ? (
                      <p className="text-sm text-amber-800">
                        No rooms are available for these dates. Please choose different dates.
                      </p>
                    ) : (
                      <>
                        {preferredUnavailable ? (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            Room <strong>{preferredRoomId}</strong> is not free for these dates. Pick
                            another available room below.
                          </p>
                        ) : preferredRoomId && roomId === preferredRoomId ? (
                          <p className="text-sm text-stone-500">
                            Preferred room <strong>{preferredRoomId}</strong> is available for your
                            dates.
                          </p>
                        ) : null}

                        <select
                          className={nativeSelectClass}
                          value={roomId}
                          onChange={(e) => form.setValue("roomId", e.target.value)}
                        >
                          <option value="">Select an available room</option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              Room {room.room_number}
                              {room.room_name ? ` — ${room.room_name}` : ""} (
                              {formatRoomTypeLabel(room.room_type)})
                              {room.pricing?.price_per_night
                                ? ` · ${formatInr(room.pricing.price_per_night)}/night`
                                : ""}
                            </option>
                          ))}
                        </select>

                        {selectedRoom ? (
                          <div className="rounded-lg border bg-stone-50 p-3 text-sm">
                            <p className="font-medium">
                              Room {selectedRoom.room_number}
                              {selectedRoom.room_name ? ` · ${selectedRoom.room_name}` : ""}
                            </p>
                            <p className="text-stone-500">
                              Up to {selectedRoom.capacity?.total_guests ?? 2} guests
                              {selectedRoom.pricing?.price_per_night
                                ? ` · ${formatInr(selectedRoom.pricing.price_per_night)}/night`
                                : null}
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-sm text-stone-500">
                    Select check-in and check-out dates to see available rooms.
                  </CardContent>
                </Card>
              )}

              {datesReady && roomId ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">3. Guests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-stone-500" />
                          <span className="text-sm">Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => form.setValue("persons", Math.max(1, persons - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{persons}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => form.setValue("persons", persons + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {(selectedRoom?.capacity?.extra_beds_allowed ?? 0) > 0 ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm">Extra beds</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{extraBeds}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setExtraBeds(
                                  Math.min(
                                    selectedRoom?.capacity?.extra_beds_allowed ?? 0,
                                    extraBeds + 1,
                                  ),
                                )
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">4. Guest details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Full name</Label>
                        <Input {...form.register("guestName")} placeholder="Guest name" />
                        {form.formState.errors.guestName ? (
                          <p className="text-xs text-red-600">
                            {form.formState.errors.guestName.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input {...form.register("guestPhone")} placeholder="+91 …" />
                        {form.formState.errors.guestPhone ? (
                          <p className="text-xs text-red-600">
                            {form.formState.errors.guestPhone.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email (optional)</Label>
                        <Input
                          type="email"
                          {...form.register("guestEmail")}
                          placeholder="you@example.com"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </>
          )}
        </form>

        <aside className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Price summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!datesReady ? (
                <p className="text-stone-500">Choose stay dates to continue.</p>
              ) : !roomId ? (
                <p className="text-stone-500">Select an available room to see pricing.</p>
              ) : quoteLoading ? (
                <div className="flex items-center gap-2 text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
                </div>
              ) : quoteError ? (
                <p className="text-red-600">{quoteError}</p>
              ) : quote ? (
                <>
                  {quote.duration_label ? (
                    <p className="text-stone-600">Duration: {quote.duration_label}</p>
                  ) : null}
                  {(quote.room_total ?? 0) > 0 ? (
                    <div className="flex justify-between">
                      <span>Room</span>
                      <span>{formatInr(quote.room_total ?? 0)}</span>
                    </div>
                  ) : null}
                  {(quote.extra_bed_total ?? 0) > 0 ? (
                    <div className="flex justify-between">
                      <span>Extra beds</span>
                      <span>{formatInr(quote.extra_bed_total ?? 0)}</span>
                    </div>
                  ) : null}
                  {(quote.extra_guest_total ?? 0) > 0 ? (
                    <div className="flex justify-between">
                      <span>Extra guests</span>
                      <span>{formatInr(quote.extra_guest_total ?? 0)}</span>
                    </div>
                  ) : null}
                  {(quote.packages_total ?? 0) > 0 ? (
                    <div className="flex justify-between">
                      <span>Package</span>
                      <span>{formatInr(quote.packages_total ?? 0)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatInr(quote.total ?? 0)}</span>
                  </div>
                </>
              ) : (
                <p className="text-stone-500">Select dates and a room to see pricing.</p>
              )}

              <Button
                className="w-full"
                disabled={
                  isAuthenticated
                    ? submitting || quoteLoading || !quote || !datesReady || !roomId
                    : !authReady
                }
                onClick={
                  isAuthenticated
                    ? onSubmit
                    : () => redirectToLogin(getCurrentAppPath())
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…
                  </>
                ) : isAuthenticated ? (
                  "Confirm booking"
                ) : (
                  "Log in to book"
                )}
              </Button>

              {pickStr(organisation, "cancellation_policy", "cancellationPolicy") ? (
                <p className="text-xs text-stone-500">
                  {pickStr(organisation, "cancellation_policy", "cancellationPolicy")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
