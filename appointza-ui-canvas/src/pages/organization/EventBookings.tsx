import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Users, DollarSign, CheckCircle2, XCircle, Clock, Search, RefreshCw, ThumbsUp, ThumbsDown, Phone, LayoutGrid, List, Columns, X } from "lucide-react";
import { EventBookingService } from "@/services/eventbooking.service";
import { EventBooking, EventBookingSelectReq } from "@/models/eventbooking.model";
import { EventService } from "@/services/event.service";
import { Event, EventSelectReq } from "@/models/event.model";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { org } from "@/lib/orgTheme";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { decodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { formatEventDateLong } from "@/utils/eventDate.util";

const EventBookings: React.FC = () => {
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsMap, setEventsMap] = useState<{ [key: number]: Event }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [checkInStatus, setCheckInStatus] = useState<string>("");
  const [confirmationStatus, setConfirmationStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filters
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [checkInStatusFilter, setCheckInStatusFilter] = useState<string>("all");
  const [confirmationStatusFilter, setConfirmationStatusFilter] = useState<string>("all");
  
  // View mode: 'card' | 'row' | 'column'
  const [viewMode, setViewMode] = useState<'card' | 'row' | 'column'>('card');
  
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const { toast } = useToast();
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookingsAndEvents = useCallback(async () => {
    const organisationlocationid = globalLocationId ? Number(globalLocationId) : (user?.locationid || 0);

    const isStaff = user?.isStaff === true;
    const hasOrganisationId = user?.organisationid && user.organisationid > 0;
    const hasLocationId = organisationlocationid > 0;

    if (!hasOrganisationId && !hasLocationId) {
      setBookings([]);
      setEvents([]);
      return;
    }

    const organisation_id = user?.organisationid || 0;

    const eventReq: EventSelectReq = {
      id: 0,
      organisation_id,
      organisation_location_id: organisationlocationid,
      status: "",
      is_public: true,
    };

    const eventsData = await eventService.select(eventReq);
    setEvents(eventsData || []);

    const map: { [key: number]: Event } = {};
    (eventsData || []).forEach((event) => {
      map[event.id] = event;
    });
    setEventsMap(map);

    const allBookings: EventBooking[] = [];

    if (eventsData && eventsData.length > 0) {
      for (const event of eventsData) {
        try {
          const bookingReq: EventBookingSelectReq = {
            id: 0,
            event_id: event.id,
            user_id: 0,
            payment_status: "",
            check_in_status: "",
          };
          const bookingsData = await eventBookingService.select(bookingReq);
          if (bookingsData && bookingsData.length > 0) {
            allBookings.push(...bookingsData);
          }
        } catch (error) {
          console.error(`Error fetching bookings for event ${event.id}:`, error);
        }
      }
    }

    setBookings(allBookings);
  }, [globalLocationId, user?.organisationid, user?.locationid, eventBookingService, eventService]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        await loadBookingsAndEvents();
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) {
          setBookings([]);
          setEvents([]);
          toast({
            title: "Error",
            description: "Failed to load event bookings",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBookingsAndEvents, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadBookingsAndEvents();
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh bookings",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setEventFilter("all");
    setPaymentStatusFilter("all");
    setCheckInStatusFilter("all");
    setConfirmationStatusFilter("all");
    setSearchTerm("");
    toast({
      title: "Filters cleared",
      description: "All filters have been reset.",
    });
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (eventFilter !== "all") {
      const eventId = parseInt(eventFilter, 10);
      filtered = filtered.filter((b) => b.event_id === eventId);
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentStatusFilter);
    }

    if (checkInStatusFilter !== "all") {
      filtered = filtered.filter((b) => b.check_in_status === checkInStatusFilter);
    }

    if (confirmationStatusFilter !== "all") {
      filtered = filtered.filter((b) => (b.confirmation_status || "pending") === confirmationStatusFilter);
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((b) => {
        const eventName = eventsMap[b.event_id]?.event_name?.toLowerCase() ?? "";
        const userName = b.user_name?.toLowerCase() ?? "";
        const mobile = b.user_mobile?.toLowerCase() ?? "";
        return eventName.includes(q) || userName.includes(q) || mobile.includes(q);
      });
    }

    return filtered;
  }, [
    bookings,
    eventFilter,
    paymentStatusFilter,
    checkInStatusFilter,
    confirmationStatusFilter,
    searchTerm,
    eventsMap,
  ]);

  const handleUpdateClick = (booking: EventBooking) => {
    setSelectedBooking(booking);
    setPaymentStatus(booking.payment_status);
    setCheckInStatus(booking.check_in_status);
    setConfirmationStatus(booking.confirmation_status || 'pending');
    setShowUpdateDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;
    
    try {
      setIsUpdating(true);
      
      const updatedBooking = { ...selectedBooking };
      
      // Only update payment_status if it wasn't paid through a gateway
      // Confirmation Status and Check-In Status can always be updated
      if (!selectedBooking.payment_reference || selectedBooking.payment_reference.trim() === '') {
        updatedBooking.payment_status = paymentStatus;
      } else {
        // Preserve original payment_status when payment was made through gateway
        updatedBooking.payment_status = selectedBooking.payment_status;
      }
      // Always allow updating check_in_status and confirmation_status
      updatedBooking.check_in_status = checkInStatus;
      updatedBooking.confirmation_status = confirmationStatus;
      
      await eventBookingService.update(updatedBooking);
      
      // Update local state
      setBookings(bookings.map(b => 
        b.id === selectedBooking.id ? updatedBooking : b
      ));
      
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
      
      setShowUpdateDialog(false);
      setSelectedBooking(null);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCheckInStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Checked In
        </Badge>;
      case 'not_checked_in':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Not Checked In
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getConfirmationStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <ThumbsDown className="h-3 w-3" />
          Rejected
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>;
      default:
        return <Badge variant="secondary">{status || 'pending'}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /** Pills styled like the HTML mock — card view only */
  const cardConfirmationPill = (status: string) => {
    const s = (status || "pending").toLowerCase();
    if (s === "approved")
      return (
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
          Approved
        </span>
      );
    if (s === "rejected")
      return (
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
          Rejected
        </span>
      );
    return (
      <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
        Pending Approval
      </span>
    );
  };

  const cardPaymentPill = (status: string) => {
    const s = (status || "").toLowerCase();
    const label =
      s === "paid" ? "Paid" : s === "failed" ? "Failed" : s === "refunded" ? "Refunded" : "Pending";
    let pillClass = "bg-yellow-100 text-yellow-700";
    if (s === "paid") pillClass = "bg-green-100 text-green-700";
    if (s === "failed") pillClass = "bg-red-100 text-red-700";
    if (s === "refunded") pillClass = "bg-blue-100 text-blue-700";
    return (
      <span className={`inline-block rounded-full px-3 py-1 text-xs ${pillClass}`}>Payment: {label}</span>
    );
  };

  const cardCheckInPill = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "checked_in")
      return (
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
          Checked In
        </span>
      );
    if (s === "cancelled")
      return (
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
          Cancelled
        </span>
      );
    return (
      <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-stone-600">
        Not Checked In
      </span>
    );
  };

  const filtersAreDefault =
    !searchTerm.trim() &&
    eventFilter === "all" &&
    paymentStatusFilter === "all" &&
    checkInStatusFilter === "all" &&
    confirmationStatusFilter === "all";

  return (
    <OrganizationPageShell>
        {isLoading ? (
          <div className={org.loading}>
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-appointza-coral" />
              <p className="text-stone-600">Loading event bookings…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters & view mode */}
            <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex h-10 shrink-0 overflow-hidden rounded-2xl border border-stone-200 sm:h-11">
                  {(
                    [
                      { mode: "card" as const, icon: LayoutGrid, label: "Card" },
                      { mode: "row" as const, icon: List, label: "Row" },
                      { mode: "column" as const, icon: Columns, label: "Column" },
                    ] as const
                  ).map(({ mode, icon: Icon, label }, i) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                        i > 0 && "border-l border-stone-200",
                        viewMode === mode
                          ? "bg-gradient-coral text-white"
                          : "bg-white text-stone-700 hover:bg-stone-50",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className={cn(org.btnOutline, "h-10 flex-1 sm:flex-none")}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 shrink-0" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={filtersAreDefault}
                    className={cn(org.btnOutline, "h-10 flex-1 sm:flex-none")}
                  >
                    <X className="h-4 w-4 shrink-0" />
                    Clear filters
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="event-filter" className="text-xs font-medium text-stone-600">
                    Event
                  </Label>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger id="event-filter" className="h-11 w-full rounded-2xl border-stone-200 bg-white text-sm">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                      <SelectItem value="all">All events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.event_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-filter" className="text-xs font-medium text-stone-600">
                    Payment status
                  </Label>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger id="payment-filter" className="h-11 w-full rounded-2xl border-stone-200 bg-white text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkin-filter" className="text-xs font-medium text-stone-600">
                    Check-in status
                  </Label>
                  <Select value={checkInStatusFilter} onValueChange={setCheckInStatusFilter}>
                    <SelectTrigger id="checkin-filter" className="h-11 w-full rounded-2xl border-stone-200 bg-white text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="not_checked_in">Not checked in</SelectItem>
                      <SelectItem value="checked_in">Checked in</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmation-filter" className="text-xs font-medium text-stone-600">
                    Confirmation status
                  </Label>
                  <Select value={confirmationStatusFilter} onValueChange={setConfirmationStatusFilter}>
                    <SelectTrigger id="confirmation-filter" className="h-11 w-full rounded-2xl border-stone-200 bg-white text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
                <Input
                  placeholder="Search by event, name, or phone…"
                  className="h-11 w-full rounded-2xl border-stone-200 pl-11 pr-4 text-base sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-appointza-cream/60 px-4 py-4 sm:px-6 sm:py-5">
              <p className="mb-4 text-sm text-stone-600">
                {filteredBookings.length} booking
                {filteredBookings.length === 1 ? "" : "s"}
                {filteredBookings.length !== bookings.length ? (
                  <span className="text-stone-400"> · {bookings.length} total</span>
                ) : null}
              </p>

              {/* Bookings list */}
              {filteredBookings.length === 0 ? (
                <div className="rounded-xl border border-stone-100 bg-white px-6 py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-16 w-16 text-stone-400" aria-hidden />
                  <h3 className="mb-2 text-lg font-semibold text-appointza-navy">No bookings found</h3>
                  <p className="text-sm text-stone-600">
                    {bookings.length === 0
                      ? "No bookings have been made for your events yet."
                      : "No bookings match your filters."}
                  </p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBookings.map((booking) => {
                    const event = eventsMap[booking.event_id];
                    const attendeesRaw =
                      booking.notes ?
                        decodeEventBookingNotes(booking.notes).attendeesText || booking.notes
                      : null;

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-3xl p-6 shadow-sm transition hover:shadow-md"
                      >
                        <h3 className="font-semibold text-lg leading-tight mb-1 text-appointza-navy">
                          {event?.event_name ?? "Event"}
                        </h3>
                        <p className="mb-4 flex items-center gap-1.5 text-sm text-stone-500">
                          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                          {event?.event_date ? formatEventDateLong(event.event_date) : "N/A"}
                        </p>

                        <div className="space-y-3 text-sm text-gray-800">
                          <div>
                            <span className="font-semibold text-appointza-navy">Booked By:</span>{" "}
                            {booking.user_name || `User #${booking.user_id}`}
                          </div>
                          {booking.user_mobile ?
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                              <span className="font-semibold text-appointza-navy">{booking.user_mobile}</span>
                            </div>
                          : null}
                          <div className="flex items-center gap-1.5 font-semibold text-appointza-navy">
                            <Users className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                            {booking.number_of_people} {booking.number_of_people === 1 ? "Person" : "People"}
                          </div>
                          {booking.total_amount != null && booking.total_amount > 0 ?
                            <div>
                              <span className="font-semibold text-appointza-navy">Amount:</span>{" "}
                              ₹{booking.total_amount.toLocaleString()}
                            </div>
                          : null}

                          <div className="pt-2">{cardConfirmationPill(booking.confirmation_status || "pending")}</div>
                          <div>{cardPaymentPill(booking.payment_status)}</div>
                          <div>{cardCheckInPill(booking.check_in_status)}</div>
                        </div>

                        {attendeesRaw ?
                          <div className="mt-6 text-sm">
                            <span className="font-semibold text-appointza-navy">Attendees:</span>
                            <br />
                            <span className="text-stone-600">{attendeesRaw}</span>
                          </div>
                        : null}

                        <div className="mt-6 text-xs text-stone-500">
                          Booked on: {formatDate(booking.created_at)}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleUpdateClick(booking)}
                          className="mt-6 flex h-auto w-full items-center justify-center gap-2 rounded-2xl border-stone-200 py-3 text-sm font-medium hover:bg-stone-50"
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden />
                          Update Status
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === "row" ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-appointza-cream/60 border-b">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Event</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Booked By</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">People</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Confirmation</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Payment</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Check-In</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Booked On</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-100">
                      {filteredBookings.map((booking) => {
                        const event = eventsMap[booking.event_id];
                        return (
                          <tr key={booking.id} className="hover:bg-stone-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-appointza-navy">{event?.event_name || 'Event'}</div>
                                <div className="text-sm text-stone-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {event?.event_date ? formatEventDateLong(event.event_date) : 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-appointza-navy">{booking.user_name || `User #${booking.user_id}`}</div>
                                {booking.user_mobile && (
                                  <div className="text-sm text-stone-500 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {booking.user_mobile}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-appointza-navy">
                              {booking.number_of_people} {booking.number_of_people === 1 ? 'Person' : 'People'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-appointza-navy">
                              {booking.total_amount && booking.total_amount > 0 ? `₹${booking.total_amount.toLocaleString()}` : 'N/A'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              {getConfirmationStatusBadge(booking.confirmation_status || 'pending')}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              {getPaymentStatusBadge(booking.payment_status)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              {getCheckInStatusBadge(booking.check_in_status)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                              {formatDate(booking.created_at)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                              <Button
                                onClick={() => handleUpdateClick(booking)}
                                variant="outline"
                                size="sm"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Update
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
            </div>

            {/* Mobile Card View for Row Mode */}
            <div className="md:hidden space-y-4">
              {filteredBookings.map((booking) => {
                const event = eventsMap[booking.event_id];
                return (
                  <Card
                    key={booking.id}
                    className="rounded-xl border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {event?.event_name || 'Event'}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1 text-xs sm:text-sm">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            {event?.event_date ? formatEventDateLong(event.event_date) : 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="pb-3 border-b">
                        <p className="text-xs font-medium text-stone-600 mb-1">Booked By</p>
                        <p className="text-sm font-semibold text-appointza-navy truncate">
                          {booking.user_name || `User #${booking.user_id}`}
                        </p>
                        {booking.user_mobile && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.user_mobile}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs sm:text-sm">
                            {booking.number_of_people} {booking.number_of_people === 1 ? 'Person' : 'People'}
                          </span>
                        </div>
                        {booking.total_amount && booking.total_amount > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              ₹{booking.total_amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Confirmation:</span>
                          {getConfirmationStatusBadge(booking.confirmation_status || 'pending')}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Payment:</span>
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Check-In:</span>
                          {getCheckInStatusBadge(booking.check_in_status)}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Booked on: {formatDate(booking.created_at)}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleUpdateClick(booking)}
                        className="w-full h-9 sm:h-10"
                        variant="outline"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Status
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredBookings.map((booking) => {
              const event = eventsMap[booking.event_id];
              return (
                <Card
                  key={booking.id}
                  className="rounded-xl border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-appointza-navy mb-1">
                          {event?.event_name || 'Event'}
                        </h3>
                        <p className="text-sm text-stone-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event?.event_date ? formatEventDateLong(event.event_date) : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-xs font-medium text-stone-600 mb-1">Booked By</p>
                          <p className="text-sm font-semibold text-appointza-navy">{booking.user_name || `User #${booking.user_id}`}</p>
                          {booking.user_mobile && (
                            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.user_mobile}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-600 mb-1">People</p>
                          <p className="text-sm text-appointza-navy">{booking.number_of_people} {booking.number_of_people === 1 ? 'Person' : 'People'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-600 mb-1">Amount</p>
                          <p className="text-sm text-appointza-navy">
                            {booking.total_amount && booking.total_amount > 0 ? `₹${booking.total_amount.toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-600 mb-1">Booked On</p>
                          <p className="text-sm text-appointza-navy">{formatDate(booking.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Confirmation:</span>
                          {getConfirmationStatusBadge(booking.confirmation_status || 'pending')}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Payment:</span>
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">Check-In:</span>
                          {getCheckInStatusBadge(booking.check_in_status)}
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="pt-4 border-t">
                          <p className="text-xs font-medium text-stone-600 mb-1">Attendees:</p>
                          <p className="text-sm text-stone-700">
                            {decodeEventBookingNotes(booking.notes).attendeesText || booking.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleUpdateClick(booking)}
                          className="w-full"
                          variant="outline"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
            </div>
          </>
        )}

        {/* Update Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Update Booking Status</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedBooking && eventsMap[selectedBooking.event_id]?.event_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation-status" className="text-sm sm:text-base">Confirmation Status *</Label>
                <Select value={confirmationStatus} onValueChange={setConfirmationStatus}>
                  <SelectTrigger id="confirmation-status" className="h-10 sm:h-11">
                    <SelectValue placeholder="Select confirmation status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-status" className="text-sm sm:text-base">Payment Status *</Label>
                {selectedBooking?.payment_reference && selectedBooking.payment_reference.trim() !== '' ? (
                  <div className="space-y-2">
                    <Select value={paymentStatus} disabled>
                      <SelectTrigger id="payment-status" className="bg-gray-100 cursor-not-allowed h-10 sm:h-11">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Payment was made through a payment gateway. Status cannot be manually edited.
                      {selectedBooking.payment_reference && (
                        <span className="block mt-1">Payment Reference: {selectedBooking.payment_reference}</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger id="payment-status" className="h-10 sm:h-11">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkin-status" className="text-sm sm:text-base">Check-In Status *</Label>
                <Select value={checkInStatus} onValueChange={setCheckInStatus}>
                  <SelectTrigger id="checkin-status" className="h-10 sm:h-11">
                    <SelectValue placeholder="Select check-in status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setShowUpdateDialog(false)} 
                disabled={isUpdating}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={isUpdating}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </OrganizationPageShell>
  );
};

export default EventBookings;

