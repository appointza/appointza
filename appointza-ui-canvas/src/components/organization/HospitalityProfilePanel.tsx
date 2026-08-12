import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useOrganisationLocationScope } from "@/hooks/useOrganisationLocationScope";
import { RoomDefinitionsPanel } from "@/components/organization/RoomDefinitionsPanel";
import { RoomStatusPanel } from "@/components/organization/RoomStatusPanel";
import { HospitalityPoliciesPanel } from "@/components/organization/HospitalityPoliciesPanel";
import {
  HospitalityFoodPanel,
  HospitalityGuestServicesPanel,
  HospitalityNearbyPanel,
  HospitalityPackagesPanel,
} from "@/components/organization/HospitalityContentPanels";
import {
  HospitalityContentSaveReq,
  HospitalityFoodItem,
  HospitalityGuestService,
  HospitalityNearbyPlace,
  HospitalityPackage,
  OrganisationHospitalityProfile,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { cn } from "@/lib/utils";

type HospitalitySection =
  | "room-definitions"
  | "room-status"
  | "policies"
  | "packages"
  | "food"
  | "nearby"
  | "guest-services";

const CONTENT_SECTIONS = new Set<HospitalitySection>([
  "policies",
  "packages",
  "food",
  "nearby",
  "guest-services",
]);

const SECTIONS: {
  id: HospitalitySection;
  label: string;
  description: string;
  icon: typeof Package;
}[] = [
  {
    id: "room-definitions",
    label: "Room definitions",
    description: "Manage bookable rooms for your property.",
    icon: BedDouble,
  },
  {
    id: "room-status",
    label: "Room status",
    description: "Operational view of room availability, occupancy, and housekeeping.",
    icon: ClipboardList,
  },
  {
    id: "policies",
    label: "Policies",
    description: "Booking type, check-in/out times, and guest policies for your organisation.",
    icon: FileText,
  },
  {
    id: "packages",
    label: "Packages",
    description: "Stay and add-on packages shown on your public property site.",
    icon: Package,
  },
  {
    id: "food",
    label: "Food menu",
    description: "Food and dining options for guests.",
    icon: UtensilsCrossed,
  },
  {
    id: "nearby",
    label: "Nearby places",
    description: "Attractions and places near your property.",
    icon: MapPin,
  },
  {
    id: "guest-services",
    label: "Guest services",
    description: "Optional paid add-ons guests can request when booking.",
    icon: Sparkles,
  },
];

function parseSection(value: string | null): HospitalitySection {
  if (value && SECTIONS.some((section) => section.id === value)) {
    return value as HospitalitySection;
  }
  return "room-definitions";
}

const hospitalityTabTriggerClass =
  "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 shadow-none transition-colors hover:text-stone-800 data-[state=active]:bg-gradient-coral data-[state=active]:text-white data-[state=active]:shadow-sm sm:px-4";

function newPackage(index: number): HospitalityPackage {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    description: "",
    kind: "stay",
    is_active: true,
    sort_order: index,
    image_url: "",
    includes: [],
    add_ons: [],
    valid_from: "",
    valid_to: "",
    minimum_nights: 1,
    max_guests: 2,
    included_guests: 0,
    extra_guest_charge: 0,
    room_type: "",
  };
}

function newFoodItem(): HospitalityFoodItem {
  return { meal: "", title: "", description: "", cuisines: [] };
}

function newNearbyPlace(): HospitalityNearbyPlace {
  return { name: "", distance: "", travel_time: "", icon: "", image_url: "", map_url: "" };
}

function newGuestService(index: number): HospitalityGuestService {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    description: "",
    category: "other",
    icon: "",
    is_active: true,
    sort_order: index,
  };
}

type HospitalityProfilePanelProps = {
  organisationId: number;
};

export function HospitalityProfilePanel({ organisationId }: HospitalityProfilePanelProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    locations,
    locationId,
    selectedLocation,
    loading: locationsLoading,
  } = useOrganisationLocationScope(organisationId);
  const locationLabel =
    selectedLocation?.name?.trim() ||
    [selectedLocation?.city, selectedLocation?.country].filter(Boolean).join(", ") ||
    "";
  const activeSection = parseSection(searchParams.get("section"));
  const selectedRoomIdParam = searchParams.get("id");
  const selectedRoomId = selectedRoomIdParam ? Number(selectedRoomIdParam) : undefined;

  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrganisationHospitalityProfile | null>(null);
  const [packages, setPackages] = useState<HospitalityPackage[]>([]);
  const [foodMenu, setFoodMenu] = useState<HospitalityFoodItem[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<HospitalityNearbyPlace[]>([]);
  const [guestServices, setGuestServices] = useState<HospitalityGuestService[]>([]);

  const loadProfile = useCallback(async () => {
    if (organisationId <= 0) return;
    setContentLoading(true);
    try {
      const data = await hospitalityService.getProfile(organisationId);
      setProfile(data);
      setPackages(data.packages ?? []);
      setFoodMenu(data.food_menu ?? []);
      setNearbyPlaces(data.nearby_places ?? []);
      setGuestServices(data.guest_services ?? []);
    } catch (error) {
      toast({
        title: "Could not load hospitality profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setContentLoading(false);
    }
  }, [organisationId, toast]);

  useEffect(() => {
    if (CONTENT_SECTIONS.has(activeSection)) {
      void loadProfile();
    }
  }, [activeSection, loadProfile]);

  useEffect(() => {
    if (!searchParams.get("section")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("section", "room-definitions");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const prevLocationIdRef = useRef(locationId);

  useEffect(() => {
    if (prevLocationIdRef.current === locationId) return;
    const hadPreviousLocation = prevLocationIdRef.current > 0;
    prevLocationIdRef.current = locationId;
    if (!hadPreviousLocation) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("roomId");
        next.delete("id");
        return next;
      },
      { replace: true },
    );
  }, [locationId, setSearchParams]);

  const setSection = (section: HospitalitySection, roomId?: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("section", section);
        if (section === "room-definitions" && roomId) {
          next.set("roomId", String(roomId));
        } else if (section === "room-status" && roomId) {
          next.set("id", String(roomId));
          next.delete("roomId");
        } else {
          next.delete("id");
          if (section !== "room-definitions") next.delete("roomId");
        }
        return next;
      },
      { replace: true },
    );
  };

  const persistContent = async (
    section: HospitalitySection,
    payload: {
      packages?: HospitalityPackage[];
      food_menu?: HospitalityFoodItem[];
      nearby_places?: HospitalityNearbyPlace[];
      guest_services?: HospitalityGuestService[];
    },
  ) => {
    if (organisationId <= 0) return;
    setSaving(true);
    try {
      const req = new HospitalityContentSaveReq();
      req.organisation_id = organisationId;
      if (payload.packages) req.packages = payload.packages;
      if (payload.food_menu) req.food_menu = payload.food_menu;
      if (payload.nearby_places) req.nearby_places = payload.nearby_places;
      if (payload.guest_services) req.guest_services = payload.guest_services;

      const updated = await hospitalityService.saveContent(req);
      setProfile(updated);
      setPackages(updated.packages ?? []);
      setFoodMenu(updated.food_menu ?? []);
      setNearbyPlaces(updated.nearby_places ?? []);
      setGuestServices(updated.guest_services ?? []);
      toast({
        title: "Saved",
        description: `${SECTIONS.find((s) => s.id === section)?.label} updated.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (organisationId <= 0) {
    return (
      <p className="text-sm text-stone-500">Sign in with an organisation account to manage hospitality content.</p>
    );
  }

  return (
    <Tabs
      value={activeSection}
      onValueChange={(v) => setSection(v as HospitalitySection)}
      className="flex flex-col gap-4"
    >
      {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Business location</p>
          {locationsLoading ?
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations…
            </div>
          : locations.length === 0 ?
            <Card>
              <CardContent className="py-6 text-sm text-stone-500">
                Add a business location under Settings → Location before managing hospitality content.
              </CardContent>
            </Card>
          : locationId <= 0 ?
            <p className="text-sm text-stone-600">
              Select a location on the{" "}
              <Link to="/organization/dashboard" className="font-medium text-[#E85D4C] hover:underline">
                Dashboard
              </Link>{" "}
              to manage hospitality content.
            </p>
          : <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
                <MapPin className="h-4 w-4 shrink-0 text-[#E85D4C]" />
                {locationLabel || `Location #${locationId}`}
              </p>
              {locations.length > 1 ? (
                <Link
                  to="/organization/dashboard"
                  className="text-xs font-medium text-[#E85D4C] hover:underline"
                >
                  Change on Dashboard
                </Link>
              ) : null}
            </div>
          }
        </div>
      </div> */}

      <TabsList className="inline-flex h-auto w-full min-w-0 max-w-full flex-row flex-wrap justify-start gap-1 overflow-x-auto bg-white p-1 shadow-sm [scrollbar-width:thin]">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <TabsTrigger key={section.id} value={section.id} className={hospitalityTabTriggerClass}>
              <Icon className="mr-1.5 h-4 w-4 shrink-0" />
              {section.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="min-w-0 flex-1">
        {SECTIONS.map((section) => (
          <TabsContent
            key={section.id}
            value={section.id}
            forceMount={section.id === "room-definitions" ? true : undefined}
            className={cn(
              "mt-0 space-y-4",
              section.id === "room-definitions" && activeSection !== "room-definitions" && "hidden",
            )}
          >
            <p className="text-sm text-stone-600">{section.description}</p>

            {section.id === "room-definitions" ?
              <RoomDefinitionsPanel
                locationId={locationId}
                locationName={locationLabel}
                onOpenRoomStatus={(roomId) => setSection("room-status", roomId)}
              />
            : null}

            {section.id === "room-status" && activeSection === "room-status" ?
              <RoomStatusPanel
                locationId={locationId}
                locationName={locationLabel}
                selectedRoomId={selectedRoomId}
                onEditRoom={(roomId) => setSection("room-definitions", roomId)}
              />
            : null}

            {section.id === "policies" && activeSection === "policies" ?
              <HospitalityPoliciesPanel
                organisationId={organisationId}
                profile={profile}
                loading={contentLoading}
                onSaved={setProfile}
              />
            : null}

            {CONTENT_SECTIONS.has(section.id) && section.id !== "policies" && contentLoading ?
              <div className="flex items-center gap-2 py-12 text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading…
              </div>
            : null}

            {section.id === "packages" && !contentLoading && (
              <HospitalityPackagesPanel
                packages={packages}
                setPackages={setPackages}
                newItem={() => newPackage(packages.length)}
                onPersist={async (next) => persistContent("packages", { packages: next })}
              />
            )}

            {section.id === "food" && !contentLoading && (
              <HospitalityFoodPanel
                foodMenu={foodMenu}
                setFoodMenu={setFoodMenu}
                newItem={newFoodItem}
                onPersist={async (next) => persistContent("food", { food_menu: next })}
              />
            )}

            {section.id === "nearby" && !contentLoading && (
              <HospitalityNearbyPanel
                nearbyPlaces={nearbyPlaces}
                setNearbyPlaces={setNearbyPlaces}
                newItem={newNearbyPlace}
                onPersist={async (next) => persistContent("nearby", { nearby_places: next })}
              />
            )}

            {section.id === "guest-services" && !contentLoading && (
              <HospitalityGuestServicesPanel
                guestServices={guestServices}
                setGuestServices={setGuestServices}
                newItem={() => newGuestService(guestServices.length)}
                onPersist={async (next) => persistContent("guest-services", { guest_services: next })}
              />
            )}
          </TabsContent>
        ))}
        </div>
      </Tabs>
  );
}
