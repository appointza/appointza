/**
 * Public room booking URL on the main Appointza site.
 * Requires organisation and location scope.
 */
export function roomBookUrl(options: {
  roomCode: string;
  organisationId: number | string;
  organisationLocationId: number | string;
  checkIn?: string;
  checkOut?: string;
  packageId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("roomId", options.roomCode);
  params.set("organisationId", String(options.organisationId));
  params.set("locationId", String(options.organisationLocationId));
  if (options.checkIn) params.set("checkIn", options.checkIn);
  if (options.checkOut) params.set("checkOut", options.checkOut);
  if (options.packageId) params.set("packageId", options.packageId);
  return `/book?${params.toString()}`;
}

export function parseRoomBookingSearchParams(searchParams: URLSearchParams) {
  const organisationId = Number(
    searchParams.get("organisationId") ||
      searchParams.get("organisation_id") ||
      searchParams.get("org") ||
      "0",
  );
  const organisationLocationId = Number(
    searchParams.get("locationId") ||
      searchParams.get("organisation_location_id") ||
      searchParams.get("location") ||
      searchParams.get("loc") ||
      "0",
  );
  return {
    roomId: (searchParams.get("roomId") || "").trim(),
    packageId: (searchParams.get("packageId") || "").trim(),
    organisationId,
    organisationLocationId,
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    checkInTime: searchParams.get("checkInTime") || "",
    checkOutTime: searchParams.get("checkOutTime") || "",
  };
}
