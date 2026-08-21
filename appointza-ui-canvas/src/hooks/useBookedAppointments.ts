import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppoinmentSelectReq, BookedAppoinmentRes } from '@/models/appoinment.model';
import { AppoinmentService } from '@/services/appoinment.service';

export const bookedAppointmentsQueryKey = (params: {
  organisationId?: number;
  organisationLocationId?: number;
  userId?: number;
  appointmentDate?: string;
}) =>
  [
    'booked-appointments',
    params.organisationId ?? 0,
    params.organisationLocationId ?? 0,
    params.userId ?? 0,
    params.appointmentDate ?? '',
  ] as const;

export async function fetchBookedAppointments(params: {
  organisationId?: number;
  organisationLocationId?: number;
  userId?: number;
  appointmentDate?: string;
}): Promise<BookedAppoinmentRes[]> {
  const service = new AppoinmentService();
  const req = new AppoinmentSelectReq();
  if (params.organisationId && params.organisationId > 0) {
    req.organisationid = params.organisationId;
  }
  if (params.organisationLocationId && params.organisationLocationId > 0) {
    req.organisationlocationid = params.organisationLocationId;
  }
  if (params.userId && params.userId > 0) {
    req.userid = params.userId;
  }
  if (params.appointmentDate) {
    req.appointmentdate = params.appointmentDate;
  }
  return (await service.SelectBookedAppoinment(req)) ?? [];
}

/** Shared React Query for SelectBookedAppoinment (org day calendar or user history). */
export function useBookedAppointments(params: {
  organisationId?: number;
  organisationLocationId?: number;
  userId?: number;
  appointmentDate?: string;
  enabled?: boolean;
}) {
  const {
    organisationId = 0,
    organisationLocationId = 0,
    userId = 0,
    appointmentDate = '',
    enabled = true,
  } = params;

  const canQuery =
    userId > 0 ||
    (organisationId > 0 && !!appointmentDate) ||
    (organisationId > 0 && organisationLocationId > 0);

  return useQuery({
    queryKey: bookedAppointmentsQueryKey({
      organisationId,
      organisationLocationId,
      userId,
      appointmentDate,
    }),
    queryFn: () =>
      fetchBookedAppointments({
        organisationId,
        organisationLocationId,
        userId,
        appointmentDate,
      }),
    enabled: enabled && canQuery,
    staleTime: 30_000,
  });
}

export function useInvalidateBookedAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['booked-appointments'] });
}
