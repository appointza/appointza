import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  BedDouble,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { getServiceEffectivePriceForDate } from "@/utils/servicePricing.util";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { EventService } from "@/services/event.service";
import { EventBookingService } from "@/services/eventbooking.service";
import { FilesService } from "@/services/files.service";
import {
  OrganisationServices,
  OrganisationServicesSelectReq,
} from "@/models/organisationservices.model";
import { OrganisationServiceTimingSelectReq, Weeks } from "@/models/organisationservicetiming.model";
import { Event, EventSelectReq } from "@/models/event.model";
import { EventBooking } from "@/models/eventbooking.model";
import { AppoinmentFinal, SelectedSerivice } from "@/models/appoinment.model";
import { encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { hospitalityService } from "@/services/hospitality.service";
import type { OrganisationType } from "@/models/organisation.model";
import { ClientHospitalityBookingPanel } from "@/components/organization/ClientHospitalityBookingPanel";

const ClientBookAppointment = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();

  const organisationId = user?.organisationid || 0;
  const organisationLocationId = globalLocationId
    ? Number(globalLocationId)
    : user?.locationid || 0;

  const clientUserId = clientId ? parseInt(clientId) : 0;
  const clientInfo = (location.state as any) || {};
  const clientName = clientInfo.name || "Client";
  const clientMobile = clientInfo.mobile || "";

  const organisationServicesService = useMemo(
    () => new OrganisationServicesService(),
    []
  );
  const organisationServiceTimingService = useMemo(
    () => new OrganisationServiceTimingService(),
    []
  );
  const eventService = useMemo(() => new EventService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  };

  type BookingType = "service" | "event" | "stay";
  const [bookingType, setBookingType] = useState<BookingType>("service");
  const [organisationType, setOrganisationType] = useState<OrganisationType>("service");

  const showHospitalityBooking =
    organisationType === "hospitality" || organisationType === "both";

  // Service booking state
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [timeSlots, setTimeSlots] = useState<AppoinmentFinal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AppoinmentFinal | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedSerivice[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBookingService, setIsBookingService] = useState(false);

  // Event booking state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isBookingEvent, setIsBookingEvent] = useState(false);

  useEffect(() => {
    if (!clientUserId) {
      toast({
        title: "Error",
        description: "Client ID is missing",
        variant: "destructive",
      });
      navigate("/organization/clients");
      return;
    }
  }, [clientUserId, navigate, toast]);

  useEffect(() => {
    if (organisationId === 0) return;
    void hospitalityService.getProfile(organisationId).then((profile) => {
      setOrganisationType(profile.organisation_type ?? "service");
    });
  }, [organisationId]);

  const loadServices = useCallback(async () => {
    if (organisationId === 0) return;
    setIsLoadingServices(true);
    try {
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      req.id = 0;
      const response = await organisationServicesService.select(req);
      const active = (response || []).filter((s) => s.isactive);
      setServices(active);
    } catch (error) {
      console.error("Error loading services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [organisationId, organisationLocationId, organisationServicesService, toast]);

  const loadTimeSlots = useCallback(async () => {
    if (organisationId === 0 || organisationLocationId === 0) return;
    setIsLoadingSlots(true);
    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      const dayNumber = Weeks[dayName as keyof typeof Weeks];
      req.day_of_week = dayNumber;
      req.appointmentdate = sendToApi(selectedDate);
      const response = await organisationServiceTimingService.selecttimingslot(req);
      setTimeSlots(response || []);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [
    organisationId,
    organisationLocationId,
    selectedDate,
    organisationServiceTimingService,
    toast,
  ]);

  const loadEvents = useCallback(async () => {
    if (organisationId === 0) return;
    setIsLoadingEvents(true);
    try {
      const req: EventSelectReq = {
        id: 0,
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        status: "active",
        is_public: true,
      };
      const response = await eventService.select(req);
      const publicEvents = (response || []).filter((e) => e.is_public === true);
      setEvents(publicEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [organisationId, organisationLocationId, eventService, toast]);

  useEffect(() => {
    if (bookingType === "service") {
      loadServices();
    } else {
      loadEvents();
    }
  }, [bookingType, loadServices, loadEvents]);

  useEffect(() => {
    if (selectedEvent && numberOfPeople > 0) {
      setAttendeeNames((prev) =>
        Array(numberOfPeople)
          .fill("")
          .map((_, i) => prev[i] || "")
      );
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (bookingType === "service") {
      loadTimeSlots();
    }
  }, [bookingType, selectedDate, loadTimeSlots]);

  const handleServiceToggle = (service: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = service.id;
    item.servicename = service.Servicename || service.servicename || "";
    item.serviceprice = getServiceEffectivePriceForDate(service, selectedDate).effectivePrice;
    item.servicetimetaken = service.timetaken || 0;
    item.iscombo = service.Iscombo || false;

    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  };

  const handleBookService = async () => {
    if (selectedServices.length === 0 || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select at least one service and a time slot",
        variant: "destructive",
      });
      return;
    }

    setIsBookingService(true);
    try {
      const appointment = new AppoinmentFinal();
      appointment.userid = clientUserId;
      appointment.organisationlocationid = organisationLocationId;
      appointment.organizationid = organisationId;
      appointment.appoinmentdate = sendToApi(selectedDate);
      appointment.fromtime = selectedTimeSlot.fromtime;
      appointment.totime = selectedTimeSlot.totime;
      appointment.attributes = { servicelist: selectedServices };
      // Bypass payment - org admin booking on behalf of client (payment collected in person or separately)
      appointment.ispaid = true;

      const response = await organisationServiceTimingService.Bookappoinment(appointment);

      if (
        response === "Successfully booked." ||
        response === "Successfully booked"
      ) {
        toast({
          title: "Appointment Booked",
          description: `Appointment created for ${clientName}`,
        });
        navigate("/organization/clients", {
          state: { selectedClientId: clientUserId },
        });
      } else {
        toast({
          title: "Booking Error",
          description: response || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error booking:", error);
      toast({
        title: "Booking Failed",
        description: error?.response?.data?.message || error?.message || "Failed to book",
        variant: "destructive",
      });
    } finally {
      setIsBookingService(false);
    }
  };

  const handleNumberOfPeopleChange = (newCount: number) => {
    setNumberOfPeople(newCount);
    setAttendeeNames((prev) => {
      if (newCount > 1) {
        return Array(newCount)
          .fill("")
          .map((_, i) => prev[i] || "");
      }
      return [""];
    });
  };

  const handleAttendeeNameChange = (index: number, value: string) => {
    setAttendeeNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleBookEvent = async () => {
    if (!selectedEvent) {
      toast({
        title: "Missing Information",
        description: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvent.remainingslot < numberOfPeople) {
      toast({
        title: "Not enough slots",
        description: `Only ${selectedEvent.remainingslot} slot(s) available`,
        variant: "destructive",
      });
      return;
    }

    if (numberOfPeople >= 1) {
      const validNames = attendeeNames.filter((n) => n.trim().length > 0);
      if (validNames.length !== numberOfPeople) {
        toast({
          title: "Validation Error",
          description: `Please enter names for all ${numberOfPeople} attendee(s)`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsBookingEvent(true);
    try {
      const booking = new EventBooking();
      booking.event_id = selectedEvent.id;
      booking.user_id = clientUserId;
      booking.number_of_people = numberOfPeople;
      const totalAmount =
        (selectedEvent.entry_amount || 0) * numberOfPeople;
      if (totalAmount > 0) {
        booking.total_amount = totalAmount;
      }
      if (numberOfPeople >= 1) {
        booking.notes = encodeEventBookingNotes(
          attendeeNames.filter((n) => n.trim().length > 0),
          {}
        );
      }

      await eventBookingService.insert(booking);

      toast({
        title: "Event Booked",
        description: `Booked ${numberOfPeople} slot(s) for ${clientName}`,
      });
      navigate("/organization/clients", {
        state: { selectedClientId: clientUserId },
      });
    } catch (error: any) {
      console.error("Error booking event:", error);
      toast({
        title: "Booking Failed",
        description: error?.response?.data?.message || error?.message || "Failed to book event",
        variant: "destructive",
      });
    } finally {
      setIsBookingEvent(false);
    }
  };

  return (
    <div
      className={cn(
        org.pageSection,
        "w-full max-w-none space-y-6 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 md:pb-8 md:pt-5",
      )}
    >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/organization/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Book for Client</h1>
            <p className="text-muted-foreground">
              Book a service, event, or stay for this client
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{clientName}</span>
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{clientMobile}</span>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={bookingType}
          onValueChange={(v) => setBookingType(v as BookingType)}
        >
          <TabsList
            className={cn(
              "grid w-full h-auto",
              showHospitalityBooking ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            <TabsTrigger value="service" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              Service
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4 shrink-0" />
              Event
            </TabsTrigger>
            {showHospitalityBooking ? (
              <TabsTrigger value="stay" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <BedDouble className="h-4 w-4 shrink-0" />
                Room / Package
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="service" className="space-y-6 mt-6">
            {isLoadingServices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No services available
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Select Services</CardTitle>
                    <CardDescription>Choose one or more services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {services.map((s) => {
                        const isSelected = selectedServices.some((x) => x.id === s.id);
                        const imageId = s.attributes?.ImageIds?.find((id) => (id ?? 0) > 0) ?? 0;
                        const imageUrl = imageId ? filesService.getImageUrl(imageId) : "";
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleServiceToggle(s)}
                            className={cn(
                              "flex items-center justify-between gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={s.Servicename || s.servicename}
                                className="h-14 w-14 rounded-lg object-cover border shrink-0"
                                loading="lazy"
                              />
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{s.Servicename || s.servicename}</p>
                              <p className="text-sm text-muted-foreground">
                                {s.timetaken} min · ₹{s.offerprize > 0 ? s.offerprize : s.prize}
                              </p>
                            </div>
                            {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                    <CardDescription>Choose appointment date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => d && setSelectedDate(d)}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Select Time</CardTitle>
                    <CardDescription>Choose available time slot</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSlots ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No slots available for this date
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => {
                          const isSelected =
                            selectedTimeSlot?.fromtime === slot.fromtime;
                          return (
                            <Button
                              key={slot.fromtime}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTimeSlot(slot)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {slot.fromtime?.slice(0, 5)}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleBookService}
                  disabled={
                    selectedServices.length === 0 ||
                    !selectedTimeSlot ||
                    isBookingService
                  }
                  className="w-full"
                >
                  {isBookingService ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Create Appointment
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="event" className="space-y-6 mt-6">
            {isLoadingEvents ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No events available
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Select Event</CardTitle>
                    <CardDescription>Choose an event to book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {events.map((e) => {
                        const isSelected = selectedEvent?.id === e.id;
                        return (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            className={cn(
                              "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div>
                              <p className="font-medium">{e.event_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {e.remainingslot} slots ·{" "}
                                {e.entry_amount > 0 ? `₹${e.entry_amount}/person` : "Free"}
                              </p>
                            </div>
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {selectedEvent && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Number of People</CardTitle>
                        <CardDescription>
                          Max {selectedEvent.remainingslot} slots available
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleNumberOfPeopleChange(Math.max(1, numberOfPeople - 1))
                            }
                            disabled={numberOfPeople <= 1}
                          >
                            -
                          </Button>
                          <span className="text-xl font-semibold w-8 text-center">
                            {numberOfPeople}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleNumberOfPeopleChange(
                                Math.min(selectedEvent.remainingslot, numberOfPeople + 1)
                              )
                            }
                            disabled={numberOfPeople >= selectedEvent.remainingslot}
                          >
                            +
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Attendee Names</CardTitle>
                        <CardDescription>
                          Please enter names for all {numberOfPeople} attendee(s)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {attendeeNames.map((name, index) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`attendee-${index}`}>
                              Person {index + 1} Name *
                            </Label>
                            <Input
                              id={`attendee-${index}`}
                              type="text"
                              placeholder={`Enter name for person ${index + 1}`}
                              value={name}
                              onChange={(e) =>
                                handleAttendeeNameChange(index, e.target.value)
                              }
                              disabled={isBookingEvent}
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}

                <Button
                  onClick={handleBookEvent}
                  disabled={
                    !selectedEvent ||
                    isBookingEvent ||
                    (numberOfPeople >= 1 &&
                      attendeeNames.filter((n) => n.trim().length > 0).length !==
                        numberOfPeople)
                  }
                  className="w-full"
                >
                  {isBookingEvent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Book Event
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {showHospitalityBooking ? (
            <TabsContent value="stay" className="space-y-6 mt-6">
              <ClientHospitalityBookingPanel
                organisationId={organisationId}
                organisationLocationId={organisationLocationId}
                clientName={clientName}
                clientMobile={clientMobile}
                onSuccess={() =>
                  navigate("/organization/clients", {
                    state: { selectedClientId: clientUserId },
                  })
                }
              />
            </TabsContent>
          ) : null}
        </Tabs>
    </div>
  );
};

export default ClientBookAppointment;
