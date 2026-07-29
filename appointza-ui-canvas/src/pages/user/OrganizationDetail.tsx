import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import UserLayout from "@/components/layout/UserLayout";
import { CalendarDays, ChevronLeft, Clock, MapPin, Phone, Star, Loader2, QrCode, Plus, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationServices } from "@/hooks/useOrganizationServices";
import { useStaff } from "@/hooks/useStaff";
import { useAppointments } from "@/hooks/useAppointments";

interface PaymentInfo {
  amount: number;
  qrUrl?: string;
}

interface SelectedService {
  id: number;
  name: string;
  price: number;
  duration: number;
  quantity: number;
}

// Dummy data for testing
const dummyOrganization = {
  id: 1,
  name: "City Medical Center",
  category: "Healthcare",
  about: "A comprehensive medical center providing quality healthcare services with experienced doctors and modern facilities.",
  address: "123 Health Street, Medical District, Chennai, Tamil Nadu",
  phone: "+91 98765 43210",
  email: "contact@citymedical.com",
  rating: 4.5,
  reviews: 128
};

const dummyServices = [
  {
    id: 1,
    name: "General Consultation",
    description: "General health checkup and consultation",
    price: 500,
    duration: 30
  },
  {
    id: 2,
    name: "Cardiology Consultation",
    description: "Heart specialist consultation",
    price: 1200,
    duration: 45
  },
  {
    id: 3,
    name: "Dental Checkup",
    description: "Complete dental examination",
    price: 800,
    duration: 60
  },
  {
    id: 4,
    name: "Blood Test",
    description: "Complete blood count and analysis",
    price: 300,
    duration: 15
  }
];

const dummyStaff = [
  {
    id: 1,
    name: "Dr. Priya Sharma"
  },
  {
    id: 2,
    name: "Dr. Rajesh Kumar"
  },
  {
    id: 3,
    name: "Dr. Meera Nair"
  }
];

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const organizationId = parseInt(id || "0");
  
  const { getOrganizationQuery } = useOrganizations();
  const { data: fetchedOrganization, isLoading: orgLoading } = getOrganizationQuery(organizationId);
  const { services: fetchedServices, isLoading: servicesLoading } = useOrganizationServices(organizationId);
  const { staff: fetchedStaff, isLoading: staffLoading } = useStaff(organizationId);
  const { createAppointment, isCreating } = useAppointments();
  
  // Use dummy data if real data is not available
  const organization = fetchedOrganization || dummyOrganization;
  const services = fetchedServices?.length > 0 ? fetchedServices : dummyServices;
  const staff = fetchedStaff?.length > 0 ? fetchedStaff : dummyStaff;
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const timeSlots = [
    { time: "9:00 AM", available: true },
    { time: "10:00 AM", available: true },
    { time: "11:00 AM", available: false },
    { time: "12:00 PM", available: true },
    { time: "1:00 PM", available: true },
    { time: "2:00 PM", available: false },
    { time: "3:00 PM", available: true },
    { time: "4:00 PM", available: true },
    { time: "5:00 PM", available: true },
    { time: "6:00 PM", available: false }
  ];

  const handleServiceToggle = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setSelectedServices(prev => {
      const existingIndex = prev.findIndex(s => s.id === serviceId);
      if (existingIndex >= 0) {
        // Remove service if quantity becomes 0
        return prev.filter(s => s.id !== serviceId);
      } else {
        // Add new service
        return [...prev, {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          quantity: 1
        }];
      }
    });
  };

  const handleQuantityChange = (serviceId: number, change: number) => {
    setSelectedServices(prev => 
      prev.map(service => {
        if (service.id === serviceId) {
          const newQuantity = Math.max(0, service.quantity + change);
          return newQuantity === 0 ? null : { ...service, quantity: newQuantity };
        }
        return service;
      }).filter(Boolean) as SelectedService[]
    );
  };

  const handleTimeSlotClick = (time: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to book an appointment",
        variant: "default",
      });
      navigate('/login', { state: { from: `/organization/${id}` } });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service first",
        variant: "destructive",
      });
      return;
    }

    setSelectedTime(time);

    // Generate payment information
    setPaymentInfo({
      amount: totalPrice,
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(`Payment for services at ${organization?.name} - ₹${totalPrice}`)
    });

    setShowPayment(true);
  };

  const handleBookingConfirm = () => {
    if (!user?.id || selectedServices.length === 0 || !selectedTime) return;

    // Parse the selected time
    const [timeStr, period] = selectedTime.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    let finalHours = hours;
    
    if (period === 'PM' && hours !== 12) {
      finalHours += 12;
    } else if (period === 'AM' && hours === 12) {
      finalHours = 0;
    }
    
    appointmentDate.setHours(finalHours, minutes || 0, 0, 0);

    createAppointment({
      userid: user.id,
      organizationid: organizationId,
      appoinmentdate: appointmentDate,
      fromtime: appointmentDate,
      totime: new Date(appointmentDate.getTime() + totalDuration * 60000),
      staffid: selectedStaff || 0,
      notes: `Booked services: ${selectedServices.map(s => `${s.name} (${s.quantity}x)`).join(', ')}`,
      isactive: true,
      createdby: user.id,
      createdon: new Date(),
      attributes: {
        servicelist: selectedServices.map(service => ({
          id: service.id,
          servicename: service.name,
          serviceprice: service.price,
          servicetimetaken: service.duration,
          iscombo: false
        }))
      }
    });

    setShowPayment(false);
    setSelectedServices([]);
    setSelectedStaff(null);
    setSelectedTime("");
  };

  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration * service.quantity), 0);

  if (orgLoading && !organization) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading organization details...</span>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6 p-4">
        <div>
          <Link 
            to="/explore" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Browse
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                  <span className="ml-1 text-sm">{dummyOrganization.rating} ({dummyOrganization.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {dummyOrganization.address}
                </div>
              </div>
            </div>
            <Button className="mt-4 md:mt-0">
              <Phone className="h-4 w-4 mr-2" />
              {dummyOrganization.phone}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>About {organization.name}</CardTitle>
                <CardDescription>{dummyOrganization.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>{dummyOrganization.about}</p>

                <div>
                  <h4 className="font-medium mb-3">Available Services</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {services.map((service) => {
                      const selectedService = selectedServices.find(s => s.id === service.id);
                      const isSelected = !!selectedService;
                      
                      return (
                        <div
                          key={service.id}
                          className={`p-3 border rounded-md transition-colors ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "hover:bg-muted/50 cursor-pointer"
                          }`}
                          onClick={() => !isSelected && handleServiceToggle(service.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{service.name}</span>
                                <span className="font-medium">₹{service.price}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {service.duration} min
                                </div>
                                {service.description && (
                                  <span className="text-xs text-muted-foreground">{service.description}</span>
                                )}
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(service.id, -1);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-6 text-center">
                                  {selectedService?.quantity || 0}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(service.id, 1);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedServices.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
                      <h5 className="font-medium mb-2">Selected Services:</h5>
                      <div className="space-y-1 text-sm">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between">
                            <span>{service.name} x{service.quantity}</span>
                            <span>₹{service.price * service.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                        <span>Total: {totalDuration} min</span>
                        <span>₹{totalPrice}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Our Medical Team</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {staff.map((person) => (
                      <div 
                        key={person.id} 
                        className={`flex flex-col items-center text-center p-2 rounded cursor-pointer transition-colors ${
                          selectedStaff === person.id ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedStaff(selectedStaff === person.id ? null : person.id)}
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-1">
                          <span className="text-lg font-medium">
                            {person.name ? person.name[0] : 'D'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{person.name || `Doctor ${person.id}`}</span>
                        <span className="text-xs text-muted-foreground">Doctor</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            {!showPayment ? (
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Book an Appointment</CardTitle>
                  <CardDescription>Select services, date, and time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">1. Select Services</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      {selectedServices.length > 0 ? 
                        `Selected: ${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} (${totalDuration} min, ₹${totalPrice})` : 
                        "Please select services from the list"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">2. Select a Date</h4>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border pointer-events-auto"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">3. Select a Time</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={slot.available ? "outline" : "ghost"}
                          className={`${slot.available ? "hover:border-primary" : "opacity-50"} ${
                            selectedTime === slot.time ? "border-primary bg-primary/5" : ""
                          }`}
                          disabled={!slot.available || selectedServices.length === 0}
                          onClick={() => handleTimeSlotClick(slot.time)}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Complete Payment</CardTitle>
                  <CardDescription>
                    {selectedServices.length > 0 && `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} - ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold mb-2">₹{paymentInfo?.amount}</p>
                    <div className="mb-4 p-4 bg-white border rounded-lg mx-auto w-48 h-48 flex items-center justify-center">
                      {paymentInfo?.qrUrl ? (
                        <img src={paymentInfo.qrUrl} alt="Payment QR Code" className="max-w-full" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <QrCode className="w-16 h-16 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">QR Code Loading...</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan the QR code to complete payment or use another payment method below
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={handleBookingConfirm}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        "Complete Booking"
                      )}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setShowPayment(false)}>
                      Back to Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default OrganizationDetail;
