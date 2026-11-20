/** Parse walk-in booking slot query params from calendar slot click. */
export function parseWalkInSlotParams(search: URLSearchParams | { get(name: string): string | null }) {
  const date = (search.get("date") || "").trim();
  const from = (search.get("from") || "").trim();
  const to = (search.get("to") || "").trim();
  const hasPrefill = Boolean(date);
  return {
    date,
    from,
    to,
    hasPrefill,
  };
}

/** Build book-appointment URL with optional walk-in slot and customer context. */
export function buildWalkInBookingUrl(options: {
  organisationId: number;
  organisationLocationId: number;
  userId: number;
  userMobile: string;
  date?: string;
  from?: string;
  to?: string;
  serviceId?: number;
}): string {
  const params = new URLSearchParams();
  if (options.userId > 0) params.set("userId", String(options.userId));
  if (options.userMobile) params.set("userMobile", options.userMobile);
  if (options.date) params.set("date", options.date);
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.serviceId && options.serviceId > 0) params.set("serviceId", String(options.serviceId));
  const qs = params.toString();
  return `/book-appointment/${options.organisationId}/${options.organisationLocationId}${qs ? `?${qs}` : ""}`;
}

export function canRescheduleAppointmentStatus(statuscode: string | null | undefined): boolean {
  const code = String(statuscode ?? "").trim().toUpperCase();
  return code === "" || code === "PENDING" || code === "CONFIRMED" || code === "BOOKED" || code === "SCHEDULED";
}
