import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, Users, AlertCircle, Search, X, Trash2, Star, QrCode, Phone, BedDouble, MapPin } from "lucide-react";
import { EventBookingService } from "@/services/eventbooking.service";
import {
  GuestHospitalityBookingService,
  type GuestHospitalityBookingMineItem,
} from "@/services/guestHospitalityBooking.service";
import { EventBooking, EventBookingSelectReq, EventBookingDeleteReq } from "@/models/eventbooking.model";
import { EventService } from "@/services/event.service";
import { Event } from "@/models/event.model";
import { ReviewService } from "@/services/review.service";
import { Review, ReviewSelectReq } from "@/models/review.model";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { decodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { formatEventDateLong, compareDateOnly, todayDateOnlyString } from "@/utils/eventDate.util";
import { cn } from "@/lib/utils";

const QRCodeSVG = lazy(() =>
  import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
);

const MyEventBookings: React.FC = () => {
  const location = useLocation();
  const isRoomsPage = location.pathname.startsWith("/user/my-room-bookings");
  const bookingKind: "event" | "room" = isRoomsPage ? "room" : "event";
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [roomBookings, setRoomBookings] = useState<GuestHospitalityBookingMineItem[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EventBooking[]>([]);
  const [events, setEvents] = useState<{ [key: number]: Event }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedCheckInStatus, setSelectedCheckInStatus] = useState<string>('all');
  const [selectedConfirmationStatus, setSelectedConfirmationStatus] = useState<string>('all');
  const [visibleBookingCount, setVisibleBookingCount] = useState(40);
  
  // Cancel booking state
  const [bookingToCancel, setBookingToCancel] = useState<EventBooking | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedEventForReview, setSelectedEventForReview] = useState<Event | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<EventBooking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  /** Booking card whose check-in QR dialog is open */
  const [bookingForQr, setBookingForQr] = useState<EventBooking | null>(null);
  
  const { user, mobile: authMobile } = useAuth();
  const { toast } = useToast();
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const roomBookingService = useMemo(() => new GuestHospitalityBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const reviewService = useMemo(() => new ReviewService(), []);

  const fetchBookings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const req: EventBookingSelectReq = {
        id: 0,
        event_id: 0,
        user_id: user.id,
        payment_status: "",
        check_in_status: "",
        confirmation_status: ""
      };

      if (isRoomsPage) {
        const roomsData = await roomBookingService.myBookings().catch(() => [] as GuestHospitalityBookingMineItem[]);
        setBookings([]);
        setEvents({});
        setRoomBookings(roomsData || []);
      } else {
        const bookingsData = await eventBookingService.select(req);
        setRoomBookings([]);
        setBookings(bookingsData || []);
      
      // Fetch event details for each booking
      if (bookingsData && bookingsData.length > 0) {
        const eventIds = [...new Set(bookingsData.map(b => b.event_id))];
        const eventsMap: { [key: number]: Event } = {};
        
        for (const eventId of eventIds) {
          try {
            const eventReq = {
              id: eventId,
              organisation_id: 0,
              organisation_location_id: 0,
              status: "",
              is_public: true
            };
            const eventData = await eventService.select(eventReq);
            if (eventData && eventData.length > 0) {
              eventsMap[eventId] = eventData[0];
            }
          } catch (error) {
            console.error(`Error fetching event ${eventId}:`, error);
          }
        }
        
        setEvents(eventsMap);
      } else {
        setEvents({});
      }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setRoomBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load reviews
  const loadReviews = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const req: ReviewSelectReq = {
        id: 0,
        user_id: user.id,
        organisation_service_id: null,
        event_id: null
      };
      
      const reviewsData = await reviewService.select(req);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  }, [user?.id, reviewService]);

  useEffect(() => {
    fetchBookings();
    loadReviews();
  }, [user?.id, isRoomsPage, eventBookingService, eventService, roomBookingService, loadReviews]);

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        const event = events[booking.event_id];
        return (
          event?.event_name?.toLowerCase().includes(term) ||
          event?.description?.toLowerCase().includes(term) ||
          event?.location?.toLowerCase().includes(term) ||
          booking.notes?.toLowerCase().includes(term)
        );
      });
    }

    // Event filter
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(booking => booking.event_id === Number(selectedEventId));
    }

    // Payment status filter
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === selectedPaymentStatus);
    }

    // Check-in status filter
    if (selectedCheckInStatus !== 'all') {
      filtered = filtered.filter(booking => booking.check_in_status === selectedCheckInStatus);
    }

    // Confirmation status filter
    if (selectedConfirmationStatus !== 'all') {
      filtered = filtered.filter(booking => booking.confirmation_status === selectedConfirmationStatus);
    }

    setFilteredBookings(filtered);
  }, [bookings, events, searchTerm, selectedEventId, selectedPaymentStatus, selectedCheckInStatus, selectedConfirmationStatus]);

  useEffect(() => {
    setVisibleBookingCount(40);
  }, [searchTerm, selectedEventId, selectedPaymentStatus, selectedCheckInStatus, selectedConfirmationStatus, bookingKind]);

  const filteredRooms = useMemo(() => {
    let list = [...roomBookings];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((room) =>
        [
          room.organisation_name,
          room.location_name,
          room.room_name,
          room.room_number,
          room.city,
          room.state,
          room.booking_id,
          room.guest_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
    }
    return list;
  }, [roomBookings, searchTerm]);

  type CombinedItem =
    | { kind: "event"; key: string; date: string; booking: EventBooking }
    | { kind: "room"; key: string; date: string; room: GuestHospitalityBookingMineItem };

  const combinedItems = useMemo(() => {
    const eventItems: CombinedItem[] =
      bookingKind === "room"
        ? []
        : filteredBookings.map((booking) => ({
            kind: "event" as const,
            key: `event-${booking.id}`,
            date: events[booking.event_id]?.event_date
              ? String(events[booking.event_id].event_date)
              : String(booking.created_at || ""),
            booking,
          }));
    const roomItems: CombinedItem[] =
      bookingKind === "event"
        ? []
        : filteredRooms.map((room) => ({
            kind: "room" as const,
            key: `room-${room.booking_guid || room.booking_id}-${room.room_id}-${room.check_in}`,
            date: room.check_in || "",
            room,
          }));
    return [...eventItems, ...roomItems].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [bookingKind, filteredBookings, filteredRooms, events]);

  const visibleBookings = useMemo(
    () => combinedItems.slice(0, visibleBookingCount),
    [combinedItems, visibleBookingCount],
  );

  const totalBookingCount = bookings.length + roomBookings.length;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEventId('all');
    setSelectedPaymentStatus('all');
    setSelectedCheckInStatus('all');
    setSelectedConfirmationStatus('all');
  };

  // Get unique event IDs from bookings
  const uniqueEventIds = useMemo(() => {
    return [...new Set(bookings.map(b => b.event_id))];
  }, [bookings]);

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /** Pills — same styling as organization Event bookings card view */
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
      <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
        Not Checked In
      </span>
    );
  };

  const filtersAreDefault =
    !searchTerm.trim() &&
    selectedEventId === "all" &&
    selectedPaymentStatus === "all" &&
    selectedCheckInStatus === "all" &&
    selectedConfirmationStatus === "all";

  /** Mobile for QR: booking row from API, else logged-in user profile */
  const getMobileForQr = (booking: EventBooking): string => {
    const fromBooking = (booking.user_mobile || "").trim();
    if (fromBooking) return fromBooking.replace(/\s+/g, "");
    const fromUser = (user?.mobile || authMobile || "").trim();
    return fromUser.replace(/\s+/g, "");
  };

  const handleCancelBooking = (booking: EventBooking) => {
    setBookingToCancel(booking);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      const deleteReq: EventBookingDeleteReq = {
        id: bookingToCancel.id
      };
      
      await eventBookingService.delete(deleteReq);
      
      toast({
        title: "Booking Cancelled",
        description: "Your event booking has been cancelled successfully.",
      });
      
      // Refresh bookings list
      await fetchBookings();
      
      // Close dialog
      setIsCancelDialogOpen(false);
      setBookingToCancel(null);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if event already has a review
  const hasReviewedEvent = (eventId: number): boolean => {
    return reviews.some(review => review.event_id === eventId);
  };

  // Open review dialog
  const openReviewDialog = (event: Event, booking: EventBooking) => {
    setSelectedEventForReview(event);
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewDialog(true);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedEventForReview || !user?.id) return;
    
    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please select a rating between 1 and 5 stars",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const review = new Review();
      review.user_id = user.id;
      review.event_id = selectedEventForReview.id;
      review.organisation_service_id = null;
      review.rating = reviewRating;
      review.comment = reviewComment.trim();
      
      await reviewService.insert(review);
      
      toast({
        title: "Success",
        description: "Thank you for your review!",
      });
      
      // Refresh reviews and bookings
      await loadReviews();
      await fetchBookings();
      
      setShowReviewDialog(false);
      setSelectedEventForReview(null);
      setSelectedBookingForReview(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] w-full max-w-full items-center justify-center overflow-x-hidden px-4 py-12">
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-100 bg-white px-6 py-10 text-center shadow-[0_2px_24px_-6px_rgba(15,23,42,0.1)] sm:max-w-none sm:rounded-[1.25rem] sm:px-12 sm:py-14">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400"
            aria-hidden
          />
          <Loader2 className="mx-auto mb-5 h-9 w-9 animate-spin text-orange-500" />
          <p className="text-sm font-medium tracking-tight text-zinc-600">
            {isRoomsPage ? "Loading your room bookings…" : "Loading your event bookings…"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">This only takes a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full min-w-0 overflow-x-hidden pb-8 sm:pb-10 -mx-4 px-3 sm:-mx-6 sm:px-4 lg:-mx-8 lg:px-5">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 md:mb-10">
          <div className="min-w-0 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90">
              {isRoomsPage ? "Your stays" : "Your events"}
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
              {isRoomsPage ? "My Room Bookings" : "My Event Bookings"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {isRoomsPage
                ? "Check-in, check-out, and payment for your room stays."
                : "View confirmation, payment, and check-in status for your registrations."}
            </p>
          </div>
          <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={filtersAreDefault}
              className="h-11 min-h-[44px] flex-1 gap-2 rounded-2xl border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-orange-200/70 hover:bg-orange-50/35 hover:text-zinc-900 disabled:opacity-60 sm:flex-initial sm:px-4 touch-manipulation"
            >
              <X className="h-4 w-4 shrink-0 text-zinc-500" />
              Clear filters
            </Button>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-4 rounded-[1.25rem] border border-zinc-100/90 bg-white p-4 shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)] sm:p-5 md:p-6">
          <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", isRoomsPage ? "lg:grid-cols-2" : "lg:grid-cols-4")}>
            {!isRoomsPage ? (
            <div className="space-y-1.5">
              <Label htmlFor="event-filter" className="text-xs font-medium text-gray-600">
                Event
              </Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event-filter" className="h-11 w-full rounded-2xl border-gray-300 bg-white text-sm">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                  <SelectItem value="all">All events</SelectItem>
                  {uniqueEventIds.map((eventId) => {
                    const ev = events[eventId];
                    return (
                      <SelectItem key={eventId} value={eventId.toString()}>
                        {ev?.event_name || `Event ${eventId}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="payment-filter" className="text-xs font-medium text-gray-600">
                Payment status
              </Label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger id="payment-filter" className="h-11 w-full rounded-2xl border-gray-300 bg-white text-sm">
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

            {!isRoomsPage ? (
            <>
            <div className="space-y-1.5">
              <Label htmlFor="checkin-filter" className="text-xs font-medium text-gray-600">
                Check-in status
              </Label>
              <Select value={selectedCheckInStatus} onValueChange={setSelectedCheckInStatus}>
                <SelectTrigger id="checkin-filter" className="h-11 w-full rounded-2xl border-gray-300 bg-white text-sm">
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
              <Label htmlFor="confirmation-filter" className="text-xs font-medium text-gray-600">
                Confirmation status
              </Label>
              <Select value={selectedConfirmationStatus} onValueChange={setSelectedConfirmationStatus}>
                <SelectTrigger id="confirmation-filter" className="h-11 w-full rounded-2xl border-gray-300 bg-white text-sm">
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
            </>
            ) : null}
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input
              placeholder={isRoomsPage ? "Search by property, room, or booking ID…" : "Search by event name, description, or location…"}
              className="h-11 w-full rounded-2xl border-zinc-200/90 pl-11 pr-4 text-base sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {totalBookingCount === 0 ? (
          <div className="rounded-[1.25rem] border border-zinc-100/90 bg-white px-6 py-12 text-center shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)]">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-zinc-300" aria-hidden />
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">No bookings found</h3>
            <p className="text-sm text-zinc-500">
              {isRoomsPage
                ? "You haven't booked any rooms yet."
                : "You haven't booked any events yet. Browse events to get started."}
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-6 text-sm text-zinc-500">
                {combinedItems.length} booking
                {combinedItems.length === 1 ? "" : "s"}
                {combinedItems.length !== totalBookingCount ? (
                  <span className="text-gray-400"> · {totalBookingCount} total</span>
                ) : null}
              </p>

              {combinedItems.length === 0 ? (
                <div className="rounded-[1.25rem] border border-zinc-100/90 bg-white px-6 py-12 text-center shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)]">
                  <AlertCircle className="mx-auto mb-4 h-16 w-16 text-zinc-300" aria-hidden />
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900">No bookings match filters</h3>
                  <p className="text-sm text-zinc-500">Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
                    {visibleBookings.map((item) => {
                      if (item.kind === "room") {
                        const room = item.room;
                        const place = [room.city, room.state].filter(Boolean).join(", ");
                        const stayLabel = [room.check_in, room.check_out].filter(Boolean).join(" → ");
                        const roomStatus = (room.closed ? "completed" : room.status || "reserved").toLowerCase();
                        const roomStatusClass =
                          roomStatus === "completed" || roomStatus === "occupied"
                            ? "bg-green-100 text-green-700"
                            : roomStatus === "checkout_pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700";
                        return (
                          <div key={item.key} className="relative overflow-hidden rounded-[1.25rem] border border-zinc-100/90 bg-white p-5 shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:border-orange-200/45 hover:shadow-[0_18px_44px_-16px_rgba(15,23,42,0.14)] sm:p-6">
                            <div
                              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-90"
                              aria-hidden
                            />
                            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                              <BedDouble className="h-3.5 w-3.5" aria-hidden />
                              Room
                            </span>
                            <h3 className="font-semibold text-lg leading-tight text-gray-900">
                              {room.organisation_name || "Stay"}
                            </h3>
                            <p className="mb-4 mt-1 text-sm text-gray-500">
                              {room.room_name || `Room ${room.room_number}`}
                              {room.room_number ? ` · #${room.room_number}` : ""}
                            </p>
                            <div className="space-y-3 text-sm text-gray-800">
                              {stayLabel ? (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                                  <span>{stayLabel}</span>
                                  {room.nights > 0 ? (
                                    <span className="text-gray-500">
                                      ({room.nights} {room.nights === 1 ? "night" : "nights"})
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              {place || room.location_name ? (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <MapPin className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                                  <span>{room.location_name ? `${room.location_name}${place ? ` · ${place}` : ""}` : place}</span>
                                </div>
                              ) : null}
                              {room.booking_id ? (
                                <div className="text-xs text-gray-500">Booking ID: {room.booking_id}</div>
                              ) : null}
                              {room.total > 0 ? (
                                <div>
                                  <span className="font-semibold text-gray-900">Amount:</span>{" "}
                                  ₹{room.total.toLocaleString()}
                                </div>
                              ) : null}
                              <div>
                                <span className={`inline-block rounded-full px-3 py-1 text-xs ${roomStatusClass}`}>
                                  {room.closed ? "Completed" : room.status.replaceAll("_", " ") || "Reserved"}
                                </span>
                              </div>
                              {room.balance > 0 ? cardPaymentPill("pending") : room.total > 0 ? cardPaymentPill("paid") : null}
                            </div>
                          </div>
                        );
                      }

                      const booking = item.booking;
                      const event = events[booking.event_id];
                      const attendeesRaw =
                        booking.notes ?
                          decodeEventBookingNotes(booking.notes).attendeesText || booking.notes
                        : null;

                      return (
                        <div key={booking.id} className="relative overflow-hidden rounded-[1.25rem] border border-zinc-100/90 bg-white p-5 shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:border-orange-200/45 hover:shadow-[0_18px_44px_-16px_rgba(15,23,42,0.14)] sm:p-6">
                          <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-90"
                            aria-hidden
                          />
                          {booking.isactive && booking.check_in_status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelBooking(booking)}
                              className="absolute right-4 top-4 h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label="Cancel booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

                            <span className="mb-3 mr-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                              Event
                            </span>
                          <h3 className="pr-10 font-semibold text-lg leading-tight text-gray-900">
                            {event?.event_name ?? "Event"}
                          </h3>
                          <p className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                            {event?.event_date ? formatEventDateLong(event.event_date) : "N/A"}
                          </p>

                          <div className="space-y-3 text-sm text-gray-800">
                            {booking.user_mobile ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                                <span className="font-semibold text-gray-900">{booking.user_mobile}</span>
                              </div>
                            ) : null}
                            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                              <Users className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                              {booking.number_of_people} {booking.number_of_people === 1 ? "Person" : "People"}
                            </div>
                            {booking.total_amount != null && booking.total_amount > 0 ? (
                              <div>
                                <span className="font-semibold text-gray-900">Amount:</span>{" "}
                                ₹{booking.total_amount.toLocaleString()}
                              </div>
                            ) : null}

                            <div className="pt-2">{cardConfirmationPill(booking.confirmation_status || "pending")}</div>
                            <div>{cardPaymentPill(booking.payment_status)}</div>
                            <div>{cardCheckInPill(booking.check_in_status)}</div>
                          </div>

                          {attendeesRaw && booking.number_of_people > 1 ? (
                            <div className="mt-6 text-sm">
                              <span className="font-semibold text-gray-900">Attendees:</span>
                              <br />
                              <span className="text-gray-600">{attendeesRaw}</span>
                            </div>
                          ) : null}

                          <div className="mt-6 text-xs text-gray-500">
                            Booked on: {formatDate(booking.created_at)}
                          </div>

                          {booking.isactive && booking.check_in_status !== 'cancelled' && (() => {
                            const eventDateStr = event?.event_date ?? null;
                            const today = todayDateOnlyString();
                            const canReview = Boolean(
                              eventDateStr && compareDateOnly(eventDateStr, today) <= 0
                            );
                            const hasReview = hasReviewedEvent(booking.event_id);
                            const phoneForQr = getMobileForQr(booking);

                            return (
                              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex h-auto w-full min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl border-gray-300 py-3 text-sm font-medium hover:bg-gray-50 sm:flex-1"
                                  onClick={() => {
                                    if (!phoneForQr) {
                                      toast({
                                        title: "No mobile number",
                                        description:
                                          "We could not find a mobile number for this booking. Update your profile or contact support.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    setBookingForQr(booking);
                                  }}
                                >
                                  <QrCode className="h-4 w-4 shrink-0" aria-hidden />
                                  Show check-in QR
                                </Button>
                                {canReview && (
                                  <Button
                                    variant={hasReview ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => event && openReviewDialog(event, booking)}
                                    disabled={hasReview}
                                    className="flex h-auto w-full min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium sm:flex-1"
                                  >
                                    {hasReview ? (
                                      <>
                                        <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                                        Reviewed
                                      </>
                                    ) : (
                                      <>
                                        <Star className="h-4 w-4 shrink-0" />
                                        Rate &amp; Review
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                  {visibleBookings.length < combinedItems.length ? (
                    <div className="mt-8 flex justify-center">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => setVisibleBookingCount((count) => count + 40)}
                      >
                        Show more ({combinedItems.length - visibleBookings.length} remaining)
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}

        {/* Cancel Booking Confirmation Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Event Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this event booking? 
                {bookingToCancel && events[bookingToCancel.event_id] && (
                  <>
                    <br /><br />
                    <strong>Event:</strong> {events[bookingToCancel.event_id].event_name}
                    <br />
                    <strong>Date:</strong> {formatEventDateLong(events[bookingToCancel.event_id].event_date)}
                    <br />
                    <strong>Number of People:</strong> {bookingToCancel.number_of_people}
                    {bookingToCancel.payment_status === 'paid' && (
                      <>
                        <br /><br />
                        <span className="text-orange-600 font-semibold">
                          Note: This booking was paid. Please contact support for refund information.
                        </span>
                      </>
                    )}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rate & Review Event</DialogTitle>
              <DialogDescription>
                Share your experience with {selectedEventForReview?.event_name || 'this event'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= reviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about this event..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewDialog(false);
                  setSelectedEventForReview(null);
                  setSelectedBookingForReview(null);
                }}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating < 1}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check-in QR (encodes registered mobile for scanning at venue) */}
        {bookingForQr ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setBookingForQr(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Check-in QR</DialogTitle>
              <DialogDescription>
                {bookingForQr && events[bookingForQr.event_id]
                  ? `Show this at check-in for ${events[bookingForQr.event_id].event_name}.`
                  : "Show this code at the event check-in desk."}
              </DialogDescription>
            </DialogHeader>
            {bookingForQr && (() => {
              const value = getMobileForQr(bookingForQr);
              const display = value || "—";
              return (
                <div className="flex flex-col items-center gap-4 py-2">
                  {value ? (
                    <>
                      <div className="rounded-lg border bg-white p-3 shadow-sm">
                        <Suspense
                          fallback={
                            <div className="flex h-[220px] w-[220px] items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          }
                        >
                          <QRCodeSVG value={value} size={220} level="M" includeMargin />
                        </Suspense>
                      </div>
                      <p className="text-sm font-mono text-center break-all text-foreground">{display}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        This QR encodes your mobile number so staff can verify your booking.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      No mobile number is available. Add a phone number to your account and try again.
                    </p>
                  )}
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingForQr(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        ) : null}
    </div>
  );
};

export default MyEventBookings;

