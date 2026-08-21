import { useInfiniteQuery } from '@tanstack/react-query';
import { OrganisationServicesSelectReq, PublicServiceCatalogueItem } from '@/models/organisationservices.model';
import { OrganisationServicesService } from '@/services/organisationservices.service';

export const PUBLIC_SERVICE_PAGE_SIZE = 80;

export const publicServiceCatalogueQueryKey = (search: string) =>
  ['public-service-catalogue', search] as const;

export async function fetchPublicServiceCatalogue(
  search = '',
  skip = 0,
  take = PUBLIC_SERVICE_PAGE_SIZE,
): Promise<PublicServiceCatalogueItem[]> {
  const service = new OrganisationServicesService();
  const req = new OrganisationServicesSelectReq();
  req.public_catalogue = true;
  req.search = search;
  req.skip = skip;
  req.take = take;
  return (await service.selectPublicCatalogue(req)) ?? [];
}

export function usePublicServiceCatalogue(params: { search?: string; enabled?: boolean } = {}) {
  const { search = '', enabled = true } = params;

  return useInfiniteQuery({
    queryKey: publicServiceCatalogueQueryKey(search),
    queryFn: ({ pageParam }) =>
      fetchPublicServiceCatalogue(search, pageParam, PUBLIC_SERVICE_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PUBLIC_SERVICE_PAGE_SIZE ? undefined : allPages.length * PUBLIC_SERVICE_PAGE_SIZE,
    enabled,
    staleTime: 60_000,
  });
}
