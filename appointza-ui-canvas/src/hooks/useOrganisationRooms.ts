import { useQuery } from '@tanstack/react-query';
import { OrganisationRoom, normalizeOrganisationRoom } from '@/models/hospitality.model';
import { hospitalityService } from '@/services/hospitality.service';

export const organisationRoomsQueryKey = (
  organisationId: number,
  locationId: number,
) => ['organisation-rooms', organisationId, locationId] as const;

export async function fetchOrganisationRooms(
  organisationId: number,
  locationId: number,
): Promise<OrganisationRoom[]> {
  if (organisationId <= 0 || locationId <= 0) {
    return [];
  }

  const items = await hospitalityService.selectRooms({
    organisation_id: organisationId,
    organisation_location_id: locationId,
  });
  return (items ?? []).map((item) => normalizeOrganisationRoom(item));
}

export function useOrganisationRooms(params: {
  organisationId: number;
  locationId: number;
  enabled?: boolean;
}) {
  const { organisationId, locationId, enabled = true } = params;

  return useQuery({
    queryKey: organisationRoomsQueryKey(organisationId, locationId),
    queryFn: () => fetchOrganisationRooms(organisationId, locationId),
    enabled: enabled && organisationId > 0 && locationId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
