import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { cn } from "@/lib/utils";
import {
  formatOrganisationLocationLabel,
  persistOrganisationLocationSelection,
} from "@/utils/organisationLocationSelection.util";

type OrganizationSidebarLocationProps = {
  collapsed: boolean;
};

export function OrganizationSidebarLocation({ collapsed }: OrganizationSidebarLocationProps) {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const organisationId = user?.organisationid || 0;
  const staffLocationId = user?.locationid || 0;
  const isStaff = user?.isStaff === true;

  const { data: locations = [], isLoading } = useOrganisationLocations({
    organisationId,
    staffLocationId,
    enabled: isAuthenticated,
  });

  const [selectedId, setSelectedId] = useState(0);

  useEffect(() => {
    if (locations.length === 0) return;

    const pick = (id: number) =>
      id > 0 && locations.some((loc) => loc.id === id) ? id : 0;

    const fromGlobal = pick(Number(globalLocationId) || 0);
    if (fromGlobal) {
      setSelectedId(fromGlobal);
      return;
    }

    const fromStorage = pick(Number(localStorage.getItem("organizationlocationid") || 0));
    if (fromStorage) {
      setSelectedId(fromStorage);
      setGlobalLocationId(fromStorage);
      return;
    }

    const firstId = locations[0]?.id ?? 0;
    if (firstId > 0) {
      setSelectedId(firstId);
      setGlobalLocationId(firstId);
    }
  }, [locations, globalLocationId, setGlobalLocationId]);

  useEffect(() => {
    const handleLocationChanged = (event: Event) => {
      const nextId = Number(
        (event as CustomEvent<{ organizationlocationid?: number }>).detail?.organizationlocationid || 0,
      );
      if (nextId > 0) setSelectedId(nextId);
    };
    window.addEventListener("organizationlocationidChanged", handleLocationChanged);
    return () => window.removeEventListener("organizationlocationidChanged", handleLocationChanged);
  }, []);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedId) ?? null,
    [locations, selectedId],
  );

  const label = formatOrganisationLocationLabel(selectedLocation);

  const handleChange = (value: string) => {
    const nextId = Number(value);
    const nextLocation = locations.find((loc) => loc.id === nextId);
    if (!nextLocation) return;
    setSelectedId(nextId);
    setGlobalLocationId(nextId);
    persistOrganisationLocationSelection(nextLocation, { refreshAuth });
  };

  if (isLoading && locations.length === 0) {
    return (
      <div className={cn("border-b border-zinc-800", collapsed ? "px-2 py-3" : "px-3 py-3")}>
        <p className={cn("text-[11px] text-zinc-500", collapsed && "text-center")}>…</p>
      </div>
    );
  }

  if (!selectedLocation && locations.length === 0) return null;

  if (collapsed) {
    return (
      <div className="border-b border-zinc-800 px-2 py-3" title={label || "Location"}>
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-300">
          <MapPin className="h-4 w-4" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-b border-zinc-800 px-3 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        <MapPin className="h-3 w-3" aria-hidden />
        Location
      </p>
      {isStaff || locations.length <= 1 ? (
        <p className="truncate text-sm font-medium text-white" title={label}>
          {label || "No location"}
        </p>
      ) : (
        <Select value={selectedId > 0 ? String(selectedId) : undefined} onValueChange={handleChange}>
          <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-left text-sm text-white shadow-none hover:border-zinc-500 focus:border-zinc-500 focus:ring-0 [&>span]:line-clamp-1">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={String(location.id)}>
                {formatOrganisationLocationLabel(location)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
