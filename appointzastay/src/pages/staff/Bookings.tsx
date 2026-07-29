import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format, subMonths } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Phone,
  Sparkles,
} from "lucide-react";
import {
  MonthBookingCalendar,
  bookingsForDay,
  type MonthCalendarViewMode,
} from "@/components/bookings/MonthBookingCalendar";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { stayApi } from "@/services/stay.service";
import {
  bookingIncludeTags,
  formatBookingDate,
  formatInr,
  formatStayDateTime,
  type StaffBookingItem,
} from "@/models/staffBooking";

type TodayTab = "arrivals" | "departures" | "inhouse" | "new";

function bookingKey(booking: StaffBookingItem) {
  return booking.id || booking.bookingCode;
}

function BookingIncludeChips({ booking, compact }: { booking: StaffBookingItem; compact?: boolean }) {
  const tags = bookingIncludeTags(booking);
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-2"}`}>
      {tags.map((tag) => {
        const isPackage = tag.startsWith("Package:");
        const isService = tag.startsWith("Service:");
        const isBed = tag.includes("extra bed");
        let cls = "bg-muted text-muted-foreground";
        if (isPackage) cls = "bg-indigo-100 text-indigo-800";
        else if (isService) cls = "bg-violet-100 text-violet-800";
        else if (isBed) cls = "bg-amber-100 text-amber-900";
        else if (tag.startsWith("Room")) cls = "bg-blue-100 text-blue-800";
        return (
          <span
            key={tag}
            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${cls}`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

function BookingDetailCard({
  booking,
  onClose,
  loading,
}: {
  booking: StaffBookingItem;
  onClose?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading details…
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{booking.guestName || "Guest"}</p>
          <p className="text-xs text-muted-foreground font-mono">{booking.bookingCode || "—"}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      {booking.phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>{booking.phone}</span>
          {booking.email && <span className="truncate">· {booking.email}</span>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Check-in</p>
          <p className="font-medium">{formatStayDateTime(booking.checkIn, booking.checkInTime)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Check-out</p>
          <p className="font-medium">{formatStayDateTime(booking.checkOut, booking.checkOutTime)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Room</p>
          <p className="font-medium">
            {booking.roomNumber ? `Room ${booking.roomNumber}` : "No room (add-ons)"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Guests</p>
          <p className="font-medium">
            {booking.persons} guest{booking.persons === 1 ? "" : "s"}
            {booking.extraBeds > 0
              ? ` · ${booking.extraBeds} extra bed${booking.extraBeds === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Nights</p>
          <p className="font-medium">{booking.nights || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{booking.status}</p>
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          What they booked
        </p>
        <BookingIncludeChips booking={booking} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-semibold">{formatInr(booking.total)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Paid</p>
          <p className="font-semibold">{formatInr(booking.paid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Balance</p>
          <p className={`font-semibold ${booking.balance > 0 ? "text-red-600" : ""}`}>
            {formatInr(booking.balance)}
          </p>
        </div>
      </div>
      {booking.roomId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/staff/rooms/status?id=${booking.roomId}`}>Open room board</Link>
        </Button>
      )}
    </div>
  );
}

function TodayBookingRow({
  booking,
  selected,
  onSelect,
}: {
  booking: StaffBookingItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
        selected ? "border-primary bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{booking.guestName}</p>
          <p className="text-xs text-muted-foreground">
            {booking.roomNumber ? `Room ${booking.roomNumber}` : "No room"}
            {booking.packages[0]?.name ? ` · ${booking.packages[0].name}` : ""}
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">{booking.bookingCode}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {formatStayDateTime(booking.checkIn, booking.checkInTime)} →{" "}
        {formatStayDateTime(booking.checkOut, booking.checkOutTime)}
        {booking.nights > 0 ? ` · ${booking.nights} night${booking.nights === 1 ? "" : "s"}` : ""}
      </p>
      <BookingIncludeChips booking={booking} compact />
      <p className="text-xs font-medium mt-2">{formatInr(booking.total)}</p>
    </button>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const organisationId = user?.organizationId ?? "";
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<MonthCalendarViewMode>("month");
  const [todayTab, setTodayTab] = useState<TodayTab>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["staff-bookings-calendar", organisationId, viewYear, viewMonth],
    queryFn: () => stayApi.bookings.calendar(viewYear, viewMonth),
    enabled: !!organisationId,
    retry: 1,
  });

  const monthDate = useMemo(() => new Date(viewYear, viewMonth - 1, 1), [viewYear, viewMonth]);

  const allBookings = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const merged: StaffBookingItem[] = [];
    for (const b of [
      ...data.bookings,
      ...data.todayArrivals,
      ...data.todayDepartures,
      ...data.todayInHouse,
      ...data.todayNewBookings,
    ]) {
      const key = bookingKey(b);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(b);
    }
    return merged;
  }, [data]);

  const calendarBookings = data?.bookings ?? [];

  const selectedFromCalendar = useMemo(
    () => (selectedId ? allBookings.find((b) => bookingKey(b) === selectedId) ?? null : null),
    [selectedId, allBookings]
  );

  const selectedBookingId = selectedFromCalendar?.id || selectedId;

  const { data: fetchedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["staff-booking-detail", organisationId, selectedBookingId],
    queryFn: () => stayApi.bookings.detail(selectedBookingId!),
    enabled: Boolean(organisationId && selectedBookingId && selectedBookingId.length > 10),
    retry: 0,
  });

  const displayBooking = fetchedDetail ?? selectedFromCalendar;

  useEffect(() => {
    if (!selectedId || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, displayBooking]);

  const todayList = useMemo(() => {
    if (!data) return [];
    switch (todayTab) {
      case "departures":
        return data.todayDepartures;
      case "inhouse":
        return data.todayInHouse;
      case "new":
        return data.todayNewBookings;
      default:
        return data.todayArrivals;
    }
  }, [data, todayTab]);

  const dayBookings = useMemo(() => {
    if (!dayFilter) return [];
    return bookingsForDay(calendarBookings, dayFilter);
  }, [calendarBookings, dayFilter]);

  const selectBooking = (booking: StaffBookingItem) => {
    setSelectedId(bookingKey(booking));
  };

  const goPrev = () => {
    const d = subMonths(monthDate, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
    setSelectedId(null);
    setDayFilter(null);
  };

  const goNext = () => {
    const d = addMonths(monthDate, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
    setSelectedId(null);
    setDayFilter(null);
  };

  const goToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth() + 1);
    setSelectedId(null);
    setDayFilter(format(t, "yyyy-MM-dd"));
  };

  const todayTabs: { id: TodayTab; label: string; count: number; icon: ReactNode }[] = [
    { id: "new", label: "New today", count: data?.todayNewBookings.length ?? 0, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "arrivals", label: "Arrivals", count: data?.todayArrivals.length ?? 0, icon: <LogIn className="w-3.5 h-3.5" /> },
    { id: "departures", label: "Departures", count: data?.todayDepartures.length ?? 0, icon: <LogOut className="w-3.5 h-3.5" /> },
    { id: "inhouse", label: "In-house", count: data?.todayInHouse.length ?? 0, icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  const apiError = !organisationId
    ? "Your account is not linked to an organisation. Sign out and sign in again."
    : isError &&
      ((error as { response?: { status?: number } })?.response?.status === 404
        ? "Bookings API not found — restart the backend to load the Bookings endpoints."
        : (error as Error)?.message || "Could not load bookings.");

  const detailPanel = displayBooking ? (
    <BookingDetailCard
      booking={displayBooking}
      loading={detailLoading}
      onClose={() => setSelectedId(null)}
    />
  ) : selectedId ? (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
      Could not load booking details. Try Refresh.
    </div>
  ) : dayFilter ? (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {formatBookingDate(dayFilter)} · {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"}
      </p>
      {dayBookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
          No bookings on this day.
        </div>
      ) : (
        dayBookings.map((b) => (
          <TodayBookingRow
            key={bookingKey(b)}
            booking={b}
            selected={selectedId === bookingKey(b)}
            onSelect={() => selectBooking(b)}
          />
        ))
      )}
    </div>
  ) : (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
      Click a booking on the calendar to see guest, room, and payment details.
    </div>
  );

  return (
    <StaffLayout fullBleed>
      <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden gap-3 p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Operations</p>
            <h1 className="text-lg sm:text-2xl font-display font-semibold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <span className="truncate">Bookings calendar</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Month view of all stays — click a booking bar for details.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto h-9"
            onClick={() => refetch()}
            disabled={isFetching || !organisationId}
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {apiError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 sm:px-4 py-3 text-sm text-destructive shrink-0">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium">Bookings could not be loaded</p>
              <p className="text-destructive/90 mt-0.5 break-words">{apiError}</p>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] gap-3 sm:gap-4">
          <div className="min-w-0 min-h-[52vh] sm:min-h-[48vh] lg:min-h-0 flex-1 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MonthBookingCalendar
                monthDate={monthDate}
                todayIso={data?.today ?? format(now, "yyyy-MM-dd")}
                bookings={calendarBookings}
                selectedId={selectedId}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSelect={selectBooking}
                onPrev={goPrev}
                onNext={goNext}
                onToday={goToday}
                onDayClick={(iso) => {
                  setDayFilter(iso);
                  setSelectedId(null);
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 min-w-0 w-full lg:w-auto shrink-0 lg:min-h-0 lg:overflow-y-auto max-h-[38vh] lg:max-h-none">
            <div ref={detailRef} className="hidden lg:block shrink-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Booking detail</CardTitle>
                </CardHeader>
                <CardContent>{detailPanel}</CardContent>
              </Card>
            </div>

            <Card className="shrink-0">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm sm:text-base">
                  Today — {data?.today ? formatBookingDate(data.today) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="grid grid-cols-2 gap-1.5">
                  {todayTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTodayTab(tab.id)}
                      className={`flex items-center justify-between gap-1 rounded-md border px-2 py-2 text-[11px] sm:text-xs transition-colors min-h-[2.5rem] ${
                        todayTab === tab.id
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="flex items-center gap-1 min-w-0">
                        {tab.icon}
                        <span className="truncate">{tab.label}</span>
                      </span>
                      <span className="font-semibold shrink-0">{tab.count}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[180px] sm:max-h-[240px] overflow-y-auto overscroll-contain pr-1">
                  {todayList.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No bookings in this list.</p>
                  ) : (
                    todayList.map((b) => (
                      <TodayBookingRow
                        key={bookingKey(b)}
                        booking={b}
                        selected={selectedId === bookingKey(b)}
                        onSelect={() => selectBooking(b)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(isMobile && (displayBooking || dayFilter) && (selectedId || dayFilter))}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setDayFilter(null);
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:max-w-md p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>{displayBooking ? "Booking detail" : "Day bookings"}</DialogTitle>
          </DialogHeader>
          {displayBooking ? (
            <BookingDetailCard booking={displayBooking} loading={detailLoading} onClose={() => setSelectedId(null)} />
          ) : (
            detailPanel
          )}
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
