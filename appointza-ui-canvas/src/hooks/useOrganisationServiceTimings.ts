import { useQuery } from "@tanstack/react-query";
import { OrganisationServiceTimingSelectReq } from "@/models/organisationservicetiming.model";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";

export const organisationServiceTimingsQueryKey = (
  organisationId: number,
  locationId: number,
) => ["organisation-service-timings", organisationId, locationId] as const;

export async function fetchOrganisationServiceTimings(
  organisationId: number,
  locationId: number,
) {
  const timingService = new OrganisationServiceTimingService();
  const req = new OrganisationServiceTimingSelectReq();
  req.organisationid = organisationId;
  req.organisationlocationid = locationId;
  return (await timingService.select(req)) ?? [];
}

export function useOrganisationServiceTimings(params: {
  organisationId: number;
  locationId: number;
  enabled?: boolean;
}) {
  const { organisationId, locationId, enabled = true } = params;

  return useQuery({
    queryKey: organisationServiceTimingsQueryKey(organisationId, locationId),
    queryFn: () => fetchOrganisationServiceTimings(organisationId, locationId),
    enabled: enabled && organisationId > 0 && locationId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
