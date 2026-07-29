import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Share2, ExternalLink, Calendar, Clock, MapPin, Phone, Mail, Users, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationLocation, OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import { getAppDomain } from "@/utils/environment";
import { generateSubdomainUrl } from "@/utils/slug.util";
import { buildOrganisationPublicSiteUrl } from "@/utils/orgPublicSiteUrl.util";

const BookingPagePreview = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const organizationId = user?.organisationid || 0;

  // API services
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);

  // State
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [encryptedUrl, setEncryptedUrl] = useState<string>('');
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [organisationDetails, setOrganisationDetails] = useState<Organisation | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');

  // Load locations
  const loadLocations  = useCallback(async () => {
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
      
      const response = await organisationLocationService.select(req);
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
  }, [isAuthenticated, organizationId, organisationLocationService, user?.locationid, toast]);

  // Load organization details
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

  // Load locations on component mount
  useEffect(() => {
    loadLocations();
    loadOrganisationDetails();
  }, [loadLocations, loadOrganisationDetails]);

  // Generate custom URL
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

  // Generate encrypted URL when location changes
  useEffect(() => {
    if (selectedLocationId > 0) {
      generateEncryptedUrl(selectedLocationId);
      
      // Generate custom URL
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        const customUrlGenerated = generateCustomUrl(selectedLocation);
        setCustomUrl(customUrlGenerated);
      }
    } else {
      setEncryptedUrl('');
      setCustomUrl('');
    }
  }, [selectedLocationId, locations, organisationDetails]);

  // Generate encrypted URL
  const generateEncryptedUrl = async (locationId: number) => {
    if (locationId > 0) {
      setIsGeneratingUrl(true);
      try {
        const selectedLocation = locations.find((loc) => loc.id === locationId);
        const url = buildOrganisationPublicSiteUrl({
          organisationName: organisationDetails?.name || "organization",
          areaName: selectedLocation?.name || "area",
          cityName: selectedLocation?.city || "city",
          stateName: selectedLocation?.state || "state",
          customUrl: selectedLocation?.customurl,
        });
        setEncryptedUrl(url);
        
        // Generate share message
        const locationName = selectedLocation?.city || 'this location';
        setShareMessage(`Book your appointment at ${locationName}!\n\nClick here to schedule: ${url}`);
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
  };

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
        // Fallback to copy if sharing fails
        copyUrlToClipboard();
      }
    } else {
      // Fallback to copy if sharing is not supported
      copyUrlToClipboard();
    }
  };

  // Get selected location
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Share Your Booking Page</h1>
            <p className="text-gray-600">Share this URL with your customers to allow them to book appointments.</p>
          </div>
        </div>

        {/* Location Selection */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Select Business Location</span>
            </CardTitle>
            <CardDescription>
              Choose the location for your booking page
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading locations...</span>
              </div>
            ) : locations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <Card
                    key={location.id}
                    className={`cursor-pointer transition-all ${
                      selectedLocationId === location.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <p className="text-sm text-gray-600">{location.city}, {location.country}</p>
                          {location.addressline1 && (
                            <p className="text-xs text-gray-500 mt-1">{location.addressline1}</p>
                          )}
                        </div>
                        {selectedLocationId === location.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Locations Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Please add a business location first to generate your booking page.
                </p>
                <Button 
                  onClick={() => window.location.href = '/organization/locations'}
                  variant="default"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking URL Section */}
        {selectedLocationId > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-green-600" />
                <span>Your Business Booking Link</span>
              </CardTitle>
              <CardDescription>
                Share this link with customers to let them book appointments at your {selectedLocation?.city || 'location'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* URL Display */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {isGeneratingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-mono text-gray-700 flex-1">
                      {encryptedUrl || 'Generating URL...'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={copyUrlToClipboard}
                    disabled={!encryptedUrl || isGeneratingUrl}
                    variant="outline"
                    className="flex-1 md:flex-none"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  
                  <Button
                    onClick={shareUrl}
                    disabled={!encryptedUrl || isGeneratingUrl}
                    variant="outline"
                    className="flex-1 md:flex-none"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>

                  <Button
                    onClick={() => window.open(encryptedUrl, '_blank')}
                    disabled={!encryptedUrl || isGeneratingUrl}
                    variant="default"
                    className="flex-1 md:flex-none"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>


                {/* Custom URL Section */}
                {customUrl && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <ExternalLink className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Custom Booking URL</span>
                    </div>
                    <div className="mb-3">
                      <div className="p-3 bg-white rounded border border-purple-200">
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-mono text-purple-700 flex-1">
                            {customUrl}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={copyCustomUrlToClipboard}
                        disabled={!customUrl}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      
                      <Button
                        onClick={() => window.open(`https://${customUrl}`, '_blank')}
                        disabled={!customUrl}
                        variant="default"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

     

        {/* Instructions */}
        <Card className="shadow-sm bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How to Use Your Booking Page</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Share the URL:</strong> Send the booking link to your customers via email, SMS, or social media</p>
              <p>• <strong>QR Code:</strong> Print the QR code and display it in your business for easy access</p>
              <p>• <strong>Website Integration:</strong> Embed the booking page on your website</p>
              <p>• <strong>Social Media:</strong> Share the link on your social media profiles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default BookingPagePreview;
