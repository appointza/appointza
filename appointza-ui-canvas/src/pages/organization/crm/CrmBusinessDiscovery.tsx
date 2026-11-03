import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Search,
  Star,
} from "lucide-react";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CrmDiscoveredPlace } from "@/models/crmLeadDiscovery.model";
import { OrganisationCrmService } from "@/services/organisationCrm.service";
import { environment } from "@/utils/environment";
import {
  loadGoogleMaps,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
} from "@/utils/googleMapsLoader.util";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

const DEFAULT_CENTER = { lat: 12.975, lng: 80.221 }; // Velachery area

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function CrmBusinessDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const service = useMemo(() => new OrganisationCrmService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [query, setQuery] = useState("salon in Velachery");
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [places, setPlaces] = useState<CrmDiscoveredPlace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);

  const mapsKey = String(environment.googleMapsApiKey || "").trim();

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (requirePhone && !String(p.phone || "").trim()) return false;
      if (requireWebsite && !String(p.website || "").trim()) return false;
      return true;
    });
  }, [places, requirePhone, requireWebsite]);

  const unsavedFiltered = useMemo(
    () => filteredPlaces.filter((p) => !p.already_saved),
    [filteredPlaces],
  );

  useEffect(() => {
    let cancelled = false;
    if (!mapHostRef.current || !mapsKey) {
      setMapError(
        mapsKey
          ? ""
          : "Add googleMapsApiKey in public/config.js to show the map.",
      );
      return;
    }

    void loadGoogleMaps(mapsKey)
      .then((g) => {
        if (cancelled || !mapHostRef.current) return;
        mapRef.current = new g.maps.Map(mapHostRef.current, {
          center: DEFAULT_CENTER,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setMapReady(true);
        setMapError("");
      })
      .catch((err) => {
        setMapError(err instanceof Error ? err.message : "Could not load Google Maps");
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [mapsKey]);

  useEffect(() => {
    if (!mapReady || !window.google?.maps || !mapRef.current) return;
    const g = window.google;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (filteredPlaces.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(13);
      return;
    }

    const bounds = new g.maps.LatLngBounds();
    for (const place of filteredPlaces) {
      if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;
      const position = { lat: place.lat, lng: place.lng };
      bounds.extend(position);
      const marker = new g.maps.Marker({
        map,
        position,
        title: place.name,
        opacity: place.already_saved ? 0.45 : 1,
      });
      marker.addListener("click", () => setSelectedId(place.place_id));
      markersRef.current.push(marker);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 64);
    }
  }, [filteredPlaces, mapReady]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const place = filteredPlaces.find((p) => p.place_id === selectedId);
    if (!place) {
      setSelectedId(filteredPlaces[0]?.place_id ?? null);
      return;
    }
    if (!Number.isFinite(place.lat)) return;
    mapRef.current.setCenter({ lat: place.lat, lng: place.lng });
    mapRef.current.setZoom(16);
  }, [selectedId, filteredPlaces]);

  const runSearch = useCallback(async () => {
    if (organisationId <= 0) {
      toast({
        title: "Organisation required",
        description: "Sign in to an organisation account first.",
        variant: "destructive",
      });
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      toast({
        title: "Enter a search",
        description: "Example: salon in Velachery",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // Always fetch the full result set; phone/website filters apply instantly in the UI.
      const res = await service.searchPlaces({
        organisation_id: organisationId,
        query: q,
        require_phone: false,
        require_website: false,
        limit: 20,
      });
      setPlaces(res.places || []);
      setSelectedId(res.places?.[0]?.place_id ?? null);
      if (!res.places?.length) {
        toast({
          title: "No businesses found",
          description: "Try a broader search.",
        });
      }
    } catch (err) {
      toast({
        title: "Search failed",
        description: apiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  }, [organisationId, query, service, toast]);

  const markSaved = (placeId: string, leadId: number) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.place_id === placeId
          ? {
              ...p,
              already_saved: true,
              saved_reason: `Saved as lead #${leadId}`,
            }
          : p,
      ),
    );
  };

  const saveLead = async (place: CrmDiscoveredPlace) => {
    if (place.already_saved) {
      toast({
        title: "Already saved",
        description: place.saved_reason || "This company is already a lead.",
      });
      return;
    }
    setSavingId(place.place_id);
    try {
      const saved = await service.savePlaceAsLead({
        organisation_id: organisationId,
        place,
      });
      markSaved(place.place_id, saved.id);
      toast({
        title: "Saved as lead",
        description: `${place.name} is now in Leads & Contacts.`,
      });
    } catch (err) {
      toast({
        title: "Could not save lead",
        description: apiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const saveAllVisible = async () => {
    if (unsavedFiltered.length === 0) {
      toast({
        title: "Nothing to save",
        description: "All visible businesses are already leads, or no results match the filters.",
      });
      return;
    }
    setSavingAll(true);
    let savedCount = 0;
    let skipped = 0;
    let failed = 0;
    try {
      for (const place of unsavedFiltered) {
        try {
          const saved = await service.savePlaceAsLead({
            organisation_id: organisationId,
            place,
          });
          markSaved(place.place_id, saved.id);
          savedCount += 1;
        } catch (err) {
          const msg = apiErrorMessage(err, "");
          if (/already saved|duplicate/i.test(msg)) {
            skipped += 1;
            setPlaces((prev) =>
              prev.map((p) =>
                p.place_id === place.place_id
                  ? { ...p, already_saved: true, saved_reason: "Already saved as lead" }
                  : p,
              ),
            );
          } else {
            failed += 1;
          }
        }
      }
      toast({
        title: "Save all finished",
        description: [
          savedCount > 0 ? `${savedCount} saved` : null,
          skipped > 0 ? `${skipped} already existed` : null,
          failed > 0 ? `${failed} failed` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "No changes",
        variant: failed > 0 && savedCount === 0 ? "destructive" : "default",
      });
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <OrganizationPageShell className="box-border h-full min-h-0 overflow-hidden bg-[#f5f7f9] p-3 md:p-4">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
        <div className="shrink-0 border-b border-[#eef1f5] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[16px] font-semibold text-[#1a1a1a]">Find businesses</h1>
              <p className="mt-0.5 text-[12px] text-[#667085]">
                Search Google Places, preview on the map, filter by phone/website, then save as leads
                (duplicates blocked).
              </p>
            </div>
            <Link
              to="/organization/crm/contacts"
              className="text-[12px] font-medium text-[#2a5af5] hover:underline"
            >
              Open Leads &amp; Contacts
            </Link>
          </div>

          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="salon in Velachery"
                className={cn(org.input, "h-10 pl-8")}
              />
            </div>
            <Button
              type="submit"
              className={cn(org.btnPrimary, "h-10 shrink-0")}
              disabled={searching || organisationId <= 0}
            >
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Search
            </Button>
          </form>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[#344054]">
              <Checkbox
                checked={requirePhone}
                onCheckedChange={(v) => setRequirePhone(v === true)}
              />
              Has mobile number
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[#344054]">
              <Checkbox
                checked={requireWebsite}
                onCheckedChange={(v) => setRequireWebsite(v === true)}
              />
              Has website
            </label>
            <span className="text-[12px] text-[#98a2b3]">
              {places.length > 0
                ? requirePhone || requireWebsite
                  ? `${filteredPlaces.length} of ${places.length} results`
                  : `${places.length} results`
                : null}
            </span>
            <Button
              type="button"
              variant="outline"
              className="ml-auto h-8"
              disabled={
                savingAll || searching || organisationId <= 0 || unsavedFiltered.length === 0
              }
              onClick={() => void saveAllVisible()}
            >
              {savingAll ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save all{unsavedFiltered.length > 0 ? ` (${unsavedFiltered.length})` : ""}
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="relative min-h-[240px] border-b border-[#eef1f5] lg:min-h-0 lg:border-b-0 lg:border-r">
            <div ref={mapHostRef} className="absolute inset-0 bg-[#eef2f7]" />
            {mapError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 text-center text-[13px] text-[#b42318]">
                {mapError}
              </div>
            ) : null}
            {!mapReady && !mapError ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading map…
              </div>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching Google Places…
              </div>
            ) : places.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <MapPin className="mx-auto h-8 w-8 text-[#d0d5dd]" />
                <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">No places yet</p>
                <p className="mt-1 text-[12px] text-[#667085]">
                  Search for a business type and area, then save shops as leads.
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-[#1a1a1a]">No matches for filters</p>
                <p className="mt-1 text-[12px] text-[#667085]">
                  Turn off “Has mobile” / “Has website” to see all {places.length} results.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#eef1f5]">
                {filteredPlaces.map((place) => {
                  const selected = selectedId === place.place_id;
                  return (
                    <li key={place.place_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(place.place_id)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors",
                          selected ? "bg-[#eef2ff]" : "hover:bg-[#fafbfc]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                              {place.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[12px] text-[#667085]">
                              {place.address || "—"}
                            </p>
                          </div>
                          {place.rating != null ? (
                            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-[#b54708]">
                              <Star className="h-3 w-3 fill-current" />
                              {place.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#667085]">
                          {place.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {place.phone}
                            </span>
                          ) : (
                            <span className="text-[#b42318]">No phone</span>
                          )}
                          {place.website ? (
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#2a5af5] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="h-3 w-3" />
                              Website
                            </a>
                          ) : (
                            <span className="text-[#b42318]">No website</span>
                          )}
                          {place.google_maps_url ? (
                            <a
                              href={place.google_maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#2a5af5] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Maps
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-2">
                          {place.already_saved ? (
                            <span className="inline-flex rounded-md bg-[#ecfdf3] px-2 py-1 text-[11px] font-medium text-[#067647]">
                              {place.saved_reason || "Already saved as lead"}
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className={cn(org.btnPrimary, "h-8")}
                              disabled={savingAll || savingId === place.place_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void saveLead(place);
                              }}
                            >
                              {savingId === place.place_id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              Save as lead
                            </Button>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </OrganizationPageShell>
  );
}
