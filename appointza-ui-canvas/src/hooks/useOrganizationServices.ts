import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationServices, OrganisationServicesDeleteReq, OrganisationServicesSelectReq } from '@/models/organisationservices.model';
import { useToast } from '@/hooks/use-toast';
import { OrganisationServicesService } from '@/services/organisationservices.service';
import { invalidatePublicSiteCacheForLocation } from '@/utils/publicSiteCache.util';

export const organizationServicesQueryKey = (
  organizationId?: number,
  locationId?: number,
) => ['organization-services', organizationId, locationId] as const;

export const useOrganizationServices = (
  organizationId?: number,
  locationId?: number,
  options?: { enabled?: boolean },
) => {
  const queryEnabled = options?.enabled !== false;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const service = new OrganisationServicesService();

  const {
    data: services,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: organizationServicesQueryKey(organizationId, locationId),
    queryFn: async () => {
      if (!organizationId) return [];
      
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organizationId;
      if (locationId && locationId > 0) {
        req.organisationlocationid = locationId;
      }
      
      const response = await service.select(req);
      return response || [];
    },
    enabled: !!organizationId && (locationId ?? 0) > 0 && queryEnabled,
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<OrganisationServices>) => {
      const serviceToSave = { ...serviceData } as OrganisationServices;
      return await service.insert(serviceToSave);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      const cacheLocationId = Number(variables.organisationlocationid ?? locationId ?? 0);
      if (cacheLocationId > 0) {
        invalidatePublicSiteCacheForLocation(cacheLocationId);
      }
      toast({
        title: "Service Created",
        description: "Service has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
      console.error('Create service error:', error);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: OrganisationServices) => {
      return await service.update(serviceData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      const cacheLocationId = Number(variables.organisationlocationid ?? locationId ?? 0);
      if (cacheLocationId > 0) {
        invalidatePublicSiteCacheForLocation(cacheLocationId);
      }
      toast({
        title: "Service Updated",
        description: "Service has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
      console.error('Update service error:', error);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const cached = queryClient.getQueryData<OrganisationServices[]>(
        organizationServicesQueryKey(organizationId, locationId),
      );
      const serviceToDelete = cached?.find((item) => item.id === serviceId);

      const deleteReq = new OrganisationServicesDeleteReq();
      deleteReq.id = serviceId;
      deleteReq.version = serviceToDelete?.version || 1;
      return await service.delete(deleteReq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      if (locationId && locationId > 0) {
        invalidatePublicSiteCacheForLocation(locationId);
      }
      toast({
        title: "Service Deleted",
        description: "Service has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
      console.error('Delete service error:', error);
    },
  });

  return {
    services: services || [],
    isLoading,
    error,
    refetch,
    createService: createServiceMutation.mutate,
    createServiceAsync: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutate,
    deleteService: deleteServiceMutation.mutate,
    isCreating: createServiceMutation.isPending,
    isUpdating: updateServiceMutation.isPending,
    isDeleting: deleteServiceMutation.isPending,
  };
};
