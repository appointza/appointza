import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Minus, Plus, Users } from "lucide-react";
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

function todayIsoLocal(): string {
  const d = new Date();
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

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "room-booking-index",
      parsed.organisationId,
      parsed.organisationLocationId,
      parsed.roomId,
      parsed.packageId,
    ],
    enabled: scopeReady,
    queryFn: () =>
      bookingService.index({
        organisationId: parsed.organisationId,
        organisationLocationId: parsed.organisationLocationId,
        roomId: parsed.roomId || undefined,
        packageId: parsed.packageId || undefined,
        checkIn: parsed.checkIn || undefined,
        checkOut: parsed.checkOut || undefined,
        checkInTime: parsed.checkInTime || undefined,
        checkOutTime: parsed.checkOutTime || undefined,
      }),
  });

  const page = useMemo(() => pickRecord(data), [data]);
  const organisation = useMemo(() => pickRecord(page.organisation), [page.organisation]);
  const isHourlyBooking = pickStr(organisation, "booking_type", "bookingType").toLowerCase() === "hourly";
  const policyCheckInTime = normalizeTime(pickStr(organisation, "check_in_time", "checkInTime"), "14:00");
  const policyCheckOutTime = normalizeTime(pickStr(organisation, "check_out_time", "checkOutTime"), "11:00");

  const rooms = useMemo(() => {
    const raw = (page.rooms as unknown[]) ?? [];
    return raw.map((item) => {
      const r = pickRecord(item);
      const cap = pickRecord(r.capacity);
      const pricing = pickRecord(r.pricing);
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
      } satisfies PublicRoom;
    });
  }, [page.rooms]);

  const form = useForm<BookingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomId: parsed.roomId || "",
      checkIn: parsed.checkIn || "",
      checkOut: parsed.checkOut || "",
      checkInTime: policyCheckInTime,
      checkOutTime: policyCheckOutTime,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      persons: 2,
    },
  });

  const hydratedRef = useRef(false);
  const roomId = form.watch("roomId");
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const checkInTime = form.watch("checkInTime");
  const checkOutTime = form.watch("checkOutTime");
  const persons = form.watch("persons");

  const selectedRoom = rooms.find((r) => r.id === roomId) ?? null;
  const minBookingDate = todayIsoLocal();
  const minCheckOutDate = checkIn && checkIn >= minBookingDate ? checkIn : minBookingDate;

  useEffect(() => {
    if (isLoading || hydratedRef.current) return;
    hydratedRef.current = true;

    const defaultCheckIn = pickStr(page, "check_in", "checkIn") || "";
    const defaultCheckOut = pickStr(page, "check_out", "checkOut") || "";
    const selectedRoomId = pickStr(page, "selected_room_id", "selectedRoomId") || parsed.roomId;

    form.reset({
      roomId: selectedRoomId,
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      checkInTime: policyCheckInTime,
      checkOutTime: policyCheckOutTime,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      persons: 2,
    });
  }, [isLoading, page, parsed.roomId, policyCheckInTime, policyCheckOutTime, form]);

  const refreshQuote = useCallback(async () => {
    if (!scopeReady || !checkIn || !checkOut) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const result = await bookingService.quote({
        organisationId: parsed.organisationId,
        organisationLocationId: parsed.organisationLocationId,
        checkIn,
        checkOut,
        roomId: roomId || undefined,
        persons,
        extraBeds,
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
    bookingService,
    parsed.organisationId,
    parsed.organisationLocationId,
    checkIn,
    checkOut,
    roomId,
    persons,
    extraBeds,
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
    if (!roomId) {
      toast({ title: "Select a room", description: "Choose a room before confirming.", variant: "destructive" });
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
        package_ids: [],
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Room booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              Add <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">organisationId</code> and{" "}
              <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">locationId</code> to the URL.
            </p>
            <p className="text-xs text-stone-500">
              Example: <span className="break-all">/book?roomId=room-201&amp;organisationId=1&amp;locationId=2</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-emerald-200">
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
            {confirmed.total != null ? (
              <p className="font-medium">{formatInr(confirmed.total)}</p>
            ) : null}
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
  const requestedRoomAvailable = page.requested_room_available ?? page.requestedRoomAvailable;

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

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
            </div>
          ) : error ? (
            <Card className="border-red-200">
              <CardContent className="pt-6 text-sm text-red-700">
                Could not load booking details. Check organisation and location IDs.
              </CardContent>
            </Card>
          ) : (
            <>
              {parsed.roomId && requestedRoomAvailable === false ? (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6 text-sm text-amber-900">
                    Room <strong>{parsed.roomId}</strong> is not available for the default dates. Pick another room or change dates.
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Room</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    className={nativeSelectClass}
                    value={roomId}
                    onChange={(e) => form.setValue("roomId", e.target.value)}
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.room_number}
                        {room.room_name ? ` — ${room.room_name}` : ""} ({formatRoomTypeLabel(room.room_type)})
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
                        {selectedRoom.pricing?.price_per_night ?
                          ` · ${formatInr(selectedRoom.pricing.price_per_night)}/night`
                        : null}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {isHourlyBooking ? "Date & time" : "Stay dates"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{isHourlyBooking ? "Start date" : "Check-in"}</Label>
                      <Input type="date" min={minBookingDate} {...form.register("checkIn")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{isHourlyBooking ? "End date" : "Check-out"}</Label>
                      <Input type="date" min={minCheckOutDate} {...form.register("checkOut")} />
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Guests</CardTitle>
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
                              Math.min(selectedRoom?.capacity?.extra_beds_allowed ?? 0, extraBeds + 1),
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
                  <CardTitle className="text-base">Guest details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input {...form.register("guestName")} placeholder="Guest name" />
                    {form.formState.errors.guestName ? (
                      <p className="text-xs text-red-600">{form.formState.errors.guestName.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input {...form.register("guestPhone")} placeholder="+91 …" />
                    {form.formState.errors.guestPhone ? (
                      <p className="text-xs text-red-600">{form.formState.errors.guestPhone.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (optional)</Label>
                    <Input type="email" {...form.register("guestEmail")} placeholder="you@example.com" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>

        <aside className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Price summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quoteLoading ? (
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
                  {(quote.extra_guest_total ?? 0) > 0 ? (
                    <div className="flex justify-between">
                      <span>Extra guests</span>
                      <span>{formatInr(quote.extra_guest_total ?? 0)}</span>
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
                disabled={submitting || quoteLoading || !quote || !roomId}
                onClick={onSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…
                  </>
                ) : (
                  "Confirm booking"
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
