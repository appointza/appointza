import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Check,
  Edit,
  Plus,
  Search,
  Trash,
  Loader2,
  Package,
  Clock,
  Layers,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Upload,
  X,
  Camera,
  Ticket,
  ClipboardList,
  Save,
} from "lucide-react";
import { useOrganizationServices } from "@/hooks/useOrganizationServices";
import { OrganisationServices } from "@/models/organisationservices.model";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useEvents } from "@/hooks/useEvents";
import { useEventBookingForm } from "@/hooks/useEventBookingForm";
import { EventFormFieldsEditor } from "@/components/organization/EventFormFieldsEditor";
import { EventDetailsFormFields } from "@/components/organization/EventDetailsFormFields";
import { ServicePricingFields } from "@/components/organization/ServicePricingFields";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  ComboEditorFields,
  ServiceEditorFields,
} from "@/components/organization/ServiceEditorFields";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import type { EventBookingFormField } from "@/utils/eventBookingFormFields.util";
import { ReferenceValue } from "@/models/referencevalue.model";
import { Event } from "@/models/event.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from "@/models/organisationlocation.model";
import { FilesService } from "@/services/files.service";
import { getServicePriceSummary } from "@/utils/servicePricing.util";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import { ServicesEventsExplainer } from "@/components/onboarding/ServicesEventsExplainer";
import { onboardingStepRoute } from "@/utils/organizationOnboarding.util";
import {
  compareDateOnly,
  formatEventDateOnly,
  isDateOnlyAfterToday,
  toDateInputValue,
  toDateOnlyString,
  todayDateOnlyString,
} from "@/utils/eventDate.util";

/** Same date/location line pattern as `PublicBrowseEventsPage` for card consistency. */
function formatOrganizationEventMetaLine(event: Event): string {
  const loc = event.location?.trim();
  let when = "";
  if (event.event_type === "single" && event.event_date) {
    when = formatEventDateOnly(event.event_date);
  } else if (event.event_type === "range" && event.from_date && event.to_date) {
    when = `${formatEventDateOnly(event.from_date)} â€“ ${formatEventDateOnly(event.to_date)}`;
  } else if (event.event_type === "daily") {
    when = "Daily";
  }
  const timeRange = formatEventTimeRange(event);
  if (timeRange) {
    when = when ? `${when} â€¢ ${timeRange}` : timeRange;
  }
  return [when, loc].filter(Boolean).join(" â€¢ ");
}

type EventDateBucket = "past" | "today" | "future";

function getEventDateBucket(eventItem: Event): EventDateBucket {
  const today = todayDateOnlyString();

  if (eventItem.event_type === "range" && eventItem.from_date && eventItem.to_date) {
    if (compareDateOnly(eventItem.to_date, today) < 0) return "past";
    if (compareDateOnly(eventItem.from_date, today) > 0) return "future";
    return "today";
  }

  if (eventItem.event_type === "single" && eventItem.event_date) {
    const cmp = compareDateOnly(eventItem.event_date, today);
    if (cmp < 0) return "past";
    if (cmp > 0) return "future";
    return "today";
  }

  return "today";
}

function eventWhenBadge(bucket: EventDateBucket): { label: string; className: string } {
  switch (bucket) {
    case "past":
      return {
        label: "Past",
        className: "bg-stone-100 text-stone-700 border border-stone-200",
      };
    case "today":
      return {
        label: "Today",
        className: "bg-sky-100 text-sky-800 border border-sky-200",
      };
    case "future":
      return {
        label: "Future",
        className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
  }
}

function tomorrowDateInputMin(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return toDateInputValue(t);
}

/** Normalize stored time to `HH:mm` for `<input type="time">`. */
function toTimeInputValue(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const match = raw.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function readTimingStartTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { StartTime?: string; startTime?: string } | undefined;
  return toTimeInputValue(tc?.StartTime ?? tc?.startTime);
}

function readTimingEndTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { EndTime?: string; endTime?: string } | undefined;
  return toTimeInputValue(tc?.EndTime ?? tc?.endTime);
}

function readEventStartTime(ev: Event): string {
  return toTimeInputValue(ev.start_time) || readTimingStartTime(ev.timing_config);
}

function readEventEndTime(ev: Event): string {
  return toTimeInputValue(ev.end_time) || readTimingEndTime(ev.timing_config);
}

function formatTimeForDisplay(raw: string | undefined): string {
  const value = toTimeInputValue(raw);
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatEventTimeRange(ev: Event): string {
  const start = readEventStartTime(ev);
  const end = readEventEndTime(ev);
  if (!start && !end) return "";
  if (start && end) return `${formatTimeForDisplay(start)} â€“ ${formatTimeForDisplay(end)}`;
  return formatTimeForDisplay(start || end);
}

function parseTimeToMinutes(value: string): number | null {
  const normalized = toTimeInputValue(value);
  if (!normalized) return null;
  const [h, m] = normalized.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

const OrganizationServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isComplete,
    nextStep,
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
    refetch: refetchOnboarding,
  } = useOnboardingStatus();
  const { user, isAuthenticated, userType } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const organizationId = user?.organisationid || 1; // Default to 1 for demo
  const [activeTab, setActiveTab] = useState<"services" | "events">("services");
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const organisationDisplayName = useMemo(() => {
    try {
      const raw = localStorage.getItem("user_context");
      if (!raw) return "Your business";
      const parsed = JSON.parse(raw) as { organisationname?: string };
      return parsed.organisationname?.trim() || "Your business";
    } catch {
      return "Your business";
    }
  }, []);

  // Event image upload state
  const [eventImages, setEventImages] = useState<number[]>([]);

  // Service image upload state (stored in OrganisationServices.attributes.ImageIds)
  const [serviceImages, setServiceImages] = useState<number[]>([]);

  // Events state - use globalLocationId from GlobalIdContext
  const eventLocationId = globalLocationId ? Number(globalLocationId) : undefined;
  const {
    events,
    isLoading: isLoadingEvents,
    createEventAsync,
    updateEvent,
    deleteEvent,
    isCreating: isCreatingEvent,
    isUpdating: isUpdatingEvent,
    isDeleting: isDeletingEvent,
  } = useEvents(organizationId, eventLocationId);

  const {
    loadFormForEvent,
    saveFormForEvent,
    isLoading: isLoadingBookingForm,
    isSaving: isSavingBookingForm,
  } = useEventBookingForm(organizationId);

  const organizationEventCardImageUrls = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    for (const ev of events) {
      const firstId = ev.images?.ImageIds?.find((id) => id > 0);
      if (firstId) map[ev.id] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [events, filesService]);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [event, setEvent] = useState<Event>(new Event());
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [addEventStep, setAddEventStep] = useState<"details" | "booking">("details");
  const [showEventBookingPanel, setShowEventBookingPanel] = useState(false);
  const [bookingFormEventId, setBookingFormEventId] = useState(0);
  const [bookingFormEventName, setBookingFormEventName] = useState("");
  const [eventBookingFormFields, setEventBookingFormFields] = useState<EventBookingFormField[]>([]);
  const [existingBookingFormValue, setExistingBookingFormValue] = useState<ReferenceValue | null>(null);
  const [showEditEventForm, setShowEditEventForm] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [eventDateFilter, setEventDateFilter] = useState<"all" | "past" | "today" | "future">("all");
  const [eventPublicFilter, setEventPublicFilter] = useState<"all" | "public" | "private">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { kind: "service"; id: number; name: string }
    | { kind: "event"; id: number; name: string }
    | null
  >(null);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!organizationId) return;

      try {
        const req = new OrganisationLocationSelectReq();
        req.organisationid = organizationId;
        const response = await locationService.select(req);
        if (response && response.length > 0) {
          setLocations(response);
          setSelectedLocationId(response[0].id);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [organizationId, locationService]);

  console.log("OrganizationServices: isAuthenticated =", isAuthenticated);
  console.log("OrganizationServices: userType =", userType);
  console.log("OrganizationServices: user =", user);
  console.log("OrganizationServices: organizationId =", organizationId);

  const {
    services,
    isLoading,
    createServiceAsync,
    updateService,
    deleteService,
    isCreating,
    isUpdating,
    isDeleting,
  } = useOrganizationServices(organizationId);

  const organizationServiceCardImageUrls = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    for (const svc of services) {
      const firstId = svc.attributes?.ImageIds?.find((id) => id > 0);
      if (firstId) map[svc.id] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [services, filesService]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] =
    useState<OrganisationServices | null>(null);
  const [service, setService] = useState<OrganisationServices>(
    new OrganisationServices()
  );
  const [selectedComboServices, setSelectedComboServices] = useState<
    OrganisationServices[]
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);

  const openServiceForm = (
    item?: OrganisationServices,
    isCombo: boolean = false
  ) => {
    const newService = item ? { ...item } : new OrganisationServices();
    // Load existing images from attributes
    setServiceImages((item as any)?.attributes?.ImageIds || []);

    // Initialize weekday_price and weekend_price if not set
    if (!newService.weekday_price || newService.weekday_price === 0) {
      newService.weekday_price = newService.prize || 0;
    }
    if (!newService.weekend_price || newService.weekend_price === 0) {
      newService.weekend_price = newService.prize || 0;
    }

    // Determine if this is a combo based on item or isCombo parameter
    const isComboService = isCombo || item?.Iscombo === true;

    if (isComboService) {
      newService.Iscombo = true;
      if (!newService.servicesids) {
        newService.servicesids = { combolist: [] };
      }
      if (!newService.servicesids.combolist) {
        newService.servicesids.combolist = [];
      }
      // Combos always use same price
      newService.is_price_different = false;
    }

    setService(newService);
    setSelectedComboServices(
      isComboService && item && item.servicesids?.combolist
        ? services.filter((s) =>
            item.servicesids.combolist?.some((c) => c.id === s.id)
          )
        : []
    );

    if (item) {
      setEditingService(item);
      if (isComboService) {
        setShowComboForm(true);
        setShowEditForm(false);
        setShowAddForm(false);
      } else {
        setShowEditForm(true);
        setShowAddForm(false);
        setShowComboForm(false);
      }
    } else if (isComboService) {
      setShowComboForm(true);
      setShowAddForm(false);
      setShowEditForm(false);
    } else {
      setShowAddForm(true);
      setShowEditForm(false);
      setShowComboForm(false);
    }
  };

  const handleSaveService = async () => {
    if (!validateService()) return;

    try {
      const serviceToSave = prepareServiceForSave();

      if (editingService) {
        // Ensure we preserve the ID and version when editing
        serviceToSave.id = editingService.id;
        serviceToSave.version = editingService.version || 1;
        serviceToSave.createdby = editingService.createdby || user?.id || 0;
        serviceToSave.createdon = editingService.createdon || new Date();

        updateService(serviceToSave);
        setEditingService(null);
        setShowEditForm(false);
        setShowComboForm(false);
        setService(new OrganisationServices());
        setSelectedComboServices([]);
        setServiceImages([]);
      } else {
        const wasFirstService = services.length === 0;
        await createServiceAsync(serviceToSave);
        setShowAddForm(false);
        setShowComboForm(false);
        setService(new OrganisationServices());
        setSelectedComboServices([]);
        setServiceImages([]);

        if (!isComplete && wasFirstService) {
          await refetchOnboarding();
          navigate(
            onboardingStepRoute(
              "website",
              selectedLocationId > 0 ? selectedLocationId : undefined,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateService = (): boolean => {
    if (!service.Servicename.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a service name",
        variant: "destructive",
      });
      return false;
    }

    if (service.Iscombo && selectedComboServices.length < 2) {
      toast({
        title: "Validation Error",
        description: "A combo must include at least 2 services",
        variant: "destructive",
      });
      return false;
    }

    // For combos, price is calculated from selected services, so skip price validation
    // For individual services, validate price
    if (!service.Iscombo) {
      if (!service.is_price_different) {
        // Same price for all days
        if (service.prize <= 0) {
          toast({
            title: "Validation Error",
            description: "Price must be greater than 0",
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Different prices for weekdays/weekends
        if (!service.weekday_price || service.weekday_price <= 0) {
          toast({
            title: "Validation Error",
            description: "Weekday price must be greater than 0",
            variant: "destructive",
          });
          return false;
        }
        if (!service.weekend_price || service.weekend_price <= 0) {
          toast({
            title: "Validation Error",
            description: "Weekend price must be greater than 0",
            variant: "destructive",
          });
          return false;
        }
      }
    }

    // Offer price is optional. If provided, it must be > 0.
    // Offer price only when same price all days
    if (service.is_price_different && service.offerprize > 0) {
      toast({
        title: "Validation Error",
        description: "Offer price is only available when same price applies all week",
        variant: "destructive",
      });
      return false;
    }

    if (service.offerprize && service.offerprize < 0) {
      toast({
        title: "Validation Error",
        description: "Offer price must be 0 or greater",
        variant: "destructive",
      });
      return false;
    }

    // Validate duration
    if (!service.timetaken || service.timetaken <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid duration in minutes",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const prepareServiceForSave = (): OrganisationServices => {
    const serviceToSave = { ...service };
    serviceToSave.organisationid = organizationId;
    serviceToSave.isactive = true;
    serviceToSave.attributes = {
      ...(serviceToSave.attributes || {}),
      ImageIds: serviceImages,
    };

    // Only set createdby/createdon for new services
    if (!editingService) {
      serviceToSave.createdby = user?.id || 0;
      serviceToSave.createdon = new Date();
    } else {
      // Preserve original createdby/createdon when editing
      serviceToSave.createdby = editingService.createdby || user?.id || 0;
      serviceToSave.createdon = editingService.createdon || new Date();
    }

    // Always set modifiedby/modifiedon
    serviceToSave.modifiedby = user?.id || 0;
    serviceToSave.modifiedon = new Date();

    // weekday_price always mirrors Monâ€“Fri / single price field
    serviceToSave.weekday_price = serviceToSave.prize;

    if (!serviceToSave.is_price_different) {
      serviceToSave.weekend_price = serviceToSave.prize;
    } else {
      if (!serviceToSave.weekend_price || serviceToSave.weekend_price <= 0) {
        serviceToSave.weekend_price = serviceToSave.prize;
      }
      // Offer does not apply when weekday/weekend prices differ
      serviceToSave.offerprize = 0;
    }

    if (serviceToSave.Iscombo) {
      // Calculate combo price as sum of selected services
      const totalPrice = selectedComboServices.reduce(
        (sum, s) => sum + s.prize,
        0
      );
      serviceToSave.prize = totalPrice;

      // Offer price is optional for combos too.
      if (!serviceToSave.offerprize || serviceToSave.offerprize <= 0) {
        serviceToSave.offerprize = 0;
      }

      // For combos, keep same price for weekdays/weekends
      serviceToSave.is_price_different = false;
      serviceToSave.weekday_price = totalPrice;
      serviceToSave.weekend_price = totalPrice;

      // Update combo list
      serviceToSave.servicesids.combolist = selectedComboServices.map((s) => ({
        id: s.id,
        servicename: s.Servicename,
      }));
    }

    return serviceToSave;
  };

  const handleComboSelection = (items: OrganisationServices[]) => {
    setSelectedComboServices(items);

    // Calculate total price for the combo
    const totalPrice = items.reduce((sum, item) => sum + item.prize, 0);
    setService((prev) => ({
      ...prev,
      prize: totalPrice,
      offerprize: 0, // Offer is optional
    }));
  };

  const requestDeleteService = (serviceItem: OrganisationServices) => {
    setDeleteConfirm({
      kind: "service",
      id: serviceItem.id,
      name: serviceItem.Servicename,
    });
  };

  const requestDeleteEvent = (eventItem: Event) => {
    setDeleteConfirm({
      kind: "event",
      id: eventItem.id,
      name: eventItem.event_name,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "service") {
      deleteService(deleteConfirm.id);
    } else {
      deleteEvent(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const filteredServices = services.filter(
    (service) =>
      service.Servicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Event handlers
  const resetEventFlow = () => {
    setShowAddEventForm(false);
    setShowEditEventForm(false);
    setShowEventBookingPanel(false);
    setAddEventStep("details");
    setBookingFormEventId(0);
    setBookingFormEventName("");
    setEventBookingFormFields([]);
    setExistingBookingFormValue(null);
    setEvent(new Event());
    setEventImages([]);
    setEditingEvent(null);
  };

  const closeServiceForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setShowComboForm(false);
    setEditingService(null);
    setService(new OrganisationServices());
    setSelectedComboServices([]);
    setServiceImages([]);
  };

  const openEventBookingForm = async (eventItem: Event) => {
    setShowAddEventForm(false);
    setShowEditEventForm(false);
    setShowEventBookingPanel(true);
    setBookingFormEventId(eventItem.id);
    setBookingFormEventName(eventItem.event_name);

    const { fields, existing } = await loadFormForEvent(eventItem.id);
    setEventBookingFormFields(fields);
    setExistingBookingFormValue(existing);
  };

  const handleSaveEventBookingForm = async () => {
    if (!bookingFormEventId) return;

    try {
      await saveFormForEvent(
        bookingFormEventId,
        bookingFormEventName,
        eventBookingFormFields,
        existingBookingFormValue,
      );

      toast({
        title: existingBookingFormValue ? "Booking form updated" : "Booking form saved",
        description: `Guests booking â€œ${bookingFormEventName}â€ will see these questions.`,
      });

      resetEventFlow();
    } catch (error) {
      console.error("Error saving booking form:", error);
      toast({
        title: "Error",
        description: "Failed to save booking form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEventForm = (item?: Event) => {
    if (item) {
      setEditingEvent(item);
      setEvent({
        ...item,
        event_date: toDateOnlyString(item.event_date),
        from_date: toDateOnlyString(item.from_date),
        to_date: toDateOnlyString(item.to_date),
        timing_config: item.timing_config || new Event.TimingConfigData(),
      });
      // Load existing images
      setEventImages(item.images?.ImageIds || []);
      setShowEditEventForm(true);
      setShowAddEventForm(false);
    } else {
      const newEvent = new Event();
      newEvent.organisation_id = organizationId;
      newEvent.organisation_location_id = eventLocationId || 0;
      newEvent.event_type = "single";
      newEvent.payment_type = "userpay";
      newEvent.status = "active";
      newEvent.is_public = true;
      newEvent.timing_config = new Event.TimingConfigData();
      setEvent(newEvent);
      setEventImages([]);
      setShowAddEventForm(true);
      setShowEditEventForm(false);
      setShowEventBookingPanel(false);
      setAddEventStep("details");
      setBookingFormEventId(0);
      setBookingFormEventName("");
      setEventBookingFormFields([]);
      setExistingBookingFormValue(null);
      setEditingEvent(null);
    }
  };

  const handleSaveEvent = async () => {
    if (!validateEvent()) return;

    try {
      const eventToSave = prepareEventForSave();

      if (editingEvent) {
        updateEvent(eventToSave);
        setEditingEvent(null);
        setShowEditEventForm(false);
        setEventImages([]);
        toast({
          title: "Event updated",
          description: "Your event has been saved.",
        });
      } else {
        const savedEvent = await createEventAsync(eventToSave);
        const eventId = savedEvent?.id ?? 0;
        const eventName = savedEvent?.event_name || eventToSave.event_name || "Event";

        if (eventId > 0) {
          setBookingFormEventId(eventId);
          setBookingFormEventName(eventName);
          setAddEventStep("booking");
          const { fields, existing } = await loadFormForEvent(eventId);
          setEventBookingFormFields(fields);
          setExistingBookingFormValue(existing);

          toast({
            title: "Event created",
            description: "Add the questions guests answer when booking.",
          });
        } else {
          resetEventFlow();
        }
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateEvent = (): boolean => {
    if (!event.event_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event name",
        variant: "destructive",
      });
      return false;
    }

    if (!event.event_type) {
      toast({
        title: "Validation Error",
        description: "Please select an event type",
        variant: "destructive",
      });
      return false;
    }

    if (event.event_type === "single" && !event.event_date) {
      toast({
        title: "Validation Error",
        description: "Please select an event date for single events",
        variant: "destructive",
      });
      return false;
    }

    // Validate single event date is in the future
    if (event.event_type === "single" && event.event_date) {
      if (!isDateOnlyAfterToday(event.event_date)) {
        toast({
          title: "Validation Error",
          description: "Event date must be a future date",
          variant: "destructive",
        });
        return false;
      }
    }

    if (event.event_type === "range" && (!event.from_date || !event.to_date)) {
      toast({
        title: "Validation Error",
        description: "Please select both from and to dates for range events",
        variant: "destructive",
      });
      return false;
    }

    // Validate range event dates are in the future
    if (event.event_type === "range" && event.from_date && event.to_date) {
      if (!isDateOnlyAfterToday(event.from_date)) {
        toast({
          title: "Validation Error",
          description: "From date must be a future date",
          variant: "destructive",
        });
        return false;
      }

      if (!isDateOnlyAfterToday(event.to_date)) {
        toast({
          title: "Validation Error",
          description: "To date must be a future date",
          variant: "destructive",
        });
        return false;
      }

      if (compareDateOnly(event.to_date, event.from_date) < 0) {
        toast({
          title: "Validation Error",
          description: "To date must be after or equal to from date",
          variant: "destructive",
        });
        return false;
      }
    }

    // Validate Location is mandatory
    if (!event.location || !event.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event location",
        variant: "destructive",
      });
      return false;
    }

    if (event.entry_amount < 0) {
      toast({
        title: "Validation Error",
        description: "Entry amount cannot be negative",
        variant: "destructive",
      });
      return false;
    }

    const startTime = readEventStartTime(event);
    const endTime = readEventEndTime(event);
    if (!startTime || !endTime) {
      toast({
        title: "Validation Error",
        description: "Please enter both start time and end time",
        variant: "destructive",
      });
      return false;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startMinutes != null && endMinutes != null && endMinutes <= startMinutes) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const prepareEventForSave = (): Event => {
    const eventToSave = { ...event };
    eventToSave.organisation_id = organizationId;
    eventToSave.organisation_location_id = eventLocationId || 0;
    eventToSave.created_by = user?.id || 0;
    eventToSave.images = { ...eventToSave.images, ImageIds: eventImages };
    eventToSave.start_time = toTimeInputValue(readEventStartTime(event));
    eventToSave.end_time = toTimeInputValue(readEventEndTime(event));
    // When creating a new event, set remainingslot equal to slot_limit
    if (!editingEvent) {
      eventToSave.remainingslot = eventToSave.slot_limit || 0;
    }
    return eventToSave;
  };

  const handleEnableClick = () => {
    if (!isComplete && nextStep) {
      navigate(onboardingStepRoute(nextStep));
      return;
    }
    navigate("/organization/dashboard");
  };

  const filteredEvents = events.filter((eventItem) => {
    const searchValue = eventSearchTerm.toLowerCase();
    const matchesSearch =
      eventItem.event_name.toLowerCase().includes(searchValue) ||
      (eventItem.description || "").toLowerCase().includes(searchValue) ||
      (eventItem.location || "").toLowerCase().includes(searchValue);

    if (!matchesSearch) return false;

    if (eventDateFilter !== "all" && getEventDateBucket(eventItem) !== eventDateFilter) {
      return false;
    }

    if (eventPublicFilter === "public" && !eventItem.is_public) return false;
    if (eventPublicFilter === "private" && eventItem.is_public) return false;

    return true;
  });

  if (!isAuthenticated) {
    console.log(
      "OrganizationServices: Not authenticated, showing auth required message"
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-stone-600">Please log in to access this page.</p>
          <p className="text-sm text-stone-500 mt-2">
            Debug: isAuthenticated = {String(isAuthenticated)}, userType ={" "}
            {userType}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  const showServicesEventsGuide =
    !isComplete || (services.length === 0 && events.length === 0);

  return (
    <div className="org-page">
      {!isComplete && (
        <div className="org-page-section pb-0 pt-2 sm:pt-4">
          <OnboardingPageGuide
            compact
            stepId="services"
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
            locationId={selectedLocationId > 0 ? selectedLocationId : undefined}
          />
        </div>
      )}

      {showServicesEventsGuide && (
        <ServicesEventsExplainer
          activeTab={activeTab}
          onTabChange={setActiveTab}
          inOnboarding={!isComplete}
        />
      )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "services" | "events")} className="w-full">
          {/* Tabs + primary action in one row */}
          <div className="org-panel-section px-6 md:px-8 py-4 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="flex w-full max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-1 shadow-sm sm:w-auto">
                <TabsTrigger
                  value="services"
                  className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 data-[state=active]:bg-gradient-coral data-[state=active]:text-white"
                >
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 data-[state=active]:bg-gradient-coral data-[state=active]:text-white"
                >
                  Events
                </TabsTrigger>
              </TabsList>

              {/* Action button changes by tab */}
              {activeTab === "services" ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {services.length >= 2 && !showAddForm && !showEditForm && !showComboForm && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowComboForm(true);
                        setShowAddForm(false);
                        setShowEditForm(false);
                        const newService = new OrganisationServices();
                        newService.Iscombo = true;
                        setService(newService);
                      }}
                      className="h-11 rounded-2xl border-stone-100 bg-white px-5 font-medium text-appointza-navy hover:bg-appointza-cream/60 shadow-sm"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Create Combo
                    </Button>
                  )}
                  {!showAddForm && !showEditForm && !showComboForm && (
                    <Button
                      onClick={() => {
                        setShowAddForm(true);
                        setShowEditForm(false);
                        setShowComboForm(false);
                        setService(new OrganisationServices());
                      }}
                      className="h-11 rounded-2xl bg-gradient-coral px-6 font-medium text-white hover:opacity-95 shadow-sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Service
                    </Button>
                  )}
                </div>
              ) : !showAddEventForm && !showEditEventForm && !showEventBookingPanel ? (
                <Button
                  onClick={() => openEventForm()}
                  className="h-11 rounded-2xl bg-gradient-coral px-6 font-medium text-white hover:opacity-95 shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Button>
              ) : null}
            </div>
          </div>

          <TabsContent value="services" className="mt-0 px-6 md:px-8 py-6 space-y-6 focus-visible:outline-none">
            {/* Search row (actions live in the top segmented header) */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border-blue-100 bg-white py-2.5 pl-11 pr-4 shadow-sm focus-visible:border-blue-400 focus-visible:ring-blue-100"
                />
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-4">
                {filteredServices.length === 0 ? (
                  <div className="rounded-3xl border border-stone-100 bg-appointza-cream/60/80 p-10 shadow-sm text-center space-y-4">
                    <Package className="h-12 w-12 mx-auto text-zinc-400 mb-2" aria-hidden />
                    <h3 className="text-lg font-semibold text-appointza-navy">No services available</h3>
                    <p className="text-stone-600 text-sm mb-4">Add your first service to get started!</p>
                    <Button
                      onClick={() => openServiceForm(undefined, false)}
                      className="rounded-2xl bg-white border border-stone-200 text-appointza-navy hover:border-orange-400 hover:bg-orange-50/50"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-stone-500">
                      {filteredServices.length} service{filteredServices.length === 1 ? "" : "s"}
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredServices.map((serviceItem) => {
                        const sub =
                          serviceItem.notes?.trim() ||
                          (serviceItem.Iscombo && serviceItem.servicesids?.combolist?.length
                            ? `Includes: ${serviceItem.servicesids.combolist
                                .map((c) => c.servicename)
                                .join(", ")}`
                            : "");
                        const s = getServicePriceSummary(serviceItem);
                        const baseRef = s.different ? Math.min(s.weekday, s.weekend) : s.weekday;
                        const hasOffer =
                          serviceItem.show_price !== false &&
                          s.offer > 0 &&
                          s.offer <
                            (s.different ? Math.min(s.weekday, s.weekend) : s.weekday);

                        const coverUrl = organizationServiceCardImageUrls[serviceItem.id];

                        return (
                          <article
                            key={serviceItem.id}
                            className="flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_10px_30px_-18px_rgba(39,72,154,0.28)] transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_18px_42px_-20px_rgba(56,80,170,0.34)]"
                          >
                            {/* Hero image / gradient (matches reference card) */}
                            <div className="relative h-44 w-full overflow-hidden bg-gradient-coral">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={serviceItem.Servicename}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    // Hide the image if it fails; gradient remains.
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/80" aria-hidden>
                                  <Package className="h-10 w-10" />
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" aria-hidden />
                            </div>

                            <div className="flex flex-1 flex-col p-6">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                  {serviceItem.Iscombo ? "Combo" : "Service"}
                                </span>

                                {serviceItem.show_price !== false && (
                                  <span className="text-sm font-semibold tabular-nums text-appointza-navy">
                                    {hasOffer ? (
                                      <>
                                        <span className="mr-1 font-normal text-stone-400 line-through">
                                          ₹{baseRef.toLocaleString("en-IN")}
                                        </span>
                                        ₹{s.offer.toLocaleString("en-IN")}
                                      </>
                                    ) : !s.different ? (
                                      <>From ₹{s.weekday.toLocaleString("en-IN")}</>
                                    ) : (
                                      <>
                                        ₹{s.weekday.toLocaleString("en-IN")}
                                        <span className="mx-1 font-normal text-stone-400">·</span>
                                        ₹{s.weekend.toLocaleString("en-IN")}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xl font-semibold leading-snug text-appointza-navy">
                                {serviceItem.Servicename}
                              </h3>

                              {sub ? (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">
                                  {sub}
                                </p>
                              ) : null}

                              <div className="mt-4 flex items-center gap-2 text-sm text-stone-600">
                                <Clock className="h-4 w-4 text-stone-400" aria-hidden />
                                <span>
                                  {serviceItem.timetaken ? `${serviceItem.timetaken} min` : "Set duration"}
                                </span>
                              </div>

                              <div className="mt-6 flex w-full gap-2">
                                <button
                                  type="button"
                                  className="flex-1 min-w-0 rounded-2xl border border-stone-200 bg-white py-3 font-medium text-appointza-navy transition-colors hover:bg-stone-50"
                                  onClick={() => openServiceForm(serviceItem, serviceItem.Iscombo)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="shrink-0 rounded-2xl border border-stone-200 bg-white px-4 py-3 font-medium text-stone-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  aria-label="Delete service"
                                  onClick={() => requestDeleteService(serviceItem)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="size-5 animate-spin mx-0.5" aria-hidden />
                                  ) : (
                                    <Trash className="size-5" aria-hidden />
                                  )}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
          </TabsContent>

          <TabsContent value="events" className="mt-0 px-6 md:px-8 py-6 space-y-6 focus-visible:outline-none">
            <div className="space-y-4">
                <div className="flex w-full flex-col lg:flex-row lg:items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearchTerm}
                      onChange={(e) => setEventSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 h-12 rounded-2xl bg-white border-stone-100 shadow-sm focus-visible:ring-orange-500/25 focus-visible:border-orange-400"
                    />
                  </div>
                  <div className="flex w-full flex-col sm:flex-row gap-3 sm:w-auto shrink-0">
                    <div className="w-full sm:w-44">
                      <Select
                        value={eventDateFilter}
                        onValueChange={(value) =>
                          setEventDateFilter(value as "all" | "past" | "today" | "future")
                        }
                      >
                        <SelectTrigger className="rounded-2xl h-11 border-stone-100 shadow-sm bg-white">
                          <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="future">Future</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-44">
                      <Select
                        value={eventPublicFilter}
                        onValueChange={(value) =>
                          setEventPublicFilter(value as "all" | "public" | "private")
                        }
                      >
                        <SelectTrigger className="rounded-2xl h-11 border-stone-100 shadow-sm bg-white">
                          <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All visibility</SelectItem>
                          <SelectItem value="public">Public only</SelectItem>
                          <SelectItem value="private">Private only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isLoadingEvents ? (
                  <div className="flex items-center justify-center h-64 rounded-xl border border-stone-100 bg-white">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" aria-hidden />
                    <span className="ml-3 text-stone-600">Loading eventsâ€¦</span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <Card className="border-stone-100 shadow-sm">
                    <CardContent className="py-14 text-center">
                      <Calendar className="h-14 w-14 mx-auto text-zinc-300 mb-4" aria-hidden />
                      <h3 className="text-lg font-semibold mb-2 text-appointza-navy">No events found</h3>
                      <p className="text-stone-600 mb-6 text-sm">
                        Try changing search, date, or visibility filters, or add a new event.
                      </p>
                      <Button
                        onClick={() => openEventForm()}
                        className="rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF6B9D] text-white hover:opacity-95"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <p className="text-sm text-stone-500">
                      {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredEvents.map((eventItem) => {
                        const img = organizationEventCardImageUrls[eventItem.id];
                        const soldOut =
                          eventItem.slot_limit > 0 &&
                          (eventItem.remainingslot ?? 0) <= 0;
                        const metaLine = formatOrganizationEventMetaLine(eventItem);
                        const whenBucket = getEventDateBucket(eventItem);
                        const whenBadge = eventWhenBadge(whenBucket);
                        const desc = eventItem.description?.trim() || "";
                        return (
                          <article
                            key={eventItem.id}
                            className="flex flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-[0_1px_12px_-4px_rgba(26,31,44,0.08)] transition-all hover:border-stone-200 hover:shadow-[0_10px_28px_-12px_rgba(26,31,44,0.18)]"
                          >
                            <div className="relative h-44 w-full overflow-hidden bg-gradient-coral shrink-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={eventItem.event_name || "Event"}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/80" aria-hidden>
                                  <Calendar className="h-10 w-10" />
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" aria-hidden />
                            </div>

                            <div className="flex flex-col flex-1 p-6">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="inline-flex items-center rounded-full bg-[#FFF0EB] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E85D4C]">
                                  {eventItem.event_type || "Event"}
                                </span>
                                {eventItem.entry_amount > 0 ? (
                                  <span className="text-sm font-semibold tabular-nums text-appointza-navy">
                                    From ₹{eventItem.entry_amount.toLocaleString("en-IN")}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-xl font-semibold mb-2 text-appointza-navy line-clamp-2">
                                {eventItem.event_name}
                              </h3>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${whenBadge.className}`}
                                >
                                  {whenBadge.label}
                                </span>
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                                    eventItem.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : eventItem.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {eventItem.status}
                                </span>
                                {eventItem.is_public ? (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-medium">
                                    Public
                                  </span>
                                ) : (
                                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                                    Private
                                  </span>
                                )}
                                {soldOut && (
                                  <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                                    Fully booked
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 mb-4 flex-1 min-h-0">
                                {metaLine ? (
                                  <p className="text-stone-600 text-sm leading-snug line-clamp-2">{metaLine}</p>
                                ) : null}
                                {desc ? (
                                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-5">{desc}</p>
                                ) : null}
                                {eventItem.slot_limit > 0 ? (
                                  <p className="text-xs text-stone-500">
                                    Availability:{" "}
                                    <span className="font-medium text-stone-700">
                                      {eventItem.remainingslot ?? 0} / {eventItem.slot_limit} slots
                                    </span>
                                  </p>
                                ) : null}
                                {eventItem.dress_code?.trim() ? (
                                  <p className="text-xs text-stone-500">
                                    Dress code:{" "}
                                    <span className="font-medium text-stone-700">{eventItem.dress_code}</span>
                                  </p>
                                ) : null}
                                {!metaLine &&
                                  !desc &&
                                  !(eventItem.slot_limit > 0) &&
                                  !eventItem.dress_code?.trim() ? (
                                  <p className="text-stone-400 text-sm italic">Details on booking page.</p>
                                ) : null}
                              </div>
                              <div className="mt-auto flex flex-col gap-2 w-full">
                                <button
                                  type="button"
                                  className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF6B9D] text-white py-4 rounded-2xl font-medium hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
                                  onClick={() => openEventForm(eventItem)}
                                >
                                  <Ticket className="size-4 shrink-0" aria-hidden />
                                  Manage event
                                </button>
                                <button
                                  type="button"
                                  className="w-full py-3 rounded-2xl font-medium bg-white border border-stone-200 text-stone-700 hover:border-[#FFD4CC] hover:bg-[#FFF8F5] hover:text-[#E85D4C] transition-colors inline-flex items-center justify-center gap-2"
                                  onClick={() => openEventBookingForm(eventItem)}
                                >
                                  <ClipboardList className="size-4 shrink-0" aria-hidden />
                                  Booking form
                                </button>
                                <button
                                  type="button"
                                  className="w-full py-3 rounded-2xl font-medium bg-white border border-stone-200 text-stone-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                                  onClick={() => requestDeleteEvent(eventItem)}
                                  disabled={isDeletingEvent}
                                >
                                  {isDeletingEvent ? (
                                    <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                                  ) : (
                                    <Trash className="size-4 shrink-0" aria-hidden />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
          </TabsContent>
        </Tabs>

        <ResponsiveEditSheet
          open={showAddForm || showEditForm}
          onOpenChange={() => {}}
          title={showEditForm ? "Edit service" : "Add new service"}
          subtitle={
            showEditForm ?
              "Update name, pricing, duration, and images for this service."
            : "Enter the details of the service you want to offer."
          }
          isEdit={showEditForm}
          saving={showEditForm ? isUpdating : isCreating}
          onCancel={closeServiceForm}
          onSave={() => void handleSaveService()}
          saveLabel={showEditForm ? "Save changes" : "Add service"}
        >
          <ServiceEditorFields
            service={service}
            onChange={setService}
            idPrefix={showEditForm ? "edit" : undefined}
            serviceImages={serviceImages}
            onServiceImagesChange={setServiceImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showComboForm}
          onOpenChange={() => {}}
          title="Create combo package"
          subtitle="Create a combo package by selecting multiple services."
          saving={isCreating}
          onCancel={closeServiceForm}
          onSave={() => void handleSaveService()}
          saveLabel="Create combo"
        >
          <ComboEditorFields
            service={service}
            onChange={setService}
            services={services}
            selectedComboServices={selectedComboServices}
            onSelectedComboServicesChange={setSelectedComboServices}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showAddEventForm && addEventStep === "details"}
          onOpenChange={() => {}}
          title="Add new event"
          subtitle="Step 1 of 2 — Enter event details, then set up the booking form."
          saving={isCreatingEvent}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEvent()}
          saveLabel="Create & set up booking form"
        >
          <EventDetailsFormFields
            event={event}
            setEvent={setEvent}
            idPrefix="event"
            toast={toast}
            eventImages={eventImages}
            onEventImagesChange={setEventImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showAddEventForm && addEventStep === "booking"}
          onOpenChange={() => {}}
          title={`Booking form — ${bookingFormEventName}`}
          subtitle="Step 2 of 2 — Add questions guests answer when booking this event online."
          saving={isSavingBookingForm}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEventBookingForm()}
          saveLabel="Save booking form"
        >
          {isLoadingBookingForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#E85D4C]" />
              <span className="text-sm text-stone-600">Loading booking form…</span>
            </div>
          ) : (
            <EventFormFieldsEditor
              idPrefix="services-create"
              fields={eventBookingFormFields}
              onChange={setEventBookingFormFields}
            />
          )}
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showEditEventForm}
          onOpenChange={() => {}}
          title="Edit event"
          subtitle="Make changes to the event details."
          isEdit
          saving={isUpdatingEvent}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEvent()}
          saveLabel="Save changes"
        >
          <EventDetailsFormFields
            event={event}
            setEvent={setEvent}
            idPrefix="edit-event"
            toast={toast}
            eventImages={eventImages}
            onEventImagesChange={setEventImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showEventBookingPanel}
          onOpenChange={() => {}}
          title={`Booking form — ${bookingFormEventName}`}
          subtitle="Questions guests answer when booking this event on your public page."
          saving={isSavingBookingForm}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEventBookingForm()}
          saveLabel="Save booking form"
        >
          {isLoadingBookingForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#E85D4C]" />
              <span className="text-sm text-stone-600">Loading booking form…</span>
            </div>
          ) : (
            <EventFormFieldsEditor
              idPrefix="services-edit"
              fields={eventBookingFormFields}
              onChange={setEventBookingFormFields}
            />
          )}
        </ResponsiveEditSheet>

        <AlertDialog
          open={deleteConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null);
          }}
        >
          <AlertDialogContent className="max-h-[min(90dvh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-3 overflow-y-auto rounded-3xl border-stone-100 p-4 md:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-appointza-navy">
                Delete {deleteConfirm?.kind === "service" ? "service" : "event"}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-stone-600">
                {deleteConfirm ? (
                  <>
                    <span className="font-medium text-appointza-navy">{deleteConfirm.name}</span>{" "}
                    will be permanently removed. This action cannot be undone.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={
                  deleteConfirm?.kind === "service" ? isDeleting : isDeletingEvent
                }
                className="min-h-11 w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              >
                {(deleteConfirm?.kind === "service" ? isDeleting : isDeletingEvent) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default OrganizationServices;
