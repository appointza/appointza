import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash, 
  Loader2, 
  Home,
  Camera,
  X,
  Save,
  Search,
  Building2,
  Upload,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAppBaseUrl } from "@/utils/environment";
import { OrganisationLocation, OrganisationLocationSelectReq, OrganisationLocationDeleteReq } from "@/models/organisationlocation.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationService } from "@/services/organisation.service";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import { FilesService } from "@/services/files.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { LocationPicker } from "@/components/organization/LocationPicker";
import { GeocodingService } from "@/services/geocoding.service";
import { Capacitor } from "@capacitor/core";

// Component for handling authenticated image loading
const AuthenticatedImage = ({ imageId, alt, className, onError }: { 
  imageId: number; 
  alt: string; 
  className: string; 
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        // Get authentication token
        const userContext = localStorage.getItem('user_context');
        let authHeaders: Record<string, string> = {};
        
        if (userContext) {
          const user = JSON.parse(userContext);
          const token = user.accesstoken;
          if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
          }
        }
        
        // Use fetch directly for binary data
        const response = await fetch(filesService.getImageUrl(imageId), {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            ...authHeaders
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
          // Fallback: try direct URL without authentication
          setImageUrl(filesService.getImageUrl(imageId));
        }
      } catch (error) {
        console.error('❌ Error loading image:', error);
        setImageUrl('');
      } finally {
        setIsLoading(false);
      }
    };

    if (imageId) {
      loadImage();
    }
  }, [imageId, filesService]);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <div className="text-xs text-gray-500">ID: {imageId}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={onError}
    />
  );
};

const LocationsScreen = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user, isAuthenticated, userType } = useAuth();
  const organizationId = user?.organisationid || 1;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<OrganisationLocation | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Organization state
  const [organization, setOrganization] = useState<Organisation | null>(null);
  const [showOrgEditDialog, setShowOrgEditDialog] = useState(false);
  const [isUploadingOrgLogo, setIsUploadingOrgLogo] = useState(false);
  
  // Form state
  const [location, setLocation] = useState<OrganisationLocation>(new OrganisationLocation());
  const [isFromMap, setIsFromMap] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(() => getAppBaseUrl());
  const [isDefaultUrl, setIsDefaultUrl] = useState(true);
  const [images, setImages] = useState<number[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Pincode lookup state
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeTimeout, setPincodeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // API services
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  // ReferenceValue state for referencetypeid = 6
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [selectedReferenceValueIds, setSelectedReferenceValueIds] = useState<number[]>([]);
  

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const req = new OrganisationLocationSelectReq();
      req.organisationid = organizationId;
      
      const response = await locationService.select(req);
          
          
          setLocations(response || []);
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
  }, [organizationId, toast, locationService]);

  // Fetch ReferenceValues with referencetypeid = 6
  const fetchReferenceValues = useCallback(async () => {
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = 6;
      req.organisationid = organizationId;
      
      const response = await referenceValueService.select(req);
      setReferenceValues(response || []);
    } catch (error) {
      console.error('❌ Error fetching ReferenceValues:', error);
    }
  }, [organizationId, referenceValueService]);

  // Fetch organization details
  const fetchOrganization = useCallback(async () => {
    try {
      const req = new OrganisationSelectReq();
      req.id = organizationId;
      
      const response = await organisationService.select(req);
      if (response && response.length > 0) {
        const org = response[0];
        // Ensure attributes_json is properly set
        if (!org.attributes_json) {
          org.attributes_json = "{}";
        }
        setOrganization(org);
      }
    } catch (error) {
      console.error('❌ Error fetching organization:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organization details",
        variant: "destructive"
      });
    }
  }, [organizationId, organisationService, toast]);

  // Initialize on mount
  useEffect(() => {
    fetchLocations();
    fetchOrganization();
    fetchReferenceValues();
  }, [fetchLocations, fetchOrganization, fetchReferenceValues]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pincodeTimeout) {
        clearTimeout(pincodeTimeout);
      }
    };
  }, [pincodeTimeout]);

  // Generate Google Maps URL from lat/lon
  const generateGoogleMapsUrl = (latitude: number, longitude: number): string => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Handle location selection from map
  const handleLocationSelect = (locationData: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => {
    const googleMapsUrl = generateGoogleMapsUrl(locationData.latitude, locationData.longitude);
    
    setLocation(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      googlelocation: locationData.address,
      geolocation_url: googleMapsUrl,
      addressline1: locationData.address.split(',')[0] || locationData.address,
      city: locationData.city || prev.city,
      state: locationData.state || prev.state,
      country: locationData.country || prev.country,
      pincode: locationData.pincode || prev.pincode,
      locationname: locationData.address,
      locationcity: locationData.city || '',
      locationstate: locationData.state || '',
      locationcountry: locationData.country || '',
      locationpincode: locationData.pincode || '',
    }));
    setIsFromMap(true);
  };

  // Handle custom URL change
  const handleCustomUrlChange = (text: string) => {
    setCustomUrlInput(text);
    
    if (isDefaultUrl && text !== getAppBaseUrl()) {
      setIsDefaultUrl(false);
      const userInput = text.replace(getAppBaseUrl(), "");
      setCustomUrlInput(getAppBaseUrl() + userInput);
    }
    
    setLocation(prev => ({ ...prev, customurl: text }));
  };

  // Handle custom URL focus
  const handleCustomUrlFocus = () => {
    if (isDefaultUrl) {
      setIsDefaultUrl(false);
      setCustomUrlInput(getAppBaseUrl());
    }
  };

  // Pincode lookup functions
  const lookupPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;
    
    setIsLookingUpPincode(true);
    try {
      // Using a free pincode API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setLocation(prev => ({
          ...prev,
          city: postOffice.District || '',
          state: postOffice.State || '',
          country: postOffice.Country || 'India',
          pincode: pincode
        }));
        
        toast({
          title: "Location Found",
          description: `Auto-filled: ${postOffice.District}, ${postOffice.State}`,
        });
      } else {
        toast({
          title: "Pincode Not Found",
          description: "Please enter a valid 6-digit pincode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up pincode:", error);
      toast({
        title: "Lookup Failed",
        description: "Could not fetch location details. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUpPincode(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    // Clear existing timeout
    if (pincodeTimeout) {
      clearTimeout(pincodeTimeout);
    }
    
    // Set new timeout for debounced lookup
    const timeout = setTimeout(() => {
      if (value.length === 6) {
        lookupPincode(value);
      }
    }, 1000); // 1 second delay
    
    setPincodeTimeout(timeout);
  };

  // Validate form fields
  const validateFields = (): boolean => {
    const requiredFields = ['name', 'addressline1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(
      field => !location[field as keyof OrganisationLocation]?.toString().trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Handle save location
  const handleSave = async () => {
    if (!validateFields()) return;
    
    setIsLoading(true);
    try {
      const isNewLocation = !location.id || location.id === 0;
      // Helper function to convert Date to Date object (for model compatibility)
      const toDate = (date: Date | string | undefined): Date => {
        if (!date) return new Date();
        if (typeof date === 'string') return new Date(date);
        return date;
      };

      // Ensure latitude and longitude are properly converted to decimal numbers
      // Use parseFloat to preserve decimal precision (e.g., 13.1104768, not 13)
      const latitude = location.latitude != null ? parseFloat(String(location.latitude)) : 0;
      const longitude = location.longitude != null ? parseFloat(String(location.longitude)) : 0;
      
      console.log('📍 Location coordinates:', {
        original: { lat: location.latitude, lng: location.longitude },
        parsed: { latitude, longitude },
        types: { 
          latType: typeof latitude, 
          lngType: typeof longitude,
          latIsNumber: !isNaN(latitude),
          lngIsNumber: !isNaN(longitude)
        }
      });

      const locationToSave = {
        ...location,
        organisationid: organizationId,
        id: location.id || 0,
        // Persist without any whitespace (matches UI restriction).
        name: location.name?.replace(/\s+/g, "").trim() || '',
        addressline1: location.addressline1?.trim() || '',
        addressline2: location.addressline2?.trim() || '',
        city: location.city?.trim() || '',
        state: location.state?.trim() || '',
        country: location.country?.trim() || 'India',
        pincode: location.pincode?.trim() || '',
        customurl: location.customurl?.trim() || '',
        latitude: latitude,
        longitude: longitude,
        googlelocation: location.googlelocation?.trim() || '',
        geolocation_url: location.geolocation_url?.trim() || (latitude && longitude ? generateGoogleMapsUrl(latitude, longitude) : ''),
        images: images.slice(0, 5) || [],
        facility_list: selectedReferenceValueIds.map(id => Number(id)), // Ensure all IDs are numbers
        email: location.email?.trim() || '',
        whatsapp_mobile: location.whatsapp_mobile?.trim() || '',
        attributes: typeof location.attributes === 'object' && location.attributes ? location.attributes : {},
        isactive: true,
        version: isNewLocation ? 1 : (location.version || 1),
        createdby: isNewLocation ? (user?.id || 0) : (location.createdby || user?.id || 0),
        createdon: isNewLocation ? new Date() : toDate(location.createdon),
        modifiedby: user?.id || 0,
        modifiedon: new Date(),
        issuspended: false,
        isfactory: false,
        notes: location.notes?.trim() || ""
      };

      console.log('💾 Saving location:', locationToSave);
      console.log('🖼️ Images being sent:', images);
      console.log('🖼️ Images in locationToSave:', locationToSave.images);
      console.log('✅ Facility List being sent:', selectedReferenceValueIds);
      console.log('✅ Facility List in locationToSave:', locationToSave.facility_list);
      
      const response = await locationService.save(locationToSave);
      
      if (response) {
        toast({
          title: "Success",
          description: "Location saved successfully",
        });
        setShowAddDialog(false);
        setShowEditDialog(false);
        resetForm();
        fetchLocations();
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error: any) {
      console.error('❌ Error saving location:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.response?.data?.error || 
                         error?.message || 
                         'Failed to save location';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete location
  const handleDelete = async () => {
    if (!selectedLocation?.id) return;
    
    setIsLoading(true);
    try {
      const req = new OrganisationLocationDeleteReq();
      req.id = selectedLocation.id;
      
      const response = await locationService.delete(req);
      
      if (response) {
        toast({
          title: "Success",
          description: "Location deleted successfully",
        });
        setShowDeleteDialog(false);
        setSelectedLocation(null);
        fetchLocations();
      } else {
        throw new Error('Failed to delete location');
      }
    } catch (error: any) {
      console.error('❌ Error deleting location:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to delete location';
    toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setLocation(new OrganisationLocation());
    setImages([]);
    setIsFromMap(false);
    setCustomUrlInput(getAppBaseUrl());
    setIsDefaultUrl(true);
    setSelectedReferenceValueIds([]);
  };

  // Auto-get current location when adding new location
  const autoGetCurrentLocation = async () => {
    try {
      const geocodingService = new GeocodingService();
      
      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor Geolocation for native platforms
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          
          const permissionStatus = await Geolocation.requestPermissions();
          
          if (permissionStatus.location !== 'granted') {
            console.log('⚠️ Location permission not granted, user can select manually');
            return;
          }

          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          });

          const { latitude, longitude } = position.coords;
          console.log('✅ Auto-detected current location:', latitude, longitude);
          
          // Reverse geocode to get address
          const locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
          
          handleLocationSelect({
            latitude,
            longitude,
            address: locationDetails.address,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country,
            pincode: locationDetails.pincode
          });
        } catch (error: any) {
          console.warn('⚠️ Auto-location detection failed (native):', error);
          // Don't show error, user can select manually
        }
      } else {
        // Use browser geolocation for web
        if (!navigator.geolocation) {
          console.log('⚠️ Geolocation not supported');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('✅ Auto-detected current location (web):', latitude, longitude);
            
            // Reverse geocode to get address
            const locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
            
            handleLocationSelect({
              latitude,
              longitude,
              address: locationDetails.address,
              city: locationDetails.city,
              state: locationDetails.state,
              country: locationDetails.country,
              pincode: locationDetails.pincode
            });
          },
          (error) => {
            console.warn('⚠️ Auto-location detection failed (web):', error);
            // Don't show error, user can select manually
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      }
    } catch (error) {
      console.warn('⚠️ Error in auto-get location:', error);
      // Don't show error, user can select manually
    }
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
    // Automatically get current location when adding new location
    autoGetCurrentLocation();
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Check if we already have 5 images
    if (images.length >= 5) {
      toast({
        title: "Maximum Images",
        description: "You can only upload up to 5 images",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const response = await filesService.upload([file]);
      
      if (response && response.length > 0) {
        setImages(prev => [...prev, response[0]]);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // Open edit dialog
  const openEditDialog = (locationItem: OrganisationLocation) => {
    // Generate geolocation_url if lat/lon exist but URL is missing
    let locationToEdit = { ...locationItem };
    
    // Ensure latitude and longitude are properly parsed as decimal numbers when loading for edit
    // This ensures full precision is maintained even if database returns them as strings or integers
    if (locationToEdit.latitude != null) {
      locationToEdit.latitude = parseFloat(String(locationToEdit.latitude));
    }
    if (locationToEdit.longitude != null) {
      locationToEdit.longitude = parseFloat(String(locationToEdit.longitude));
    }
    
    if (locationToEdit.latitude && locationToEdit.longitude && !locationToEdit.geolocation_url) {
      locationToEdit.geolocation_url = generateGoogleMapsUrl(locationToEdit.latitude, locationToEdit.longitude);
    }
    
    console.log('📥 Loading location for edit:', {
      original: { lat: locationItem.latitude, lng: locationItem.longitude },
      parsed: { lat: locationToEdit.latitude, lng: locationToEdit.longitude }
    });
    
    setLocation(locationToEdit);
    setImages(locationToEdit.images || []);
    setIsFromMap(!!locationToEdit.googlelocation);
    setCustomUrlInput(locationToEdit.customurl || getAppBaseUrl());
    setIsDefaultUrl(!locationToEdit.customurl);
    
    // Load selected ReferenceValue IDs from facility_list
    const facilityList = locationToEdit.facility_list || [];
    console.log('📥 Loading facility_list for edit:', facilityList);
    setSelectedReferenceValueIds(facilityList.map(id => Number(id))); // Ensure all IDs are numbers
    
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (locationItem: OrganisationLocation) => {
    setSelectedLocation(locationItem);
    setShowDeleteDialog(true);
  };

  // Organization logo upload
  const handleOrgLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingOrgLogo(true);

    try {
      const response = await filesService.upload([file]);
      
      if (response && response.length > 0) {
        if (organization) {
          setOrganization(prev => prev ? { ...prev, organisationlogo: response[0] } : null);
        }
        toast({
          title: "Success",
          description: "Organization logo uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingOrgLogo(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // Save organization details
  const handleSaveOrganization = async () => {
    if (!organization) return;
    
    // Trim all string values before saving
    const updatedOrganization = {
      ...organization,
      // Trim all string fields
      name: organization?.name?.trim() || '',
      gstnumber: organization?.gstnumber?.trim() || '',
      primarytypecode: organization?.primarytypecode?.trim() || '',
      secondarytypecode: organization?.secondarytypecode?.trim() || '',
      notes: organization?.notes?.trim() || '',
      // Ensure booking amount is at least 5.10 only if it's below that value
      booking_amount: organization?.booking_amount < 5.10 ? 5.10 : (organization?.booking_amount || 5.10),
      // Ensure attributes_json is properly set as a JSON string
      attributes_json: organization?.attributes_json || "{}",
      // Also ensure attributes is set for backend compatibility
      attributes: organization?.attributes || new Organisation.AttributesData()
    };
    
    setIsLoading(true);
    try {
      await organisationService.update(updatedOrganization);
      toast({
        title: "Success",
        description: "Organization details updated successfully",
      });
      setShowOrgEditDialog(false);
      fetchOrganization(); // Refresh organization data
    } catch (error: any) {
      console.error('❌ Error updating organization:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update organization details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.addressline1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading && locations.length === 0) {
    return (
      <OrganizationPageShell embedded={embedded}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading locations...</span>
        </div>
      </OrganizationPageShell>
    );
  }

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={MapPin}
          title="Location"
          description="Manage your business locations and organization details."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-6")}>
        {!embedded && (
        <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold tracking-tight">Locations & Organization</h2>
            <p className="text-muted-foreground">
              Manage your business locations and organization details.
            </p>
          </div>
        </div>
        )}

        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-6">
            {/* Show form when adding or editing */}
            {(showAddDialog || showEditDialog) ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{showAddDialog ? 'Add Location' : 'Edit Location'}</CardTitle>
                      <CardDescription>
                        {showAddDialog ? 'Add a new business location with address details.' : 'Update the location details.'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setShowAddDialog(false);
                      setShowEditDialog(false);
                      resetForm();
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Location Name *</Label>
                        <Input
                          id="name"
                          value={location.name || ''}
                          // Disallow whitespace in location name (auto-strip spaces).
                          onChange={(e) =>
                            setLocation((prev) => ({
                              ...prev,
                              name: e.target.value.replace(/\s+/g, "").trim(),
                            }))
                          }
                          placeholder="Enter location name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="customurl">Custom URL</Label>
                        <Input
                          id="customurl"
                          value={customUrlInput}
                          onChange={(e) => handleCustomUrlChange(e.target.value.trim())}
                          onFocus={handleCustomUrlFocus}
                          placeholder="Enter custom URL (optional)"
                        />
                      </div>
                    </div>

                    {/* Location Picker Button */}
                    <div>
                      <Label>Location on Map</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLocationPicker(true)}
                        className="w-full sm:w-auto"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {location.latitude && location.longitude ? 'Update Location' : 'Select Location on Map'}
                      </Button>
                      {location.latitude && location.longitude && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Location set: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="addressline1">Building Details *</Label>
                      <Input
                        id="addressline1"
                        value={location.addressline1 || ''}
                        onChange={(e) => setLocation(prev => ({ ...prev, addressline1: e.target.value.trim() }))}
                        placeholder="Enter building number and name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="addressline2">Area Details</Label>
                      <Input
                        id="addressline2"
                        value={location.addressline2 || ''}
                        onChange={(e) => setLocation(prev => ({ ...prev, addressline2: e.target.value.trim() }))}
                        placeholder="Enter road name and area"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <div className="relative">
                          <Input
                            id="city"
                            value={location.city || ''}
                            onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value.trim() }))}
                            placeholder="Enter city"
                            disabled={isFromMap}
                            className={location.city ? "bg-green-50 border-green-300" : ""}
                          />
                          {location.city && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="state">State *</Label>
                        <div className="relative">
                          <Input
                            id="state"
                            value={location.state || ''}
                            onChange={(e) => setLocation(prev => ({ ...prev, state: e.target.value.trim() }))}
                            placeholder="Enter state"
                            disabled={isFromMap}
                            className={location.state ? "bg-green-50 border-green-300" : ""}
                          />
                          {location.state && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <div className="relative">
                          <Input
                            id="pincode"
                            value={location.pincode || ''}
                            onChange={(e) => {
                              const value = e.target.value.trim().replace(/\D/g, '').slice(0, 6);
                              setLocation(prev => ({ ...prev, pincode: value }));
                              handlePincodeChange(value);
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim().length === 6) {
                                lookupPincode(e.target.value.trim());
                              }
                            }}
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                          />
                          {isLookingUpPincode && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter pincode to auto-fill city, state, and country
                        </p>
                      </div>
                    </div>

                    {/* Location contact for booking notifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Location Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={location.email || ''}
                          onChange={(e) => setLocation(prev => ({ ...prev, email: e.target.value.trim() }))}
                          placeholder="location@example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Email for booking notifications at this location
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="whatsapp_mobile">WhatsApp / Mobile</Label>
                        <Input
                          id="whatsapp_mobile"
                          value={location.whatsapp_mobile || ''}
                          onChange={(e) => setLocation(prev => ({ ...prev, whatsapp_mobile: e.target.value.trim().replace(/\D/g, '').slice(0, 15) }))}
                          placeholder="10-digit mobile number"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Booking notifications sent to this number when someone books
                        </p>
                      </div>
                    </div>

                    {/* ReferenceValue Checkboxes (referencetypeid = 6) */}
                    {referenceValues.length > 0 && (
                      <div>
                        <Label>Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2 p-4 border rounded-lg">
                          {referenceValues.map((refValue) => (
                            <div key={refValue.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`refvalue-${refValue.id}`}
                                checked={selectedReferenceValueIds.includes(refValue.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedReferenceValueIds(prev => [...prev, refValue.id]);
                                  } else {
                                    setSelectedReferenceValueIds(prev => prev.filter(id => id !== refValue.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`refvalue-${refValue.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {refValue.displaytext || refValue.identifier}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image Display and Upload */}
                    <div>
                      <Label>Photos (max 5)</Label>
                      
                      {/* Existing Images */}
                      {images.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Current photos:</p>
                          <div className="flex flex-wrap gap-2">
                            {images.map((imageId, index) => (
                              <div key={imageId} className="relative">
                                <AuthenticatedImage
                                  imageId={imageId}
                                  alt={`Location image ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                                <button
                                  onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          {images.length >= 5 ? 'Maximum 5 photos reached' : `Add photos (${images.length}/5)`}
                        </p>
                        {images.length < 5 && (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="image-upload"
                              disabled={isUploadingImage}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              disabled={isUploadingImage}
                            >
                              {isUploadingImage ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Camera className="mr-2 h-4 w-4" />
                                  Add Photos
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setShowEditDialog(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {showAddDialog ? 'Saving...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {showAddDialog ? 'Save Location' : 'Update Location'}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Business Locations</h3>
                    <p className="text-muted-foreground">
                      Manage your business locations and addresses.
                    </p>
                  </div>
                  <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </div>

                {/* Search */}
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trim())}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Locations List */}
                {filteredLocations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No locations match your search." : "Add your first location to get started!"}
              </p>
              {!searchTerm && (
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>

            <div className="grid gap-4">
          {filteredLocations.map((locationItem) => (
            <Card key={locationItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Location Icon */}
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{locationItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {locationItem.addressline1}
                        {locationItem.addressline2 && `, ${locationItem.addressline2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locationItem.city}, {locationItem.state} {locationItem.pincode}
                      </p>
                      {locationItem.customurl && (
                        <p className="text-sm text-blue-600 mt-1">
                          <a href={locationItem.customurl} target="_blank" rel="noopener noreferrer">
                            {locationItem.customurl}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(locationItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(locationItem)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          </>
        )}
              </>
            )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Location</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          <TabsContent value="organization" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Organization Details</h3>
                <p className="text-muted-foreground">
                  Manage your organization information and branding.
                </p>
              </div>
              <Button onClick={() => setShowOrgEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Organization
              </Button>
            </div>

            {/* Organization Details Card */}
            {organization && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {organization?.name || 'Organization'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Organization Name</Label>
                      <p className="text-sm text-gray-600">{organization?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">GST Number</Label>
                      <p className="text-sm text-gray-600">{organization?.gstnumber || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Primary Type</Label>
                      <p className="text-sm text-gray-600">{organization?.primarytypecode || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Secondary Type</Label>
                      <p className="text-sm text-gray-600">{organization?.secondarytypecode || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Booking Amount</Label>
                      <p className="text-sm text-gray-600">₹{organization?.booking_amount || 0}</p>
                    </div>
                  </div>
                  
                  {organization?.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-gray-600">{organization?.notes}</p>
                    </div>
                  )}

                  {/* Organization Logo */}
                  <div>
                    <Label className="text-sm font-medium">Organization Logo</Label>
                    <div className="mt-2">
                      {organization?.organisationlogo ? (
                        <div className="flex items-center gap-4">
                          <AuthenticatedImage
                            imageId={organization?.organisationlogo || 0}
                            alt="Organization Logo"
                            className="w-20 h-20 rounded-lg object-cover border"
                          />
                       
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 mb-2">No logo uploaded</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('org-logo-upload')?.click()}
                            disabled={isUploadingOrgLogo}
                          >
                            {isUploadingOrgLogo ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Logo
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOrgLogoUpload}
                        className="hidden"
                        id="org-logo-upload"
                        disabled={isUploadingOrgLogo}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Edit Dialog */}
            <Dialog open={showOrgEditDialog} onOpenChange={setShowOrgEditDialog}>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Edit Organization Details</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Update your organization information and branding.
                  </DialogDescription>
                </DialogHeader>
                
                {organization && (
                  <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="org-name" className="text-sm sm:text-base">Organization Name</Label>
                        <Input
                          id="org-name"
                          value={organization?.name || ''}
                          onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value.trim() } : null)}
                          placeholder="Enter organization name"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="org-gst" className="text-sm sm:text-base">GST Number</Label>
                        <Input
                          id="org-gst"
                          value={organization?.gstnumber || ''}
                          onChange={(e) => setOrganization(prev => prev ? { ...prev, gstnumber: e.target.value.trim() } : null)}
                          placeholder="Enter GST number"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="org-primary-type" className="text-sm sm:text-base">Primary Type Code</Label>
                        <Input
                          id="org-primary-type"
                          value={organization?.primarytypecode || ''}
                          onChange={(e) => setOrganization(prev => prev ? { ...prev, primarytypecode: e.target.value.trim() } : null)}
                          placeholder="Enter primary type code"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="org-secondary-type" className="text-sm sm:text-base">Secondary Type Code</Label>
                        <Input
                          id="org-secondary-type"
                          value={organization?.secondarytypecode || ''}
                          onChange={(e) => setOrganization(prev => prev ? { ...prev, secondarytypecode: e.target.value.trim() } : null)}
                          placeholder="Enter secondary type code"
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="org-booking-amount" className="text-sm sm:text-base">Booking Amount (Minimum: ₹5.10)</Label>
                        <Input
                          id="org-booking-amount"
                          type="number"
                          step="0.01"
                          min="5.10"
                          value={organization?.booking_amount || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value.trim()) || 0;
                            // Allow any value to be typed, validation happens on save
                            setOrganization(prev => prev ? { ...prev, booking_amount: value } : null);
                          }}
                          placeholder="Enter booking amount (minimum ₹5.10)"
                          className={`h-10 sm:h-11 ${organization && organization.booking_amount < 5.10 && organization.booking_amount > 0 ? "border-red-500" : ""}`}
                        />
                        {organization && organization.booking_amount < 5.10 && organization.booking_amount > 0 && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1">
                            Amount must be at least ₹5.10
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="org-notes" className="text-sm sm:text-base">Notes</Label>
                      <Textarea
                        id="org-notes"
                        value={organization?.notes || ''}
                        onChange={(e) => setOrganization(prev => prev ? { ...prev, notes: e.target.value.trim() } : null)}
                        placeholder="Enter organization notes or description (paragraph)"
                        rows={4}
                        className="resize-y text-sm sm:text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add a paragraph or description about your organization. This will be stored in the organization notes field.
                      </p>
                    </div>

                    {/* Organization Logo Upload in Edit Dialog */}
                    <div>
                      <Label className="text-sm sm:text-base font-medium">Organization Logo</Label>
                      <div className="mt-2">
                        {organization?.organisationlogo ? (
                          <div className="flex items-center gap-4">
                            <AuthenticatedImage
                              imageId={organization?.organisationlogo || 0}
                              alt="Organization Logo"
                              className="w-20 h-20 rounded-lg object-cover border"
                            />
                            <div>
                              <p className="text-sm text-gray-600">Logo ID: {organization?.organisationlogo}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('org-logo-upload-edit')?.click()}
                                disabled={isUploadingOrgLogo}
                                className="mt-2"
                              >
                                {isUploadingOrgLogo ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Change Logo
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-2">No logo uploaded</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('org-logo-upload-edit')?.click()}
                              disabled={isUploadingOrgLogo}
                            >
                              {isUploadingOrgLogo ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Logo
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOrgLogoUpload}
                          className="hidden"
                          id="org-logo-upload-edit"
                          disabled={isUploadingOrgLogo}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowOrgEditDialog(false)}
                    className="w-full sm:w-auto h-10 sm:h-11"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveOrganization} 
                    disabled={isLoading || (organization && organization.booking_amount < 5.10 && organization.booking_amount > 0)}
                    className="w-full sm:w-auto h-10 sm:h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Location Picker Dialog */}
        <LocationPicker
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </OrganizationPageShell>
  );
};

export default LocationsScreen;