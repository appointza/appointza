import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import UserLayout from "@/components/layout/UserLayout";
import { CalendarDays, Check, Loader2, Plus, Minus, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationServices } from "@/hooks/useOrganizationServices";
import { useStaff } from "@/hooks/useStaff";
import { useAppointments } from "@/hooks/useAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";

interface SelectedService {
  id: number;
  name: string;
  price: number;
  duration: number;
  quantity: number;
}

const BookAppointment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Leave request states
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [hasLeaveRequests, setHasLeaveRequests] = useState(false);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(5);
  
  const { services, isLoading: servicesLoading } = useOrganizationServices(selectedOrgId || undefined);
  const { staff, isLoading: staffLoading } = useStaff(selectedOrgId || undefined);
  const { createAppointment, isCreating } = useAppointments();
  
  // API service
  const organisationServiceTimingService = useMemo(() => new OrganisationServiceTimingService(), []);
  
  const availableTimes = [
    "9:00 AM", "10:00 AM", "11:00 AM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  // Convert date for API
  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate;
  };

  // Load leave requests
  const loadLeaveRequests = useCallback(async () => {
    if (!selectedOrgId) return;

    try {
      const req = {
        organisationid: selectedOrgId,
        organisationlocationid: 1, // Default location ID
        appointmentdate: selectedDate ? sendToApi(selectedDate) : sendToApi(new Date())
      };

      const response = await organisationServiceTimingService.getLeaveRequests(req);
      
      if (response && response.length > 0) {
        setLeaveRequests(response);
        setHasLeaveRequests(true);
        console.log('✅ Leave requests loaded:', response);
      } else {
        setLeaveRequests([]);
        setHasLeaveRequests(false);
      }
    } catch (error) {
      console.error('❌ Error loading leave requests:', error);
    }
  }, [selectedOrgId, selectedDate, organisationServiceTimingService]);

  // Get leave info for a specific date
  const getLeaveInfoForDate = useCallback((date: Date) => {
    if (!hasLeaveRequests || leaveRequests.length === 0) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    return leaveRequests.find(leave => {
      const leaveDate = new Date(leave.appointmentdate).toISOString().split('T')[0];
      return leaveDate === dateString;
    });
  }, [hasLeaveRequests, leaveRequests]);

  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration * service.quantity), 0);

  const handleServiceToggle = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setSelectedServices(prev => {
      const existingIndex = prev.findIndex(s => s.id === serviceId);
      if (existingIndex >= 0) {
        // Remove service if it exists
        return prev.filter(s => s.id !== serviceId);
      } else {
        // Add new service
        return [...prev, {
          id: service.id,
          name: service.Servicename,
          price: service.offerprize,
          duration: service.timetaken,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrgId || selectedServices.length === 0 || !selectedDate || !selectedTime || !user?.id) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const [timeStr, period] = selectedTime.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    let finalHours = hours;
    
    if (period === 'PM' && hours !== 12) {
      finalHours += 12;
    } else if (period === 'AM' && hours === 12) {
      finalHours = 0;
    }
    
    appointmentDate.setHours(finalHours, minutes, 0, 0);
    
    createAppointment({
      userid: user.id,
      organizationid: selectedOrgId,
      appoinmentdate: appointmentDate,
      fromtime: appointmentDate,
      totime: new Date(appointmentDate.getTime() + totalDuration * 60000),
      staffid: selectedStaffId || 0,
      notes: notes || `Booked services: ${selectedServices.map(s => `${s.name} (${s.quantity}x)`).join(', ')}`,
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
    
    // Reset form
    setSelectedOrgId(null);
    setSelectedServices([]);
    setSelectedStaffId(null);
    setSelectedDate(new Date());
    setSelectedTime("");
    setNotes("");
  };

  // Load leave requests when organization changes
  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Book an Appointment</h2>
            <p className="text-gray-600 mt-2">
              Complete the form below to schedule your appointment.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Card className="shadow-lg bg-white border border-gray-200">
              <CardHeader className="pb-4 bg-white">
                <CardTitle className="text-xl text-gray-900">Appointment Details</CardTitle>
                <CardDescription className="text-gray-600">
                  Select the organization, services, and time for your appointment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 bg-white">
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-gray-700">Organization *</Label>
                  <Select
                    value={selectedOrgId?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedOrgId(parseInt(value));
                      setSelectedServices([]);
                      setSelectedStaffId(null);
                    }}
                    disabled={orgsLoading}
                  >
                    <SelectTrigger id="organization" className="w-full bg-white border-gray-300">
                      <SelectValue placeholder={orgsLoading ? "Loading..." : "Select organization"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-[200px] z-50">
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Services *</Label>
                  {!selectedOrgId ? (
                    <p className="text-sm text-gray-500">Select organization first</p>
                  ) : servicesLoading ? (
                    <p className="text-sm text-gray-500">Loading services...</p>
                  ) : (
                    <div className="space-y-3">
                      {services.map((service) => {
                        const selectedService = selectedServices.find(s => s.id === service.id);
                        const isSelected = !!selectedService;
                        
                        return (
                          <div
                            key={service.id}
                            className={`p-3 border rounded-md transition-colors ${
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "hover:bg-gray-50 cursor-pointer border-gray-200"
                            }`}
                            onClick={() => !isSelected && handleServiceToggle(service.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">{service.Servicename}</span>
                                  <span className="font-medium">₹{service.offerprize}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {service.timetaken} min • {service.notes || 'Service available'}
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
                      
                      {selectedServices.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
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
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff" className="text-gray-700">Staff Member (Optional)</Label>
                  <Select
                    value={selectedStaffId?.toString() || "auto"}
                    onValueChange={(value) => setSelectedStaffId(value === "auto" ? null : parseInt(value))}
                    disabled={!selectedOrgId || staffLoading}
                  >
                    <SelectTrigger id="staff" className="w-full bg-white border-gray-300">
                      <SelectValue placeholder={
                        !selectedOrgId 
                          ? "Select organization first"
                          : staffLoading 
                          ? "Loading..."
                          : "Any available staff"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-[200px] z-50">
                      <SelectItem value="auto">Any available staff member</SelectItem>
                      {staff.map((person) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {(person as any).name || `Staff Member ${person.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 bg-white border-gray-300"
                          disabled={selectedServices.length === 0}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            console.log('📅 Date selected:', date?.toDateString());
                            if (date) {
                              setSelectedDate(date);
                              
                              // Check leave requests and show message
                              if (hasLeaveRequests) {
                                const leaveInfo = getLeaveInfoForDate(date);
                                if (leaveInfo) {
                                  if (leaveInfo.isfullday) {
                                    toast({
                                      title: "Full Day Leave",
                                      description: "This date has a full day leave request. All appointments are unavailable.",
                                      variant: "destructive"
                                    });
                                  } else {
                                    toast({
                                      title: "Half Day Leave",
                                      description: `This date has a half day leave from ${leaveInfo.start_time.slice(0, 5)} to ${leaveInfo.end_time.slice(0, 5)}. Some appointments may be unavailable.`,
                                      variant: "default"
                                    });
                                  }
                                }
                              }
                            }
                          }}
                          modifiers={{
                            disabled: (date) => {
                              // Only disable past dates - allow ALL future dates including leave dates
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const checkDate = new Date(date);
                              checkDate.setHours(0, 0, 0, 0);
                              
                              console.log('🗓️ Calendar disabled check:', {
                                date: date.toDateString(),
                                checkDate: checkDate.toDateString(),
                                today: today.toDateString(),
                                isPast: checkDate < today,
                                willDisable: checkDate < today
                              });
                              
                              // Only disable past dates - NO leave request restrictions
                              return checkDate < today;
                            }
                          }}
                          initialFocus
                          className="p-3 bg-white"
                        />
                      </PopoverContent>
                     </Popover>
                     
                     {/* Debug Information */}
                     <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
                       <p><strong>Debug Info:</strong></p>
                       <p>Organization ID: {selectedOrgId || 'None'}</p>
                       <p>Has Leave Requests: {hasLeaveRequests ? 'Yes' : 'No'}</p>
                       <p>Leave Requests Count: {leaveRequests.length}</p>
                       <p>Booking Window Days: {bookingWindowDays}</p>
                       {leaveRequests.length > 0 && (
                         <div>
                           <p><strong>Leave Requests:</strong></p>
                           {leaveRequests.map((leave, index) => (
                             <p key={index}>
                               Date: {new Date(leave.appointmentdate).toDateString()}, 
                               Full Day: {leave.isfullday ? 'Yes' : 'No'}
                               {!leave.isfullday && `, Time: ${leave.start_time} - ${leave.end_time}`}
                             </p>
                           ))}
                         </div>
                       )}
                     </div>
                     
                     {/* Leave Request Information */}
                    {hasLeaveRequests && selectedDate && (() => {
                      const leaveInfo = getLeaveInfoForDate(selectedDate);
                      if (leaveInfo) {
                        return (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <p className="text-sm text-orange-800">
                                {leaveInfo.isfullday 
                                  ? 'Full day leave - All appointments unavailable'
                                  : `Half day leave: ${leaveInfo.start_time.slice(0, 5)} - ${leaveInfo.end_time.slice(0, 5)}`
                                }
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-gray-700">Time *</Label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                      disabled={selectedServices.length === 0 || !selectedDate}
                    >
                      <SelectTrigger id="time" className="w-full bg-white border-gray-300">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-[200px] z-50">
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-700">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] resize-none bg-white border-gray-300"
                  />
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 bg-white">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedOrgId || selectedServices.length === 0 || !selectedDate || !selectedTime || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Appointment ({totalDuration} min, ₹{totalPrice})
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </UserLayout>
  );
};

export default BookAppointment;
