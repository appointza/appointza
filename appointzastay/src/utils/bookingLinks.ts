export type BookQuery = {
  roomId?: string;
  packageId?: string;
  checkIn?: string;
  checkOut?: string;
  persons?: number;
};

function basePath(): string {
  return (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
}

export function bookUrl(query: BookQuery = {}): string {
  const params = new URLSearchParams();
  if (query.roomId) params.set("roomId", query.roomId);
  if (query.packageId) params.set("packageId", query.packageId);
  if (query.checkIn) params.set("checkIn", query.checkIn);
  if (query.checkOut) params.set("checkOut", query.checkOut);
  if (query.persons != null && query.persons > 0) params.set("persons", String(query.persons));
  const qs = params.toString();
  return `${basePath()}/book${qs ? `?${qs}` : ""}`;
}

export const BOOKING_ROOM_NONE = "__none__";
