import { useQuery } from '@tanstack/react-query';
import { ReferenceValue, ReferenceValueSelectReq } from '@/models/referencevalue.model';
import { ReferenceValueService } from '@/services/referencevalue.service';

export const referenceValuesQueryKey = (
  organisationId: number,
  referencetypeid: number,
) => ['reference-values', organisationId, referencetypeid] as const;

export async function fetchReferenceValues(
  organisationId: number,
  referencetypeid: number,
): Promise<ReferenceValue[]> {
  if (organisationId <= 0 || referencetypeid <= 0) {
    return [];
  }

  const service = new ReferenceValueService();
  const req = new ReferenceValueSelectReq();
  req.referencetypeid = referencetypeid;
  req.organisationid = organisationId;
  return (await service.select(req)) ?? [];
}

export function useReferenceValues(params: {
  organisationId: number;
  referencetypeid: number;
  enabled?: boolean;
}) {
  const { organisationId, referencetypeid, enabled = true } = params;

  return useQuery({
    queryKey: referenceValuesQueryKey(organisationId, referencetypeid),
    queryFn: () => fetchReferenceValues(organisationId, referencetypeid),
    enabled: enabled && organisationId > 0 && referencetypeid > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
