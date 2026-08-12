
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationServices, OrganisationServicesSelectReq, OrganisationServicesDeleteReq } from '@/models/organisationservices.model';
import { useToast } from '@/hooks/use-toast';
import { OrganisationServicesService } from '@/services/organisationservices.service';

export const useOrganizationServices = (organizationId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const service = new OrganisationServicesService();

  const {
    data: services,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization-services', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('🔍 Fetching services for organization:', organizationId);
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organizationId;
      
      const response = await service.select(req);
      console.log('✅ Services API response:', response);
      return response || [];
    },
    enabled: !!organizationId,
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<OrganisationServices>) => {
      console.log('Creating service:', serviceData);
      const serviceToSave = { ...serviceData } as OrganisationServices;
      return await service.insert(serviceToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
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
      console.log('Updating service:', serviceData);
      return await service.update(serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
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
      console.log('Deleting service:', serviceId);
      // Get the service to get its version
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organizationId;
      const services = await service.select(req);
      const serviceToDelete = services?.find(s => s.id === serviceId);
      
      const deleteReq = new OrganisationServicesDeleteReq();
      deleteReq.id = serviceId;
      deleteReq.version = serviceToDelete?.version || 1;
      return await service.delete(deleteReq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
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
