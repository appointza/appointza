import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Loader2,
  BookOpen,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import UserLayout from "@/components/layout/UserLayout";
import {
  getCurrentAppPath,
  getMainAppAuthUrl,
  mustUseMainAppForAuth,
  redirectToLogin,
} from "@/utils/authNavigation.util";
import { formatEventDateLong } from "@/utils/eventDate.util";
import { EventService } from "@/services/event.service";
import { Event, EventSelectReq } from "@/models/event.model";
import { EventBookingService } from "@/services/eventbooking.service";
import { EventBooking, EventBookingSelectReq } from "@/models/eventbooking.model";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { FilesService } from "@/services/files.service";
import { PaymentService, CreatePaymentOrderReq, VerifyPaymentReq } from "@/services/payment.service";
import { loadScript } from "@/utils/razorpay.util";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { environment } from "@/utils/environment";
import { decodeEventBookingNotes, encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import {
  type EventBookingFormField,
  parseEventBookingFormFieldsFromNotes,
  sortEventBookingFormFieldsByDisplayOrder,
} from "@/utils/eventBookingFormFields.util";

const EventBookingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>(['']);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [hasPaymentCredentials, setHasPaymentCredentials] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<EventBooking | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const eventService = useMemo(() => new EventService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const paymentService = useMemo(() => new PaymentService(), []);

  // Auth tokens live on the main app host only. Never book on org subdomains.
  useEffect(() => {
    if (!mustUseMainAppForAuth()) return;
    window.location.replace(getMainAppAuthUrl(getCurrentAppPath()));
  }, []);

  const [dynamicFields, setDynamicFields] = useState<EventBookingFormField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  const loadEventFormConfig = async (evt: Event) => {
    try {
      const typeReq = new ReferenceTypeSelectReq();
      typeReq.identifier = "EVENTBOOKINGFORM";
      const types = await referenceTypeService.select(typeReq);
      const type =
        (types || []).find((t) => Number(t.organizationid) === Number(evt.organisation_id)) ??
        (types || [])[0];
      if (!type?.id) {
        setDynamicFields([]);
        return;
      }

      const valueReq = new ReferenceValueSelectReq();
      valueReq.referencetypeid = Number(type.id);
      valueReq.organisationid = evt.organisation_id;
      valueReq.identifier = `EVENT_${evt.id}`;
      const values = await referenceValueService.select(valueReq);
      const notes = values?.[0]?.notes || "";
      if (!notes) {
        setDynamicFields([]);
        return;
      }

      const fields = parseEventBookingFormFieldsFromNotes(notes);
      setDynamicFields(sortEventBookingFormFieldsByDisplayOrder(fields));
    } catch {
      setDynamicFields([]);
    }
  };

  const prefillFromLastBooking = async (evt: Event) => {
    if (!user?.id) return;
    try {
      const bookingReq = new EventBookingSelectReq();
      bookingReq.id = 0;
      bookingReq.event_id = evt.id;
      bookingReq.user_id = user.id;
      bookingReq.payment_status = "";
      bookingReq.check_in_status = "";
      bookingReq.confirmation_status = "";
      const bookings = await eventBookingService.select(bookingReq);
      const last = (bookings || []).sort((a, b) => (b.id || 0) - (a.id || 0))[0];
      if (!last?.notes) return;
      const decoded = decodeEventBookingNotes(last.notes);
      if (decoded.payload?.form && typeof decoded.payload.form === "object") {
        setDynamicValues(decoded.payload.form);
      }
    } catch {
      // ignore
    }
  };

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        toast({
          title: "Error",
          description: "Event ID is missing.",
          variant: "destructive",
        });
        navigate('/user/events');
        return;
      }

      try {
        setIsLoading(true);
        const req: EventSelectReq = {
          id: parseInt(eventId),
          organisation_id: 0,
          organisation_location_id: 0,
          status: "",
          is_public: true
        };
        const response = await eventService.select(req);
        
        if (response && response.length > 0) {
          const eventData = response[0];
          setEvent(eventData);
          await loadEventFormConfig(eventData);
          await prefillFromLastBooking(eventData);
          
          // Check if payment is required (payment_type is "userpay")
          const paymentRequired = eventData.payment_type?.toLowerCase() === 'userpay' && eventData.entry_amount > 0;
          setIsPaymentRequired(paymentRequired);
          
          // Check if payment gateway credentials exist and are active for the organization
          // If no records OR is_active = false, make it free booking
          if (paymentRequired && eventData.organisation_id > 0) {
            try {
              const credentialsResponse = await fetch(`${environment.baseurl}/api/PaymentGatewayCredentials/Select`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  item: {
                    organization_id: eventData.organisation_id,
                    gateway_name: 'razorpay',
                    is_active: true  // Only get active credentials
                  }
                })
              });
              
              if (credentialsResponse.ok) {
                const credentialsResult = await credentialsResponse.json();
                const credentials = credentialsResult.item || [];
                
                // Check if we have at least one active Razorpay credential
                // If no records found OR all are inactive, credentials.length will be 0
                const hasActiveCredentials = credentials.length > 0 && 
                  credentials.some((cred: any) => cred.is_active === true && cred.gateway_name === 'razorpay');
                
                setHasPaymentCredentials(hasActiveCredentials);
                console.log('💳 Payment credentials check:', {
                  found: credentials.length,
                  hasActive: hasActiveCredentials,
                  credentials: credentials
                });
                
                // If no active credentials, treat as free booking
                if (!hasActiveCredentials) {
                  console.log('💰 No active payment credentials found - booking will be free');
                }
              } else {
                // API error - treat as free booking
                setHasPaymentCredentials(false);
                console.log('💰 Payment credentials API error - booking will be free');
              }
            } catch (error) {
              console.error('Error checking payment credentials:', error);
              // Error checking credentials - treat as free booking for safety
              setHasPaymentCredentials(false);
              console.log('💰 Error checking credentials - booking will be free');
            }
          } else {
            // Payment not required - free booking
            setHasPaymentCredentials(false);
          }
          
          // Load event image
          if (eventData.images?.ImageIds && eventData.images.ImageIds.length > 0) {
            const firstImageId = eventData.images.ImageIds[0];
            if (firstImageId > 0) {
              setEventImageUrl(filesService.getImageUrl(firstImageId));
            }
          }
        } else {
          toast({
            title: "Event Not Found",
            description: "The event you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/user/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Failed to load event details.",
          variant: "destructive",
        });
        navigate('/user/events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, eventService, filesService, navigate, toast]);

  // Handle number of people change
  const handleNumberOfPeopleChange = (value: string) => {
    const count = parseInt(value) || 1;
    setNumberOfPeople(count);
    
    // Update attendee names array
    if (count > 1) {
      const newNames = Array(count).fill('').map((_, index) => attendeeNames[index] || '');
      setAttendeeNames(newNames);
    } else {
      setAttendeeNames(['']);
    }
  };

  // Handle attendee name change
  const handleAttendeeNameChange = (index: number, value: string) => {
    const newNames = [...attendeeNames];
    newNames[index] = value;
    setAttendeeNames(newNames);
  };

  // Validate and submit booking
  const handleBookEvent = async () => {
    // Check if user is authenticated - require login for booking
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to confirm your booking. You will be redirected to the login page.",
        variant: "destructive",
      });
      // Redirect to login with return URL
      redirectToLogin(getCurrentAppPath(), navigate);
      return;
    }

    if (!event) {
      toast({
        title: "Error",
        description: "Event information is missing.",
        variant: "destructive",
      });
      return;
    }

    // Validate slots available
    if (event.remainingslot < numberOfPeople) {
      toast({
        title: "Not enough slots",
        description: `Only ${event.remainingslot} slot(s) available.`,
        variant: "destructive",
      });
      return;
    }

    // Validate names for all attendees
    if (numberOfPeople >= 1) {
      const validNames = attendeeNames.filter(name => name.trim().length > 0);
      if (validNames.length !== numberOfPeople) {
        toast({
          title: "Validation Error",
          description: `Please enter names for all ${numberOfPeople} attendee(s).`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate required dynamic fields
    if (dynamicFields.some((f) => f.required)) {
      const missing = dynamicFields.find((f) => f.required && String(dynamicValues[f.key] ?? "").trim().length === 0);
      if (missing) {
        toast({
          title: "Validation Error",
          description: `Please fill ${missing.label || missing.key}.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsBooking(true);

      const booking = new EventBooking();
      booking.event_id = event.id;
      booking.user_id = user.id || 0;
      booking.number_of_people = numberOfPeople;
      
      // Calculate total amount
      const totalAmount = event.entry_amount > 0 ? event.entry_amount * numberOfPeople : 0;
      if (totalAmount > 0) {
        booking.total_amount = totalAmount;
      }

      booking.notes = encodeEventBookingNotes(
        attendeeNames.filter((name) => name.trim().length > 0),
        dynamicValues
      );

      // Check if payment is required
      if (isPaymentRequired && hasPaymentCredentials && totalAmount > 0) {
        // Payment required - proceed with payment flow
        setPendingBooking(booking);
        await handlePaymentFlow(booking, totalAmount);
      } else {
        // No payment required - book directly
        await eventBookingService.insert(booking);
        setBookingSuccess(true);
        toast({
          title: "Booking Successful",
          description: `Successfully booked ${numberOfPeople} slot(s) for ${event.event_name}.`,
        });
      }
    } catch (error: any) {
      console.error('Error booking event:', error);
      toast({
        title: "Booking Failed",
        description: error?.message || "Failed to book event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getEventDateDisplay = (event: Event): string => {
    switch (event.event_type) {
      case 'single':
        return formatEventDateLong(event.event_date);
      case 'range':
        return `${formatEventDateLong(event.from_date)} - ${formatEventDateLong(event.to_date)}`;
      case 'daily':
        return 'Daily Recurring';
      default:
        return 'N/A';
    }
  };

  // Handle payment flow
  const handlePaymentFlow = async (booking: EventBooking, totalAmount: number) => {
    try {
      setIsProcessingPayment(true);
      
      if (!event || !user) {
        toast({
          title: "Error",
          description: "Missing event or user information",
          variant: "destructive"
        });
        setIsProcessingPayment(false);
        return;
      }

      // Create payment order
      const paymentReq: CreatePaymentOrderReq = {
        organizationid: event.organisation_id,
        organisationlocationid: event.organisation_location_id,
        userid: user.id || 0,
        amount: totalAmount,
        currency: "INR",
        receipt: `event_${event.id}_${Date.now()}`,
        eventid: event.id
      };

      const paymentOrder = await paymentService.createOrder(paymentReq);
      
      // Load Razorpay script
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      // Initialize Razorpay checkout
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount * 100, // Convert to paise
        currency: paymentOrder.currency,
        name: event.event_name || "Appointza",
        description: `Payment for event booking - ${event.event_name}`,
        order_id: paymentOrder.orderid,
        handler: async function (response: any) {
          await handlePaymentSuccess(response, booking);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || ""
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            setShowPaymentModal(false);
          }
        }
      };

      const razorpay = (window as any).Razorpay(options);
      razorpay.open();
      setShowPaymentModal(true);
      
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: any, booking: EventBooking) => {
    try {
      setIsProcessingPayment(true);
      
      // First, create the booking
      await eventBookingService.insert(booking);
      
      // Get the newly created booking to get its ID
      const bookingReq = new EventBookingSelectReq();
      bookingReq.id = 0;
      bookingReq.event_id = booking.event_id;
      bookingReq.user_id = booking.user_id;
      bookingReq.payment_status = "";
      bookingReq.check_in_status = "";
      
      const bookings = await eventBookingService.select(bookingReq);
      const bookedEvent = bookings
        .filter(b => b.event_id === booking.event_id && b.user_id === booking.user_id)
        .sort((a, b) => b.id - a.id)[0]; // Get the most recent one

      if (bookedEvent && bookedEvent.id > 0) {
        // Verify payment with booking ID
        try {
          const verifyReq: VerifyPaymentReq = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            appointmentid: 0, // Not used for events
            eventbookingid: bookedEvent.id
          };

          const verifyResult = await paymentService.verifyPayment(verifyReq);
          
          if (verifyResult.isvalid) {
            setBookingSuccess(true);
            toast({
              title: "Payment Successful!",
              description: "Your event booking has been confirmed and payment is verified.",
            });
          } else {
            toast({
              title: "Payment Verification Failed",
              description: verifyResult.message || "Please contact support with your payment ID.",
              variant: "destructive"
            });
          }
        } catch (verifyError: any) {
          console.error('Payment verification error:', verifyError);
          toast({
            title: "Payment Verification Error",
            description: "Payment was successful but verification failed. Please contact support.",
            variant: "destructive"
          });
        }
      } else {
        setBookingSuccess(true);
        toast({
          title: "Booking Successful!",
          description: "Your event booking has been confirmed. Payment verification will be processed.",
        });
      }

      setPendingBooking(null);
      setShowPaymentModal(false);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error processing your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancel = () => {
    navigate('/user/events');
  };

  const handleBackToEvents = () => {
    navigate('/user/events');
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading event details...</span>
        </div>
      </UserLayout>
    );
  }

  if (!event) {
    return (
      <UserLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist.
            </p>
            <Button onClick={handleBackToEvents}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </UserLayout>
    );
  }

  // Show success message after booking
  if (bookingSuccess) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Booking Confirmed!</h2>
              <p className="text-green-700 mb-4">
                You have successfully booked {numberOfPeople} slot(s) for <strong>{event.event_name}</strong>.
              </p>
              {event.entry_amount > 0 && (
                <p className="text-green-700 mb-6">
                  Total Amount: <strong>₹{(event.entry_amount * numberOfPeople).toLocaleString()}</strong>
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={handleBackToEvents} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Button>
                <Button onClick={() => navigate('/user/my-event-bookings')}>
                  View My Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{event.event_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Calendar className="h-4 w-4" />
              <span>{getEventDateDisplay(event)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Event Image */}
            {eventImageUrl && (
              <div className="mb-6">
                <img
                  src={eventImageUrl}
                  alt={event.event_name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Event Description */}
            {event.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {event.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}
              
              {event.entry_amount > 0 && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Entry Amount</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{event.entry_amount.toLocaleString()} per person
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Available Slots</p>
                  <p className="text-sm text-muted-foreground">
                    {event.remainingslot || event.slot_limit} / {event.slot_limit} slots
                  </p>
                </div>
              </div>

              {event.payment_type && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Payment Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {event.payment_type}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dress Code */}
            {event.dress_code && (
              <div className="mb-6 pt-4 border-t">
                <p className="text-sm">
                  <strong>Dress Code:</strong> {event.dress_code}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Form Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Book Event Slot</CardTitle>
            <CardDescription>
              Fill in the details below to book your slot
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Number of People */}
            <div className="space-y-2">
              <Label htmlFor="number-of-people">Number of People *</Label>
              <Input
                id="number-of-people"
                type="number"
                min="1"
                max={event?.remainingslot || 1}
                value={numberOfPeople}
                onChange={(e) => handleNumberOfPeopleChange(e.target.value)}
                disabled={isBooking || !event.remainingslot || event.remainingslot === 0}
              />
              {event && (
                <p className="text-xs text-muted-foreground">
                  Available slots: {event.remainingslot || event.slot_limit}
                </p>
              )}
            </div>

            {/* Attendee Names */}
            {numberOfPeople >= 1 && (
              <div className="space-y-3">
                <Label>Attendee Names *</Label>
                <p className="text-xs text-muted-foreground">
                  Please enter names for all {numberOfPeople} attendee(s)
                </p>
                {attendeeNames.map((name, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`attendee-${index}`}>Person {index + 1} Name *</Label>
                    <Input
                      id={`attendee-${index}`}
                      type="text"
                      placeholder={`Enter name for person ${index + 1}`}
                      value={name}
                      onChange={(e) => handleAttendeeNameChange(index, e.target.value)}
                      disabled={isBooking}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic fields configured per-event */}
            {dynamicFields.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <Label>Additional Details</Label>
                {dynamicFields.map((f) => {
                  const value = dynamicValues[f.key] ?? "";
                  const type = (f.type || "string").toLowerCase();
                  return (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={`dyn-${f.key}`}>
                        {f.label || f.key}
                        {f.required ? " *" : ""}
                      </Label>
                      {type === "boolean" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            id={`dyn-${f.key}`}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({ ...prev, [f.key]: e.target.checked }))
                            }
                            disabled={isBooking}
                            className="rounded"
                          />
                          <span className="text-sm text-muted-foreground">
                            {Boolean(value) ? "Yes" : "No"}
                          </span>
                        </div>
                      ) : (
                        <Input
                          id={`dyn-${f.key}`}
                          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                          value={value}
                          onChange={(e) =>
                            setDynamicValues((prev) => ({
                              ...prev,
                              [f.key]: type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value,
                            }))
                          }
                          disabled={isBooking}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Amount */}
            {event?.entry_amount > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    ₹{(event.entry_amount * numberOfPeople).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₹{event.entry_amount.toLocaleString()} × {numberOfPeople} person(s)
                </p>
              </div>
            )}

            {/* Login Notice */}
            {!isAuthenticated && (
              <div className="pt-4 border-t">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You need to be logged in to confirm your booking. 
                    You will be redirected to the login page when you click "Confirm Booking".
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isBooking}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleBookEvent} 
                disabled={isBooking || isProcessingPayment || !event.remainingslot || event.remainingslot === 0}
                className="flex-1"
              >
                {isBooking || isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isProcessingPayment ? "Processing Payment..." : "Booking..."}
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {isPaymentRequired && hasPaymentCredentials && event.entry_amount > 0
                      ? `Pay ₹${(event.entry_amount * numberOfPeople).toLocaleString()} & Book`
                      : "Confirm Booking"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default EventBookingPage;

