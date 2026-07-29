
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Mock data
const mockOrganization = {
  id: "org1",
  name: "City Hospital",
  description: "A full-service hospital providing comprehensive healthcare services.",
  address: "123 Health Ave, Chennai",
  phone: "+91 9876543210",
  email: "contact@cityhospital.com",
  businessType: "hospital",
  template: {
    type: "classic",
    primaryColor: "#1AAFCC",
    secondaryColor: "#F04E98",
    showServices: true,
    showHours: true,
    showSpecializations: true,
    showLocation: true,
  },
  hours: {
    "Monday": "9:00 AM - 5:00 PM",
    "Tuesday": "9:00 AM - 5:00 PM",
    "Wednesday": "9:00 AM - 5:00 PM",
    "Thursday": "9:00 AM - 5:00 PM",
    "Friday": "9:00 AM - 5:00 PM",
    "Saturday": "10:00 AM - 2:00 PM",
    "Sunday": "Closed"
  },
  services: [
    { id: "s1", name: "General Checkup", price: 500, duration: 30, category: "General Medicine" },
    { id: "s2", name: "Cardiology Consultation", price: 1000, duration: 45, category: "Cardiology" },
    { id: "s3", name: "Pediatric Care", price: 700, duration: 40, category: "Pediatrics" },
    { id: "s4", name: "Dental Cleaning", price: 600, duration: 60, category: "Dental" },
    { id: "s5", name: "Orthopedic Consultation", price: 900, duration: 45, category: "Orthopedics" },
  ],
  specializations: [
    { id: "sp1", name: "Cardiology", description: "Heart care specialists" },
    { id: "sp2", name: "Neurology", description: "Brain and nervous system experts" },
    { id: "sp3", name: "Orthopedics", description: "Bone and joint specialists" },
    { id: "sp4", name: "Pediatrics", description: "Child healthcare" },
    { id: "sp5", name: "Dental", description: "Oral health services" },
  ],
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  }
};

const OrganizationTemplate = () => {
  const { orgId, templateType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("services");
  const [organization] = useState(mockOrganization); // In a real app, fetch based on orgId

  // Handle booking attempt
  const handleBookNow = (serviceId: string) => {
    if (isAuthenticated) {
      navigate(`/book?service=${serviceId}&org=${organization.id}`);
    } else {
      setShowLoginDialog(true);
    }
  };

  // Navigate to login page
  const navigateToLogin = () => {
    navigate('/login', { 
      state: { 
        from: `/org/template/${orgId}/${templateType}` 
      }
    });
  };

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number, address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodedAddress}`, '_blank');
  };

  // Format price in rupees
  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  // Group services by category
  const servicesByCategory = organization.services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, typeof organization.services>);

  // Get all unique categories
  const categories = Object.keys(servicesByCategory);

  // Classic Template
  const ClassicTemplate = () => (
    <div className="max-w-4xl mx-auto">
      <div 
        className="p-6 md:p-8 text-white rounded-t-lg" 
        style={{ backgroundColor: organization.template.primaryColor }}
      >
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="opacity-80 mt-2">{organization.description}</p>
      </div>
      
      <div className="bg-white shadow-md rounded-b-lg p-6 md:p-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            {organization.template.showServices && (
              <TabsTrigger value="services">Services</TabsTrigger>
            )}
            {organization.template.showSpecializations && (
              <TabsTrigger value="specializations">Specializations</TabsTrigger>
            )}
            {(organization.template.showHours || organization.template.showLocation) && (
              <TabsTrigger value="info">Hours & Location</TabsTrigger>
            )}
          </TabsList>
          
          {organization.template.showServices && (
            <TabsContent value="services" className="mt-6">
              {categories.map(category => (
                <div key={category} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">{category}</h3>
                  <div className="space-y-3">
                    {servicesByCategory[category].map(service => (
                      <Card key={service.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between text-sm">
                            <span>{service.duration} minutes</span>
                            <span className="font-medium">{formatPrice(service.price)}</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            onClick={() => handleBookNow(service.id)}
                            className="w-full"
                            style={{ 
                              backgroundColor: organization.template.secondaryColor,
                              color: "white" 
                            }}
                          >
                            Book Now
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          )}
          
          {organization.template.showSpecializations && (
            <TabsContent value="specializations" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organization.specializations.map(spec => (
                  <Card key={spec.id}>
                    <CardHeader>
                      <CardTitle>{spec.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{spec.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
          
          {(organization.template.showHours || organization.template.showLocation) && (
            <TabsContent value="info" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {organization.template.showHours && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Opening Hours</h3>
                    <div className="space-y-2">
                      {Object.entries(organization.hours).map(([day, time]) => (
                        <div key={day} className="flex justify-between p-2 border-b">
                          <span className="font-medium">{day}</span>
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {organization.template.showLocation && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Location</h3>
                    <p className="mb-4">{organization.address}</p>
                    <p className="mb-4">
                      <span className="font-medium">Phone:</span> {organization.phone}<br />
                      <span className="font-medium">Email:</span> {organization.email}
                    </p>
                    <Button 
                      onClick={() => openGoogleMaps(
                        organization.location.latitude, 
                        organization.location.longitude,
                        organization.address
                      )}
                    >
                      View on Map
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );

  // Modern Template
  const ModernTemplate = () => (
    <div className="max-w-4xl mx-auto">
      <div style={{ backgroundColor: organization.template.primaryColor }} className="h-32 relative rounded-t-lg">
        <div className="absolute -bottom-16 left-8 bg-white rounded-full p-4 shadow-lg">
          <svg viewBox="0 0 24 24" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" 
              fill={organization.template.secondaryColor} 
            />
          </svg>
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-b-lg pt-20 pb-6 px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-gray-600 mt-2">{organization.description}</p>
          
          <div className="flex gap-2 mt-4">
            {organization.specializations.slice(0, 3).map(spec => (
              <span 
                key={spec.id} 
                className="px-3 py-1 text-xs rounded-full" 
                style={{ 
                  backgroundColor: `${organization.template.secondaryColor}20`, // Using 20% opacity
                  color: organization.template.secondaryColor 
                }}
              >
                {spec.name}
              </span>
            ))}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            {organization.template.showServices && (
              <TabsTrigger value="services">Services</TabsTrigger>
            )}
            {organization.template.showSpecializations && (
              <TabsTrigger value="specializations">About</TabsTrigger>
            )}
            {(organization.template.showHours || organization.template.showLocation) && (
              <TabsTrigger value="info">Contact</TabsTrigger>
            )}
          </TabsList>
          
          {organization.template.showServices && (
            <TabsContent value="services">
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category}>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <span style={{ color: organization.template.secondaryColor }}>●</span>
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicesByCategory[category].map(service => (
                        <div 
                          key={service.id} 
                          className="flex flex-col justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <div className="flex justify-between my-2">
                              <span className="text-sm text-gray-500">{service.duration} min</span>
                              <span className="font-semibold">{formatPrice(service.price)}</span>
                            </div>
                          </div>
                          <Button 
                            className="mt-4"
                            style={{ 
                              backgroundColor: organization.template.secondaryColor,
                              color: "white"
                            }}
                            onClick={() => handleBookNow(service.id)}
                          >
                            Book Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
          
          {organization.template.showSpecializations && (
            <TabsContent value="specializations">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {organization.specializations.map(spec => (
                  <div 
                    key={spec.id} 
                    className="p-4 border rounded-lg"
                  >
                    <h3 className="font-medium text-lg mb-2">{spec.name}</h3>
                    <p className="text-gray-600">{spec.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
          
          {(organization.template.showHours || organization.template.showLocation) && (
            <TabsContent value="info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {organization.template.showHours && (
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <span style={{ color: organization.template.secondaryColor }}>●</span>
                      Hours
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(organization.hours).map(([day, time], i) => (
                        <div 
                          key={day} 
                          className={`flex justify-between p-2 ${
                            i % 2 === 0 ? 'bg-gray-50' : ''
                          } rounded`}
                        >
                          <span>{day}</span>
                          <span className="font-medium">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {organization.template.showLocation && (
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <span style={{ color: organization.template.secondaryColor }}>●</span>
                      Find Us
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="mb-3">{organization.address}</p>
                      <p className="mb-4">
                        <span className="font-medium">Phone:</span> {organization.phone}<br />
                        <span className="font-medium">Email:</span> {organization.email}
                      </p>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => openGoogleMaps(
                          organization.location.latitude, 
                          organization.location.longitude,
                          organization.address
                        )}
                      >
                        Get Directions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );

  // Minimalist Template
  const MinimalistTemplate = () => (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-8 md:p-12 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: organization.template.primaryColor }}>
          {organization.name}
        </h1>
        
        {organization.template.showSpecializations && (
          <p className="text-gray-500 mb-8">
            {organization.specializations.slice(0, 3).map(s => s.name).join(" • ")}
          </p>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-lg mx-auto">
          <TabsList className="grid grid-cols-3 mb-6">
            {organization.template.showServices && (
              <TabsTrigger value="services">Services</TabsTrigger>
            )}
            {organization.template.showSpecializations && (
              <TabsTrigger value="about">About</TabsTrigger>
            )}
            {(organization.template.showHours || organization.template.showLocation) && (
              <TabsTrigger value="info">Info</TabsTrigger>
            )}
          </TabsList>
          
          {organization.template.showServices && (
            <TabsContent value="services">
              <div className="space-y-8 max-w-md mx-auto">
                {categories.map(category => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-sm uppercase tracking-widest text-gray-500 text-center">
                      {category}
                    </h3>
                    {servicesByCategory[category].map(service => (
                      <div 
                        key={service.id} 
                        className="flex justify-between items-center border-b pb-4"
                      >
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium mb-2">{formatPrice(service.price)}</span>
                          <Button 
                            size="sm"
                            onClick={() => handleBookNow(service.id)}
                            style={{ 
                              backgroundColor: organization.template.secondaryColor,
                              color: "white"
                            }}
                          >
                            Book
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
          
          {organization.template.showSpecializations && (
            <TabsContent value="about">
              <div className="text-center space-y-6 max-w-md mx-auto">
                <p className="text-gray-600">{organization.description}</p>
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Specializations</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {organization.specializations.map(spec => (
                      <span 
                        key={spec.id} 
                        className="px-3 py-1 text-sm bg-gray-100 rounded-full"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
          
          {(organization.template.showHours || organization.template.showLocation) && (
            <TabsContent value="info">
              <div className="max-w-md mx-auto space-y-8">
                {organization.template.showHours && (
                  <div>
                    <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-3 text-center">Hours</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(organization.hours).map(([day, time]) => (
                        <div key={day} className="text-center">
                          <span className="font-medium">{day}: </span>
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {organization.template.showLocation && (
                  <div className="text-center">
                    <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-2">Location</h3>
                    <p className="mb-2">{organization.address}</p>
                    <p className="mb-4">
                      <span className="font-medium">Contact:</span> {organization.phone}<br />
                      <span className="font-medium">Email:</span> {organization.email}
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => openGoogleMaps(
                        organization.location.latitude, 
                        organization.location.longitude,
                        organization.address
                      )}
                    >
                      Directions
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );

  // Login dialog
  const LoginDialog = () => (
    <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            Please login to book an appointment with {organization.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Button 
            className="w-full" 
            onClick={navigateToLogin}
          >
            Login Now
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowLoginDialog(false)}
          >
            Continue Browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <LoginDialog />
      
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          Back
        </Button>
      </div>
      
      {templateType === "classic" ? (
        <ClassicTemplate />
      ) : templateType === "modern" ? (
        <ModernTemplate />
      ) : (
        <MinimalistTemplate />
      )}
    </div>
  );
};

export default OrganizationTemplate;
