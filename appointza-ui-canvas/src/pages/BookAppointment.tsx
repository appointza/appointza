import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, MapPin, Clock, Star, Phone, Mail, Calendar, Users, RefreshCw, Loader2, AlertCircle, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { FilesService } from "@/services/files.service";
import { OrganisationDetail, OrganisationSelectReq } from "@/models/organisation.model";
import { ReferenceType, ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { OrgLocationReq, OrgLocationStaffResponse, Service, Timing } from "@/models/organisationlocation.model";
import { REFERENCETYPE } from "@/models/users.model";
import { DayOfWeekUtil } from "@/utils/dayofweek.util";
import {
  buildOrganisationCustomUrlHost,
  buildOrganisationPublicSiteOriginFromHost,
} from "@/utils/orgPublicSiteUrl.util";

const BookAppointment = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // API services
  const organisationService = useMemo(() => new OrganisationService(), []);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  // State
  const [organisations, setOrganisations] = useState<OrganisationDetail[]>([]);
  const [filteredOrganisations, setFilteredOrganisations] = useState<OrganisationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<number | null>(null);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<number | null>(null);
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceType[]>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<OrgLocationStaffResponse | null>(null);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<number | null>(null);
  const [selectedOrganisationLocationId, setSelectedOrganisationLocationId] = useState<number | null>(null);

  const getOrganizationUrl = (org: OrganisationDetail): string => {
    const host = buildOrganisationCustomUrlHost({ customUrl: org.organisationlocationcustomurl });
    if (!host) return "";
    return buildOrganisationPublicSiteOriginFromHost(host);
  };

  const getDisplayUrl = (org: OrganisationDetail): string => {
    return buildOrganisationCustomUrlHost({ customUrl: org.organisationlocationcustomurl });
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading organizations...');
      const req = new OrganisationSelectReq();
      const response = await organisationService.SelectOrganisationDetail(req);
      console.log('✅ Organizations API response:', response);
      
      if (response) {
        setOrganisations(response);
        setFilteredOrganisations(response);
      }
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [organisationService, toast]);

  // Load reference types
  const loadReferenceTypes = useCallback(async () => {
    try {
      console.log('🔍 Loading primary business types...');
      const req = new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      const response = await referenceValueService.select(req);
      console.log('✅ Primary business types API response:', response);
      
      if (response) {
        setPrimaryBusinessTypes(response);
      }
    } catch (error) {
      console.error('❌ Error loading primary business types:', error);
      toast({
        title: "Error",
        description: "Failed to load business types",
        variant: "destructive"
      });
    }
  }, [referenceValueService, toast]);

  // Load secondary types
  const loadSecondaryTypes = useCallback(async (primaryId: number) => {
    try {
      console.log('🔍 Loading secondary business types for primary:', primaryId);
      const req = new ReferenceValueSelectReq();
      req.parentid = primaryId;
      req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      
      const response = await referenceValueService.select(req);
      console.log('✅ Secondary business types API response:', response);
      
      if (response) {
        setSecondaryBusinessTypes(response);
      }
    } catch (error) {
      console.error('❌ Error loading secondary business types:', error);
      toast({
        title: "Error",
        description: "Failed to load secondary business types",
        variant: "destructive"
      });
    }
  }, [referenceValueService, toast]);

  // Load business details
  const loadBusinessDetails = useCallback(async (orgLocationId: number, organisationId?: number) => {
    try {
      console.log('🔍 Loading business details for location:', orgLocationId);
      
      // Find the organisation from the list to get organisationid if not provided
      let orgId = organisationId;
      if (!orgId) {
        const org = organisations.find(o => o.organisationlocationid === orgLocationId);
        if (org) {
          orgId = org.organisationid;
        }
      }
      
      const req = new OrgLocationReq();
      req.orglocid = orgLocationId;
      
      const response = await organisationLocationService.SelectlocationDetail(req);
      console.log('✅ Business details API response:', response);
      
      if (response && response.length > 0) {
        const locationDetail = new OrgLocationStaffResponse();
        const responseData = response[0];

        // Map properties
        locationDetail.BusinessName = responseData.BusinessName || '';
        locationDetail.StreetName = responseData.StreetName || '';
        locationDetail.Area = responseData.Area || '';
        locationDetail.City = responseData.City || '';
        locationDetail.State = responseData.State || '';
        locationDetail.PostalCode = responseData.PostalCode || '';

        // Map Services
        locationDetail.Services = responseData.Services?.map(service => {
          const s = new Service();
          s.ServiceName = service.ServiceName || '';
          s.Price = service.Price || 0;
          s.OfferPrice = service.OfferPrice || 0;
          s.Duration = service.Duration || 0;
          return s;
        }) || [];

        // Map Timings
        locationDetail.Timings = responseData.Timings?.map(timing => {
          const t = new Timing();
          t.Day = timing.Day || 0;
          t.StartTime = typeof timing.StartTime === 'string' 
            ? timing.StartTime 
            : String(timing.StartTime) || '';
          t.EndTime = typeof timing.EndTime === 'string' 
            ? timing.EndTime 
            : timing.EndTime 
              ? String(timing.EndTime) 
              : '';
          return t;
        }) || [];

        setSelectedBusiness(locationDetail);
        setSelectedOrganisationId(orgId || null);
        setSelectedOrganisationLocationId(orgLocationId);
        setShowBusinessDetails(true);
      }
    } catch (error) {
      console.error('❌ Error loading business details:', error);
      toast({
        title: "Error",
        description: "Failed to load business details",
        variant: "destructive"
      });
    }
  }, [organisationLocationService, toast, organisations]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...organisations];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(org => 
        org.organisationname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organisationlocationcity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organisationprimarytypecode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Primary type filter
    if (selectedPrimaryType) {
      filtered = filtered.filter(org => org.organisationprimarytype === selectedPrimaryType);
    }

    // Secondary type filter
    if (selectedSecondaryType) {
      filtered = filtered.filter(org => org.organisationsecondarytype === selectedSecondaryType);
    }

    setFilteredOrganisations(filtered);
  }, [organisations, searchTerm, selectedPrimaryType, selectedSecondaryType]);

  // Handle primary type selection
  const handlePrimaryTypeSelect = (typeId: number) => {
    setSelectedPrimaryType(typeId);
    setSelectedSecondaryType(null);
    loadSecondaryTypes(typeId);
  };

  // Handle secondary type selection
  const handleSecondaryTypeSelect = (typeId: number) => {
    setSelectedSecondaryType(typeId);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedPrimaryType(null);
    setSelectedSecondaryType(null);
    setSearchTerm('');
    setFilteredOrganisations(organisations);
  };

  // Helper functions
  const getDayName = (dayNumber: number): string => {
    return DayOfWeekUtil.getDayNameFromNumber(dayNumber);
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return timeString;
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
    loadReferenceTypes();
  }, [loadInitialData, loadReferenceTypes]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
                <p className="text-sm text-gray-600">Find and book services near you</p>
              </div>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by business name, location, or service type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Filter by Business Type</CardTitle>
                <CardDescription>
                  Select primary and secondary business types to narrow down your search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Primary Types */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Primary Business Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {primaryBusinessTypes.map((type) => (
                        <Button
                          key={type.id}
                          variant={selectedPrimaryType === type.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePrimaryTypeSelect(type.id)}
                          className="text-xs"
                        >
                          {type.displaytext}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Types */}
                  {selectedPrimaryType && secondaryBusinessTypes.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Secondary Business Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {secondaryBusinessTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={selectedSecondaryType === type.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSecondaryTypeSelect(type.id)}
                            className="text-xs"
                          >
                            {type.displaytext}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {(selectedPrimaryType || selectedSecondaryType || searchTerm) && (
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-gray-600">Loading services...</span>
          </div>
        ) : filteredOrganisations.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedPrimaryType || selectedSecondaryType
                  ? 'No services match your filters'
                  : 'No services available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedPrimaryType || selectedSecondaryType
                  ? 'Try adjusting your search criteria or filters'
                  : 'Check back later for available services'}
              </p>
              {(searchTerm || selectedPrimaryType || selectedSecondaryType) && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganisations.map((org) => (
              <Card key={org.organisationid} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Business Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {org.organisationimageid ? (
                        <img
                          src={filesService.get(org.organisationimageid)}
                          alt={org.organisationname}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Calendar className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {org.organisationname}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {org.organisationlocationcity}, {org.organisationlocationstate}
                      </p>
                      {org.organisationprimarytypecode && (
                        <Badge variant="secondary" className="text-xs">
                          {org.organisationprimarytypecode}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-4 text-sm text-gray-600">
                    <p>{org.organisationlocationaddressline1}</p>
                    <p>{org.organisationlocationpincode}</p>
                  </div>

                  {/* Organization URL */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={getOrganizationUrl(org)}
                          onClick={(e) => {
                            e.preventDefault();
                            // Use encoded URL for navigation
                            window.location.href = `/organization/${org.organisationid}`;
                          }}
                          className="text-xs text-appointza-teal hover:text-appointza-teal/80 hover:underline truncate"
                          title={`Visit ${org.organisationname}`}
                        >
                          {getDisplayUrl(org)}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <Button
                      onClick={() => loadBusinessDetails(org.organisationlocationid, org.organisationid)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => {
                        // Navigate to booking page
                        window.location.href = `/book-appointment/${org.organisationid}/${org.organisationlocationid}`;
                      }}
                      size="sm"
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Business Details Modal */}
      <Dialog open={showBusinessDetails} onOpenChange={setShowBusinessDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedBusiness?.BusinessName || 'Business Details'}
            </DialogTitle>
            <DialogDescription>
              Complete information about this business
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness && (
            <div className="space-y-6">
              {/* Address */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedBusiness.StreetName && `${selectedBusiness.StreetName}, `}
                    {selectedBusiness.Area}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedBusiness.City && `${selectedBusiness.City}, `}
                    {selectedBusiness.State && `${selectedBusiness.State}`}
                    {selectedBusiness.PostalCode && ` - ${selectedBusiness.PostalCode}`}
                  </p>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Services Offered
                </h4>
                {selectedBusiness.Services.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBusiness.Services.map((service, index) => (
                      <div key={index} className="bg-white border rounded-lg p-3">
                        <h5 className="font-medium text-gray-900">
                          {service.ServiceName || 'Unnamed Service'}
                        </h5>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Price: ₹{service.Price || 0}</span>
                          {service.OfferPrice > 0 && (
                            <span className="text-green-600">
                              Offer: ₹{service.OfferPrice}
                            </span>
                          )}
                          <span>Duration: {service.Duration || 0} mins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No services listed</p>
                )}
              </div>

              {/* Business Hours */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Business Hours
                </h4>
                {selectedBusiness.Timings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBusiness.Timings.map((timing, index) => (
                      <div key={index} className="flex justify-between items-center bg-white border rounded-lg p-3">
                        <span className="font-medium text-gray-900">
                          {getDayName(timing.Day)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatTime(timing.StartTime)} - {formatTime(timing.EndTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No timings available</p>
                )}
              </div>

              {/* Book Now Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowBusinessDetails(false);
                    // Navigate to booking page
                    if (selectedOrganisationId && selectedOrganisationLocationId) {
                      window.location.href = `/book-appointment/${selectedOrganisationId}/${selectedOrganisationLocationId}`;
                    } else {
                      toast({
                        title: "Error",
                        description: "Unable to book appointment. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full"
                  disabled={!selectedOrganisationId || !selectedOrganisationLocationId}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookAppointment;
