
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Phone,
  Calendar,
  UserPlus,
  CalendarPlus,
  MapPin,
  CalendarX,
  Loader2,
  ArrowLeft,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ClientServiceHistory from "@/components/organization/ClientServiceHistory";
import TodayAppointmentCard from "@/components/organization/TodayAppointmentCard";
import EnhancedTimeline from "@/components/organization/EnhancedTimeline";
import CreateClientDialog from "@/components/organization/CreateClientDialog";
import OnSpotRegistrationDialog from "@/components/organization/OnSpotRegistrationDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { AppoinmentService } from "@/services/appoinment.service";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import { EventBookingService } from "@/services/eventbooking.service";
import { EventService } from "@/services/event.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ClientInfoRes, ClientsSelectReq, SearchAppointmentByMobileReq, BookedAppoinmentRes, AppoinmentSelectReq } from "@/models/appoinment.model";
import { AppointmentRecord, AppointmentRecordSelectReq } from "@/models/appointmentrecord.model";
import { EventBooking, EventBookingSelectReq } from "@/models/eventbooking.model";
import { Event, EventSelectReq } from "@/models/event.model";
import { ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { decodeEventBookingNotes, encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { formatEventDateLong } from "@/utils/eventDate.util";
import {
  type EventBookingFormField,
  parseEventBookingFormFieldsFromNotes,
  sortEventBookingFormFieldsByDisplayOrder,
} from "@/utils/eventBookingFormFields.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { useIsMobile } from "@/hooks/use-mobile";

function clientInitials(name: string | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

const ClientManagement = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<ClientInfoRes[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientAppointments, setClientAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<AppointmentRecord[]>([]);
  const [clientEventBookings, setClientEventBookings] = useState<EventBooking[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<number, Event>>({});
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const [todayAppointment, setTodayAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOnSpotDialogOpen, setIsOnSpotDialogOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState("");
  type CrmTabId = "today" | "history" | "timeline" | "events";
  const [crmTab, setCrmTab] = useState<CrmTabId>("today");

  const filteredClients = useMemo(() => {
    const raw = mobileInput.trim().toLowerCase();
    if (!raw) return clients;
    const digits = raw.replace(/\D/g, "");
    return clients.filter((c) => {
      const mob = (c.mobile || "").replace(/\s/g, "").toLowerCase();
      const name = (c.username || "").toLowerCase();
      const mobDigits = mob.replace(/\D/g, "");
      const nameMatch = name.includes(raw);
      const mobMatch = digits.length > 0 ? mobDigits.includes(digits) : mob.includes(raw.replace(/\s/g, ""));
      return nameMatch || mobMatch;
    });
  }, [clients, mobileInput]);

  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [eventDetailsBooking, setEventDetailsBooking] = useState<EventBooking | null>(null);
  const [eventDetailsFields, setEventDetailsFields] = useState<EventBookingFormField[]>([]);
  const [eventDetailsValues, setEventDetailsValues] = useState<Record<string, any>>({});
  const [isSavingEventDetails, setIsSavingEventDetails] = useState(false);

  const loadClientsList = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingClients(true);
    try {
      const req = new ClientsSelectReq();

      // Get organisationlocationid from GlobalIdContext (set from dashboard)
      // Fallback to user locationid if not set in context
      const organisationlocationid = globalLocationId
        ? Number(globalLocationId)
        : (user?.locationid || 0);

      console.log('📥 Using location ID from GlobalIdContext:', organisationlocationid);

      req.organisationid = user?.organisationid || 0;
      req.organisationlocationid = organisationlocationid;
      req.mobilenumber = "";

      console.log('🔍 Loading clients with:', {
        organisationid: req.organisationid,
        organisationlocationid: req.organisationlocationid,
        userLocationId: user?.locationid
      });

      const appointmentClients = await appointmentService.SelectUniqueClients(req);
      const clientsMap = new Map<number, ClientInfoRes>();

      (appointmentClients || []).forEach((client) => {
        clientsMap.set(client.userid, client);
      });

      // Also include users who enrolled in events (even if no service appointments)
      try {
        const eventReq: EventSelectReq = {
          id: 0,
          organisation_id: user?.organisationid || 0,
          organisation_location_id: organisationlocationid,
          status: "",
          is_public: true
        };
        const events = await eventService.select(eventReq);

        for (const event of events || []) {
          const bookingReq: EventBookingSelectReq = {
            id: 0,
            event_id: event.id,
            user_id: 0,
            payment_status: "",
            check_in_status: "",
            confirmation_status: ""
          };
          const bookings = await eventBookingService.select(bookingReq);
          (bookings || []).forEach((booking) => {
            if (!booking.user_id || booking.user_id <= 0) return;

            const existingClient = clientsMap.get(booking.user_id);
            if (existingClient) {
              // Backfill missing name/mobile from event booking payload if needed
              if (!existingClient.username && booking.user_name) {
                existingClient.username = booking.user_name;
              }
              if (!existingClient.mobile && booking.user_mobile) {
                existingClient.mobile = booking.user_mobile;
              }
              clientsMap.set(booking.user_id, existingClient);
              return;
            }

            const eventClient = new ClientInfoRes();
            eventClient.userid = booking.user_id;
            eventClient.username = booking.user_name || `User #${booking.user_id}`;
            eventClient.mobile = booking.user_mobile || "";
            eventClient.city = "";
            clientsMap.set(eventClient.userid, eventClient);
          });
        }
      } catch (eventMergeError) {
        console.error('Error merging event-enrolled users into client list', eventMergeError);
      }

      setClients(Array.from(clientsMap.values()));
    } catch (error) {
      console.error('Error loading clients', error);
      toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [
    isAuthenticated,
    globalLocationId,
    user?.locationid,
    user?.organisationid,
    appointmentService,
    eventService,
    eventBookingService,
    toast
  ]);

  useEffect(() => {
    loadClientsList();
  }, [loadClientsList]);

  const loadEventBookingFormFields = useCallback(
    async (evt: Event | undefined | null): Promise<EventBookingFormField[]> => {
      if (!evt?.id || !evt.organisation_id) return [];
      try {
        const typeReq = new ReferenceTypeSelectReq();
        typeReq.identifier = "EVENTBOOKINGFORM";
        const types = (await referenceTypeService.select(typeReq)) || [];
        const type =
          types.find((t) => Number(t.organizationid) === Number(evt.organisation_id)) ?? types[0];
        if (!type?.id) return [];

        const valueReq = new ReferenceValueSelectReq();
        valueReq.referencetypeid = Number(type.id);
        valueReq.organisationid = Number(evt.organisation_id);
        valueReq.identifier = `EVENT_${evt.id}`;
        const values = (await referenceValueService.select(valueReq)) || [];
        const notes = values?.[0]?.notes || "";
        const fields = parseEventBookingFormFieldsFromNotes(notes);
        return sortEventBookingFormFieldsByDisplayOrder(fields);
      } catch (e) {
        console.error("Error loading event booking form fields:", e);
        return [];
      }
    },
    [referenceTypeService, referenceValueService],
  );

  const openEventDetailsEditor = useCallback(
    async (booking: EventBooking) => {
      const evt = eventsMap[booking.event_id];
      const fields = await loadEventBookingFormFields(evt);
      const decoded = decodeEventBookingNotes(booking.notes);
      const existingForm =
        decoded.payload?.form && typeof decoded.payload.form === "object" ? decoded.payload.form : {};
      setEventDetailsBooking(booking);
      setEventDetailsFields(fields);
      setEventDetailsValues(existingForm);
      setIsEventDetailsOpen(true);
    },
    [eventsMap, loadEventBookingFormFields],
  );

  const saveEventDetails = useCallback(async () => {
    if (!eventDetailsBooking) return;
    setIsSavingEventDetails(true);
    try {
      const decoded = decodeEventBookingNotes(eventDetailsBooking.notes);
      const attendees =
        decoded.payload?.attendees && Array.isArray(decoded.payload.attendees)
          ? decoded.payload.attendees
          : decoded.attendeesText
              ? decoded.attendeesText.split(",").map((s) => s.trim()).filter(Boolean)
              : [];

      const updated = { ...eventDetailsBooking };
      updated.notes = encodeEventBookingNotes(attendees, eventDetailsValues);

      const saved = await eventBookingService.update(updated);
      // update local list
      setClientEventBookings((prev) =>
        prev.map((b) => (b.id === saved.id ? saved : b)),
      );

      toast({
        title: "Saved",
        description: "Event booking details updated.",
      });
      setIsEventDetailsOpen(false);
      setEventDetailsBooking(null);
      setEventDetailsFields([]);
      setEventDetailsValues({});
    } catch (e) {
      console.error("Error saving event details:", e);
      toast({ title: "Error", description: "Failed to save details.", variant: "destructive" });
    } finally {
      setIsSavingEventDetails(false);
    }
  }, [eventBookingService, eventDetailsBooking, eventDetailsValues, toast]);

  const loadClientData = async (userId: number, organizationId: number) => {
    setIsLoadingClientData(true);
    try {
      // Load appointments by userid
      const appointmentReq = new AppoinmentSelectReq();
      appointmentReq.userid = userId;
      appointmentReq.organisationid = organizationId;
      const appointments = await appointmentService.SelectBookedAppoinment(appointmentReq);
      
      // Load appointment records by userid
      const recordReq = new AppointmentRecordSelectReq();
      recordReq.userid = userId;
      recordReq.organisationid = organizationId;
      const records = await appointmentRecordService.select(recordReq);

      // Load event bookings ONLY for events belonging to this organization
      const organisationlocationid = globalLocationId
        ? Number(globalLocationId)
        : (user?.locationid || 0);

      const orgEventsReq: EventSelectReq = {
        id: 0,
        organisation_id: organizationId,
        organisation_location_id: organisationlocationid,
        status: "",
        is_public: true,
      };
      const orgEvents = (await eventService.select(orgEventsReq)) || [];

      const nextEventsMap: Record<number, Event> = {};
      orgEvents.forEach((e) => {
        nextEventsMap[e.id] = e;
      });
      setEventsMap(nextEventsMap);

      const bookingsByEvent = await Promise.all(
        orgEvents.map(async (evt) => {
          const req: EventBookingSelectReq = {
            id: 0,
            event_id: evt.id,
            user_id: userId,
            payment_status: "",
            check_in_status: "",
            confirmation_status: "",
          };
          try {
            return (await eventBookingService.select(req)) || [];
          } catch (e) {
            console.error(`Error loading bookings for event ${evt.id}`, e);
            return [];
          }
        })
      );

      const normalizedEventBookings = bookingsByEvent.flat();
      setClientEventBookings(normalizedEventBookings);

      setClientAppointments(appointments || []);
      setAppointmentRecords(records || []);

      // Calculate stats
      const allAppointments = appointments || [];
      const totalAppointments = allAppointments.length;
      
      // Calculate total spent based on selected services' prices
      const totalSpent = allAppointments.reduce((sum, appt) => {
        const services = appt?.attributes?.servicelist || [];
        const servicesTotal = Array.isArray(services)
          ? services.reduce((s, svc) => s + (Number((svc as any)?.serviceprice) || 0), 0)
          : 0;
        return sum + servicesTotal;
      }, 0);
      
      // Get last visit date
      let lastVisit = new Date();
      if (allAppointments.length > 0) {
        const sortedDates = allAppointments
          .map(a => new Date(a.appoinmentdate))
          .sort((a, b) => b.getTime() - a.getTime());
        lastVisit = sortedDates[0];
      }

      // Find today's appointment
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAppt = allAppointments.find(apt => {
        const aptDate = new Date(apt.appoinmentdate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
      setTodayAppointment(todayAppt || null);

      return { totalAppointments, lastVisit, totalSpent };
    } catch (error) {
      console.error('Error loading client data', error);
      setClientAppointments([]);
      setAppointmentRecords([]);
      setClientEventBookings([]);
      setEventsMap({});
      setTodayAppointment(null);
      return { totalAppointments: 0, lastVisit: new Date(), totalSpent: 0 };
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const handleClientClick = async (client: ClientInfoRes) => {
    try {
      const stats = await loadClientData(
        Number(client.userid),
        user?.organisationid || 0
      );

      setSelectedClient({
        id: Number(client.userid),
        name: client.username || "",
        mobile: client.mobile || "",
        email: "",
        lastVisit: stats.lastVisit,
        totalAppointments: stats.totalAppointments,
        totalSpent: stats.totalSpent
      } as any);
    } catch (error) {
      console.error('Error loading client details', error);
      setSelectedClient({
        id: Number(client.userid),
        name: client.username || "",
        mobile: client.mobile || "",
        email: "",
        lastVisit: new Date(),
        totalAppointments: 0,
        totalSpent: 0
      } as any);
      setClientAppointments([]);
      setAppointmentRecords([]);
      setClientEventBookings([]);
      setEventsMap({});
      setTodayAppointment(null);
    }
  };

  const handleClientSearch = async (mobile: string) => {
    try {
      const req = new SearchAppointmentByMobileReq();
      req.organisationid = user?.organisationid || 0;
      req.mobilenumber = mobile;

      const results = await appointmentService.searchByMobile(req);

      if (results && results.length > 0) {
        const first = results[0] as BookedAppoinmentRes;
        const userId = first.userid;
        
        // Load all client data
        const stats = await loadClientData(userId, user?.organisationid || 0);

        setSelectedClient({
          id: Number(userId),
          name: first.username || "",
          mobile: first.mobile || mobile,
          email: "",
          lastVisit: stats.lastVisit,
          totalAppointments: stats.totalAppointments,
          totalSpent: stats.totalSpent
        } as any);

        toast({
          title: "Client Found",
          description: `${first.username || mobile} loaded with recent history.`,
        });
      } else {
        setSelectedClient(null);
        setClientAppointments([]);
        setAppointmentRecords([]);
        setClientEventBookings([]);
        setEventsMap({});
        setTodayAppointment(null);
        toast({
          title: "Client Not Found",
          description: "No client found with this mobile number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching client', error);
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    }
  };

  const handleClientCreated = () => {
    // Reload clients list after a new client is created
    loadClientsList();
  };


  const showListPanel = !isMobile || !selectedClient;
  const showDetailPanel = !isMobile || !!selectedClient;

  return (
    <div
      className={cn(
        org.page,
        "flex flex-col overflow-hidden",
        isMobile ? "h-[calc(100dvh-6rem)]" : "h-[calc(100dvh-1.5rem)]"
      )}
    >
      <div className={cn(org.pageSection, "flex min-h-0 flex-1 flex-col py-4 md:py-5")}>
        <div
          className={cn(
            org.card,
            "flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
          )}
        >
          {showListPanel ? (
            <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-stone-100 lg:w-[22rem] lg:border-r xl:w-96">
              <div className="border-b border-stone-100 p-4 sm:p-5">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = mobileInput.trim().replace(/\s+/g, "");
                    if (t) void handleClientSearch(t);
                  }}
                >
                  <div className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="Search name or mobile…"
                      className={cn(org.input, "h-11 pl-10")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className={cn(org.btnPrimary, "h-11 shrink-0 px-4")}
                    aria-label="Search by mobile"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </form>
                <p className="mt-2 text-xs text-stone-500">
                  Filter the list as you type, or search by exact mobile number.
                </p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-appointza-cream/40 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-appointza-navy">All customers</h2>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium tabular-nums text-stone-600 shadow-sm">
                      {isLoadingClients ? "…" : filteredClients.length}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsOnSpotDialogOpen(true)}
                    className={cn(org.btnPrimary, "h-9 text-xs")}
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    On-Spot Registration
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-sm text-stone-500">
                      <Loader2 className="h-4 w-4 animate-spin text-appointza-coral" />
                      Loading customers…
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="p-8 text-center text-sm text-stone-500">
                      No customers yet. Use On-Spot Registration to add one.
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-sm text-stone-500">
                      No customers match your search.
                    </div>
                  ) : (
                    <ul className="divide-y divide-stone-100">
                      {filteredClients.map((c) => {
                        const isSelected = selectedClient?.id === Number(c.userid);
                        return (
                          <li key={c.userid}>
                            <button
                              type="button"
                              onClick={() => void handleClientClick(c)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors sm:px-5",
                                isSelected ?
                                  "border-l-[3px] border-appointza-coral bg-[#FFF0EB] pl-[calc(1rem-3px)] sm:pl-[calc(1.25rem-3px)]"
                                : "border-l-[3px] border-transparent hover:bg-stone-50"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                                  isSelected ?
                                    "bg-gradient-coral text-white"
                                  : "bg-stone-100 text-stone-600"
                                )}
                                aria-hidden
                              >
                                {clientInitials(c.username)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-appointza-navy">
                                  {c.username || "Unknown"}
                                </p>
                                <p className="truncate text-sm text-stone-500">{c.mobile || "—"}</p>
                              </div>
                              {c.city ? (
                                <span className="hidden shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600 sm:inline">
                                  {c.city}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </aside>
          ) : null}

          {showDetailPanel ? (
            <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-appointza-cream/30">
              {selectedClient ? (
                <>
                  <div className="border-b border-stone-100 bg-white p-4 sm:p-6">
                    {isMobile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ml-2 mb-3 h-9 gap-1.5 px-2 text-stone-600 hover:text-appointza-navy"
                        onClick={() => setSelectedClient(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to list
                      </Button>
                    ) : null}
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-coral text-lg font-semibold text-white shadow-md shadow-[#FF6B6B]/20">
                          {clientInitials(selectedClient.name)}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold text-appointza-navy sm:text-2xl">
                            {selectedClient.name}
                          </h2>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-stone-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-appointza-coral" aria-hidden />
                              {selectedClient.mobile}
                            </span>
                            {(() => {
                              const loc = clients.find((x) => Number(x.userid) === selectedClient.id)?.city;
                              return loc ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-stone-400" aria-hidden />
                                  {loc}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(`/organization/clients/${selectedClient.id}/book`, {
                            state: { name: selectedClient.name, mobile: selectedClient.mobile },
                          })
                        }
                        className={cn(org.btnPrimary, "w-full shrink-0 lg:w-auto")}
                      >
                        <CalendarPlus className="h-4 w-4 shrink-0" />
                        On-Spot Booking
                      </Button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-stone-100 bg-appointza-cream/50 px-4 py-3">
                        <p className="text-xs font-medium text-stone-500">Total visits</p>
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-appointza-navy">
                          {selectedClient.totalAppointments}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-100 bg-appointza-cream/50 px-4 py-3">
                        <p className="text-xs font-medium text-stone-500">Last visit</p>
                        <p className="mt-0.5 text-lg font-semibold text-appointza-navy">
                          {format(selectedClient.lastVisit, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-2xl border border-stone-100 bg-appointza-cream/50 px-4 py-3 sm:col-span-1">
                        <p className="text-xs font-medium text-stone-500">Customer ID</p>
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-appointza-navy">
                          #{selectedClient.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-stone-100 bg-white">
                    <div className="-mb-px flex overflow-x-auto">
                      {(
                        [
                          { id: "today" as const, label: "Today" },
                          { id: "history" as const, label: "History" },
                          { id: "timeline" as const, label: "Timeline" },
                          { id: "events" as const, label: "Events" },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCrmTab(tab.id)}
                          className={cn(
                            "shrink-0 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-medium transition-colors sm:px-6",
                            crmTab === tab.id ?
                              "border-appointza-coral text-[#E85D4C]"
                            : "border-transparent text-stone-500 hover:text-stone-700"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {crmTab === "today" ?
                    <>
                      {isLoadingClientData ?
                        <div className={org.loading}>
                          <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
                        </div>
                      : todayAppointment ?
                        <TodayAppointmentCard
                          appointment={{
                            id: Number(todayAppointment.id || 0),
                            clientName: selectedClient?.name || todayAppointment.username || "",
                            service:
                              Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                              (todayAppointment as any).attributes.servicelist.length > 0
                                ? (todayAppointment as any).attributes.servicelist[0].servicename
                                : "Appointment",
                            time: String(todayAppointment.fromtime || ""),
                            duration:
                              Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                              (todayAppointment as any).attributes.servicelist.length > 0
                                ? (todayAppointment as any).attributes.servicelist.reduce(
                                    (sum: number, svc: any) => sum + (Number(svc.servicetimetaken) || 0),
                                    0
                                  )
                                : 0,
                            status: todayAppointment.statuscode || "",
                            staff: todayAppointment.staffname || "",
                            price:
                              Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                              (todayAppointment as any).attributes.servicelist.length > 0
                                ? (todayAppointment as any).attributes.servicelist.reduce(
                                    (sum: number, svc: any) => sum + (Number(svc.serviceprice) || 0),
                                    0
                                  )
                                : 0,
                          }}
                        />
                      : <div className={org.empty}>
                          <CalendarX className="mx-auto mb-3 h-12 w-12 text-stone-300" aria-hidden />
                          <p className="font-medium text-appointza-navy">No appointment today</p>
                          <p className="mt-1 text-stone-500">This customer has no booking scheduled for today.</p>
                        </div>
                      }
                    </>
                  : crmTab === "history" ?
                    <>
                      {isLoadingClientData ?
                        <div className={org.loading}>
                          <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
                        </div>
                      : <ClientServiceHistory appointments={clientAppointments} />}
                    </>
                  : crmTab === "timeline" ?
                    <>
                      {isLoadingClientData ?
                        <div className={org.loading}>
                          <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
                        </div>
                      : <EnhancedTimeline
                          appointments={clientAppointments}
                          appointmentRecords={appointmentRecords}
                          userId={selectedClient?.id || 0}
                          organizationId={user?.organisationid || 0}
                          onRecordAdded={async () => {
                            if (selectedClient?.id) {
                              await loadClientData(selectedClient.id, user?.organisationid || 0);
                            }
                          }}
                        />}
                    </>
                  : <>
                      {isLoadingClientData ?
                        <div className={org.loading}>
                          <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
                        </div>
                      : clientEventBookings.length === 0 ?
                        <div className={org.empty}>
                          <Calendar className="mx-auto mb-3 h-12 w-12 text-stone-300" aria-hidden />
                          <p className="font-medium text-appointza-navy">No event bookings</p>
                          <p className="mt-1 text-stone-500">This customer has not registered for any events yet.</p>
                        </div>
                      : <Card className={cn(org.card, "border-0 shadow-none")}>
                          <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Event booking history</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              All event registrations for this client
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {clientEventBookings.map((booking) => {
                                const event = eventsMap[booking.event_id];
                                const eventDate =
                                  event?.event_date ?
                                    formatEventDateLong(event.event_date)
                                  : "N/A";
                                const bookingDate =
                                  booking.created_at ?
                                    format(new Date(booking.created_at), "MMM d, yyyy")
                                  : "N/A";
                                const decoded = decodeEventBookingNotes(booking.notes);
                                const form =
                                  decoded.payload?.form && typeof decoded.payload.form === "object" ?
                                    decoded.payload.form
                                  : null;
                                const hasFormValues =
                                  !!form &&
                                  Object.keys(form).some((k) =>
                                    String((form as Record<string, unknown>)[k] ?? "").trim().length > 0
                                  );
                                return (
                                  <div
                                    key={booking.id}
                                    className="flex flex-col gap-3 rounded-xl border border-stone-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-medium sm:text-base">
                                        {event?.event_name || `Event #${booking.event_id}`}
                                      </div>
                                      <div className="text-xs text-muted-foreground sm:text-sm">
                                        Event date: {eventDate}
                                      </div>
                                      <div className="text-xs text-muted-foreground sm:text-sm">
                                        Booked on: {bookingDate}
                                      </div>
                                      {hasFormValues ?
                                        <div className="mt-2 space-y-1 text-xs sm:text-sm">
                                          <div className="text-muted-foreground">Form details:</div>
                                          <div className="grid gap-1">
                                            {Object.entries(form as Record<string, unknown>)
                                              .slice(0, 4)
                                              .map(([k, v]) => (
                                                <div key={k} className="flex gap-2">
                                                  <span className="font-medium">{k}:</span>
                                                  <span className="break-words text-muted-foreground">
                                                    {String(v)}
                                                  </span>
                                                </div>
                                              ))}
                                            {Object.keys(form as Record<string, unknown>).length > 4 ?
                                              <div className="text-muted-foreground">…</div>
                                            : null}
                                          </div>
                                        </div>
                                      : <div className="mt-2 text-xs text-muted-foreground">
                                          No form details added yet.
                                        </div>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        People: {booking.number_of_people}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Payment: {booking.payment_status || "pending"}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Status: {booking.check_in_status || "not_checked_in"}
                                      </Badge>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={hasFormValues ? "outline" : "default"}
                                        onClick={() => openEventDetailsEditor(booking)}
                                      >
                                        {hasFormValues ? "Edit details" : "Add details"}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      }
                    </>
                  }
                  </div>
                </>
              ) : (
                <div className={cn(org.empty, "m-4 flex min-h-0 flex-1 flex-col items-center justify-center sm:m-6")}>
                  <Users className="h-12 w-12 text-stone-300" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-appointza-navy">Select a customer</h3>
                  <p className="mt-2 max-w-sm text-center text-sm text-stone-500">
                    Pick someone from the list or search by mobile to view appointments, history, and events.
                  </p>
                </div>
              )}
            </main>
          ) : null}
        </div>
      </div>

      {/* Event booking details dialog */}
      <Dialog
        open={isEventDetailsOpen}
        onOpenChange={(open) => {
          setIsEventDetailsOpen(open);
          if (!open) {
            setEventDetailsBooking(null);
            setEventDetailsFields([]);
            setEventDetailsValues({});
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/25 px-4 py-3 text-left sm:px-6 sm:py-4">
            <DialogTitle className="text-lg sm:text-xl">Event booking details</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {eventDetailsBooking
                ? `Add / edit the form answers for Event #${eventDetailsBooking.event_id}.`
                : "Add / edit the form answers."}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {eventDetailsFields.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                No booking form fields are configured for this event. Configure fields in{" "}
                <span className="font-medium">Organization → Reference Values → EVENTBOOKINGFORM</span>.
              </div>
            ) : (
              <div className="space-y-4">
                {eventDetailsFields.map((f) => {
                  const value = eventDetailsValues[f.key] ?? "";
                  const type = (f.type || "string").toLowerCase();
                  return (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={`evdet-${f.key}`}>
                        {f.label || f.key}
                        {f.required ? " *" : ""}
                      </Label>
                      {type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <input
                            id={`evdet-${f.key}`}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) =>
                              setEventDetailsValues((prev) => ({ ...prev, [f.key]: e.target.checked }))
                            }
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-muted-foreground">
                            {Boolean(value) ? "Yes" : "No"}
                          </span>
                        </div>
                      ) : (
                        <Input
                          id={`evdet-${f.key}`}
                          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                          value={value}
                          onChange={(e) =>
                            setEventDetailsValues((prev) => ({
                              ...prev,
                              [f.key]:
                                type === "number"
                                  ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                  : e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 border-t bg-background px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEventDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveEventDetails}
              disabled={!eventDetailsBooking || isSavingEventDetails}
              className={cn(org.btnPrimary, "w-full sm:w-auto")}
            >
              {isSavingEventDetails ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onClientCreated={handleClientCreated}
      />

      {/* On-Spot Registration Dialog - create user & book inline, no URL */}
      <OnSpotRegistrationDialog
        open={isOnSpotDialogOpen}
        onOpenChange={setIsOnSpotDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default ClientManagement;
