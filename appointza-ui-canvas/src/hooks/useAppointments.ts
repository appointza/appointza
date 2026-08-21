import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Appoinment } from '@/models/appoinment.model';
import { useToast } from '@/hooks/use-toast';
import { fetchBookedAppointments } from '@/hooks/useBookedAppointments';

export const useAppointments = (organizationId?: number, userId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', organizationId ?? 0, userId ?? 0],
    queryFn: () =>
      fetchBookedAppointments({
        organisationId: organizationId || 0,
        userId: userId || 0,
      }),
    enabled: !!(organizationId || userId),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: Partial<Appoinment>) => {
      // Mock appointment creation for BookAppointment / OrganizationDetail demo pages
      console.log('Creating appointment with data:', appointmentData);
      return { success: true, id: Date.now() };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment Booked Successfully!",
        description: "Your appointment has been scheduled. You will receive a confirmation shortly.",
      });
      console.log('Appointment created successfully:', data);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
      console.error('Create appointment error:', error);
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: Appoinment) => {
      console.log('Updating appointment with data:', appointmentData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment Updated",
        description: "Appointment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
      console.error('Update appointment error:', error);
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      console.log('Cancelling appointment:', appointmentId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment Cancelled",
        description: "Appointment has been cancelled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
      console.error('Cancel appointment error:', error);
    },
  });

  return {
    appointments: appointments || [],
    isLoading,
    error,
    refetch,
    createAppointment: createAppointmentMutation.mutate,
    updateAppointment: updateAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
  };
};
