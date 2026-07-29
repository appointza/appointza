
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organisation, OrganisationSelectReq } from '@/models/organisation.model';
import { useToast } from '@/hooks/use-toast';

export const useOrganizations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: organizations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      // Mock organization data since API services are removed
      return [
        { id: 1, name: "Sample Salon", address: "123 Main St", phone: "1234567890", isactive: true },
        { id: 2, name: "Health Clinic", address: "456 Oak Ave", phone: "0987654321", isactive: true }
      ] as Organisation[];
    },
  });

  const getOrganizationQuery = (id: number) => {
    return useQuery({
      queryKey: ['organization', id],
      queryFn: async () => {
        // Mock organization data since API services are removed
        return { id, name: `Organization ${id}`, address: "Sample Address", phone: "1234567890", isactive: true } as Organisation;
      },
      enabled: !!id,
    });
  };

  const updateOrganizationMutation = useMutation({
    mutationFn: async (organizationData: Organisation) => {
      // Mock organization update since API services are removed
      console.log('Updating organization:', organizationData);
      return organizationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({
        title: "Organization Updated",
        description: "Organization details have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      });
      console.error('Update organization error:', error);
    },
  });

  return {
    organizations: organizations || [],
    isLoading,
    error,
    refetch,
    getOrganizationQuery,
    updateOrganization: updateOrganizationMutation.mutate,
    isUpdating: updateOrganizationMutation.isPending,
  };
};
