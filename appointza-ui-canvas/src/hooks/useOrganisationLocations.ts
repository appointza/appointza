import { useQuery } from '@tanstack/react-query';
import { OrganisationLocation, OrganisationLocationSelectReq } from '@/models/organisationlocation.model';
import { OrganisationLocationService } from '@/services/organisationlocation.service';

export const organisationLocationsQueryKey = (
  organisationId: number,
  staffLocationId: number,
) =>
  organisationId > 0
    ? (['organisation-locations', organisationId] as const)
    : (['organisation-locations', organisationId, staffLocationId] as const);

/** Shared fetcher — also used by onboarding so Location/Select hits one React Query cache. */
export async function fetchOrganisationLocations(
  organisationId: number,
  staffLocationId: number,
): Promise<OrganisationLocation[]> {
  const locationService = new OrganisationLocationService();
  const locReq = new OrganisationLocationSelectReq();

  if (organisationId > 0) {
    locReq.organisationid = organisationId;
  } else if (staffLocationId > 0) {
    locReq.organisationlocationid = staffLocationId;
  } else {
    return [];
  }

  return (await locationService.select(locReq)) ?? [];
}

export function useOrganisationLocations(params: {
  organisationId: number;
  staffLocationId?: number;
  enabled?: boolean;
}) {
  const { organisationId, staffLocationId = 0, enabled = true } = params;

  return useQuery({
    queryKey: organisationLocationsQueryKey(organisationId, staffLocationId),
    queryFn: () => fetchOrganisationLocations(organisationId, staffLocationId),
    enabled: enabled && (organisationId > 0 || staffLocationId > 0),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
