import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, EventSelectReq, EventDeleteReq } from '@/models/event.model';
import { useToast } from '@/hooks/use-toast';
import { EventService } from '@/services/event.service';

export const useEvents = (organizationId?: number, locationId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const service = new EventService();

  const {
    data: events,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['events', organizationId, locationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('🔍 Fetching events for organization:', organizationId, 'location:', locationId);
      const req = new EventSelectReq();
      req.organisation_id = organizationId;
      if (locationId) {
        req.organisation_location_id = locationId;
      }
      // Services management should show all created events (past/today/future).
      req.include_past = true;
      
      const response = await service.select(req);
      console.log('✅ Events API response:', response);
      return response || [];
    },
    enabled: !!organizationId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      console.log('Creating event:', eventData);
      const eventToSave = { ...eventData } as Event;
      return await service.insert(eventToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
      console.error('Create event error:', error);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Event) => {
      console.log('Updating event:', eventData);
      return await service.update(eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Event Updated",
        description: "Event has been updated successfully.",
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible locations
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message ||
                          error?.response?.data?.title ||
                          error?.message || 
                          "Failed to update event. Please try again.";
      toast({
        title: "Cannot Update Event",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Update event error:', error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      console.log('Deleting event:', eventId);
      const deleteReq = new EventDeleteReq();
      deleteReq.id = eventId;
      return await service.delete(deleteReq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Event Deleted",
        description: "Event has been removed successfully.",
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible locations
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message ||
                          error?.response?.data?.title ||
                          error?.message || 
                          "Failed to delete event. Please try again.";
      toast({
        title: "Cannot Delete Event",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Delete event error:', error);
    },
  });

  return {
    events: events || [],
    isLoading,
    error,
    refetch,
    createEvent: createEventMutation.mutate,
    createEventAsync: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};

