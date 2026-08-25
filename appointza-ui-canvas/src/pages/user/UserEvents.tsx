import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Loader2,
  Search,
  Star,
  Image as ImageIcon,
  BookOpen
} from "lucide-react";
import { formatEventDateLong } from "@/utils/eventDate.util";
import { EventService } from "@/services/event.service";
import { Event, EventSelectReq } from "@/models/event.model";
import { FilesService } from "@/services/files.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const UserEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventImageUrls, setEventImageUrls] = useState<{ [eventId: number]: string[] }>({});
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all"); // "all", "userpay", "clientpay"
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all"); // "all", "single", "range", "daily"
  
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const eventService = useMemo(() => new EventService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  // Fetch all public active events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const req: EventSelectReq = {
          id: 0,
          organisation_id: 0,
          organisation_location_id: 0,
          status: "active",
          is_public: true
        };
        const response = await eventService.select(req);
        
        // Filter to only show public events (backend doesn't filter by is_public)
        const publicEvents = (response || []).filter(event => event.is_public === true);
        setEvents(publicEvents);
        
        // Load images for all events
        if (publicEvents.length > 0) {
          loadEventImages(publicEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [eventService]);

  // Navigate to booking page
  const openBookingForm = (event: Event) => {
    navigate(`/user/events/${event.id}/book`);
  };


  // Load images for events
  const loadEventImages = async (eventsList: Event[]) => {
    const imageUrlsMap: { [eventId: number]: string[] } = {};
    
    for (const event of eventsList) {
      if (event.images?.ImageIds && event.images.ImageIds.length > 0) {
        const urls: string[] = [];
        for (const imageId of event.images.ImageIds) {
          if (imageId > 0) {
            const imageUrl = filesService.getImageUrl(imageId);
            urls.push(imageUrl);
          }
        }
        if (urls.length > 0) {
          imageUrlsMap[event.id] = urls;
        }
      }
    }
    
    setEventImageUrls(imageUrlsMap);
  };

  // Filter events based on search term, payment type, and event type
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.event_name.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term) ||
        event.event_type.toLowerCase().includes(term)
      );
    }
    
    // Apply payment type filter
    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter(event => event.payment_type === paymentTypeFilter);
    }
    
    // Apply event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }
    
    return filtered;
  }, [events, searchTerm, paymentTypeFilter, eventTypeFilter]);

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

  // Get event type badge color
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'single':
        return 'bg-blue-100 text-blue-800';
      case 'range':
        return 'bg-purple-100 text-purple-800';
      case 'daily':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-muted-foreground mt-2">
            Browse and discover upcoming events
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Label htmlFor="search-events" className="text-sm font-medium mb-2 block">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-events"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Payment Type Filter */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label htmlFor="payment-type-filter" className="text-sm font-medium">
              Payment Type
            </Label>
            <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
              <SelectTrigger id="payment-type-filter" className="w-full">
                <SelectValue placeholder="All Payment Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Types</SelectItem>
                <SelectItem value="userpay">User Pay</SelectItem>
                <SelectItem value="clientpay">Client Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Type Filter */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label htmlFor="event-type-filter" className="text-sm font-medium">
              Event Type *
            </Label>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger id="event-type-filter" className="w-full">
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="single">Single Event</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
                <SelectItem value="daily">Daily Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {(paymentTypeFilter !== "all" || eventTypeFilter !== "all" || searchTerm.trim()) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentTypeFilter("all");
                  setEventTypeFilter("all");
                  setSearchTerm("");
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || paymentTypeFilter !== "all" || eventTypeFilter !== "all" 
                  ? 'No events found' 
                  : 'No events available'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || paymentTypeFilter !== "all" || eventTypeFilter !== "all"
                  ? 'Try adjusting your filters or search terms'
                  : 'Check back later for upcoming events'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Event Image */}
                {eventImageUrls[event.id] && eventImageUrls[event.id].length > 0 ? (
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={eventImageUrls[event.id][0]}
                      alt={event.event_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image on error
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className={cn("text-xs", getEventTypeColor(event.event_type))}>
                        {event.event_type}
                      </Badge>
                      {event.rating && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {event.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className={cn("text-xs", getEventTypeColor(event.event_type))}>
                        {event.event_type}
                      </Badge>
                      {event.rating && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {event.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{event.event_name}</CardTitle>
                    {event.is_public && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        Public
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getEventDateDisplay(event)}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground line-clamp-2">{event.location}</span>
                      </div>
                    )}
                    
                    {event.entry_amount > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          ₹{event.entry_amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                     {event.slot_limit > 0 && (
                       <div className="flex items-center gap-2">
                         <Users className="h-4 w-4 text-muted-foreground" />
                         <span className="text-muted-foreground">
                           {event.remainingslot ?? event.slot_limit} / {event.slot_limit} remaining
                         </span>
                       </div>
                     )}

                    {event.payment_type && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground capitalize">
                          {event.payment_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dress Code */}
                  {event.dress_code && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        <strong>Dress Code:</strong> {event.dress_code}
                      </p>
                    </div>
                  )}

                  {/* Multiple Images Indicator */}
                  {eventImageUrls[event.id] && eventImageUrls[event.id].length > 1 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>{eventImageUrls[event.id].length} images</span>
                    </div>
                  )}

                  {/* Book Slot Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => openBookingForm(event)}
                      className="w-full"
                      disabled={!event.remainingslot || event.remainingslot === 0}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {event.remainingslot > 0 ? 'Book Slot' : 'Fully Booked'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
  );
};

export default UserEvents;

