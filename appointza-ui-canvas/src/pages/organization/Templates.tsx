import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Template, TemplateType } from "@/models/TemplateModels";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, Share2, ExternalLink, MapPin, CheckCircle, AlertCircle, Wand2, PencilLine, FileText } from "lucide-react";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { OrganisationLocation, UpdateLocationTemplateIdReq } from "@/models/organisationlocation.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import {
  buildTemplateBuilderPath,
} from "@/utils/organizationOnboarding.util";
import { OrganisationService } from "@/services/organisation.service";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import {
  buildOrganisationTemplateBookingUrl,
  buildOrganisationCustomUrlHost,
  buildOrganisationPublicSiteOriginFromHost,
} from "@/utils/orgPublicSiteUrl.util";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { EventService } from "@/services/event.service";
import { SiteDetailsItem } from "@/models/sitedetail.model";
import { renderSiteTemplateHtml } from "@/utils/templateRenderer.util";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { invalidatePublicSiteCacheForLocation } from "@/utils/publicSiteCache.util";

const templatesSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";

const OrganizationTemplates = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { isComplete, hasCustomDomain, hasServices, hasWebsite, hasTiming, nextStep } = useOnboardingStatus();
  const inOnboarding = !embedded && !isComplete && hasCustomDomain && hasServices;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Legacy ?view=booking — single screen now; drop the query param
  useEffect(() => {
    if (searchParams.get("tab") !== "templates" || !searchParams.get("view")) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("view");
        return n;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | string>("");
  const [primaryColor, setPrimaryColor] = useState("#1AAFCC");
  const [secondaryColor, setSecondaryColor] = useState("#F04E98");
  const [showServices, setShowServices] = useState(true);
  const [showHours, setShowHours] = useState(true);
  const [showSpecializations, setShowSpecializations] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  
  // Location selection state
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [existingTemplate, setExistingTemplate] = useState<ReferenceValue | null>(null);
  const [fetchedTemplates, setFetchedTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // Booking page URL (same location as template assignment)
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [organisationDetails, setOrganisationDetails] = useState<Organisation | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [previewSiteData, setPreviewSiteData] = useState<SiteDetailsItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Get organization ID from user context
  const organizationId = useMemo(() => {
    return user?.organisationid || 0;
  }, [user]);

  const { data: cachedLocations = [] } = useOrganisationLocations({
    organisationId: user?.organisationid || 0,
    staffLocationId: user?.locationid || 0,
    enabled: isAuthenticated,
  });

  // Use fetched templates from ReferenceValue service
  const availableTemplates = useMemo(() => {
    return fetchedTemplates;
  }, [fetchedTemplates]);

  // API services
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const siteDetailsService = useMemo(() => new SiteDetailsService(), []);
  const eventService = useMemo(() => new EventService(), []);

  const renderTemplatePreviewHtml = useCallback(
    (templateContent: string) => {
      if (!templateContent?.includes("<!DOCTYPE html")) {
        return templateContent;
      }
      if (!previewSiteData) {
        return templateContent;
      }
      return renderSiteTemplateHtml(templateContent, previewSiteData);
    },
    [previewSiteData],
  );

  // Fetch templates from ReferenceValue with referencetypeid = 5
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      console.log('🔍 Fetching templates from ReferenceValue with referencetypeid = 5');
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = 5;
      // IMPORTANT: only load templates for this organization
      req.organisationid = organizationId;
      
      const response = await referenceValueService.select(req);
      console.log('✅ Templates API response:', response);
      
      if (response && response.length > 0) {
        // Convert ReferenceValue to Template format
        const templates: Template[] = response.map((refValue: ReferenceValue) => ({
          id: refValue.id.toString(), // ReferenceValue.id
          name: refValue.displaytext,
          // `notes` stores the builder project JSON; show as description fallback
          description: refValue.notes || "",
          // `description` stores the generated HTML for public booking page
          content: refValue.description || "",
          isactive: refValue.isactive,
          previewImage: "/placeholder.svg",
        }));
        
        setFetchedTemplates(templates);
        console.log('✅ Converted templates:', templates);
        
        // Set the first template as selected if none is selected
        if (templates.length > 0) {
          setSelectedTemplate((current) => current || (templates[0].id as TemplateType));
        }
      } else {
        setFetchedTemplates([]);
        console.log('⚠️ No templates found');
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [organizationId, referenceValueService, toast]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = cachedLocations;
      if (response && response.length > 0) {
        setLocations(response);
        setSelectedLocationId(response[0].id);
      } else {
        setLocations([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cachedLocations, isAuthenticated]);

  // Check if location already has a template using ReferenceValue service
  const checkExistingTemplate = useCallback(async (locationId: number): Promise<ReferenceValue | null> => {
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = 5;
      // IMPORTANT: scope by organization so we don't read other org templates
      req.organisationid = organizationId;
      // Add location-specific filter if needed
      // You might need to add a custom field or use description/notes to store locationId
      
      const response = await referenceValueService.select(req);
      // Filter by location if you have location info in the template data
      // For now, return the first template or implement location-specific filtering
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('❌ Error checking existing template:', error);
      return null;
    }
  }, [organizationId, referenceValueService]);

  // Update location's templateid field using dedicated API
  const updateLocationTemplateId = async (locationId: number, templateId: string): Promise<boolean> => {
    try {
      console.log('🔗 Updating location templateid:', { locationId, templateId });
      
      // Use the template ID directly (it's already a number from ReferenceValue.id)
      const numericTemplateId = parseInt(templateId) || 0;
      
      console.log('🔢 Using template ID directly:', { original: templateId, numeric: numericTemplateId });
      
      // Use the dedicated API to update only the templateid
      const req = new UpdateLocationTemplateIdReq();
      req.organisationlocationid = locationId;
      req.templateid = numericTemplateId;
      
      const response = await locationService.updateLocationTemplateId(req);
      console.log('✅ Location templateid updated successfully:', response);
      
      if (response) {
        // Update the local state to reflect the change
        setLocations(prevLocations => 
          prevLocations.map(loc => 
            loc.id === locationId 
              ? { ...loc, templateid: numericTemplateId }
              : loc
          )
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error updating location templateid:', error);
      return false;
    }
  };

  // Update only the templateid in organisationlocation table
  const createOrUpdateTemplate = async () => {
    if (!selectedLocationId) {
      toast({
        title: "Error",
        description: "Please select a location first",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingTemplate(true);
    try {
      console.log('🔧 Updating templateid for location:', selectedLocationId);
      
      // Get the selected template ID
      const templateId = selectedTemplate;
      console.log('📋 Selected Template ID:', templateId);

      // Update only the location's templateid field
      const success = await updateLocationTemplateId(selectedLocationId, templateId);

      if (success) {
        invalidatePublicSiteCacheForLocation(selectedLocationId);
        toast({
          title: "Success",
          description: `Template ID ${templateId} has been assigned to location.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update template for location",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error updating location templateid:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // Check for existing template when location changes
  const checkLocationTemplate = useCallback(async (locationId: number) => {
    if (!locationId || !organizationId) return;
    
    try {
      const template = await checkExistingTemplate(locationId);
      setExistingTemplate(template);
    } catch (error) {
      console.error('❌ Error checking location template:', error);
      setExistingTemplate(null);
    }
  }, [checkExistingTemplate, organizationId]);

  // Load organisation details for booking page
  const loadOrganisationDetails = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return;
    
    try {
      const req = new OrganisationSelectReq();
      req.id = organizationId;
      const response = await organisationService.select(req);
      
      if (response && response.length > 0) {
        setOrganisationDetails(response[0]);
        console.log('✅ Organisation details loaded:', response[0]);
      }
    } catch (error) {
      console.error('❌ Error loading organisation details:', error);
    }
  }, [isAuthenticated, organizationId, organisationService]);

  // Custom URL host from organisationlocation.customurl + domainname in config.js
  const generateCustomUrl = (location: OrganisationLocation) => {
    if (!location) return "";
    return buildOrganisationCustomUrlHost({ customUrl: location.customurl });
  };

  // Generate booking URL for location (/template/{orgloctempid})
  const generateBookingUrl = useCallback(async (locationId: number) => {
    if (locationId > 0) {
      setIsGeneratingUrl(true);
      try {
        const selectedLocation = locations.find((loc) => loc.id === locationId);
        const url = buildOrganisationTemplateBookingUrl(selectedLocation?.orgloctempid);
        setBookingUrl(url);
        if (!url) {
          toast({
            title: "Booking link unavailable",
            description:
              "This location has no booking GUID yet. Run the orgloctempid backfill on the database, then refresh this page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error generating encrypted URL:', error);
        setBookingUrl('');
        toast({
          title: "Error",
          description: "Failed to generate booking URL",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingUrl(false);
      }
    } else {
      setBookingUrl('');
    }
  }, [locations, toast]);

  const openTemplateBuilder = (mode: "new" | "edit" = "new") => {
    if (!selectedLocationId) {
      navigate(buildTemplateBuilderPath(0));
      return;
    }
    navigate(
      buildTemplateBuilderPath(
        selectedLocationId,
        mode === "edit" && selectedTemplate ? Number(selectedTemplate) : undefined,
      ),
    );
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = async () => {
    if (bookingUrl) {
      try {
        await navigator.clipboard.writeText(bookingUrl);
        toast({
          title: "URL Copied",
          description: "Booking URL has been copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying URL:', error);
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  const customUrlOrigin = customUrl ? buildOrganisationPublicSiteOriginFromHost(customUrl) : "";

  // Copy custom URL to clipboard
  const copyCustomUrlToClipboard = async () => {
    if (customUrlOrigin) {
      try {
        await navigator.clipboard.writeText(customUrlOrigin);
        toast({
          title: "Custom URL Copied",
          description: "Custom booking URL has been copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying custom URL:', error);
        toast({
          title: "Error",
          description: "Failed to copy custom URL to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  // Share URL
  const shareUrl = async () => {
    if (bookingUrl && navigator.share) {
      try {
        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
        const locationName = selectedLocation?.city || 'this location';
        
        await navigator.share({
          title: 'Book Appointment - Appointza',
          text: `Book your appointment at ${locationName}!`,
          url: bookingUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyUrlToClipboard();
      }
    } else {
      copyUrlToClipboard();
    }
  };

  // During setup, send users without an assigned org template straight to the builder.
  useEffect(() => {
    if (embedded || isLoading || locations.length === 0 || !selectedLocationId) return;
    if (isComplete || hasWebsite) return;

    navigate(buildTemplateBuilderPath(selectedLocationId), { replace: true });
  }, [embedded, isLoading, isComplete, hasWebsite, locations, selectedLocationId, navigate]);

  // Load templates and locations on component mount
  useEffect(() => {
    fetchTemplates();
    fetchLocations();
    loadOrganisationDetails();
  }, [fetchTemplates, fetchLocations, loadOrganisationDetails]);

  // Generate booking URL when location changes
  useEffect(() => {
    if (selectedLocationId && selectedLocationId > 0) {
      generateBookingUrl(selectedLocationId);
      
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        const customUrlGenerated = generateCustomUrl(selectedLocation);
        setCustomUrl(customUrlGenerated);
      }
    } else {
      setBookingUrl('');
      setCustomUrl('');
    }
  }, [selectedLocationId, locations, organisationDetails, generateBookingUrl]);

  // Check for existing template when location changes
  useEffect(() => {
    if (selectedLocationId) {
      checkLocationTemplate(selectedLocationId);
    } else {
      setExistingTemplate(null);
    }
  }, [selectedLocationId, checkLocationTemplate]);

  // Load real location/org/services data for template preview (same renderer as public subdomain).
  useEffect(() => {
    if (!selectedLocationId || selectedLocationId <= 0) {
      setPreviewSiteData(null);
      return;
    }

    let cancelled = false;

    const loadPreviewData = async () => {
      setPreviewLoading(true);
      try {
        const siteResponse = await siteDetailsService.select(selectedLocationId);
        if (cancelled || !siteResponse?.length) {
          setPreviewSiteData(null);
          return;
        }

        const siteData = siteResponse[0];
        let publicEvents: unknown[] = [];
        try {
          const eventsResponse = await eventService.select({
            id: 0,
            organisation_id: siteData.organisationdetail?.id || organizationId,
            organisation_location_id: siteData.locationdetail?.id || selectedLocationId,
            status: "",
            is_public: true,
          });
          publicEvents = (eventsResponse || []).filter(
            (event: { is_public?: boolean }) => event?.is_public === true,
          );
        } catch {
          // events are optional for preview
        }

        if (!cancelled) {
          setPreviewSiteData({
            ...(siteData as SiteDetailsItem),
            events: publicEvents,
          } as SiteDetailsItem);
        }
      } catch (error) {
        console.error("Failed to load template preview data:", error);
        if (!cancelled) setPreviewSiteData(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreviewData();
    return () => {
      cancelled = true;
    };
  }, [selectedLocationId, siteDetailsService, eventService, organizationId]);


  const TemplatePreviews = () => {
    if (isLoadingTemplates) {
      return (
        <div className={cn(org.loading, "flex-col gap-2 py-8")}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-stone-600">Loading templates…</span>
        </div>
      );
    }

    if (availableTemplates.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-10 text-center text-sm text-stone-500 shadow-none">
          <p>No templates found. Use the builder above to create one.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {availableTemplates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              org.card,
              "cursor-pointer overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none transition-colors hover:border-blue-300 hover:shadow-none",
              selectedTemplate === template.id && "border-blue-500 ring-2 ring-blue-500 ring-offset-2",
            )}
            onClick={() => {
              setSelectedTemplate(template.id as TemplateType);
            }}
          >
            <div className="aspect-video bg-stone-100 overflow-hidden">
              {template.content && template.content.includes("<!DOCTYPE html>") ? (
                previewLoading && selectedLocationId ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <iframe
                    title={`${template.name} preview`}
                    srcDoc={renderTemplatePreviewHtml(template.content)}
                    className="h-full w-full border-0 pointer-events-none bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )
              ) : (
                <img
                  src={template.previewImage}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-appointza-navy">{template.name}</CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className={cn(
                  selectedTemplate === template.id ? org.btnPrimary : org.btnOutline,
                  "min-h-10 w-full rounded-xl border-stone-200 shadow-none",
                  selectedTemplate === template.id && "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template.id as TemplateType);
                }}
              >
                {selectedTemplate === template.id ? "Selected" : "Select"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };


  const TemplatePreview = () => {
    const selectedTemplateData = availableTemplates.find((t) => t.id === selectedTemplate);

    if (!selectedTemplateData) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>Please select a template to preview.</p>
        </div>
      );
    }

    if (!selectedLocationId) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-10 text-center text-sm text-stone-500 shadow-none">
          Select a location above to preview with your real business data.
        </div>
      );
    }

    if (previewLoading) {
      return (
        <div className={cn(org.loading, "flex-col gap-2 py-12")}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-stone-600">Loading preview…</span>
        </div>
      );
    }

    if (
      selectedTemplateData.content &&
      selectedTemplateData.content.includes("<!DOCTYPE html>")
    ) {
      return (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <iframe
            srcDoc={renderTemplatePreviewHtml(selectedTemplateData.content)}
            className="h-[min(70vh,720px)] w-full border-0"
            title="Template Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-gray-500">
        <p>This template has no HTML content to preview.</p>
      </div>
    );
  };

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={FileText}
          title="Templates & booking"
          description="Pick a location, choose a website template, assign it, and copy your booking link — all on one page."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-4 sm:space-y-6")}>
        {inOnboarding && (
          <div className={cn(!embedded && "org-page-section pb-0 pt-2 sm:pt-4")}>
            <OnboardingPageGuide
              compact
              stepId="website"
              hasCustomDomain={hasCustomDomain}
              hasServices={hasServices}
              hasWebsite={hasWebsite}
              hasTiming={hasTiming}
            />
            <p className="mt-3 text-sm text-stone-600">
              Save your page to link it to your location. Next you&apos;ll set business hours.
            </p>
          </div>
        )}

        {!embedded && (
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Templates & Booking Page</h1>
          </div>
        )}

        <div className="w-full space-y-6">
          <Card className={cn(org.card, "w-full overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="flex items-start gap-3">
                <div className={templatesSectionIconWrap}>
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                <h3 className="text-base font-semibold text-appointza-navy md:text-lg">
                  Create page with AI
                </h3>
                <p className="text-sm text-stone-500">
                  Copy the AI prompt, paste HTML from ChatGPT or Claude, and save — no drag-and-drop builder.
                </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:shrink-0">
                <Button
                  variant="outline"
                  className={cn(org.btnOutline, "min-h-10 rounded-xl border-stone-200 bg-white shadow-none")}
                  onClick={() => openTemplateBuilder("edit")}
                >
                <PencilLine className="mr-2 h-4 w-4 text-blue-600" />
                Open AI builder
              </Button>
              <Button
                className={cn(org.btnPrimary, "min-h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700")}
                onClick={() => openTemplateBuilder("new")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                New AI page
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(org.card, "rounded-2xl border-stone-200 bg-white shadow-none")}>
            <CardHeader className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-lg text-appointza-navy">
                <span className={templatesSectionIconWrap}>
                  <MapPin className="h-5 w-5" />
                </span>
                Select business location
              </CardTitle>
              <CardDescription className="text-stone-500">
                One location for both your public website template and booking link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className={cn(org.loading, "flex-col gap-2 py-8")}>
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-sm text-stone-600">Loading locations…</span>
                </div>
              ) : locations.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {locations.map((location) => (
                      <Card
                        key={location.id}
                        className={cn(
                          org.card,
                          "cursor-pointer rounded-2xl border-stone-200 bg-white shadow-none transition-colors hover:border-blue-300 hover:shadow-none",
                          selectedLocationId === location.id &&
                            "border-blue-500 bg-blue-50 ring-2 ring-blue-500",
                        )}
                        onClick={() => setSelectedLocationId(location.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-appointza-navy sm:text-base">
                                {location.name}
                              </h3>
                              <p className="truncate text-xs text-stone-500 sm:text-sm">
                                {location.city}, {location.country}
                              </p>
                              {location.templateid ? (
                                <p className="mt-1 text-xs text-emerald-600">Template assigned</p>
                              ) : null}
                            </div>
                            {selectedLocationId === location.id && (
                              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Button
                      onClick={createOrUpdateTemplate}
                      disabled={!selectedLocationId || !selectedTemplate || isCreatingTemplate}
                      className={cn(org.btnPrimary, "min-h-11 w-full rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700 sm:w-auto")}
                    >
                      {isCreatingTemplate ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        "Assign selected template to this location"
                      )}
                    </Button>
                    {selectedTemplate ? (
                      <p className="text-sm text-stone-600">
                        Selected:{" "}
                        <span className="font-medium text-appointza-navy">
                          {availableTemplates.find((t) => t.id === selectedTemplate)?.name || "Unknown"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-stone-300" />
                  <h3 className="mb-2 text-base font-medium text-appointza-navy">No locations found</h3>
                  <p className="mb-4 text-sm text-stone-500">
                    Add a business location first to use templates and booking links.
                  </p>
                  <Button
                    onClick={() => navigate("/organization/profile?tab=location")}
                    className={cn(org.btnPrimary, "min-h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700")}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Add location
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-1 text-lg font-semibold text-appointza-navy">Choose a template</h2>
            <p className="mb-4 text-sm text-stone-500">
              Select a design, then assign it to your location above.
            </p>
            <TemplatePreviews />
          </div>

          {selectedTemplate ? (
            <Card className={cn(org.card, "rounded-2xl border-stone-200 bg-white shadow-none")}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-lg text-appointza-navy sm:text-xl">
                  Live template preview
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Matches the public subdomain page — uses your selected location&apos;s real data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePreview />
              </CardContent>
            </Card>
          ) : null}

          {selectedLocationId && selectedLocationId > 0 ? (
            <Card className={cn(org.card, "rounded-2xl border-stone-200 bg-white shadow-none")}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg text-appointza-navy sm:text-xl">
                  <span className={templatesSectionIconWrap}>
                    <ExternalLink className="h-5 w-5" />
                  </span>
                  Your booking link
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Share link for bookings at{" "}
                  {locations.find((loc) => loc.id === selectedLocationId)?.city || "your location"}
                  {" "}
                  (uses location GUID)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-none">
                    <div className="flex items-start gap-2">
                      {isGeneratingUrl ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-600" />
                      ) : (
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                      )}
                      <span className="flex-1 break-all font-mono text-xs text-stone-700 sm:text-sm">
                        {bookingUrl || (isGeneratingUrl ? "Generating URL…" : "No booking GUID for this location")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      onClick={copyUrlToClipboard}
                      disabled={!bookingUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      onClick={shareUrl}
                      disabled={!bookingUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      onClick={() => window.open(bookingUrl, "_blank")}
                      disabled={!bookingUrl || isGeneratingUrl}
                      className={cn(org.btnPrimary, "min-h-11 w-full rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700 sm:w-auto")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>

                  {customUrl ? (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-none">
                      <div className="mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-appointza-navy">Custom booking URL</span>
                      </div>
                      <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3 shadow-none">
                        <span className="break-all font-mono text-xs text-stone-700 sm:text-sm">{customUrl}</span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={copyCustomUrlToClipboard}
                          disabled={!customUrl}
                          variant="outline"
                          className={cn(org.btnOutline, "min-h-10 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => customUrlOrigin && window.open(customUrlOrigin, "_blank")}
                          disabled={!customUrlOrigin}
                          className={cn(org.btnPrimary, "min-h-10 w-full rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700 sm:w-auto")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border border-stone-200 bg-white shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-appointza-navy sm:text-lg">
                How to use your booking page
              </h3>
              <div className="space-y-2 text-xs text-stone-600 sm:text-sm">
                <p>• Share the URL via email, SMS, or social media</p>
                <p>• Print a QR code and display it at your business</p>
                <p>• Embed the booking page on your website</p>
                <p>• Add the link to your social profiles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OrganizationPageShell>
  );
};

export default OrganizationTemplates;
