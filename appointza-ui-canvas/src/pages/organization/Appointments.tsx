import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarDays, Search, Eye, Loader2, RefreshCw, FileText, X, LayoutList, LayoutGrid, BedDouble } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import UserAppointmentDetails from "@/components/organization/UserAppointmentDetails";
import { Appoinment, BookedAppoinmentRes, AppoinmentSelectReq, UpdateStatusReq, UpdatePaymentReq, AddStaffReq } from "@/models/appoinment.model";
import { AppoinmentService } from "@/services/appoinment.service";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { StaffService } from "@/services/staff.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationLocationSelectReq, OrganisationLocation } from "@/models/organisationlocation.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { useNavigate } from "react-router-dom";
import { StaffSelectReq, StaffUser } from "@/models/staff.model";
import { ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { REFERENCETYPE } from "@/models/users.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { sortReferenceValuesByDisplayOrder } from "@/utils/referencevalue.util";
import { cn } from "@/lib/utils";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { org } from "@/lib/orgTheme";
import RoomBookingDetailsDialog from "@/components/organization/RoomBookingDetailsDialog";
import { hospitalityService } from "@/services/hospitality.service";
import { normalizeOrganisationRoom, OrganisationRoom, statusClassName, statusLabel } from "@/models/hospitality.model";
import type { OrganisationType } from "@/models/organisation.model";
import {
  getRoomBookingStartDate,
  roomBookingLabel,
  roomGuestName,
  roomGuestPhone,
  roomHasActiveBooking,
  roomIsPaid,
  roomMatchesSearch,
} from "@/utils/roomBooking.util";


const OrganizationAppointments = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const navigate = useNavigate();
  const organizationId = user?.organisationid || 1;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointmentTab, setAppointmentTab] = useState<"upcoming" | "past">("upcoming");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [appointments, setAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [pastAppointments, setPastAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [roomBookings, setRoomBookings] = useState<OrganisationRoom[]>([]);
  const [upcomingRoomBookings, setUpcomingRoomBookings] = useState<OrganisationRoom[]>([]);
  const [pastRoomBookings, setPastRoomBookings] = useState<OrganisationRoom[]>([]);
  const [organisationType, setOrganisationType] = useState<OrganisationType>("service");
  const [selectedRoomBooking, setSelectedRoomBooking] = useState<OrganisationRoom | null>(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);

  // API services
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const staffService = useMemo(() => new StaffService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);

  const showRoomBookings =
    organisationType === "hospitality" ||
    organisationType === "both" ||
    roomBookings.length > 0;

  const splitRoomBookings = useCallback((rooms: OrganisationRoom[]) => {
    const active = rooms.filter(roomHasActiveBooking);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = active.filter((room) => {
      const start = getRoomBookingStartDate(room);
      if (!start) return true;
      start.setHours(0, 0, 0, 0);
      return start >= now;
    });

    const past = active.filter((room) => {
      const start = getRoomBookingStartDate(room);
      if (!start) return false;
      start.setHours(0, 0, 0, 0);
      return start < now;
    });

    return { upcoming, past, active };
  }, []);

  const fetchRoomBookings = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return;

    const organisationlocationid = globalLocationId
      ? Number(globalLocationId)
      : (user?.locationid || 0);

    try {
      const profile = await hospitalityService.getProfile(organizationId);
      setOrganisationType(profile.organisation_type ?? "service");

      if (!organisationlocationid) {
        setRoomBookings([]);
        setUpcomingRoomBookings([]);
        setPastRoomBookings([]);
        return;
      }

      const rooms = await hospitalityService.selectRooms({
        organisation_id: organizationId,
        organisation_location_id: organisationlocationid,
      });
      const normalized = (rooms || []).map((room) => normalizeOrganisationRoom(room));
      const split = splitRoomBookings(normalized);
      setRoomBookings(split.active);
      setUpcomingRoomBookings(split.upcoming);
      setPastRoomBookings(split.past);
    } catch (error) {
      console.error("❌ Error fetching room bookings:", error);
      setRoomBookings([]);
      setUpcomingRoomBookings([]);
      setPastRoomBookings([]);
    }
  }, [
    isAuthenticated,
    organizationId,
    globalLocationId,
    user?.locationid,
    splitRoomBookings,
  ]);

  // Additional state for business functionality
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [appointmentStatusList, setAppointmentStatusList] = useState<ReferenceValue[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('Cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentName, setPaymentName] = useState<string>('');
  const [paymentCode, setPaymentCode] = useState<string>('');

  // Load locations and initialize location ID if not set
  const initializeLocation = useCallback(async () => {
    if (!isAuthenticated || globalLocationId) return; // Skip if location already set
    
    try {
      const req = new OrganisationLocationSelectReq();
      
      if (user?.organisationid && user.organisationid > 0) {
        req.organisationid = user.organisationid;
      } else if (user?.locationid && user.locationid > 0) {
        req.organisationlocationid = user.locationid;
      } else {
        return; // No organization or location
      }
      
      const response = await organisationLocationService.select(req);
      
      if (response && response.length > 0) {
        // Set first location in GlobalIdContext if not already set
        setGlobalLocationId(response[0].id);
        console.log('✅ Auto-initialized location ID:', response[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading locations for initialization:', error);
    }
  }, [isAuthenticated, globalLocationId, user, organisationLocationService, setGlobalLocationId]);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping appointment fetch');
      return;
    }
    
    // Get location ID from GlobalIdContext (stored from dashboard)
    const organisationlocationid = globalLocationId 
      ? Number(globalLocationId) 
      : (user?.locationid || 0);
    
    console.log('🔍 Location ID check:', {
      globalLocationId,
      userLocationId: user?.locationid,
      finalLocationId: organisationlocationid
    });
    
    // If no location ID, still try to fetch (API might return all appointments for organization)
    // But show a warning
    if (!organisationlocationid) {
      console.log('⚠️ No location ID available, fetching appointments for organization only');
      toast({
        title: "No Location Selected",
        description: "Please select a location in the dashboard to filter appointments.",
        variant: "default"
      });
    }
    
    setIsLoading(true);
    try {
      console.log('🔍 Fetching appointments for organization:', organizationId, 'location:', organisationlocationid);
      const req = new AppoinmentSelectReq();
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid || 0; // Allow 0 to fetch all
      
      const response = await appointmentService.SelectBookedAppoinment(req);
      console.log('✅ Appointments API response:', response);
      console.log('📊 Response details:', {
        isArray: Array.isArray(response),
        length: response?.length,
        firstItem: response?.[0]
      });
      
      const appointmentsList = response || [];
      setAppointments(appointmentsList);
      
      if (appointmentsList.length === 0) {
        console.log('⚠️ No appointments found for location:', organisationlocationid);
      }
      
      // Separate appointments into upcoming and previous
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of today
      
      const upcoming = response?.filter(appointment => {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= now;
      }) || [];
      
      const previous = response?.filter(appointment => {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate < now;
      }) || [];

      setUpcomingAppointments(upcoming);
      setPastAppointments(previous);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, organizationId, globalLocationId, user?.locationid, appointmentService, toast]);

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return;
    
    // Get location ID from GlobalIdContext
    const organisationlocationid = globalLocationId 
      ? Number(globalLocationId) 
      : (user?.locationid || 0);
    
    if (!organisationlocationid) return;
    
    try {
      const req = new StaffSelectReq();
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid;
      
      const response = await staffService.SelectStaffDetail(req);
      setStaffList(response || []);
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
    }
  }, [isAuthenticated, organizationId, globalLocationId, user?.locationid, staffService]);

  // Fetch status reference types
  const fetchStatusReferenceTypes = useCallback(async () => {
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = REFERENCETYPE.APPOINTMENTSTATUS;
      req.organisationid = organizationId; // Include organization ID
      
      const response = await referenceValueService.select(req);
      setAppointmentStatusList(sortReferenceValuesByDisplayOrder(response || []));
    } catch (error) {
      console.error('❌ Error fetching status types:', error);
    }
  }, [referenceValueService, organizationId]);

  // Initialize location on component mount if not set
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
    fetchStaffList();
    fetchStatusReferenceTypes();
    fetchRoomBookings();
  }, [fetchAppointments, fetchStaffList, fetchStatusReferenceTypes, fetchRoomBookings]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAppointments();
      await fetchRoomBookings();
      await fetchStatusReferenceTypes(); // Also refresh reference values
    } catch (error) {
      console.error('❌ Error refreshing appointments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDate(undefined);
    setStatusFilter(null);
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset.",
    });
  };

  // Handle status change
  const handleStatusChange = async (appointmentId: number, status: string) => {
    // Get location ID from GlobalIdContext
    const organisationlocationid = globalLocationId 
      ? Number(globalLocationId) 
      : (user?.locationid || 0);
    
    if (!organisationlocationid) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const req = new UpdateStatusReq();
      req.appoinmentid = appointmentId;
      req.statuscode = status;
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid;
      
      await appointmentService.UpdateStatus(req);
      
      // Refresh appointments
      await fetchAppointments();
      
      toast({
        title: "Appointment Status Updated",
        description: `Appointment status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    }
  };

  // Assign staff to appointment
  const handleAssignStaff = async (staffId: number, staffName: string) => {
    if (!selectedAppointmentId) return;
    
    // Get location ID from GlobalIdContext
    const organisationlocationid = globalLocationId 
      ? Number(globalLocationId) 
      : (user?.locationid || 0);
    
    if (!organisationlocationid) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const req = new AddStaffReq();
      req.appoinmentid = selectedAppointmentId;
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid;
      req.staffid = staffId;
      req.staffname = staffName;
      
      await appointmentService.Assignstaff(req);
      
      // Refresh appointments
      await fetchAppointments();
      
      setShowStaffDialog(false);
      setSelectedAppointmentId(null);
      
      toast({
        title: "Staff Assigned",
        description: `Staff ${staffName} has been assigned to the appointment.`,
      });
    } catch (error) {
      console.error('❌ Error assigning staff:', error);
      toast({
        title: "Error",
        description: "Failed to assign staff",
        variant: "destructive"
      });
    }
  };

  // Update payment
  const handleUpdatePayment = async () => {
    if (!selectedAppointmentId) return;
    
    // Get location ID from GlobalIdContext
    const organisationlocationid = globalLocationId 
      ? Number(globalLocationId) 
      : (user?.locationid || 0);
    
    if (!organisationlocationid) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const req = new UpdatePaymentReq();
      req.appoinmentid = selectedAppointmentId;
      req.paymenttype = selectedPaymentType;
      req.paymenttypeid = selectedPaymentType === 'Cash' ? 1 : 
                         selectedPaymentType === 'Card' ? 2 : 3;
      req.amount = Number(paymentAmount) || 0;
      req.paymentname = paymentName;
      req.paymentcode = paymentCode;
      req.statusid = 1; // Completed payment
      req.customername = '';
      req.customerid = 0;
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid;
      
      await appointmentService.UpdatePayment(req);
      
      // Refresh appointments
      await fetchAppointments();
      
      setShowPaymentDialog(false);
      setSelectedAppointmentId(null);
      setPaymentAmount('');
      setPaymentName('');
      setPaymentCode('');
      
      toast({
        title: "Payment Updated",
        description: "Payment has been updated successfully.",
      });
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive"
      });
    }
  };

  const handleViewRoomBooking = (room: OrganisationRoom) => {
    setSelectedRoomBooking(room);
    setIsRoomDetailsOpen(true);
  };

  // Handle view appointment
  const handleViewAppointment = (appointment: BookedAppoinmentRes) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  // Handle manage appointment record
  const handleManageRecord = (appointment: BookedAppoinmentRes) => {
    navigate(`/organization/appointments/${appointment.id}/record`);
  };

  // Handle payment status toggle
  const handlePaymentStatusToggle = async (appointmentId: number, isPaid: boolean) => {
    try {
      // Find the appointment to get its current data
      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) return;

      // Create an updated appointment object
      const updatedAppointment = { ...appointment, ispaid: isPaid };
      
      // Update the appointment using the existing update method
      await appointmentService.update(updatedAppointment);
      
      // Refresh appointments to get the updated data
      await fetchAppointments();
      
      toast({
        title: "Payment Status Updated",
        description: `Appointment payment status has been updated to ${isPaid ? 'Paid' : 'Unpaid'}.`,
      });
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  // Get status color for dialogs
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      case 'CONFIRMED':
        return '#2196F3';
      default:
        return '#FFC107';
    }
  };

  // Filter appointments based on search, date, and status
  const getFilteredAppointments = (appointments: BookedAppoinmentRes[]) => {
    return appointments.filter(appointment => {
      // Filter by search term
      const searchMatch = 
        appointment.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        appointment.organisationname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.attributes?.servicelist?.some(service => 
          service.servicename?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false;
        
      // Filter by selected date
      const dateMatch = selectedDate 
        ? new Date(appointment.appoinmentdate).toDateString() === selectedDate.toDateString() 
        : true;
      
      // Filter by status
      const statusMatch = statusFilter ? appointment.statuscode === statusFilter : true;
      
      return searchMatch && dateMatch && statusMatch;
    });
  };

  const getFilteredRoomBookings = (rooms: OrganisationRoom[]) => {
    return rooms.filter((room) => {
      const searchMatch = roomMatchesSearch(room, searchTerm);
      const start = getRoomBookingStartDate(room);
      const dateMatch = selectedDate
        ? start
          ? start.toDateString() === selectedDate.toDateString()
          : false
        : true;
      const statusMatch = statusFilter
        ? room.status?.toLowerCase() === statusFilter.toLowerCase()
        : true;
      return searchMatch && dateMatch && statusMatch;
    });
  };

  const filteredUpcomingAppointments = getFilteredAppointments(upcomingAppointments);
  const filteredPastAppointments = getFilteredAppointments(pastAppointments);
  const filteredUpcomingRoomBookings = getFilteredRoomBookings(upcomingRoomBookings);
  const filteredPastRoomBookings = getFilteredRoomBookings(pastRoomBookings);

  return (
    <OrganizationPageShell>
        {isLoading ? (
          <div className={org.loading}>
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-appointza-coral" />
              <p className="text-stone-600">Loading appointments…</p>
            </div>
          </div>
        ) : (
          <Tabs value={appointmentTab} onValueChange={(v) => setAppointmentTab(v as "upcoming" | "past")} className="w-full">
            <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-stretch gap-2 sm:max-w-md sm:gap-3">
                  <TabsList className="flex h-auto min-w-0 flex-1 gap-1.5 rounded-none bg-transparent p-0">
                    <TabsTrigger value="upcoming" className={org.tabTrigger}>
                      Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="past" className={org.tabTrigger}>
                      Past
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex h-10 shrink-0 overflow-hidden rounded-2xl border border-stone-200 sm:h-11">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                        viewMode === "table"
                          ? "bg-gradient-coral text-white"
                          : "bg-white text-stone-700 hover:bg-stone-50",
                      )}
                    >
                      <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 border-l border-stone-200 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                        viewMode === "card"
                          ? "bg-gradient-coral text-white"
                          : "bg-white text-stone-700 hover:bg-stone-50",
                      )}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                <div className="flex w-full shrink-0 gap-2 sm:ml-auto sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
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
                    disabled={!searchTerm && !selectedDate && !statusFilter}
                    className={cn(org.btnOutline, "h-10 flex-1 sm:flex-none")}
                  >
                    <X className="h-4 w-4 shrink-0" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
                  <Input
                    placeholder="Search appointments..."
                    className="h-11 w-full min-w-0 rounded-2xl border-stone-200 pl-11 pr-4 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-11 min-w-[10.5rem] max-w-[14rem] shrink-0 items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-3.5 text-left text-sm outline-none hover:bg-stone-50 sm:min-w-[12rem] sm:max-w-none sm:gap-3 sm:px-4"
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-stone-400 sm:h-5 sm:w-5" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-appointza-navy">
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto p-3"
                    />
                  </PopoverContent>
                </Popover>

                <Select
                  value={statusFilter ?? "all"}
                  onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-11 w-[10.5rem] shrink-0 rounded-2xl border-stone-200 bg-white text-sm sm:w-[11rem]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(24rem,var(--radix-select-content-available-height))]">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {appointmentStatusList.map((status) => (
                      <SelectItem key={status.id} value={status.identifier}>
                        {status.displaytext}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-appointza-cream/60 px-4 py-4 sm:px-6 lg:px-8">
              <TabsContent value="upcoming" className="mt-0 space-y-4 focus-visible:outline-none">
                <p className="text-sm text-stone-500">
                  {filteredUpcomingAppointments.length + filteredUpcomingRoomBookings.length} booking
                  {filteredUpcomingAppointments.length + filteredUpcomingRoomBookings.length === 1 ? "" : "s"} · upcoming
                  {showRoomBookings && filteredUpcomingRoomBookings.length > 0
                    ? ` (${filteredUpcomingRoomBookings.length} room)`
                    : ""}
                </p>

                {/* Table view */}
                <div className={viewMode === "table" ? "block" : "hidden"}>
                  <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-appointza-cream/60">
                          <tr className="text-left text-sm text-stone-600">
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Client</th>
                            <th className="px-6 py-4 font-medium">Mobile</th>
                            <th className="px-6 py-4 font-medium">{showRoomBookings ? "Service / Room" : "Service"}</th>
                            <th className="px-6 py-4 font-medium">Date &amp; Time</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Payment</th>
                            <th className="px-6 py-4 font-medium">Staff</th>
                            <th className="px-6 py-4 text-center font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                          {filteredUpcomingAppointments.map((appointment) => (
                            <tr key={`svc-${appointment.id}`} className="transition-colors hover:bg-stone-50">
                              <td className="px-6 py-5 text-stone-600">Service</td>
                              <td className="px-6 py-5 font-medium text-appointza-navy">
                                {appointment.username || "N/A"}
                              </td>
                              <td className="px-6 py-5 text-stone-600">{appointment.mobile || "N/A"}</td>
                              <td className="px-6 py-5 text-appointza-navy">
                                {appointment.attributes?.servicelist
                                  ?.map((service) => service.servicename)
                                  .join(", ") || "N/A"}
                              </td>
                              <td className="px-6 py-5 text-stone-600">
                                {format(new Date(appointment.appoinmentdate), "PP")} at{" "}
                                {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
                              </td>
                              <td className="px-6 py-5">
                                <Select
                                  defaultValue={appointment.statuscode}
                                  onValueChange={(value) => handleStatusChange(appointment.id, value)}
                                >
                                  <SelectTrigger className="h-9 w-[140px]">
                                    <SelectValue>
                                      <span className="capitalize">{appointment.statuscode?.toLowerCase()}</span>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {appointmentStatusList.length > 0 ? (
                                      appointmentStatusList.map((status) => (
                                        <SelectItem key={status.id} value={status.identifier}>
                                          {status.displaytext}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-5">
                                <Button
                                  variant={appointment.ispaid ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePaymentStatusToggle(appointment.id, !appointment.ispaid)}
                                  className={
                                    appointment.ispaid
                                      ? "rounded-full bg-green-100 font-medium text-green-700 hover:bg-green-200"
                                      : "rounded-full border-orange-200 bg-orange-100 font-medium text-orange-700 hover:bg-orange-200"
                                  }
                                >
                                  {appointment.ispaid ? "Paid" : "Unpaid"}
                                </Button>
                              </td>
                              <td className="px-6 py-5 text-stone-600">{appointment.staffname || "Unassigned"}</td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-stone-500 hover:text-orange-600"
                                    onClick={() => handleViewAppointment(appointment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-stone-500 hover:text-orange-600"
                                    onClick={() => handleManageRecord(appointment)}
                                    title="Manage Record"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredUpcomingRoomBookings.map((room) => (
                            <tr key={`room-${room.id}`} className="transition-colors hover:bg-stone-50">
                              <td className="px-6 py-5">
                                <span className="inline-flex items-center gap-1.5 text-stone-700">
                                  <BedDouble className="h-4 w-4 text-appointza-coral" />
                                  Room
                                </span>
                              </td>
                              <td className="px-6 py-5 font-medium text-appointza-navy">{roomGuestName(room)}</td>
                              <td className="px-6 py-5 text-stone-600">{roomGuestPhone(room)}</td>
                              <td className="px-6 py-5 text-appointza-navy">{roomBookingLabel(room)}</td>
                              <td className="px-6 py-5 text-stone-600">
                                {room.booking?.check_in || "—"}
                                {room.booking?.check_out ? ` → ${room.booking.check_out}` : ""}
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClassName(room.status)}`}>
                                  {statusLabel(room.status)}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <Button
                                  variant={roomIsPaid(room) ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    roomIsPaid(room)
                                      ? "rounded-full bg-green-100 font-medium text-green-700 hover:bg-green-200"
                                      : "rounded-full border-orange-200 bg-orange-100 font-medium text-orange-700 hover:bg-orange-200"
                                  }
                                  disabled
                                >
                                  {roomIsPaid(room) ? "Paid" : "Unpaid"}
                                </Button>
                              </td>
                              <td className="px-6 py-5 text-stone-600">
                                {room.cleaning_assignment?.staff_name || "—"}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-stone-500 hover:text-orange-600"
                                  onClick={() => handleViewRoomBooking(room)}
                                  title="View room booking"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card view */}
                <div
                  className={cn(
                    "grid gap-6",
                    viewMode === "card" ? "md:grid-cols-2 lg:grid-cols-3" : "hidden"
                  )}
                >
                  {filteredUpcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-appointza-navy">
                            {appointment.username || "N/A"}
                          </h3>
                          <p className="mt-1 text-sm text-stone-600">{appointment.mobile || "N/A"}</p>
                        </div>
                        <Select
                          defaultValue={appointment.statuscode}
                          onValueChange={(value) => handleStatusChange(appointment.id, value)}
                        >
                          <SelectTrigger className="h-9 w-[120px] shrink-0">
                            <SelectValue>
                              <span className="text-xs capitalize">{appointment.statuscode?.toLowerCase()}</span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {appointmentStatusList.length > 0 ? (
                              appointmentStatusList.map((status) => (
                                <SelectItem key={status.id} value={status.identifier}>
                                  {status.displaytext}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Service:</span>{" "}
                        {appointment.attributes?.servicelist
                          ?.map((service) => service.servicename)
                          .join(", ") || "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Date:</span>{" "}
                        {format(new Date(appointment.appoinmentdate), "PP")} at{" "}
                        {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Staff:</span>{" "}
                        {appointment.staffname || "Unassigned"}
                      </p>

                      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl border-stone-200 py-3 hover:bg-stone-50"
                          onClick={() => handleViewAppointment(appointment)}
                        >
                          View details
                        </Button>
                        <Button
                          className="flex-1 rounded-2xl bg-gradient-coral py-3 text-white hover:opacity-95"
                          onClick={() => handleManageRecord(appointment)}
                        >
                          Manage record
                        </Button>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant={appointment.ispaid ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePaymentStatusToggle(appointment.id, !appointment.ispaid)}
                          className={
                            appointment.ispaid
                              ? "rounded-full bg-green-600 hover:bg-green-700"
                              : "rounded-full border-orange-500 text-orange-600 hover:bg-orange-50"
                          }
                        >
                          {appointment.ispaid ? "Paid" : "Unpaid"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredUpcomingRoomBookings.map((room) => (
                    <div
                      key={`room-card-up-${room.id}`}
                      className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-appointza-coral">
                            <BedDouble className="h-3.5 w-3.5" />
                            Room booking
                          </div>
                          <h3 className="text-lg font-semibold text-appointza-navy">{roomGuestName(room)}</h3>
                          <p className="mt-1 text-sm text-stone-600">{roomGuestPhone(room)}</p>
                        </div>
                        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClassName(room.status)}`}>
                          {statusLabel(room.status)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Room:</span> {roomBookingLabel(room)}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Stay:</span>{" "}
                        {room.booking?.check_in || "—"}
                        {room.booking?.check_out ? ` → ${room.booking.check_out}` : ""}
                      </p>
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-stone-200 py-3 hover:bg-stone-50"
                          onClick={() => handleViewRoomBooking(room)}
                        >
                          View booking details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredUpcomingAppointments.length === 0 && filteredUpcomingRoomBookings.length === 0 && (
                  <div className="rounded-2xl border border-stone-100 bg-white py-12 text-center text-sm text-stone-500">
                    No upcoming appointments or room bookings found.
                  </div>
                )}
              </TabsContent>
          
              <TabsContent value="past" className="mt-0 space-y-4 focus-visible:outline-none">
                <p className="text-sm text-stone-500">
                  {filteredPastAppointments.length + filteredPastRoomBookings.length} booking
                  {filteredPastAppointments.length + filteredPastRoomBookings.length === 1 ? "" : "s"} · past
                  {showRoomBookings && filteredPastRoomBookings.length > 0
                    ? ` (${filteredPastRoomBookings.length} room)`
                    : ""}
                </p>

                <div className={viewMode === "table" ? "block" : "hidden"}>
                  <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-appointza-cream/60">
                          <tr className="text-left text-sm text-stone-600">
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Client</th>
                            <th className="px-6 py-4 font-medium">Mobile</th>
                            <th className="px-6 py-4 font-medium">{showRoomBookings ? "Service / Room" : "Service"}</th>
                            <th className="px-6 py-4 font-medium">Date &amp; Time</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Payment</th>
                            <th className="px-6 py-4 font-medium">Staff</th>
                            <th className="px-6 py-4 text-center font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                          {filteredPastAppointments.map((appointment) => (
                            <tr key={`svc-past-${appointment.id}`} className="transition-colors hover:bg-stone-50">
                              <td className="px-6 py-5 text-stone-600">Service</td>
                              <td className="px-6 py-5 font-medium text-appointza-navy">{appointment.username || "N/A"}</td>
                              <td className="px-6 py-5 text-stone-600">{appointment.mobile || "N/A"}</td>
                              <td className="px-6 py-5 text-appointza-navy">
                                {appointment.attributes?.servicelist
                                  ?.map((service) => service.servicename)
                                  .join(", ") || "N/A"}
                              </td>
                              <td className="px-6 py-5 text-stone-600">
                                {format(new Date(appointment.appoinmentdate), "PP")} at{" "}
                                {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                    appointment.statuscode === "COMPLETED"
                                      ? "bg-green-100 text-green-700"
                                      : appointment.statuscode === "CANCELLED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  <span className="capitalize">{appointment.statuscode?.toLowerCase()}</span>
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <Button
                                  variant={appointment.ispaid ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePaymentStatusToggle(appointment.id, !appointment.ispaid)}
                                  className={
                                    appointment.ispaid
                                      ? "rounded-full bg-green-100 font-medium text-green-700 hover:bg-green-200"
                                      : "rounded-full border-orange-200 bg-orange-100 font-medium text-orange-700 hover:bg-orange-200"
                                  }
                                >
                                  {appointment.ispaid ? "Paid" : "Unpaid"}
                                </Button>
                              </td>
                              <td className="px-6 py-5 text-stone-600">{appointment.staffname || "Unassigned"}</td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-stone-500 hover:text-orange-600"
                                    onClick={() => handleViewAppointment(appointment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-stone-500 hover:text-orange-600"
                                    onClick={() => handleManageRecord(appointment)}
                                    title="Manage Record"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredPastRoomBookings.map((room) => (
                            <tr key={`room-past-${room.id}`} className="transition-colors hover:bg-stone-50">
                              <td className="px-6 py-5">
                                <span className="inline-flex items-center gap-1.5 text-stone-700">
                                  <BedDouble className="h-4 w-4 text-appointza-coral" />
                                  Room
                                </span>
                              </td>
                              <td className="px-6 py-5 font-medium text-appointza-navy">{roomGuestName(room)}</td>
                              <td className="px-6 py-5 text-stone-600">{roomGuestPhone(room)}</td>
                              <td className="px-6 py-5 text-appointza-navy">{roomBookingLabel(room)}</td>
                              <td className="px-6 py-5 text-stone-600">
                                {room.booking?.check_in || "—"}
                                {room.booking?.check_out ? ` → ${room.booking.check_out}` : ""}
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClassName(room.status)}`}>
                                  {statusLabel(room.status)}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <Button
                                  variant={roomIsPaid(room) ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    roomIsPaid(room)
                                      ? "rounded-full bg-green-100 font-medium text-green-700 hover:bg-green-200"
                                      : "rounded-full border-orange-200 bg-orange-100 font-medium text-orange-700 hover:bg-orange-200"
                                  }
                                  disabled
                                >
                                  {roomIsPaid(room) ? "Paid" : "Unpaid"}
                                </Button>
                              </td>
                              <td className="px-6 py-5 text-stone-600">
                                {room.cleaning_assignment?.staff_name || "—"}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-stone-500 hover:text-orange-600"
                                  onClick={() => handleViewRoomBooking(room)}
                                  title="View room booking"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-6",
                    viewMode === "card" ? "md:grid-cols-2 lg:grid-cols-3" : "hidden"
                  )}
                >
                  {filteredPastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-appointza-navy">{appointment.username || "N/A"}</h3>
                          <p className="mt-1 text-sm text-stone-600">{appointment.mobile || "N/A"}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
                            appointment.statuscode === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : appointment.statuscode === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <span className="capitalize">{appointment.statuscode?.toLowerCase()}</span>
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Service:</span>{" "}
                        {appointment.attributes?.servicelist
                          ?.map((service) => service.servicename)
                          .join(", ") || "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Date:</span>{" "}
                        {format(new Date(appointment.appoinmentdate), "PP")} at{" "}
                        {appointment.fromtime?.toString().substring(0, 5) || "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Staff:</span>{" "}
                        {appointment.staffname || "Unassigned"}
                      </p>

                      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl border-stone-200 py-3 hover:bg-stone-50"
                          onClick={() => handleViewAppointment(appointment)}
                        >
                          View details
                        </Button>
                        <Button
                          className="flex-1 rounded-2xl bg-gradient-coral py-3 text-white hover:opacity-95"
                          onClick={() => handleManageRecord(appointment)}
                        >
                          Manage record
                        </Button>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant={appointment.ispaid ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePaymentStatusToggle(appointment.id, !appointment.ispaid)}
                          className={
                            appointment.ispaid
                              ? "rounded-full bg-green-600 hover:bg-green-700"
                              : "rounded-full border-orange-500 text-orange-600 hover:bg-orange-50"
                          }
                        >
                          {appointment.ispaid ? "Paid" : "Unpaid"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredPastRoomBookings.map((room) => (
                    <div
                      key={`room-card-past-${room.id}`}
                      className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-appointza-coral">
                            <BedDouble className="h-3.5 w-3.5" />
                            Room booking
                          </div>
                          <h3 className="text-lg font-semibold text-appointza-navy">{roomGuestName(room)}</h3>
                          <p className="mt-1 text-sm text-stone-600">{roomGuestPhone(room)}</p>
                        </div>
                        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClassName(room.status)}`}>
                          {statusLabel(room.status)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Room:</span> {roomBookingLabel(room)}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-appointza-navy">Stay:</span>{" "}
                        {room.booking?.check_in || "—"}
                        {room.booking?.check_out ? ` → ${room.booking.check_out}` : ""}
                      </p>
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-stone-200 py-3 hover:bg-stone-50"
                          onClick={() => handleViewRoomBooking(room)}
                        >
                          View booking details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPastAppointments.length === 0 && filteredPastRoomBookings.length === 0 && (
                  <div className="rounded-2xl border border-stone-100 bg-white py-12 text-center text-sm text-stone-500">
                    No past appointments or room bookings found.
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
        {/* Appointment Details Dialog */}
        {selectedAppointment && (
          <UserAppointmentDetails
            appointment={selectedAppointment}
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedAppointment(null);
            }}
            onAppointmentUpdate={(updatedAppointment) => {
              // Update the selected appointment with the new data
              setSelectedAppointment(updatedAppointment);
              
              // Also update the appointment in the appointments list
              setAppointments(prevAppointments => 
                prevAppointments.map(app => 
                  app.id === updatedAppointment.id ? updatedAppointment : app
                )
              );
            }}
            onRefresh={handleRefresh}
          />
        )}

        <RoomBookingDetailsDialog
          room={selectedRoomBooking}
          open={isRoomDetailsOpen}
          onClose={() => {
            setIsRoomDetailsOpen(false);
            setSelectedRoomBooking(null);
          }}
        />

        {/* Staff Assignment Dialog */}
        <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Assign Staff</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Select a staff member to assign to this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {staffList.map((staff) => (
                <Button
                  key={staff.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleAssignStaff(staff.id, staff.name)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {staff.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{staff.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{staff.mobile}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Update Status</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Select a new status for this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {appointmentStatusList.map((status) => (
                <Button
                  key={status.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => {
                    handleStatusChange(selectedAppointmentId!, status.identifier);
                    setShowStatusDialog(false);
                    setSelectedAppointmentId(null);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(status.identifier) }}
                    />
                    <span className="text-sm sm:text-base">{status.displaytext}</span>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Update Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Update Payment</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Update payment details for this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm sm:text-base">Payment Method</Label>
                <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm sm:text-base">Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              
              <div>
                <Label className="text-sm sm:text-base">Payment Name (Optional)</Label>
                <Input
                  placeholder="e.g., Credit Card, UPI, etc."
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              
              <div>
                <Label className="text-sm sm:text-base">Payment Code/Reference</Label>
                <Input
                  placeholder="Transaction ID or Reference"
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              
              <Button onClick={handleUpdatePayment} className="w-full h-10 sm:h-11">
                Update Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </OrganizationPageShell>
  );
};

export default OrganizationAppointments;
