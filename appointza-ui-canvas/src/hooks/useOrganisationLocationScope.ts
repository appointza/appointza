import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { OrganisationLocation, OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";

function readStoredLocationId(): number {
  try {
    const fromKey = Number(localStorage.getItem("organizationlocationid") || 0);
    if (fromKey > 0) return fromKey;

    const userContextStr = localStorage.getItem("user_context");
    if (!userContextStr) return 0;
    const userContext = JSON.parse(userContextStr);
    return Number(userContext?.organisationlocationid || 0);
  } catch {
    return 0;
  }
}

export function useOrganisationLocationScope(organisationId: number) {
  const { user, isAuthenticated } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLocationChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ organizationlocationid?: number }>).detail;
      const nextId = Number(detail?.organizationlocationid || 0);
      if (nextId > 0) {
        setGlobalLocationId(nextId);
      }
    };

    window.addEventListener("organizationlocationidChanged", handleLocationChanged);
    return () => window.removeEventListener("organizationlocationidChanged", handleLocationChanged);
  }, [setGlobalLocationId]);

  const loadLocations = useCallback(async () => {
    if (!isAuthenticated || organisationId <= 0) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const req = new OrganisationLocationSelectReq();
      if (organisationId > 0) {
        req.organisationid = organisationId;
      } else if (user?.locationid && user.locationid > 0) {
        req.organisationlocationid = user.locationid;
      }

      const response = await locationService.select(req);
      const locs = response ?? [];
      setLocations(locs);

      if (locs.length === 0) return;

      const storedId = globalLocationId
        ? Number(globalLocationId)
        : readStoredLocationId();
      const staffLocationId = user?.locationid && user.locationid > 0 ? user.locationid : 0;
      const preferredId =
        storedId > 0 && locs.some((loc) => loc.id === storedId) ? storedId
        : staffLocationId > 0 && locs.some((loc) => loc.id === staffLocationId) ? staffLocationId
        : locs[0].id;

      if (!globalLocationId || !locs.some((loc) => loc.id === Number(globalLocationId))) {
        setGlobalLocationId(preferredId);
      }
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [
    globalLocationId,
    isAuthenticated,
    locationService,
    organisationId,
    setGlobalLocationId,
    user?.locationid,
  ]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const locationId = useMemo(() => {
    const fromGlobal = globalLocationId ? Number(globalLocationId) : 0;
    if (fromGlobal > 0 && locations.some((loc) => loc.id === fromGlobal)) {
      return fromGlobal;
    }
    if (locations.length === 1) return locations[0].id;
    return 0;
  }, [globalLocationId, locations]);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) ?? null,
    [locationId, locations],
  );

  const setLocationId = useCallback(
    (id: number) => {
      setGlobalLocationId(id);
    },
    [setGlobalLocationId],
  );

  return {
    locations,
    locationId,
    selectedLocation,
    loading,
    setLocationId,
    reloadLocations: loadLocations,
  };
}
