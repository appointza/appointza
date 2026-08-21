import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  UserPlus,
  CheckCircle2,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import {
  UsersRegisterReq,
  UsersLoginReq,
  UsersGetOtpReq,
  UsersContext,
} from "@/models/users.model";
import OtpInput from "@/components/auth/OtpInput";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { EventService } from "@/services/event.service";
import { EventBookingService } from "@/services/eventbooking.service";
import {
  OrganisationServices,
  OrganisationServicesSelectReq,
} from "@/models/organisationservices.model";
import {
  OrganisationServiceTimingSelectReq,
  Weeks,
} from "@/models/organisationservicetiming.model";
import { Event, EventSelectReq } from "@/models/event.model";
import { EventBooking } from "@/models/eventbooking.model";
import { encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import {
  AppoinmentFinal,
  SelectedSerivice,
} from "@/models/appoinment.model";

interface OnSpotRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void;
}

const OnSpotRegistrationDialog = ({
  open,
  onOpenChange,
  onClientCreated,
}: OnSpotRegistrationDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();

  const organisationId = user?.organisationid || 0;
  const organisationLocationId = globalLocationId
    ? Number(globalLocationId)
    : user?.locationid || 0;

  const usersService = useMemo(() => new UsersService(), []);
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

  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  };

  const [step, setStep] = useState<"form" | "otp" | "booking">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [createdUser, setCreatedUser] = useState<UsersContext | null>(null);

  const [bookingType, setBookingType] = useState<"service" | "event">("service");
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedService, setSelectedService] =
    useState<OrganisationServices | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<AppoinmentFinal[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<AppoinmentFinal | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedSerivice[]>(
    []
  );
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [isBooking, setIsBooking] = useState(false);

  const loadServices = useCallback(async () => {
    if (organisationId === 0) return;
    try {
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      req.id = 0;
      const response = await organisationServicesService.select(req);
      setServices((response || []).filter((s) => s.isactive));
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    }
  }, [organisationId, organisationLocationId, organisationServicesService]);

  const loadTimeSlots = useCallback(async () => {
    if (organisationId === 0 || organisationLocationId === 0) return;
    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      const dayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayNumber = Weeks[dayName as keyof typeof Weeks];
      req.day_of_week = dayNumber;
      req.appointmentdate = sendToApi(selectedDate);
      const response =
        await organisationServiceTimingService.selecttimingslot(req);
      setTimeSlots(response || []);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error("Error loading time slots:", error);
      setTimeSlots([]);
    }
  }, [
    organisationId,
    organisationLocationId,
    selectedDate,
    organisationServiceTimingService,
  ]);

  const loadEvents = useCallback(async () => {
    if (organisationId === 0) return;
    try {
      const req: EventSelectReq = {
        id: 0,
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        status: "active",
        is_public: true,
      };
      const response = await eventService.select(req);
      setEvents((response || []).filter((e) => e.is_public === true));
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    }
  }, [organisationId, organisationLocationId, eventService]);

  useEffect(() => {
    if (open && step === "booking" && createdUser) {
      loadServices();
      loadEvents();
    }
  }, [open, step, createdUser, loadServices, loadEvents]);

  useEffect(() => {
    if (step === "booking" && bookingType === "service") {
      loadTimeSlots();
    }
  }, [step, bookingType, selectedDate, loadTimeSlots]);

  useEffect(() => {
    if (selectedEvent) {
      setAttendeeNames((prev) =>
        Array(numberOfPeople)
          .fill("")
          .map((_, i) => prev[i] || "")
      );
    }
  }, [selectedEvent?.id]);

  const handleNumberOfPeopleChange = (newCount: number) => {
    setNumberOfPeople(newCount);
    setAttendeeNames((prev) =>
      newCount > 1
        ? Array(newCount)
            .fill("")
            .map((_, i) => prev[i] || "")
        : [""]
    );
  };

  const handleAttendeeNameChange = (index: number, value: string) => {
    setAttendeeNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleServiceToggle = (service: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = service.id;
    item.servicename = service.Servicename || service.servicename || "";
    item.serviceprice =
      service.offerprize > 0 ? service.offerprize : service.prize || 0;
    item.servicetimetaken = service.timetaken || 0;
    item.iscombo = service.Iscombo || false;
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the client's name",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.mobile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter mobile number",
        variant: "destructive",
      });
      return false;
    }
    if (formData.mobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const registerReq = new UsersRegisterReq();
      registerReq.username = formData.name.trim();
      registerReq.usermobile = formData.mobile.trim();
      registerReq.useremail = formData.email.trim() || "";
      registerReq.usermobilecountrycode = "+91";
      registerReq.organisationid = 0;
      registerReq.organisationname = "";
      registerReq.primarytype = 0;
      registerReq.secondarytype = 0;
      registerReq.latitude = 0;
      registerReq.longitude = 0;
      const response = await usersService.register(registerReq);
      if (response) {
        toast({
          title: "OTP Sent",
          description: `We've sent a verification code to ${formData.mobile}`,
        });
        setStep("otp");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || error?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const currentOtp = otpValue || otp;
    if (!currentOtp || currentOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const loginReq = new UsersLoginReq();
      loginReq.mobile = formData.mobile;
      loginReq.otp = currentOtp;
      const loginResp = await usersService.login(loginReq);
      if (loginResp?.userid && loginResp.userid > 0) {
        setCreatedUser(loginResp);
        toast({
          title: "Client Created Successfully",
          description: `${formData.name} has been verified and can now book`,
        });
        setStep("booking");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description:
          error?.response?.data?.message || error?.message || "OTP verification failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const getOtpReq = new UsersGetOtpReq();
      getOtpReq.mobile = formData.mobile;
      await usersService.getotp(getOtpReq);
      toast({ title: "OTP Resent", description: `Sent to ${formData.mobile}` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async () => {
    if (selectedServices.length === 0 || !selectedTimeSlot || !createdUser) {
      toast({
        title: "Missing Information",
        description: "Please select at least one service and a time slot",
        variant: "destructive",
      });
      return;
    }
    setIsBooking(true);
    try {
      const appointment = new AppoinmentFinal();
      appointment.userid = createdUser.userid;
      appointment.organisationlocationid = organisationLocationId;
      appointment.organizationid = organisationId;
      appointment.appoinmentdate = sendToApi(selectedDate);
      appointment.fromtime = selectedTimeSlot.fromtime;
      appointment.totime = selectedTimeSlot.totime;
      appointment.attributes = { servicelist: selectedServices };
      appointment.ispaid = true;
      const response =
        await organisationServiceTimingService.Bookappoinment(appointment);
      if (
        response === "Successfully booked." ||
        response === "Successfully booked"
      ) {
        toast({
          title: "Appointment Booked",
          description: `Appointment created for ${formData.name}`,
        });
        onClientCreated?.();
        handleNewRegistration();
      } else {
        toast({
          title: "Booking Error",
          description: response || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description:
          error?.response?.data?.message || error?.message || "Failed to book",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookEvent = async () => {
    if (!selectedEvent || !createdUser) {
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
    setIsBooking(true);
    try {
      const booking = new EventBooking();
      booking.event_id = selectedEvent.id;
      booking.user_id = createdUser.userid;
      booking.number_of_people = numberOfPeople;
      if ((selectedEvent.entry_amount || 0) * numberOfPeople > 0) {
        booking.total_amount =
          (selectedEvent.entry_amount || 0) * numberOfPeople;
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
        description: `Booked ${numberOfPeople} slot(s) for ${formData.name}`,
      });
      onClientCreated?.();
      handleNewRegistration();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to book event",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleNewRegistration = () => {
    setFormData({ name: "", mobile: "", email: "" });
    setOtp("");
    setCreatedUser(null);
    setSelectedService(null);
    setSelectedEvent(null);
    setSelectedTimeSlot(null);
    setSelectedServices([]);
    setNumberOfPeople(1);
    setAttendeeNames([""]);
    setStep("form");
  };

  const handleClose = () => {
    handleNewRegistration();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            On-Spot Registration
          </DialogTitle>
          <DialogDescription>
            Create client and book appointment immediately. No URL navigation.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Enter client's full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                maxLength={10}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleCreateUser}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Create User & Send OTP"
              )}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter code sent to {formData.mobile}
            </p>
            <OtpInput
              onComplete={(v) => {
                setOtp(v);
                handleVerifyOtp(v);
              }}
            />
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-blue-600 hover:underline"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
            <Button
              onClick={() => handleVerifyOtp()}
              disabled={loading || !otp || otp.length !== 6}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify & Continue
            </Button>
          </div>
        )}

        {step === "booking" && createdUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">
                {formData.name} registered! Book below.
              </span>
            </div>

            <Tabs
              value={bookingType}
              onValueChange={(v) => setBookingType(v as "service" | "event")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="service">Book Service</TabsTrigger>
                <TabsTrigger value="event">Book Event</TabsTrigger>
              </TabsList>

              <TabsContent value="service" className="space-y-4 mt-4">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No services available
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {services.map((s) => {
                        const sel = selectedServices.some((x) => x.id === s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleServiceToggle(s)}
                            className={cn(
                              "p-3 border rounded cursor-pointer",
                              sel ? "border-primary bg-primary/5" : ""
                            )}
                          >
                            {s.Servicename || s.servicename} · ₹
                            {s.offerprize > 0 ? s.offerprize : s.prize}
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full">
                            {format(selectedDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            disabled={(d) =>
                              d < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Slot</Label>
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.fromtime}
                            size="sm"
                            variant={
                              selectedTimeSlot?.fromtime === slot.fromtime
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setSelectedTimeSlot(slot)}
                          >
                            {slot.fromtime?.slice(0, 5)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleBookService}
                      disabled={
                        selectedServices.length === 0 ||
                        !selectedTimeSlot ||
                        isBooking
                      }
                      className="w-full"
                    >
                      {isBooking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Appointment
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="event" className="space-y-4 mt-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No events available
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {events.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={cn(
                            "p-3 border rounded cursor-pointer",
                            selectedEvent?.id === e.id
                              ? "border-primary bg-primary/5"
                              : ""
                          )}
                        >
                          {e.event_name} · {e.remainingslot} slots
                        </div>
                      ))}
                    </div>
                    {selectedEvent && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label>People:</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleNumberOfPeopleChange(
                                Math.max(1, numberOfPeople - 1)
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">
                            {numberOfPeople}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleNumberOfPeopleChange(
                                Math.min(
                                  selectedEvent.remainingslot,
                                  numberOfPeople + 1
                                )
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Attendee Names *</Label>
                          {attendeeNames.map((name, i) => (
                            <Input
                              key={i}
                              placeholder={`Person ${i + 1} name`}
                              value={name}
                              onChange={(e) =>
                                handleAttendeeNameChange(i, e.target.value)
                              }
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <Button
                      onClick={handleBookEvent}
                      disabled={
                        !selectedEvent ||
                        isBooking ||
                        (numberOfPeople >= 1 &&
                          attendeeNames.filter((n) => n.trim()).length !==
                            numberOfPeople)
                      }
                      className="w-full"
                    >
                      {isBooking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Book Event
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleNewRegistration}
                className="flex-1"
              >
                Register Another Client
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnSpotRegistrationDialog;
