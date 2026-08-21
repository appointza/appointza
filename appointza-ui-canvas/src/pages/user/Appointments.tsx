import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, SegmentTabsList, SegmentTabsTrigger, SegmentTabsContent } from "@/components/ui/segment-tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
  Filter,
  User,
  CreditCard,
  Trash2,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AppoinmentService } from "@/services/appoinment.service";
import { BookedAppoinmentRes, UpdateStatusReq, UpdatePaymentReq } from "@/models/appoinment.model";
import { useBookedAppointments } from "@/hooks/useBookedAppointments";

/** Shared shell — soft elevation, warm hover, top accent (matches Appointza / Explore tone). */
const appointmentCardClassName =
  "group relative flex h-full min-w-0 flex-col overflow-hidden touch-manipulation rounded-2xl border border-zinc-100/90 bg-white p-4 shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)] transition-[transform,box-shadow,border-color] duration-300 ease-out sm:rounded-[1.25rem] sm:p-5 md:p-6 sm:hover:-translate-y-0.5 sm:hover:border-orange-200/45 sm:hover:shadow-[0_18px_44px_-16px_rgba(15,23,42,0.14),0_0_0_1px_rgba(251,146,60,0.06)] active:opacity-[0.98] sm:active:translate-y-0";

const UserAppointments = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // API services
  const appointmentService = useMemo(() => new AppoinmentService(), []);

  const {
    data: appointmentsData,
    isLoading,
    refetch: refetchAppointments,
  } = useBookedAppointments({
    userId: user?.id,
    enabled: isAuthenticated && !!user?.id,
  });

  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming');
  const [visibleCount, setVisibleCount] = useState(40);
  
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{start: Date | null; end: Date | null}>({
    start: null,
    end: null
  });

  // Action states
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('Cash');
  const [paymentName, setPaymentName] = useState('');
  const [paymentCode, setPaymentCode] = useState('');

  const { upcomingAppointments, previousAppointments } = useMemo(() => {
    const response = appointmentsData ?? [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = response.filter((appointment) => {
      const appointmentDate = new Date(appointment.appoinmentdate);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= now;
    });

    const previous = response.filter((appointment) => {
      const appointmentDate = new Date(appointment.appoinmentdate);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate < now;
    });

    return { upcomingAppointments: upcoming, previousAppointments: previous };
  }, [appointmentsData]);

  // Status pill — matches mock (e.g. green "Upcoming" on confirmed future visits)
  const getStatusPresentation = (appointment: BookedAppoinmentRes, tab: "upcoming" | "previous") => {
    const c = (appointment.statuscode || "").toUpperCase();
    if (tab === "upcoming") {
      if (c === "CANCELLED")
        return { label: "Cancelled", className: "text-xs leading-tight bg-red-50 text-red-700 px-2.5 py-1 rounded-xl font-medium ring-1 ring-red-200/60 shadow-sm" };
      if (c === "COMPLETED")
        return { label: "Completed", className: "text-xs leading-tight bg-sky-50 text-sky-800 px-2.5 py-1 rounded-xl font-medium ring-1 ring-sky-200/60 shadow-sm" };
      if (c === "CONFIRMED")
        return { label: "Upcoming", className: "text-xs leading-tight bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-medium ring-1 ring-emerald-200/60 shadow-sm" };
      if (c === "PENDING")
        return { label: "Pending", className: "text-xs leading-tight bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl font-medium ring-1 ring-amber-200/60 shadow-sm" };
    }
    if (c === "COMPLETED")
      return { label: "Completed", className: "text-xs leading-tight bg-sky-50 text-sky-800 px-2.5 py-1 rounded-xl font-medium ring-1 ring-sky-200/60 shadow-sm" };
    if (c === "CANCELLED")
      return { label: "Cancelled", className: "text-xs leading-tight bg-red-50 text-red-700 px-2.5 py-1 rounded-xl font-medium ring-1 ring-red-200/60 shadow-sm" };
    if (c === "CONFIRMED")
      return { label: "Confirmed", className: "text-xs leading-tight bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-medium ring-1 ring-emerald-200/60 shadow-sm" };
    if (c === "PENDING")
      return { label: "Pending", className: "text-xs leading-tight bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl font-medium ring-1 ring-amber-200/60 shadow-sm" };
    return {
      label: c || "Unknown",
      className: "text-xs leading-tight bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-xl font-medium ring-1 ring-zinc-200/80 shadow-sm",
    };
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAppointments();
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    // Check if appointment is within 24 hours
    const appointmentDate = new Date(selectedAppointment.appoinmentdate);
    const currentDate = new Date();
    const hoursDifference = (appointmentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      if (!confirm('This appointment is within 24 hours. You may be subject to a cancellation fee. Do you want to proceed?')) {
        return;
      }
    }

    try {
      const req = new UpdateStatusReq();
      req.appoinmentid = selectedAppointment.id;
      req.statuscode = 'CANCELLED';
      
      await appointmentService.UpdateStatus(req);
      
      // Refresh the appointments list
      await refetchAppointments();
      
      // Close the dialog
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancelReason('');
      
      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!selectedAppointment || !paymentAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const req = new UpdatePaymentReq();
      req.appoinmentid = selectedAppointment.id;
      req.paymenttype = selectedPaymentType;
      req.paymenttypeid = selectedPaymentType === 'Cash' ? 1 : 
                         selectedPaymentType === 'Card' ? 2 : 3;
      req.amount = Number(paymentAmount) || 0;
      req.paymentname = paymentName;
      req.paymentcode = paymentCode;
      req.statusid = 1; // Assuming 1 is for completed payment
      req.customername = selectedAppointment.username || '';
      req.customerid = selectedAppointment.userid || 0;
      req.organisationid = selectedAppointment.organizationid || 0;
      req.organisationlocationid = selectedAppointment.organisationlocationid || 0;
      
      await appointmentService.UpdatePayment(req);
      
      // Refresh the appointments list
      await refetchAppointments();
      
      // Close the dialog
      setShowPaymentDialog(false);
      setSelectedAppointment(null);
      setPaymentAmount('');
      setSelectedPaymentType('Cash');
      setPaymentName('');
      setPaymentCode('');
      
      toast({
        title: "Success",
        description: "Payment updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive"
      });
    }
  };

  // Get filtered appointments
  const getFilteredAppointments = (appointments: BookedAppoinmentRes[]) => {
    return appointments.filter(appointment => {
      // Status filter
      if (selectedStatus !== 'ALL' && appointment.statuscode !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (dateRange.start && dateRange.end) {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        if (appointmentDate < startDate || appointmentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    setVisibleCount(40);
  }, [activeTab, selectedStatus, dateRange.start, dateRange.end]);

  if (isLoading && !appointmentsData) {
    return (
      <div className="flex min-h-[40vh] w-full max-w-full items-center justify-center overflow-x-hidden px-4 py-12">
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-100 bg-white px-6 py-10 text-center shadow-[0_2px_24px_-6px_rgba(15,23,42,0.1)] sm:max-w-none sm:rounded-[1.25rem] sm:px-12 sm:py-14">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400"
            aria-hidden
          />
          <Loader2 className="mx-auto mb-5 h-9 w-9 animate-spin text-orange-500" />
          <p className="text-sm font-medium tracking-tight text-zinc-600">Loading your appointments…</p>
          <p className="mt-1 text-xs text-zinc-400">This only takes a moment</p>
        </div>
      </div>
    );
  }

  const currentAppointments = activeTab === 'upcoming' ? upcomingAppointments : previousAppointments;
  const filteredAppointments = getFilteredAppointments(currentAppointments);
  const visibleAppointments = filteredAppointments.slice(0, visibleCount);

    const appointmentServicesTotal = (a: BookedAppoinmentRes) =>
    a.attributes?.servicelist?.reduce((sum, s) => sum + (Number(s.serviceprice) || 0), 0) ?? 0;

  return (
    <div className="mx-auto w-full max-w-full min-w-0 overflow-x-hidden pb-8 sm:pb-10 -mx-4 px-3 sm:-mx-6 sm:px-4 lg:-mx-8 lg:px-5">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 md:mb-10">
          <div className="min-w-0 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90">Your schedule</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">My Appointments</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Manage upcoming visits and browse past appointments in one calm, organised view.
            </p>
          </div>
          <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
            <Button
              onClick={() => setShowFilterDialog(true)}
              variant="outline"
              className="h-11 min-h-[44px] flex-1 gap-2 rounded-2xl border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-orange-200/70 hover:bg-orange-50/35 hover:text-zinc-900 sm:flex-initial sm:px-4 touch-manipulation"
            >
              <Filter className="h-4 w-4 shrink-0 text-zinc-500" />
              Filter
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="h-11 min-h-[44px] flex-1 gap-2 rounded-2xl border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-orange-200/70 hover:bg-orange-50/35 hover:text-zinc-900 disabled:opacity-60 sm:flex-initial sm:px-4 touch-manipulation"
            >
              <RefreshCw className={cn("h-4 w-4 shrink-0 text-zinc-500", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "previous")}>
          <SegmentTabsList>
            <SegmentTabsTrigger value="upcoming">Upcoming</SegmentTabsTrigger>
            <SegmentTabsTrigger value="previous">Previous</SegmentTabsTrigger>
          </SegmentTabsList>

          <SegmentTabsContent value="upcoming">
            {filteredAppointments.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
                  {visibleAppointments.map((appointment) => {
                    const statusPresentation = getStatusPresentation(appointment, "upcoming");
                    const total = appointmentServicesTotal(appointment);
                    return (
                      <article key={appointment.id} className={cn(appointmentCardClassName, "appointment-card")}>
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-90"
                          aria-hidden
                        />
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl">
                              {new Date(appointment.appoinmentdate).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
                              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                                <Clock className="size-3.5 shrink-0" aria-hidden />
                              </span>
                              <span className="font-medium text-zinc-600">
                                {formatTime(appointment.fromtime)} – {formatTime(appointment.totime)}
                              </span>
                            </p>
                          </div>
                          <span className={cn("w-fit shrink-0 self-start sm:self-center", statusPresentation.className)}>
                            {statusPresentation.label}
                          </span>
                        </div>

                        <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold text-orange-600">
                          {appointment.organisationname}
                        </h3>
                        <p className="mb-4 flex items-start gap-2 text-sm leading-snug text-zinc-500">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden />
                          <span>{appointment.city || "No location specified"}</span>
                        </p>

                        {appointment.staffname ? (
                          <p className="mb-3 flex items-center gap-2 text-sm text-zinc-600">
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400 ring-1 ring-zinc-100/80">
                              <User className="size-3.5 shrink-0" aria-hidden />
                            </span>
                            <span>
                              <span className="text-zinc-400">Staff · </span>
                              {appointment.staffname}
                            </span>
                          </p>
                        ) : null}

                        {appointment.attributes?.servicelist && appointment.attributes.servicelist.length > 0 ? (
                          <div className="mb-4 min-h-0">
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Services</p>
                            <div className="space-y-2">
                              {appointment.attributes.servicelist.map((service, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-2.5 transition-colors hover:bg-zinc-50"
                                >
                                  <p className="min-w-0 flex-1 text-sm font-medium text-zinc-800 break-words leading-snug">
                                    {service.servicename}
                                  </p>
                                  <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                                    ₹{service.serviceprice}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {appointment.ispaid ? (
                          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/60">
                            <CheckCircle className="size-3.5 shrink-0 text-emerald-600" />
                            Paid
                          </div>
                        ) : null}

                        {(() => {
                          const showCancel =
                            appointment.statuscode !== "CANCELLED" && appointment.statuscode !== "COMPLETED";
                          const showFooter = total > 0 || showCancel;
                          return showFooter ? (
                            <div className="mt-auto space-y-4 border-t border-zinc-100 pt-5">
                              {total > 0 ? (
                                <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50/90 px-3.5 py-3 ring-1 ring-zinc-100/90">
                                  <span className="text-sm font-medium text-zinc-600">Total</span>
                                  <span className="text-lg font-semibold tabular-nums tracking-tight text-zinc-900">
                                    ₹{total.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              ) : null}
                              {showCancel ? (
                                <Button
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowCancelDialog(true);
                                  }}
                                  variant="outline"
                                  className="w-full min-h-[48px] rounded-2xl border-red-200/90 bg-white py-3.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50/80 hover:text-red-700 touch-manipulation"
                                >
                                  <span className="inline-flex items-center justify-center gap-2">
                                    <Trash2 className="size-4 shrink-0 opacity-80" />
                                    Cancel appointment
                                  </span>
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <div className="flex-grow" />
                          );
                        })()}

                        {false &&
                          !appointment.ispaid &&
                          appointment.statuscode !== "CANCELLED" && (
                            <Button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setPaymentAmount(appointmentServicesTotal(appointment).toString() || "");
                                setShowPaymentDialog(true);
                              }}
                              variant="outline"
                              className="mt-2 w-full sm:w-auto text-green-600 border-green-600 hover:bg-green-50 text-xs h-8"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                              Pay Now
                            </Button>
                          )}
                      </article>
                    );
                  })}
                </div>
                {visibleAppointments.length < filteredAppointments.length ? (
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-2xl text-sm"
                      onClick={() => setVisibleCount((n) => n + 40)}
                    >
                      Show more ({filteredAppointments.length - visibleAppointments.length} remaining)
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/90 via-white to-white px-4 py-10 text-center shadow-[0_2px_24px_-8px_rgba(15,23,42,0.08)] sm:rounded-[1.25rem] sm:px-8 sm:py-14">
                <div
                  className="pointer-events-none mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-50 text-orange-600 shadow-sm ring-1 ring-orange-200/40"
                  aria-hidden
                >
                  <Calendar className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900">No upcoming appointments</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                  When you book a service, it will appear here with date, time, and everything you need at a glance.
                </p>
                <Button
                  onClick={() => (window.location.href = "/explore")}
                  className="mt-6 w-full max-w-xs mx-auto h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:opacity-[0.97] hover:shadow-lg hover:shadow-orange-500/25 touch-manipulation sm:mt-8 sm:w-auto sm:max-w-none sm:px-8"
                >
                  Browse services
                </Button>
              </div>
            )}
          </SegmentTabsContent>

          <SegmentTabsContent value="previous">
            {filteredAppointments.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
                  {visibleAppointments.map((appointment) => {
                    const statusPresentation = getStatusPresentation(appointment, "previous");
                    const total = appointmentServicesTotal(appointment);
                    return (
                      <article key={appointment.id} className={cn(appointmentCardClassName, "appointment-card")}>
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-90"
                          aria-hidden
                        />
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl">
                              {new Date(appointment.appoinmentdate).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
                              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                                <Clock className="size-3.5 shrink-0" aria-hidden />
                              </span>
                              <span className="font-medium text-zinc-600">
                                {formatTime(appointment.fromtime)} – {formatTime(appointment.totime)}
                              </span>
                            </p>
                          </div>
                          <span className={cn("w-fit shrink-0 self-start sm:self-center", statusPresentation.className)}>
                            {statusPresentation.label}
                          </span>
                        </div>

                        <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold text-orange-600">
                          {appointment.organisationname}
                        </h3>
                        <p className="mb-4 flex items-start gap-2 text-sm leading-snug text-zinc-500">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden />
                          <span>{appointment.city || "No location specified"}</span>
                        </p>

                        {appointment.attributes?.servicelist && appointment.attributes.servicelist.length > 0 ? (
                          <div className="mb-4 min-h-0">
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Services</p>
                            <div className="space-y-2">
                              {appointment.attributes.servicelist.map((service, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-2.5 transition-colors hover:bg-zinc-50"
                                >
                                  <p className="min-w-0 flex-1 text-sm font-medium text-zinc-800 break-words leading-snug">
                                    {service.servicename}
                                  </p>
                                  <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                                    ₹{service.serviceprice}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {appointment.ispaid ? (
                          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/60">
                            <CheckCircle className="size-3.5 shrink-0 text-emerald-600" />
                            Paid
                          </div>
                        ) : null}

                        {total > 0 ? (
                          <div className="mt-auto border-t border-zinc-100 pt-5">
                            <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50/90 px-3.5 py-3 ring-1 ring-zinc-100/90">
                              <span className="text-sm font-medium text-zinc-600">Total</span>
                              <span className="text-lg font-semibold tabular-nums tracking-tight text-zinc-900">
                                ₹{total.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-grow" />
                        )}
                      </article>
                    );
                  })}
                </div>
                {visibleAppointments.length < filteredAppointments.length ? (
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-2xl text-sm"
                      onClick={() => setVisibleCount((n) => n + 40)}
                    >
                      Show more ({filteredAppointments.length - visibleAppointments.length} remaining)
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/90 via-white to-white px-4 py-10 text-center shadow-[0_2px_24px_-8px_rgba(15,23,42,0.08)] sm:rounded-[1.25rem] sm:px-8 sm:py-14">
                <div
                  className="pointer-events-none mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-sm ring-1 ring-zinc-200/80"
                  aria-hidden
                >
                  <Calendar className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900">No previous appointments</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                  Completed visits will land here so you can revisit providers and services you have already enjoyed.
                </p>
              </div>
            )}
          </SegmentTabsContent>
        </Tabs>

        {/* Filter Dialog */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold">Filter appointments</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Narrow the list by status. Date range filters can be added from here when needed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-11 mt-1.5 rounded-2xl border-gray-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => {
                    setSelectedStatus("ALL");
                    setDateRange({ start: null, end: null });
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-2xl border-gray-200"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => setShowFilterDialog(false)}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-md border-0 hover:opacity-95"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Appointment Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold">Cancel appointment</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                This action notifies the provider. Cancellations near the appointment time may incur a fee.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Details</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedAppointment.appoinmentdate).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    {formatTime(selectedAppointment.fromtime)} –{" "}
                    {formatTime(selectedAppointment.totime)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="cancel-reason" className="text-sm font-medium text-gray-700">
                    Reason
                  </Label>
                  <Input
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why are you cancelling?"
                    className="mt-1.5 h-11 rounded-2xl border-gray-200"
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <h4 className="font-medium text-amber-900 mb-2 text-sm">Policy</h4>
                  <ul className="text-xs text-amber-900/90 space-y-1.5 leading-relaxed">
                    <li>• Cancellations 24+ hours before are typically fully refundable.</li>
                    <li>• Within 24 hours, a fee may apply.</li>
                    <li>• No-shows may be charged the full amount.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    onClick={() => setShowCancelDialog(false)}
                    variant="outline"
                    className="flex-1 h-11 rounded-2xl border-gray-200"
                  >
                    Keep appointment
                  </Button>
                  <Button
                    onClick={handleCancelAppointment}
                    disabled={!cancelReason.trim()}
                    className="flex-1 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Cancel appointment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold">Payment</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Update how this appointment was paid (if enabled by your provider).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={selectedPaymentType === "Cash" ? "default" : "outline"}
                    onClick={() => setSelectedPaymentType("Cash")}
                    className={cn(
                      "flex-1 h-11 rounded-2xl",
                      selectedPaymentType === "Cash" &&
                        "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:opacity-95"
                    )}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPaymentType === "Card" ? "default" : "outline"}
                    onClick={() => setSelectedPaymentType("Card")}
                    className={cn(
                      "flex-1 h-11 rounded-2xl",
                      selectedPaymentType === "Card" &&
                        "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:opacity-95"
                    )}
                  >
                    Card
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="payment-amount" className="text-sm font-medium text-gray-700">
                  Amount
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 h-11 rounded-2xl border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="payment-name" className="text-sm font-medium text-gray-700">
                  Label (optional)
                </Label>
                <Input
                  id="payment-name"
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  placeholder="e.g. UPI, card last 4"
                  className="mt-1.5 h-11 rounded-2xl border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="payment-code" className="text-sm font-medium text-gray-700">
                  Reference / transaction ID
                </Label>
                <Input
                  id="payment-code"
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value)}
                  placeholder="Reference"
                  className="mt-1.5 h-11 rounded-2xl border-gray-200"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline"
                  className="flex-1 h-11 rounded-2xl border-gray-200"
                >
                  Close
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!paymentAmount.trim()}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold border-0 shadow-md hover:opacity-95"
                >
                  Save payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default UserAppointments;
