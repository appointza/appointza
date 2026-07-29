
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Staff, StaffSelectReq, StaffDeleteReq } from '@/models/staff.model';
import { useToast } from '@/hooks/use-toast';

export const useStaff = (organizationId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: staff,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['staff', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      // Mock staff data since API services are removed
      return [
        { id: 1, name: "John Doe", email: "john@example.com", phone: "1234567890", isactive: true },
        { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "0987654321", isactive: true }
      ] as Staff[];
    },
    enabled: !!organizationId,
  });

  const createStaffMutation = useMutation({
    mutationFn: async (staffData: Partial<Staff>) => {
      // Mock staff creation since API services are removed
      console.log('Creating staff:', staffData);
      return { id: Date.now(), ...staffData } as Staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Staff Added",
        description: "Staff member has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
      console.error('Create staff error:', error);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (staffData: Staff) => {
      // Mock staff update since API services are removed
      console.log('Updating staff:', staffData);
      return staffData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Staff Updated",
        description: "Staff member has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
      console.error('Update staff error:', error);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      // Mock staff deletion since API services are removed
      console.log('Deleting staff:', staffId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Staff Removed",
        description: "Staff member has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove staff member. Please try again.",
        variant: "destructive",
      });
      console.error('Delete staff error:', error);
    },
  });

  return {
    staff: staff || [],
    isLoading,
    error,
    refetch,
    createStaff: createStaffMutation.mutate,
    updateStaff: updateStaffMutation.mutate,
    deleteStaff: deleteStaffMutation.mutate,
    isCreating: createStaffMutation.isPending,
    isUpdating: updateStaffMutation.isPending,
    isDeleting: deleteStaffMutation.isPending,
  };
};
