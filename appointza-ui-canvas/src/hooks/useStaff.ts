import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Staff, StaffSelectReq, StaffDeleteReq, StaffUser } from '@/models/staff.model';
import { StaffService } from '@/services/staff.service';
import { useToast } from '@/hooks/use-toast';

export const staffQueryKey = (organizationId?: number) =>
  ['staff', organizationId ?? 0] as const;

export async function fetchOrganisationStaff(organizationId: number): Promise<StaffUser[]> {
  if (!organizationId) return [];
  const staffService = new StaffService();
  const req = new StaffSelectReq();
  req.organisationid = organizationId;
  return (await staffService.SelectStaffDetail(req)) ?? [];
}

export const useStaff = (organizationId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const staffService = new StaffService();

  const {
    data: staff,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: staffQueryKey(organizationId),
    queryFn: () => fetchOrganisationStaff(organizationId || 0),
    enabled: !!organizationId && organizationId > 0,
    staleTime: 30_000,
  });

  const createStaffMutation = useMutation({
    mutationFn: async (staffData: Partial<Staff>) => {
      return await staffService.insert(staffData as Staff);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Staff Added',
        description: 'Staff member has been added successfully.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to add staff member. Please try again.',
        variant: 'destructive',
      });
      console.error('Create staff error:', err);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (staffData: Staff) => {
      return await staffService.update(staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Staff Updated',
        description: 'Staff member has been updated successfully.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to update staff member. Please try again.',
        variant: 'destructive',
      });
      console.error('Update staff error:', err);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (payload: { staffId: number; version: number }) => {
      const deleteReq = new StaffDeleteReq();
      deleteReq.id = payload.staffId;
      deleteReq.version = payload.version;
      return await staffService.delete(deleteReq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Staff Removed',
        description: 'Staff member has been removed successfully.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to remove staff member. Please try again.',
        variant: 'destructive',
      });
      console.error('Delete staff error:', err);
    },
  });

  return {
    staff: (staff || []) as StaffUser[],
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
