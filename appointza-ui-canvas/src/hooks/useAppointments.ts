import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Appoinment, AppoinmentSelectReq, AppoinmentDeleteReq, AppoinmentFinal } from '@/models/appoinment.model';
import { useToast } from '@/hooks/use-toast';

// Dummy appointment data for demonstration
const getDummyAppointments = (userId: number) => [
  {
    id: 1,
    userid: userId,
    organizationid: 101,
    organisationlocationid: 1,
    fromtime: new Date('2024-12-10T10:00:00'),
    totime: new Date('2024-12-10T11:30:00'),
    appoinmentdate: new Date('2024-12-10'),
    status: 1,
    statuscode: "COMPLETED",
    version: 1,
    createdby: userId,
    createdon: new Date('2024-12-01'),
    modifiedby: userId,
    modifiedon: new Date('2024-12-10'),
    attributes: {
      servicelist: [
        {
          id: 1,
          servicename: "Hair Cut & Styling",
          serviceprice: 50,
          servicetimetaken: 60,
          iscombo: false
        },
        {
          id: 2,
          servicename: "Hair Wash",
          serviceprice: 20,
          servicetimetaken: 30,
          iscombo: false
        }
      ]
    },
    isactive: true,
    issuspended: false,
    isfactory: false,
    notes: "Regular haircut, satisfied with service",
    staffid: 5,
    staffname: "Sarah Johnson",
    ispaid: true
  },
  {
    id: 2,
    userid: userId,
    organizationid: 102,
    organisationlocationid: 2,
    fromtime: new Date('2024-11-25T14:00:00'),
    totime: new Date('2024-11-25T15:00:00'),
    appoinmentdate: new Date('2024-11-25'),
    status: 1,
    statuscode: "COMPLETED",
    version: 1,
    createdby: userId,
    createdon: new Date('2024-11-20'),
    modifiedby: userId,
    modifiedon: new Date('2024-11-25'),
    attributes: {
      servicelist: [
        {
          id: 3,
          servicename: "Deep Cleaning",
          serviceprice: 80,
          servicetimetaken: 60,
          iscombo: false
        }
      ]
    },
    isactive: true,
    issuspended: false,
    isfactory: false,
    notes: "Excellent dental cleaning service",
    staffid: 3,
    staffname: "Dr. Mike Wilson",
    ispaid: true
  },
  {
    id: 3,
    userid: userId,
    organizationid: 103,
    organisationlocationid: 3,
    fromtime: new Date('2024-11-15T09:00:00'),
    totime: new Date('2024-11-15T10:30:00'),
    appoinmentdate: new Date('2024-11-15'),
    status: 1,
    statuscode: "COMPLETED",
    version: 1,
    createdby: userId,
    createdon: new Date('2024-11-10'),
    modifiedby: userId,
    modifiedon: new Date('2024-11-15'),
    attributes: {
      servicelist: [
        {
          id: 4,
          servicename: "Full Body Massage",
          serviceprice: 120,
          servicetimetaken: 90,
          iscombo: false
        }
      ]
    },
    isactive: true,
    issuspended: false,
    isfactory: false,
    notes: "Very relaxing massage session",
    staffid: 7,
    staffname: "Lisa Chen",
    ispaid: true
  },
  {
    id: 4,
    userid: userId,
    organizationid: 101,
    organisationlocationid: 1,
    fromtime: new Date('2024-10-20T11:00:00'),
    totime: new Date('2024-10-20T12:00:00'),
    appoinmentdate: new Date('2024-10-20'),
    status: 0,
    statuscode: "CANCELLED",
    version: 1,
    createdby: userId,
    createdon: new Date('2024-10-15'),
    modifiedby: userId,
    modifiedon: new Date('2024-10-19'),
    attributes: {
      servicelist: [
        {
          id: 5,
          servicename: "Beard Trim",
          serviceprice: 30,
          servicetimetaken: 30,
          iscombo: false
        }
      ]
    },
    isactive: false,
    issuspended: false,
    isfactory: false,
    notes: "Cancelled due to emergency",
    staffid: 5,
    staffname: "Sarah Johnson",
    ispaid: false
  },
  {
    id: 5,
    userid: userId,
    organizationid: 104,
    organisationlocationid: 4,
    fromtime: new Date('2024-12-20T16:00:00'),
    totime: new Date('2024-12-20T17:00:00'),
    appoinmentdate: new Date('2024-12-20'),
    status: 0,
    statuscode: "SCHEDULED",
    version: 1,
    createdby: userId,
    createdon: new Date('2024-12-14'),
    modifiedby: userId,
    modifiedon: new Date('2024-12-14'),
    attributes: {
      servicelist: [
        {
          id: 6,
          servicename: "Eye Exam",
          serviceprice: 75,
          servicetimetaken: 60,
          iscombo: false
        }
      ]
    },
    isactive: true,
    issuspended: false,
    isfactory: false,
    notes: "Annual eye checkup",
    staffid: 9,
    staffname: "Dr. Emma Davis",
    ispaid: false
  }
] as Appoinment[];

export const useAppointments = (organizationId?: number, userId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: appointments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['appointments', organizationId, userId],
    queryFn: async () => {
      // If userId is provided, return dummy data for demo purposes
      if (userId && !organizationId) {
        return getDummyAppointments(userId);
      }
      
      // Return dummy data since API services are removed
      return getDummyAppointments(userId || 1);
    },
    enabled: !!(organizationId || userId),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: Partial<Appoinment>) => {
      // Mock appointment creation since API services are removed
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
      // Mock appointment update since API services are removed
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
      // Mock appointment cancellation since API services are removed
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
