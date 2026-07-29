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
import { OrganisationLocation, OrganisationLocationSelectReq, UpdateLocationTemplateIdReq } from "@/models/organisationlocation.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationService } from "@/services/organisation.service";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import { environment, getAppDomain } from "@/utils/environment";
import { generateSubdomainUrl } from "@/utils/slug.util";
import { buildOrganisationPublicSiteUrl } from "@/utils/orgPublicSiteUrl.util";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

const templatesSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]";

const OrganizationTemplates = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
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
  const [encryptedUrl, setEncryptedUrl] = useState<string>('');
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [organisationDetails, setOrganisationDetails] = useState<Organisation | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');

  // Get organization ID from user context
  const organizationId = useMemo(() => {
    return user?.organisationid || 0;
  }, [user]);

  // Use fetched templates from ReferenceValue service
  const availableTemplates = useMemo(() => {
    return fetchedTemplates;
  }, [fetchedTemplates]);

  // API services
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);

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
        if (templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(templates[0].id as TemplateType);
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
      const req = new OrganisationLocationSelectReq();
      
      // If user has organisationid, use it; otherwise use locationid (for staff users)
      if (user?.organisationid && user.organisationid > 0) {
        req.organisationid = user.organisationid;
        console.log('🔍 Fetching locations for organization:', user.organisationid);
      } else if (user?.locationid && user.locationid > 0) {
        req.organisationlocationid = user.locationid;
        console.log('🔍 Fetching locations for staff location:', user.locationid);
      } else {
        console.log('⚠️ No organization or location ID found for user');
        setLocations([]);
        toast({
          title: "No Access",
          description: "No organization or location access found.",
          variant: "destructive"
        });
        return;
      }
      
      const response = await locationService.select(req);
      console.log('✅ Locations API response:', response);
      
      if (response && response.length > 0) {
        setLocations(response);
        setSelectedLocationId(response[0].id);
      } else {
        setLocations([]);
        toast({
          title: "No Locations",
          description: "No business locations found. Please add a location first.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, locationService, toast]);

  // Check if location already has a template using ReferenceValue service
  const checkExistingTemplate = async (locationId: number): Promise<ReferenceValue | null> => {
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
  };

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
  }, [organizationId, referenceValueService]);

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

  // Generate custom URL for booking page
  const generateCustomUrl = (location: OrganisationLocation) => {
    if (!organisationDetails || !location) return '';
    
    return generateSubdomainUrl(
      organisationDetails.name || 'organization',
      location.name || 'area',
      location.city || 'city',
      location.state || 'state',
      getAppDomain()
    );
  };

  // Generate encrypted URL for booking page
  const generateEncryptedUrl = useCallback(async (locationId: number) => {
    if (locationId > 0) {
      setIsGeneratingUrl(true);
      try {
        const location = locations.find((loc) => loc.id === locationId);
        const url = buildOrganisationPublicSiteUrl({
          organisationName: organisationDetails?.name || "organization",
          areaName: location?.name || "area",
          cityName: location?.city || "city",
          stateName: location?.state || "state",
          customUrl: location?.customurl,
        });
        setEncryptedUrl(url);
      } catch (error) {
        console.error('Error generating encrypted URL:', error);
        setEncryptedUrl('');
        toast({
          title: "Error",
          description: "Failed to generate booking URL",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingUrl(false);
      }
    } else {
      setEncryptedUrl('');
    }
  }, [toast, locations, organisationDetails]);

  // Copy URL to clipboard
  const copyUrlToClipboard = async () => {
    if (encryptedUrl) {
      try {
        await navigator.clipboard.writeText(encryptedUrl);
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

  // Copy custom URL to clipboard
  const copyCustomUrlToClipboard = async () => {
    if (customUrl) {
      try {
        await navigator.clipboard.writeText(customUrl);
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
    if (encryptedUrl && navigator.share) {
      try {
        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
        const locationName = selectedLocation?.city || 'this location';
        
        await navigator.share({
          title: 'Book Appointment - Appointza',
          text: `Book your appointment at ${locationName}!`,
          url: encryptedUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyUrlToClipboard();
      }
    } else {
      copyUrlToClipboard();
    }
  };

  // Load templates and locations on component mount
  useEffect(() => {
    fetchTemplates();
    fetchLocations();
    loadOrganisationDetails();
  }, [fetchTemplates, fetchLocations, loadOrganisationDetails]);

  // Generate booking URL when location changes
  useEffect(() => {
    if (selectedLocationId && selectedLocationId > 0) {
      generateEncryptedUrl(selectedLocationId);
      
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        const customUrlGenerated = generateCustomUrl(selectedLocation);
        setCustomUrl(customUrlGenerated);
      }
    } else {
      setEncryptedUrl('');
      setCustomUrl('');
    }
  }, [selectedLocationId, locations, organisationDetails, generateEncryptedUrl]);

  // Check for existing template when location changes
  useEffect(() => {
    if (selectedLocationId) {
      checkLocationTemplate(selectedLocationId);
    } else {
      setExistingTemplate(null);
    }
  }, [selectedLocationId, checkLocationTemplate]);


  const TemplatePreviews = () => {
    if (isLoadingTemplates) {
      return (
        <div className={cn(org.loading, "flex-col gap-2 py-8")}>
          <Loader2 className="h-8 w-8 animate-spin text-appointza-coral" />
          <span className="text-sm text-stone-600">Loading templates…</span>
        </div>
      );
    }

    if (availableTemplates.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-appointza-cream/40 py-10 text-center text-sm text-stone-500">
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
              "cursor-pointer overflow-hidden transition-all hover:border-stone-200 hover:shadow-md",
              selectedTemplate === template.id && "ring-2 ring-[#E85D4C] ring-offset-2",
            )}
            onClick={() => {
              setSelectedTemplate(template.id as TemplateType);
            }}
          >
            <div className="aspect-video bg-stone-100">
              {template.content && template.content.includes("<!DOCTYPE html>") ? (
                <div className="h-full w-full overflow-hidden">
                  <iframe
                    title={`${template.name} preview`}
                    srcDoc={template.content}
                    className="h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 pointer-events-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
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
                  "min-h-10 w-full",
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


  const HtmlTemplateRenderer = ({ templateContent }: { templateContent: string }) => {
    // Sample data for template rendering
    const sampleData = {
      organisationdetail: {
        name: "City Hospital",
        tagline: "Your Health, Our Priority"
      },
      locationdetail: {
        addressline1: "123 Health Avenue",
        addressline2: "Medical District",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        images: [1, 2, 3] // Sample image IDs
      },
      orgnaisatinservice: [
        { Servicename: "General Checkup", notes: "Complete health assessment", prize: 500, timetaken: 30 },
        { Servicename: "Cardiology Consultation", notes: "Heart health evaluation", prize: 1000, timetaken: 45 },
        { Servicename: "Pediatric Care", notes: "Child health services", prize: 700, timetaken: 40 }
      ],
      OrganisationServiceTiming: [
        { day_of_week: 1, start_time: "9:00 AM", end_time: "5:00 PM" },
        { day_of_week: 2, start_time: "9:00 AM", end_time: "5:00 PM" },
        { day_of_week: 3, start_time: "9:00 AM", end_time: "5:00 PM" },
        { day_of_week: 4, start_time: "9:00 AM", end_time: "5:00 PM" },
        { day_of_week: 5, start_time: "9:00 AM", end_time: "5:00 PM" },
        { day_of_week: 6, start_time: "10:00 AM", end_time: "2:00 PM" },
        { day_of_week: 7, start_time: "Closed", end_time: "Closed" }
      ],
      environment: {
        baseurl: environment.baseurl
      }
    };

    // Simple template replacement (in a real app, you'd use a proper template engine)
    let processedContent = templateContent;
    
    // Replace template variables with sample data
    processedContent = processedContent.replace(/\{\{organisationdetail\.name\}\}/g, sampleData.organisationdetail.name);
    processedContent = processedContent.replace(/\{\{organisationdetail\.tagline\}\}/g, sampleData.organisationdetail.tagline);
    processedContent = processedContent.replace(/\{\{locationdetail\.addressline1\}\}/g, sampleData.locationdetail.addressline1);
    processedContent = processedContent.replace(/\{\{locationdetail\.addressline2\}\}/g, sampleData.locationdetail.addressline2);
    processedContent = processedContent.replace(/\{\{locationdetail\.city\}\}/g, sampleData.locationdetail.city);
    processedContent = processedContent.replace(/\{\{locationdetail\.state\}\}/g, sampleData.locationdetail.state);
    processedContent = processedContent.replace(/\{\{locationdetail\.pincode\}\}/g, sampleData.locationdetail.pincode);
    processedContent = processedContent.replace(/\{\{environment\.baseurl\}\}/g, sampleData.environment.baseurl);

    // Handle services loop
    const servicesHtml = sampleData.orgnaisatinservice.map(service => 
      `<div class="service-card">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h4 class="fw-bold mb-2">${service.Servicename}</h4>
            <p class="text-muted mb-3">${service.notes}</p>
          </div>
          <div class="col-md-4 text-md-end">
            <div class="price mb-2">₹${service.prize}</div>
            <span class="badge">${service.timetaken} minutes</span>
          </div>
        </div>
      </div>`
    ).join('');
    processedContent = processedContent.replace(/\{\{#orgnaisatinservice\}\}[\s\S]*?\{\{\/orgnaisatinservice\}\}/g, servicesHtml);

    // Handle timing loop
    const timingHtml = sampleData.OrganisationServiceTiming.map(timing => {
      const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return `<div class="col-md-6 col-lg-4 mb-3">
        <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
          <span class="fw-semibold">${dayNames[timing.day_of_week]}</span>
          <span class="text-primary fw-semibold">${timing.start_time} - ${timing.end_time}</span>
        </div>
      </div>`;
    }).join('');
    processedContent = processedContent.replace(/\{\{#OrganisationServiceTiming\}\}[\s\S]*?\{\{\/OrganisationServiceTiming\}\}/g, timingHtml);

    // Handle location images
    const imagesHtml = sampleData.locationdetail.images.map((imageId, index) => 
      `<img src="${sampleData.environment.baseurl}/api/Files/Get?id=${imageId}" alt="Location Image" class="gallery-image">`
    ).join('');
    processedContent = processedContent.replace(/\{\{#each locationdetail\.images\}\}[\s\S]*?\{\{\/each\}\}/g, imagesHtml);

    return (
      <div className="w-full h-screen border rounded-lg overflow-hidden">
        <iframe
          srcDoc={processedContent}
          className="w-full h-full border-0"
          title="Template Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  };

  const TemplatePreview = () => {
    const selectedTemplateData = availableTemplates.find(t => t.id === selectedTemplate);
    
    if (!selectedTemplateData) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Please select a template to preview.</p>
        </div>
      );
    }
    
    // If it's an HTML template, render it
    if (selectedTemplateData?.content && selectedTemplateData.content.includes('<!DOCTYPE html>')) {
      return <HtmlTemplateRenderer templateContent={selectedTemplateData.content} />;
    }

    // Fallback to original preview for non-HTML templates
    const orgName = "City Hospital";
    const services = [
      { id: "s1", name: "General Checkup", price: 500, duration: 30 },
      { id: "s2", name: "Cardiology Consultation", price: 1000, duration: 45 },
      { id: "s3", name: "Pediatric Care", price: 700, duration: 40 }
    ];
    const specializations = [
      { id: "sp1", name: "Cardiology" },
      { id: "sp2", name: "Neurology" },
      { id: "sp3", name: "Orthopedics" }
    ];
    const hours = {
      "Monday": "9:00 AM - 5:00 PM",
      "Tuesday": "9:00 AM - 5:00 PM",
      "Wednesday": "9:00 AM - 5:00 PM",
      "Thursday": "9:00 AM - 5:00 PM",
      "Friday": "9:00 AM - 5:00 PM",
      "Saturday": "10:00 AM - 2:00 PM",
      "Sunday": "Closed"
    };
    const location = {
      address: "123 Health Ave, Chennai",
      coords: { latitude: 13.0827, longitude: 80.2707 }
    };

    // Classic Template
    if (selectedTemplate === "classic") {
      return (
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="p-6 text-white" 
            style={{ backgroundColor: primaryColor }}
          >
            <h2 className="text-3xl font-bold">{orgName}</h2>
            <p className="opacity-80">Healthcare Services</p>
          </div>
          
          <div className="p-6 space-y-6">
            {showServices && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Our Services</h3>
                <div className="space-y-3">
                  {services.map(service => (
                    <div key={service.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <span className="text-sm text-gray-500">{service.duration} min</span>
                      </div>
                      <div>
                        <span className="font-semibold">₹{service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showSpecializations && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Specializations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {specializations.map(spec => (
                      <li key={spec.id}>{spec.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showHours && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Opening Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(hours).map(([day, time]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium">{day}</span>
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {showLocation && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Location</h3>
                <p className="mb-2">{location.address}</p>
                <Button className="bg-gray-100 hover:bg-gray-200 text-gray-800">
                  View on Map
                </Button>
              </div>
            )}
            
            <Button 
              className="w-full mt-6"
              style={{ 
                backgroundColor: secondaryColor,
                color: "white"
              }}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      );
    }
    
    // Modern Template
    else if (selectedTemplate === "modern") {
      return (
        <div className="overflow-hidden rounded-lg border">
          <div style={{ backgroundColor: primaryColor }} className="h-20 relative">
            <div className="absolute -bottom-10 left-6 bg-white rounded-full p-3 shadow-md">
              <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" 
                  fill={secondaryColor} 
                />
              </svg>
            </div>
          </div>
          
          <div className="pt-12 px-6 pb-6">
            <h2 className="text-2xl font-bold">{orgName}</h2>
            <div className="flex gap-2 mt-1 mb-6">
              {specializations.slice(0, 3).map(spec => (
                <span 
                  key={spec.id} 
                  className="px-2 py-1 text-xs rounded" 
                  style={{ 
                    backgroundColor: `${secondaryColor}20`, // Using 20% opacity
                    color: secondaryColor 
                  }}
                >
                  {spec.name}
                </span>
              ))}
            </div>
            
            <div className="space-y-6">
              {showServices && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <span style={{ color: secondaryColor }}>●</span>
                    Our Services
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {services.map(service => (
                      <div key={service.id} className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                        <div className="font-semibold">₹{service.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showHours && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <span style={{ color: secondaryColor }}>●</span>
                      Hours
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(hours).map(([day, time], i) => (
                        <div 
                          key={day} 
                          className={`flex justify-between p-2 ${
                            i % 2 === 0 ? 'bg-gray-50' : ''
                          }`}
                        >
                          <span>{day}</span>
                          <span className="font-medium">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {showLocation && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <span style={{ color: secondaryColor }}>●</span>
                      Find Us
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="mb-2">{location.address}</p>
                      <Button 
                        variant="outline"
                        className="w-full"
                      >
                        Get Directions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full mt-4"
                style={{ 
                  backgroundColor: secondaryColor,
                  color: "white" 
                }}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Minimalist Template
    else {
      return (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>{orgName}</h2>
            {showSpecializations && (
              <p className="text-gray-500 mb-6">
                {specializations.map(s => s.name).join(" • ")}
              </p>
            )}
            
            <div className="max-w-md mx-auto space-y-8">
              {showServices && (
                <div>
                  <div className="space-y-4">
                    {services.map(service => (
                      <div 
                        key={service.id} 
                        className="flex justify-between border-b pb-3"
                      >
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                        <div className="font-medium">₹{service.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showHours && (
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Hours</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(hours).map(([day, time]) => (
                      <div key={day}>
                        <span className="font-medium">{day}: </span>
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showLocation && (
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-2">Location</h3>
                  <p>{location.address}</p>
                </div>
              )}
              
              <Button 
                className="w-full"
                style={{ 
                  backgroundColor: secondaryColor,
                  color: "white"
                }}
              >
                Schedule Appointment
              </Button>
            </div>
          </div>
        </div>
      );
    }
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
        {!embedded && (
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Templates & Booking Page</h1>
          </div>
        )}

        <div className="space-y-6">
          <Card className={cn(org.card, "overflow-hidden border-stone-100 bg-gradient-to-br from-[#FFF8F5] to-white")}>
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
                  className={cn(org.btnOutline, "min-h-10")}
                  onClick={() => navigate("/organization/template-builder")}
                >
                <PencilLine className="mr-2 h-4 w-4 text-[#E85D4C]" />
                Open AI builder
              </Button>
              <Button
                className={cn(org.btnPrimary, "min-h-10")}
                onClick={() => navigate("/organization/template-builder")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                New AI page
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(org.card, "border-stone-100")}>
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
                  <Loader2 className="h-6 w-6 animate-spin text-appointza-coral" />
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
                          "cursor-pointer transition-all hover:border-stone-200 hover:shadow-md",
                          selectedLocationId === location.id &&
                            "border-[#FFD4CC] bg-[#FFF8F5] ring-2 ring-[#E85D4C]",
                        )}
                        onClick={() => setSelectedLocationId(location.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0EB]">
                              <MapPin className="h-5 w-5 text-[#E85D4C]" />
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
                      className={cn(org.btnPrimary, "min-h-11 w-full sm:w-auto")}
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
                    className={cn(org.btnPrimary, "min-h-10")}
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

          {selectedLocationId && selectedLocationId > 0 ? (
            <Card className={cn(org.card, "border-stone-100")}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg text-appointza-navy sm:text-xl">
                  <span className={templatesSectionIconWrap}>
                    <ExternalLink className="h-5 w-5" />
                  </span>
                  Your booking link
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Share this URL for bookings at{" "}
                  {locations.find((loc) => loc.id === selectedLocationId)?.city || "your location"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-stone-100 bg-appointza-cream/50 p-4">
                    <div className="flex items-start gap-2">
                      {isGeneratingUrl ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#E85D4C]" />
                      ) : (
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                      )}
                      <span className="flex-1 break-all font-mono text-xs text-stone-700 sm:text-sm">
                        {encryptedUrl || "Generating URL…"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      onClick={copyUrlToClipboard}
                      disabled={!encryptedUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      onClick={shareUrl}
                      disabled={!encryptedUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      onClick={() => window.open(encryptedUrl, "_blank")}
                      disabled={!encryptedUrl || isGeneratingUrl}
                      className={cn(org.btnPrimary, "min-h-11 w-full sm:w-auto")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>

                  {customUrl ? (
                    <div className="mt-4 rounded-2xl border border-stone-100 bg-[#FFF8F5] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-[#E85D4C]" />
                        <span className="text-sm font-medium text-appointza-navy">Custom booking URL</span>
                      </div>
                      <div className="mb-3 rounded-2xl border border-stone-100 bg-white p-3">
                        <span className="break-all font-mono text-xs text-stone-700 sm:text-sm">{customUrl}</span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={copyCustomUrlToClipboard}
                          disabled={!customUrl}
                          variant="outline"
                          className={cn(org.btnOutline, "min-h-10 w-full sm:w-auto")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => window.open(`https://${customUrl}`, "_blank")}
                          disabled={!customUrl}
                          className={cn(org.btnPrimary, "min-h-10 w-full sm:w-auto")}
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

          <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/80">
            <CardContent className="p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-emerald-900 sm:text-lg">
                How to use your booking page
              </h3>
              <div className="space-y-2 text-xs text-emerald-800 sm:text-sm">
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
