import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Loader2,
  Search,
  Ticket,
} from "lucide-react";
import { EventService } from "@/services/event.service";
import { Event } from "@/models/event.model";
import { FilesService } from "@/services/files.service";
import { useToast } from "@/hooks/use-toast";
import { PublicBrowseShell } from "@/components/layout/PublicBrowseShell";
import { useAuth } from "@/contexts/AuthContext";
import { formatEventDateOnly } from "@/utils/eventDate.util";

function formatEventLine(event: Event): string {
  const loc = event.location?.trim();
  let when = "";
  if (event.event_type === "single" && event.event_date) {
    when = formatEventDateOnly(event.event_date);
  } else if (event.event_type === "range" && event.from_date && event.to_date) {
    when = `${formatEventDateOnly(event.from_date)} – ${formatEventDateOnly(event.to_date)}`;
  } else if (event.event_type === "daily") {
    when = "Daily";
  }
  return [when, loc].filter(Boolean).join(" • ");
}

/**
 * Dedicated public surface for browsing every upcoming public event — not mixed with Explore’s org/service tabs.
 * Uses POST /api/Event/select via EventService.selectPublicBrowse() (no separate backend endpoint).
 */
const PublicBrowseEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventImageUrls, setEventImageUrls] = useState<{ [eventId: number]: string[] }>({});
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const eventService = useMemo(() => new EventService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    let cancelled = false;

    const loadEventImages = async (eventsList: Event[]) => {
      const imageUrlsMap: { [eventId: number]: string[] } = {};
      for (const ev of eventsList) {
        if (!ev.images?.ImageIds?.length) continue;
        const urls: string[] = [];
        for (const imageId of ev.images.ImageIds) {
          if (imageId > 0) urls.push(filesService.getImageUrl(imageId));
        }
        if (urls.length) imageUrlsMap[ev.id] = urls;
      }
      if (!cancelled) setEventImageUrls(imageUrlsMap);
    };

    const run = async () => {
      try {
        setIsLoading(true);
        const response = await eventService.selectPublicBrowse();
        if (cancelled) return;
        const publicEvents = (response || []).filter((e) => e.is_public !== false);
        setEvents(publicEvents);
        if (publicEvents.length) await loadEventImages(publicEvents);
      } catch {
        if (!cancelled) {
          setEvents([]);
          toast({
            title: "Could not load events",
            description: "Try again shortly.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [eventService, filesService, toast]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ev) =>
          ev.event_name.toLowerCase().includes(term) ||
          ev.description?.toLowerCase().includes(term) ||
          ev.location?.toLowerCase().includes(term) ||
          ev.event_type.toLowerCase().includes(term)
      );
    }

    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter((ev) => ev.payment_type === paymentTypeFilter);
    }

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((ev) => ev.event_type === eventTypeFilter);
    }

    return filtered;
  }, [events, searchTerm, paymentTypeFilter, eventTypeFilter]);

  const openBookingForm = (eventId: number) => {
    const dest = `/user/events/${eventId}/book`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate("/login", { state: { from: dest } });
    }
  };

  return (
    <PublicBrowseShell
      title="Events — Browse all public events | Appointza"
      metaDescription="Browse all upcoming public events on Appointza and book tickets."
      heading="Events"
      description={
        <>
          Every upcoming public event on Appointza. Book a ticket — you’ll sign in when you confirm a booking if needed.
        </>
      }
      footnote={
        <>
          Want services or organisations?{" "}
          <Link to="/services" className="text-orange-600 font-medium hover:underline">
            Services
          </Link>
          {" · "}
          <Link to="/organisations" className="text-orange-600 font-medium hover:underline">
            Organisations
          </Link>
          {" · "}
          <Link to="/explore" className="text-orange-600 font-medium hover:underline">
            Explore
          </Link>
          .
        </>
      }
    >
        {isLoading ? (
          <div className="flex items-center justify-center h-64 rounded-xl border border-zinc-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <span className="ml-3 text-zinc-600">Loading events…</span>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
              <div className="relative flex-1 max-w-md">
                <Label htmlFor="public-events-search" className="text-sm font-medium mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="public-events-search"
                    placeholder="Search events…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[180px]">
                <Label htmlFor="payment-type-filter-public">Payment</Label>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger id="payment-type-filter-public">
                    <SelectValue placeholder="Payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payment types</SelectItem>
                    <SelectItem value="userpay">User pays</SelectItem>
                    <SelectItem value="clientpay">Host pays</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 min-w-[180px]">
                <Label htmlFor="event-type-filter-public">Schedule type</Label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger id="event-type-filter-public">
                    <SelectValue placeholder="Event schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All schedules</SelectItem>
                    <SelectItem value="single">Single date</SelectItem>
                    <SelectItem value="range">Date range</SelectItem>
                    <SelectItem value="daily">Daily recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentTypeFilter !== "all" || eventTypeFilter !== "all" || searchTerm.trim()) && (
                <Button
                  type="button"
                  variant="outline"
                  className="xl:self-end"
                  onClick={() => {
                    setPaymentTypeFilter("all");
                    setEventTypeFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {!filteredEvents.length ? (
              <Card className="border-zinc-200 shadow-sm">
                <CardContent className="py-14 text-center">
                  <Calendar className="h-14 w-14 mx-auto text-zinc-300 mb-4" aria-hidden />
                  <h3 className="text-lg font-semibold mb-2 text-zinc-900">
                    {!events.length ? "No events listed yet" : "Nothing matches your filters"}
                  </h3>
                  <p className="text-zinc-600 mb-6 text-sm">
                    {!events.length
                      ? "Check back soon for new public events."
                      : "Try broadening your search or resetting filters."}
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/">Return home</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-zinc-500">{filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}</p>
            )}

            {filteredEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => {
                  const img = eventImageUrls[event.id]?.[0];
                  const soldOut =
                    event.slot_limit > 0 && (event.remainingslot ?? 0) <= 0;
                  const metaLine = formatEventLine(event);
                  const desc = event.description?.trim() || "";
                  return (
                    <article
                      key={event.id}
                      className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-lg shadow-zinc-200/70 hover:border-zinc-300 hover:shadow-xl transition-all flex flex-col"
                    >
                      <div className="relative h-56 w-full bg-gradient-to-br from-zinc-100 to-zinc-200 shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 pointer-events-none z-0">
                          <Calendar className="size-14" aria-hidden />
                        </div>
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            className="relative z-10 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.remove();
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className="text-sm font-medium text-orange-600 capitalize">
                            {event.event_type || "Event"}
                          </span>
                          {event.entry_amount > 0 && (
                            <span className="text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 shrink-0">
                              ₹{event.entry_amount.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 line-clamp-2">{event.event_name}</h3>
                        <div className="flex flex-col gap-2 mb-4 flex-1 min-h-0">
                          {metaLine ? (
                            <p className="text-zinc-600 text-sm leading-snug line-clamp-2">{metaLine}</p>
                          ) : null}
                          {desc ? (
                            <p className="text-zinc-600 text-sm leading-relaxed line-clamp-5">{desc}</p>
                          ) : null}
                          {!metaLine && !desc ? (
                            <p className="text-zinc-400 text-sm italic">Details on booking page.</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-medium hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-auto"
                          onClick={() => openBookingForm(event.id)}
                          disabled={soldOut}
                        >
                          <Ticket className="size-4 shrink-0" aria-hidden />
                          {soldOut ? "Fully booked" : "Book Ticket"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
    </PublicBrowseShell>
  );
};

export default PublicBrowseEventsPage;
