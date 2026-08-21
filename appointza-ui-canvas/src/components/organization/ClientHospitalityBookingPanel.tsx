import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Check, Loader2, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  GuestHospitalityBookingService,
  type HospitalityBookingQuote,
} from "@/services/guestHospitalityBooking.service";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import { useToast } from "@/hooks/use-toast";
import type { HospitalityPackage } from "@/models/hospitality.model";

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

function normalizePackage(item: unknown): HospitalityPackage {
  const r = pickRecord(item);
  const includes = (r.includes as unknown[]) ?? [];
  const addOns = (r.add_ons as unknown[]) ?? r.addOns as unknown[] ?? [];
  return {
    id: pickStr(r, "id"),
    name: pickStr(r, "name"),
    price: pickStr(r, "price"),
    description: pickStr(r, "description"),
    badge: pickStr(r, "badge") || undefined,
    kind: pickStr(r, "kind") || "stay",
    is_active: r.is_active !== false && r.isActive !== false,
    sort_order: pickNum(r, "sort_order", "sortOrder"),
    image_url: pickStr(r, "image_url", "imageUrl"),
    includes: includes.map(String),
    add_ons: addOns.map(String),
    valid_from: pickStr(r, "valid_from", "validFrom"),
    valid_to: pickStr(r, "valid_to", "validTo"),
    minimum_nights: pickNum(r, "minimum_nights", "minimumNights") || 1,
    max_guests: pickNum(r, "max_guests", "maxGuests") || 2,
    included_guests: pickNum(r, "included_guests", "includedGuests"),
    extra_guest_charge: pickNum(r, "extra_guest_charge", "extraGuestCharge"),
    room_type: pickStr(r, "room_type", "roomType"),
  };
}

type PublicRoom = {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity?: { total_guests?: number; extra_beds_allowed?: number };
  pricing?: { price_per_night?: number; price_per_hour?: number };
};

const nativeSelectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type ClientHospitalityBookingPanelProps = {
  organisationId: number;
  organisationLocationId: number;
  clientName: string;
  clientMobile: string;
  onSuccess: (bookingCode: string) => void;
};

export function ClientHospitalityBookingPanel({
  organisationId,
  organisationLocationId,
  clientName,
  clientMobile,
  onSuccess,
}: ClientHospitalityBookingPanelProps) {
  const bookingService = useMemo(() => new GuestHospitalityBookingService(), []);
  const { toast } = useToast();

  const scopeReady = organisationId > 0 && organisationLocationId > 0;

  const [roomId, setRoomId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [persons, setPersons] = useState(2);
  const [extraBeds, setExtraBeds] = useState(0);
  const [quote, setQuote] = useState<HospitalityBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hydratedRef = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "client-hospitality-booking-index",
      organisationId,
      organisationLocationId,
      selectedPackageId,
      checkIn,
      checkOut,
    ],
    enabled: scopeReady,
    queryFn: () =>
      bookingService.index({
        organisationId,
        organisationLocationId,
        packageId: selectedPackageId || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        checkInTime,
        checkOutTime,
      }),
  });

  const page = useMemo(() => pickRecord(data), [data]);
  const organisation = useMemo(() => pickRecord(page.organisation), [page.organisation]);
  const isHourlyBooking =
    pickStr(organisation, "booking_type", "bookingType").toLowerCase() === "hourly";

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
      } satisfies PublicRoom;
    });
  }, [page.rooms]);

  const packages = useMemo(() => {
    const raw = (page.packages as unknown[]) ?? [];
    return raw
      .map(normalizePackage)
      .filter((p) => p.is_active && p.kind.toLowerCase() !== "addon")
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [page.packages]);

  const selectedRoom = rooms.find((r) => r.id === roomId) ?? null;
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const minBookingDate = todayIsoLocal();
  const minCheckOutDate = checkIn && checkIn >= minBookingDate ? checkIn : minBookingDate;

  useEffect(() => {
    if (isLoading || hydratedRef.current) return;
    hydratedRef.current = true;

    const policyCheckIn = normalizeTime(
      pickStr(organisation, "check_in_time", "checkInTime"),
      "14:00",
    );
    const policyCheckOut = normalizeTime(
      pickStr(organisation, "check_out_time", "checkOutTime"),
      "11:00",
    );
    const defaultCheckIn = pickStr(page, "check_in", "checkIn") || minBookingDate;
    const defaultCheckOut =
      pickStr(page, "check_out", "checkOut") ||
      (() => {
        const d = new Date(defaultCheckIn);
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();

    setCheckIn(defaultCheckIn);
    setCheckOut(defaultCheckOut);
    setCheckInTime(policyCheckIn);
    setCheckOutTime(policyCheckOut);
    if (rooms.length === 1) setRoomId(rooms[0].id);
  }, [isLoading, organisation, page, rooms, minBookingDate]);

  const refreshQuote = useCallback(async () => {
    if (!scopeReady || !checkIn || !checkOut || !roomId) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const result = await bookingService.quote({
        organisationId,
        organisationLocationId,
        checkIn,
        checkOut,
        roomId,
        persons,
        extraBeds,
        packageIds: selectedPackageId ? [selectedPackageId] : [],
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
    checkIn,
    checkOut,
    selectedPackageId,
    roomId,
    bookingService,
    organisationId,
    organisationLocationId,
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

  const handleSubmit = async () => {
    if (!roomId) {
      toast({
        title: "Select a room",
        description: "Choose a room before confirming.",
        variant: "destructive",
      });
      return;
    }
    if (!clientName.trim() || !clientMobile.trim()) {
      toast({
        title: "Client details missing",
        description: "Client name and phone are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await bookingService.create({
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        room_id: roomId,
        guest_name: clientName.trim(),
        phone: clientMobile.trim(),
        check_in: checkIn,
        check_out: checkOut,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        persons,
        extra_beds: extraBeds,
        package_ids: selectedPackageId ? [selectedPackageId] : [],
        guest_service_ids: [],
      });

      if (!result?.booking_code) throw new Error("Booking failed.");

      toast({
        title: selectedPackageId ? "Stay booked" : "Room booked",
        description: `Reference ${result.booking_code}`,
      });
      onSuccess(result.booking_code);
    } catch (err) {
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!scopeReady) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Select an organization location to book rooms or packages.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          Could not load rooms and packages. Check hospitality settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {packages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Package (optional)</CardTitle>
            <CardDescription>Add a stay package, or leave unselected for room-only booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div
                onClick={() => setSelectedPackageId("")}
                className={cn(
                  "flex items-center justify-between gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                  !selectedPackageId
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <div>
                  <p className="font-medium">Room only</p>
                  <p className="text-sm text-muted-foreground">Book the room without a package</p>
                </div>
                {!selectedPackageId ? <Check className="h-5 w-5 text-primary shrink-0" /> : null}
              </div>
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id || pkg.name}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={cn(
                      "flex items-start justify-between gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{pkg.name}</p>
                      {pkg.description ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
                      ) : null}
                      <p className="text-sm font-medium mt-1">
                        {pkg.price}
                        {pkg.minimum_nights > 1 ? ` · min ${pkg.minimum_nights} nights` : ""}
                      </p>
                    </div>
                    {isSelected ? <Check className="h-5 w-5 text-primary shrink-0" /> : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Select Room</CardTitle>
          <CardDescription>
            {selectedPackage?.room_type
              ? `Package applies to ${formatRoomTypeLabel(selectedPackage.room_type)} rooms`
              : "Choose an available room"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rooms.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No rooms available for these dates</p>
          ) : (
            <>
              <select
                className={nativeSelectClass}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
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
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">
                    Room {selectedRoom.room_number}
                    {selectedRoom.room_name ? ` · ${selectedRoom.room_name}` : ""}
                  </p>
                  <p className="text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle>{isHourlyBooking ? "Date & time" : "Stay dates"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isHourlyBooking ? "Start date" : "Check-in"}</Label>
              <Input
                type="date"
                min={minBookingDate}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isHourlyBooking ? "End date" : "Check-out"}</Label>
              <Input
                type="date"
                min={minCheckOutDate}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Check-in time</Label>
              <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out time</Label>
              <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPersons(Math.max(1, persons - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{persons}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPersons(persons + 1)}
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
          <CardTitle>Price summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {quoteLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
            </div>
          ) : quoteError ? (
            <p className="text-destructive">{quoteError}</p>
          ) : quote ? (
            <>
              {quote.duration_label ? (
                <p className="text-muted-foreground">Duration: {quote.duration_label}</p>
              ) : null}
              {(quote.room_total ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span>Room</span>
                  <span>{formatInr(quote.room_total ?? 0)}</span>
                </div>
              ) : null}
              {(quote.packages_total ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span>Package</span>
                  <span>{formatInr(quote.packages_total ?? 0)}</span>
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
            <p className="text-muted-foreground">Select a room and dates to see pricing.</p>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => void handleSubmit()}
        disabled={submitting || quoteLoading || !quote || !roomId || rooms.length === 0}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…
          </>
        ) : (
          <>
            <BedDouble className="mr-2 h-4 w-4" />
            Confirm booking
          </>
        )}
      </Button>
    </div>
  );
}
