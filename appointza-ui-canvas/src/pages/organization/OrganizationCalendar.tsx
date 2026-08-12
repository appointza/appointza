import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarDays,
  Clock,
  LayoutGrid,
  Loader2,
  RefreshCw,
  User,
  BedDouble,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { AppoinmentService } from "@/services/appoinment.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import {
  AppoinmentFinal,
  AppoinmentSelectReq,
  BookedAppoinmentRes,
} from "@/models/appoinment.model";
import {
  CalendarDayOverview,
  CalendarOverviewReq,
  OrganisationServiceTimingSelectReq,
} from "@/models/organisationservicetiming.model";
import { OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import OrganizationCalendarBoardView from "@/pages/organization/OrganizationCalendarBoardView";
import OrganizationCalendarRoomsView from "@/pages/organization/OrganizationCalendarRoomsView";
import { hospitalityService } from "@/services/hospitality.service";
import { normalizeOrganisationRoom, OrganisationRoom } from "@/models/hospitality.model";
import type { OrganisationType } from "@/models/organisation.model";
import { getRoomAvailabilityState } from "@/utils/roomAmenities.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import {
  formatAppointmentTime,
  getAppointmentDayNumber,
  parseAppointmentDate,
  parseDotNetTimeSpanToMilliseconds,
  sendAppointmentDateToApi,
  toDateKey,
} from "@/utils/appointmentTime.util";
import { Link } from "react-router-dom";

type TimingSlot = AppoinmentFinal & {
  statuscode?: string;
  notes?: string;
};

type CalendarViewMode = "split" | "board";
type CalendarKind = "services" | "rooms";

const OrganizationCalendar = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const organizationId = user?.organisationid || 0;

  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const timingService = useMemo(() => new OrganisationServiceTimingService(), []);
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("split");
  const [calendarKind, setCalendarKind] = useState<CalendarKind>("services");
  const [organisationType, setOrganisationType] = useState<OrganisationType>("service");
  const [rooms, setRooms] = useState<OrganisationRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [appointments, setAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimingSlot[]>([]);
  const [monthOverview, setMonthOverview] = useState<CalendarDayOverview[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>("");

  const organisationLocationId = globalLocationId
    ? Number(globalLocationId)
    : user?.locationid || 0;

  const showRoomsCalendar =
    organisationType === "hospitality" || organisationType === "both";

  const loadOrganisationType = useCallback(async () => {
    if (!organizationId) return;
    try {
      const profile = await hospitalityService.getProfile(organizationId);
      setOrganisationType(profile.organisation_type ?? "service");
    } catch {
      setOrganisationType("service");
    }
  }, [organizationId]);

  const fetchRooms = useCallback(async () => {
    if (!organizationId || !organisationLocationId) {
      setRooms([]);
      return;
    }
    setIsLoadingRooms(true);
    try {
      const items = await hospitalityService.selectRooms({
        organisation_id: organizationId,
        organisation_location_id: organisationLocationId,
      });
      setRooms(items.map((item) => normalizeOrganisationRoom(item)));
    } catch (error) {
      console.error("Error loading rooms for calendar", error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [organizationId, organisationLocationId, toast]);

  const initializeLocation = useCallback(async () => {
    if (!isAuthenticated || globalLocationId || !organizationId) return;
    try {
      const req = new OrganisationLocationSelectReq();
      req.organisationid = organizationId;
      const locations = await locationService.select(req);
      if (locations?.length) {
        setGlobalLocationId(locations[0].id);
      }
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, globalLocationId, organizationId, locationService, setGlobalLocationId]);

  const loadLocationLabel = useCallback(async () => {
    if (!organisationLocationId) {
      setLocationLabel("");
      return;
    }
    try {
      const req = new OrganisationLocationSelectReq();
      req.organisationlocationid = organisationLocationId;
      const locations = await locationService.select(req);
      const loc = locations?.[0];
      setLocationLabel(
        loc
          ? loc.name?.trim() || [loc.city, loc.state].filter(Boolean).join(", ") || `Location #${loc.id}`
          : "",
      );
    } catch {
      setLocationLabel("");
    }
  }, [organisationLocationId, locationService]);

  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return;
    setIsLoadingAppointments(true);
    try {
      const req = new AppoinmentSelectReq();
      req.organisationid = organizationId;
      req.organisationlocationid = organisationLocationId || 0;
      const response = await appointmentService.SelectBookedAppoinment(req);
      setAppointments(response || []);
    } catch (error) {
      console.error("Error loading appointments for calendar", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [
    isAuthenticated,
    organizationId,
    organisationLocationId,
    appointmentService,
    toast,
  ]);

  const fetchSlotsForDate = useCallback(
    async (date: Date) => {
      if (!organizationId || !organisationLocationId) {
        setTimeSlots([]);
        return;
      }
      setIsLoadingSlots(true);
      try {
        const req = new OrganisationServiceTimingSelectReq();
        req.organisationid = organizationId;
        req.organisationlocationid = organisationLocationId;
        req.day_of_week = getAppointmentDayNumber(date);
        req.appointmentdate = sendAppointmentDateToApi(date);
        const response = await timingService.selecttimingslot(req);
        setTimeSlots((response as TimingSlot[]) || []);
      } catch (error) {
        console.error("Error loading time slots", error);
        toast({
          title: "Error",
          description: "Failed to load time slots for this date",
          variant: "destructive",
        });
        setTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [organizationId, organisationLocationId, timingService, toast],
  );

  const fetchMonthOverview = useCallback(async () => {
    if (!organizationId || !organisationLocationId) {
      setMonthOverview([]);
      return;
    }
    setIsLoadingOverview(true);
    try {
      const req = new CalendarOverviewReq();
      req.organisationid = organizationId;
      req.organisationlocationid = organisationLocationId;
      req.year = calendarMonth.getFullYear();
      req.month = calendarMonth.getMonth() + 1;
      const response = await timingService.selectCalendarOverview(req);
      setMonthOverview(response?.days ?? []);
    } catch (error) {
      console.error("Error loading calendar overview", error);
      toast({
        title: "Error",
        description: "Failed to load month calendar",
        variant: "destructive",
      });
      setMonthOverview([]);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [
    organizationId,
    organisationLocationId,
    calendarMonth,
    timingService,
    toast,
  ]);

  useEffect(() => {
    void loadOrganisationType();
  }, [loadOrganisationType]);

  useEffect(() => {
    void initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    void loadLocationLabel();
  }, [loadLocationLabel]);

  useEffect(() => {
    if (calendarKind === "rooms" && showRoomsCalendar) {
      void fetchRooms();
    }
  }, [calendarKind, showRoomsCalendar, fetchRooms]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (viewMode === "split") {
      void fetchSlotsForDate(selectedDate);
    }
  }, [selectedDate, fetchSlotsForDate, viewMode]);

  useEffect(() => {
    if (viewMode === "board" && organisationLocationId) {
      void fetchMonthOverview();
    }
  }, [viewMode, fetchMonthOverview, organisationLocationId]);

  const handleCalendarKindChange = (kind: CalendarKind) => {
    setCalendarKind(kind);
    if (kind === "rooms") {
      setViewMode("split");
    }
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "board") {
      setCalendarMonth(selectedDate);
    }
  };

  const handleBoardMonthChange = (month: Date) => {
    setCalendarMonth(month);
  };

  const handleBoardSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (!isSameMonthSafe(date, calendarMonth)) {
      setCalendarMonth(date);
    }
  };

  function isSameMonthSafe(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookedAppoinmentRes[]>();
    for (const apt of appointments) {
      const d = parseAppointmentDate(apt.appoinmentdate);
      if (!d) continue;
      const key = toDateKey(d);
      const list = map.get(key) ?? [];
      list.push(apt);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const bookingCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    bookingsByDate.forEach((list, key) => counts.set(key, list.length));
    return counts;
  }, [bookingsByDate]);

  const selectedDayBookings = useMemo(() => {
    const key = toDateKey(selectedDate);
    const list = bookingsByDate.get(key) ?? [];
    return [...list].sort((a, b) => {
      const ta = parseDotNetTimeSpanToMilliseconds(a.fromtime) ?? 0;
      const tb = parseDotNetTimeSpanToMilliseconds(b.fromtime) ?? 0;
      return ta - tb;
    });
  }, [selectedDate, bookingsByDate]);

  const availableSlots = useMemo(
    () => timeSlots.filter((s) => s.statuscode === "Available"),
    [timeSlots],
  );
  const bookedSlots = useMemo(
    () => timeSlots.filter((s) => s.statuscode === "Booked"),
    [timeSlots],
  );

  const roomOccupancyByDay = useMemo(() => {
    const counts = new Map<string, number>();
    if (!rooms.length) return counts;

    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const key = toDateKey(date);
      const busy = rooms.filter((room) => {
        const state = getRoomAvailabilityState(room, date);
        return state !== "Available";
      }).length;
      if (busy > 0) counts.set(key, busy);
    }
    return counts;
  }, [rooms, calendarMonth]);

  const selectedDayRoomStats = useMemo(() => {
    let available = 0;
    let occupied = 0;
    for (const room of rooms) {
      const state = getRoomAvailabilityState(room, selectedDate);
      if (state === "Available") available += 1;
      else occupied += 1;
    }
    return { available, occupied };
  }, [rooms, selectedDate]);

  const refreshAll = () => {
    if (calendarKind === "rooms") {
      void fetchRooms();
      return;
    }
    void fetchAppointments();
    if (viewMode === "split") {
      void fetchSlotsForDate(selectedDate);
    } else {
      void fetchMonthOverview();
    }
  };

  const isRefreshing =
    calendarKind === "rooms" ?
      isLoadingRooms
    : isLoadingAppointments ||
      (viewMode === "split" ? isLoadingSlots : isLoadingOverview);

  return (
    <OrganizationPageShell
      className="min-w-0"
      title="Calendar"
      description={
        calendarKind === "rooms" ?
          "See room availability by date for the selected business location."
        : "See bookings by date and which time slots are available or fully booked."
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {showRoomsCalendar ?
            <div className={cn(org.segmentGroup, "shrink-0")}>
              <button
                type="button"
                onClick={() => handleCalendarKindChange("services")}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                  calendarKind === "services" ? org.segmentActive : org.segmentInactive,
                )}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Services</span>
              </button>
              <button
                type="button"
                onClick={() => handleCalendarKindChange("rooms")}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                  calendarKind === "rooms" ? org.segmentActive : org.segmentInactive,
                )}
              >
                <BedDouble className="h-4 w-4" />
                <span className="hidden sm:inline">Rooms</span>
              </button>
            </div>
          : null}
          {calendarKind === "services" ?
            <div className={cn(org.segmentGroup, "shrink-0")}>
            <button
              type="button"
              onClick={() => handleViewModeChange("split")}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                viewMode === "split" ? org.segmentActive : org.segmentInactive,
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Split view</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("board")}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                viewMode === "board" ? org.segmentActive : org.segmentInactive,
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar view</span>
            </button>
          </div>
          : null}
          <Button
            type="button"
            variant="outline"
            onClick={refreshAll}
            disabled={isRefreshing}
            className={cn(org.btnOutline, "min-h-10")}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      }
    >
      {!organisationLocationId ? (
        <div className={cn(org.pageSection, "pt-0")}>
        <div className={cn(org.card, "p-6 text-sm text-stone-600")}>
          <p className="font-medium text-appointza-navy">Select a location first</p>
          <p className="mt-1">
            Choose a location on the{" "}
            <Link to="/organization/dashboard" className="font-medium text-[#E85D4C] hover:underline">
              dashboard
            </Link>{" "}
            to view the calendar and slots for that branch.
          </p>
        </div>
        </div>
      ) : calendarKind === "rooms" ? (
        <div className={cn(org.pageSection, "pt-2 pb-8")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-8">
          <div className={cn(org.card, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center gap-2 text-sm text-stone-600">
              <BedDouble className="h-4 w-4 text-[#E85D4C]" />
              <span>
                {locationLabel ?
                  <>
                    <span className="font-medium text-appointza-navy">{locationLabel}</span>
                    <span className="text-stone-400"> · </span>
                  </>
                : null}
                {format(calendarMonth, "MMMM yyyy")}
              </span>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="rounded-xl border border-stone-100 p-2 pointer-events-auto"
              modifiers={{
                hasRoomActivity: (date) => (roomOccupancyByDay.get(toDateKey(date)) ?? 0) > 0,
              }}
              modifiersClassNames={{
                hasRoomActivity:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-orange-500",
              }}
            />
            <p className="mt-3 text-xs text-stone-500">
              Orange dot = at least one room occupied, reserved, or unavailable that day.
            </p>
          </div>

          <OrganizationCalendarRoomsView
            selectedDate={selectedDate}
            locationLabel={locationLabel}
            rooms={rooms}
            isLoading={isLoadingRooms}
            availableCount={selectedDayRoomStats.available}
            occupiedCount={selectedDayRoomStats.occupied}
          />
        </div>
        </div>
      ) : viewMode === "board" ? (
        <div className={cn(org.pageSection, "pt-2 pb-8")}>
          <OrganizationCalendarBoardView
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            locationLabel={locationLabel}
            monthDays={monthOverview}
            isLoading={isLoadingOverview}
            onMonthChange={handleBoardMonthChange}
            onSelectDate={handleBoardSelectDate}
          />
        </div>
      ) : (
        <div className={cn(org.pageSection, "pt-2 pb-8")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-8">
          <div className={cn(org.card, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center gap-2 text-sm text-stone-600">
              <CalendarIcon className="h-4 w-4 text-[#E85D4C]" />
              <span>
                {locationLabel ? (
                  <>
                    <span className="font-medium text-appointza-navy">{locationLabel}</span>
                    <span className="text-stone-400"> · </span>
                  </>
                ) : null}
                {format(calendarMonth, "MMMM yyyy")}
              </span>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="rounded-xl border border-stone-100 p-2 pointer-events-auto"
              modifiers={{
                hasBookings: (date) => (bookingCountByDay.get(toDateKey(date)) ?? 0) > 0,
              }}
              modifiersClassNames={{
                hasBookings:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#E85D4C]",
              }}
            />
            <p className="mt-3 text-xs text-stone-500">
              Dot = day has bookings. Select a date to view slots and customers.
            </p>
          </div>

          <div className="space-y-6 min-w-0">
            <div className={cn(org.card, "p-4 sm:p-5")}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-appointza-navy">
                  {format(selectedDate, "EEEE, d MMMM yyyy")}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-emerald-50 text-emerald-700 border-transparent">
                    {availableSlots.length} available
                  </Badge>
                  <Badge className="bg-[#FFF0EB] text-[#E85D4C] border-transparent">
                    {bookedSlots.length} booked slots
                  </Badge>
                  <Badge variant="outline" className="text-stone-600">
                    {selectedDayBookings.length} booking
                    {selectedDayBookings.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-appointza-navy">
                  <Clock className="h-4 w-4 text-[#E85D4C]" />
                  Time slots
                </h3>
                {isLoadingSlots ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
                    Loading slots…
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-500">
                    No slots configured for this day. Set business hours under Settings → Business
                    hours.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {timeSlots.map((slot, index) => {
                      const isAvailable = slot.statuscode === "Available";
                      return (
                        <div
                          key={`${String(slot.fromtime)}-${index}`}
                          className={cn(
                            "rounded-2xl border px-3 py-2.5 text-center text-sm transition-colors",
                            isAvailable
                              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                              : "border-stone-200 bg-stone-100 text-stone-600",
                          )}
                        >
                          <div className="font-semibold tabular-nums">
                            {formatAppointmentTime(slot.fromtime)}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium">
                            {isAvailable ? "Available" : "Booked"}
                          </div>
                          {slot.notes ? (
                            <div className="mt-0.5 text-[10px] text-stone-500 line-clamp-2">
                              {slot.notes}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-appointza-navy">
                  <User className="h-4 w-4 text-[#E85D4C]" />
                  Who booked this day
                </h3>
                {isLoadingAppointments ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
                    Loading bookings…
                  </div>
                ) : selectedDayBookings.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">
                    No customer bookings on this date.
                  </p>
                ) : (
                  <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-100 overflow-hidden">
                    {selectedDayBookings.map((apt) => (
                      <li
                        key={apt.id}
                        className="flex flex-col gap-1 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-appointza-navy truncate">
                            {apt.username || "Customer"}
                          </p>
                          {apt.mobile ? (
                            <p className="text-xs text-stone-500">{apt.mobile}</p>
                          ) : null}
                          {apt.attributes?.servicelist?.length ? (
                            <p className="mt-1 text-xs text-stone-600 line-clamp-2">
                              {apt.attributes.servicelist
                                .map((s) => s.servicename)
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
                          <span className="tabular-nums font-medium text-stone-700">
                            {formatAppointmentTime(apt.fromtime)}
                            {apt.totime ? (
                              <> – {formatAppointmentTime(apt.totime)}</>
                            ) : null}
                          </span>
                          {apt.statuscode ? (
                            <Badge variant="outline" className="capitalize text-xs">
                              {apt.statuscode}
                            </Badge>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Slot availability uses the same rules as your public booking page (capacity, events,
              and leave).
            </p>
          </div>
        </div>
        </div>
      )}
    </OrganizationPageShell>
  );
};

export default OrganizationCalendar;
