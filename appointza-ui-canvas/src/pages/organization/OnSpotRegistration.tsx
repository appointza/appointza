import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  CheckCircle2, 
  Calendar, 
  CalendarDays, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import { UsersService } from "@/services/users.service";
import { UsersRegisterReq, UsersLoginReq, UsersGetOtpReq, UsersContext } from "@/models/users.model";
import OtpInput from "@/components/auth/OtpInput";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationServices, OrganisationServicesSelectReq } from "@/models/organisationservices.model";
import { EventService } from "@/services/event.service";
import { Event, EventSelectReq } from "@/models/event.model";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { AppoinmentFinal } from "@/models/appoinment.model";
import { format } from "date-fns";

const OnSpotRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const usersService = useMemo(() => new UsersService(), []);
  const organisationServicesService = useMemo(() => new OrganisationServicesService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const organisationServiceTimingService = useMemo(() => new OrganisationServiceTimingService(), []);

  // Registration states
  const [step, setStep] = useState<"form" | "otp" | "booking">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [createdUser, setCreatedUser] = useState<UsersContext | null>(null);

  // Booking states
  const [bookingType, setBookingType] = useState<"service" | "event">("service");
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedService, setSelectedService] = useState<OrganisationServices | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isBooking, setIsBooking] = useState(false);

  const organisationId = user?.organisationid || 0;
  const organisationLocationId = globalLocationId ? Number(globalLocationId) : (user?.locationid || 0);

  // Load services and events when booking step is reached
  useEffect(() => {
    if (step === "booking" && createdUser) {
      console.log("🔍 Loading services and events:", {
        organisationId,
        organisationLocationId,
        step,
        hasCreatedUser: !!createdUser
      });
      
      if (organisationId === 0) {
        toast({
          title: "Error",
          description: "Organization ID is missing. Please ensure you're logged in as an organization user.",
          variant: "destructive",
        });
        return;
      }
      
      if (organisationLocationId === 0) {
        toast({
          title: "Warning",
          description: "Location ID is missing. Services and events may not load correctly.",
          variant: "default",
        });
      }
      
      loadServices();
      loadEvents();
    }
  }, [step, createdUser, organisationId, organisationLocationId]);

  const loadServices = async () => {
    if (organisationId === 0) {
      console.warn("⚠️ Cannot load services: organisationId is 0");
      return;
    }
    
    try {
      console.log("🔍 Loading services with:", {
        organisationid: organisationId
      });
      
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      req.id = 0; // Get all services
      
      const response = await organisationServicesService.select(req);
      console.log("✅ Services loaded (raw):", response);
      
      // Filter only active services
      const activeServices = (response || []).filter(service => service.isactive === true);
      console.log("✅ Active services:", activeServices);
      
      if (activeServices.length > 0) {
        setServices(activeServices);
        console.log(`✅ Set ${activeServices.length} active service(s)`);
      } else {
        setServices([]);
        console.warn("⚠️ No active services found");
        toast({
          title: "No Services",
          description: "No active services found. Please add services in the Services section first.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("❌ Error loading services:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load services";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setServices([]);
    }
  };

  const loadEvents = async () => {
    if (organisationId === 0) {
      console.warn("⚠️ Cannot load events: organisationId is 0");
      return;
    }
    
    try {
      console.log("🔍 Loading events with:", {
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        status: "active",
        is_public: true
      });
      
      const req: EventSelectReq = {
        id: 0,
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        status: "active",
        is_public: true
      };
      
      const response = await eventService.select(req);
      console.log("✅ Events loaded:", response);
      
      const publicEvents = (response || []).filter(e => e.is_public === true);
      
      if (publicEvents.length > 0) {
        setEvents(publicEvents);
        toast({
          title: "Events Loaded",
          description: `Found ${publicEvents.length} event(s)`,
        });
      } else {
        setEvents([]);
        toast({
          title: "No Events",
          description: "No active events found for this location. You may need to add events first.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("❌ Error loading events:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load events";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setEvents([]);
    }
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
      console.error("Error creating user:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create user";
      toast({
        title: "Error",
        description: errorMessage,
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
      
      if (loginResp && loginResp.userid && loginResp.userid > 0) {
        setCreatedUser(loginResp);
        toast({
          title: "Client Created Successfully",
          description: `${formData.name} has been verified and can now book`,
        });
        setStep("booking");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "OTP verification failed";
      toast({
        title: "Verification Failed",
        description: errorMessage,
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
      toast({
        title: "OTP Resent",
        description: `We've sent a new verification code to ${formData.mobile}`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to resend OTP";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !createdUser) {
      toast({
        title: "Missing Information",
        description: "Please select a service",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      // Navigate to booking page with the created user context
      const bookingUrl = `/book-appointment/${organisationId}/${organisationLocationId}?userId=${createdUser.userid}&userMobile=${formData.mobile}`;
      window.location.href = bookingUrl;
    } catch (error) {
      console.error("Error navigating to booking:", error);
      toast({
        title: "Error",
        description: "Failed to open booking page",
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

    setIsBooking(true);
    try {
      // Navigate to event booking page
      const bookingUrl = `/user/events/${selectedEvent.id}/book?userId=${createdUser.userid}&userMobile=${formData.mobile}`;
      window.location.href = bookingUrl;
    } catch (error) {
      console.error("Error navigating to event booking:", error);
      toast({
        title: "Error",
        description: "Failed to open event booking page",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("form");
      setOtp("");
    } else if (step === "booking") {
      setStep("otp");
    } else {
      navigate("/organization/clients");
    }
  };

  const handleNewRegistration = () => {
    setFormData({ name: "", mobile: "", email: "" });
    setOtp("");
    setCreatedUser(null);
    setSelectedService(null);
    setSelectedEvent(null);
    setStep("form");
  };

  return (
    <OrganizationLayout>
      <OrganizationPageShell
        title="On-Spot Registration"
        description="Create client and book appointment immediately"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className={cn(org.btnOutline, "w-full sm:w-auto")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      >
        <div className="org-page-section">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
              {/* Left column — keeps page from feeling empty on desktop */}
              <div className="hidden lg:flex flex-col justify-start pt-2">
                <div className="rounded-3xl border border-stone-100 bg-white/70 p-6 shadow-[0_1px_12px_-6px_rgba(26,31,44,0.06)]">
                  <h2 className="text-base font-semibold text-appointza-navy">
                    Quick walk-in flow
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    <li>1) Create client</li>
                    <li>2) Verify OTP</li>
                    <li>3) Book service or event</li>
                  </ul>
                  <p className="mt-4 text-xs text-stone-500">
                    This is a UI helper only—no data changes.
                  </p>
                </div>
              </div>

              {/* Right column — main form card */}
              <div className="space-y-6">

        {/* Registration Form Step */}
        {step === "form" && (
          <Card className="org-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Client Registration
              </CardTitle>
              <CardDescription>
                Enter client details to create a new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter client's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({ ...formData, mobile: value });
                  }}
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={handleCreateUser} 
                disabled={loading}
                className={cn(org.btnPrimary, "h-11 w-full")}
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
            </CardContent>
          </Card>
        )}

        {/* OTP Verification Step */}
        {step === "otp" && (
          <Card className="org-card">
            <CardHeader>
              <CardTitle>Verify Mobile Number</CardTitle>
              <CardDescription>
                Enter the 6-digit verification code sent to {formData.mobile}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <OtpInput
                  onComplete={(otpValue) => {
                    setOtp(otpValue);
                    handleVerifyOtp(otpValue);
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-[#E85D4C] hover:underline"
                  disabled={loading}
                >
                  Change Mobile Number
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#E85D4C] hover:underline"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
              <Button
                onClick={() => handleVerifyOtp()}
                disabled={loading || !otp || otp.length !== 6}
                className={cn(org.btnPrimary, "h-11 w-full")}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Booking Step */}
        {step === "booking" && createdUser && (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="org-card border-emerald-100 bg-emerald-50/60">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-appointza-navy">
                      {formData.name} has been successfully registered!
                    </p>
                    <p className="text-sm text-emerald-700">
                      Mobile: {formData.mobile} | User ID: {createdUser.userid}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Options */}
            <Card className="org-card">
              <CardHeader>
                <CardTitle>Book Appointment or Event</CardTitle>
                <CardDescription>
                  Select a service or event to book for {formData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={bookingType} onValueChange={(v) => setBookingType(v as "service" | "event")}>
                  <TabsList className={cn(org.segmentGroup, "grid w-full grid-cols-2")}>
                    <TabsTrigger value="service" className={cn("flex items-center justify-center gap-2", bookingType === "service" ? org.segmentActive : org.segmentInactive)}>
                      <Calendar className="h-4 w-4" />
                      Book Service
                    </TabsTrigger>
                    <TabsTrigger value="event" className={cn("flex items-center justify-center gap-2", bookingType === "event" ? org.segmentActive : org.segmentInactive)}>
                      <CalendarDays className="h-4 w-4" />
                      Book Event
                    </TabsTrigger>
                  </TabsList>

                  {/* Service Booking */}
                  <TabsContent value="service" className="space-y-4 mt-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      Organization ID: {organisationId} | Location ID: {organisationLocationId}
                    </div>
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground space-y-2">
                        <p>No services available</p>
                        {organisationId === 0 && (
                          <p className="text-xs text-red-600">Organization ID is missing</p>
                        )}
                        {organisationLocationId === 0 && (
                          <p className="text-xs text-red-600">Location ID is missing</p>
                        )}
                        <p className="text-xs">Please add services in the Services section first.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedService?.id === service.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedService(service)}
                          >
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="font-semibold">{service.Servicename || service.servicename || 'Service'}</p>
                                 <p className="text-sm text-muted-foreground">
                                   Duration: {service.timetaken || 0} min | 
                                   Price: ₹{service.prize || service.offerprize || 0}
                                 </p>
                               </div>
                              {selectedService?.id === service.id && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={handleBookAppointment}
                      disabled={!selectedService || isBooking}
                      className="w-full"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening Booking...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Appointment
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* Event Booking */}
                  <TabsContent value="event" className="space-y-4 mt-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      Organization ID: {organisationId} | Location ID: {organisationLocationId}
                    </div>
                    {events.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground space-y-2">
                        <p>No events available</p>
                        {organisationId === 0 && (
                          <p className="text-xs text-red-600">Organization ID is missing</p>
                        )}
                        {organisationLocationId === 0 && (
                          <p className="text-xs text-red-600">Location ID is missing</p>
                        )}
                        <p className="text-xs">Please add events in the Events section first.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedEvent?.id === event.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{event.event_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {event.remainingslot} slots available
                                  {event.entry_amount > 0 && ` | ₹${event.entry_amount} per person`}
                                </p>
                              </div>
                              {selectedEvent?.id === event.id && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={handleBookEvent}
                      disabled={!selectedEvent || isBooking}
                      className="w-full"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening Booking...
                        </>
                      ) : (
                        <>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Book Event
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleNewRegistration} className="flex-1">
                    Register Another Client
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/organization/clients")} className="flex-1">
                    Back to Clients
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
              </div>
            </div>
          </div>
        </div>
      </OrganizationPageShell>
    </OrganizationLayout>
  );
};

export default OnSpotRegistration;
