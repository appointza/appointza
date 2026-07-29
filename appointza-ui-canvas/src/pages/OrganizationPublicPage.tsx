import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Phone, Star, Calendar } from "lucide-react";
import { OrganizationPageData, OrganizationPageResponse } from "@/models/organizationpage.model";

const OrganizationPublicPage = () => {
  const { organizationId } = useParams();
  const [searchParams] = useSearchParams();
  const [organizationData, setOrganizationData] = useState<OrganizationPageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to format time from TimeSpan
  const formatTime = (timeSpan: any) => {
    if (!timeSpan) return '';
    const hours = timeSpan.Hours.toString().padStart(2, '0');
    const minutes = timeSpan.Minutes.toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper function to get day name
  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || '';
  };

  useEffect(() => {
    // Check if data is passed via URL params (base64 encoded)
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      try {
        // Decode base64 data
        const decodedData = atob(dataParam);
        const parsedData: OrganizationPageResponse = JSON.parse(decodedData);
        
        if (parsedData.item && parsedData.item.length > 0) {
          setOrganizationData(parsedData.item[0]);
        }
      } catch (error) {
        console.error('Error parsing organization data:', error);
      }
    } else {
      // If no data in URL, you could fetch from API using organizationId
      // This is where you'd implement API call if needed
      console.log('Organization ID:', organizationId);
    }
    
    setLoading(false);
  }, [organizationId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Organization Not Found</h1>
          <p className="text-muted-foreground">The organization you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  const { locationdetail, organisationdetail, orgnaisatinservice, OrganisationServiceTiming } = organizationData;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{organisationdetail.name}</h1>
            {organisationdetail.tagline && (
              <p className="text-xl text-muted-foreground mb-6">{organisationdetail.tagline}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{locationdetail.city}, {locationdetail.state}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-current" />
                <span>Premium Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{locationdetail.name}</h3>
                  <p className="text-muted-foreground">
                    {locationdetail.addressline1}
                    {locationdetail.addressline2 && `, ${locationdetail.addressline2}`}
                  </p>
                  <p className="text-muted-foreground">
                    {locationdetail.city}, {locationdetail.state} {locationdetail.pincode}
                  </p>
                  <p className="text-muted-foreground">{locationdetail.country}</p>
                </div>
                {locationdetail.googlelocation && (
                  <Button variant="outline" className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Our Services</CardTitle>
                <CardDescription>
                  Professional services tailored to your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {orgnaisatinservice.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{service.Servicename}</h3>
                          {service.Iscombo && (
                            <Badge variant="secondary" className="mt-1">Combo Service</Badge>
                          )}
                        </div>
                        {service.show_price !== false && (
                          <div className="text-right">
                            {service.offerprize > 0 && service.offerprize < service.prize ? (
                              <div>
                                <span className="text-lg font-bold text-primary">₹{service.offerprize}</span>
                                <span className="text-sm text-muted-foreground line-through ml-2">₹{service.prize}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold">₹{service.prize}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.timetaken} minutes</span>
                        </div>
                        {service.code && (
                          <Badge variant="outline" className="text-xs">
                            {service.code}
                          </Badge>
                        )}
                      </div>
                      {service.Iscombo && service.servicesids.combolist.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Includes:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.servicesids.combolist.map((combo) => (
                              <Badge key={combo.id} variant="outline" className="text-xs">
                                {combo.servicename}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {OrganisationServiceTiming.map((timing) => (
                    <div key={timing.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{getDayName(timing.day_of_week)}</span>
                      <span className="text-muted-foreground">
                        {formatTime(timing.start_time)} - {formatTime(timing.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Book Appointment */}
            <Card>
              <CardHeader>
                <CardTitle>Book an Appointment</CardTitle>
                <CardDescription>
                  Schedule your visit with us today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </Button>
              </CardContent>
            </Card>

            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {organisationdetail.gstnumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Number:</span>
                    <span className="font-mono">{organisationdetail.gstnumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{organisationdetail.primarytypecode}</span>
                </div>
                {organisationdetail.secondarytypecode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{organisationdetail.secondarytypecode}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPublicPage;