import { LocationService, type LocationDetail } from "@/services/location.service";
import type { OrganisationLocation } from "@/models/organisationlocation.model";

/** Dashboard / sidebar label: `cuddalore — Chennai`. */
export function formatOrganisationLocationLabel(
  location: Pick<OrganisationLocation, "name" | "city"> | null | undefined,
): string {
  if (!location) return "";
  const name = (location.name || "").trim();
  const city = (location.city || "").trim();
  if (name && city) return `${name} — ${city}`;
  return name || city || "";
}

export function organisationLocationToDetail(location: OrganisationLocation): LocationDetail {
  return {
    id: location.id,
    name: location.name || "",
    address: location.addressline1 || location.address || "",
    city: location.city || "",
    state: location.state || "",
    country: location.country || "",
    pincode: location.pincode || "",
    phone: location.whatsapp_mobile || "",
    email: location.email || "",
    organisationid: location.organisationid || 0,
    templateid: location.templateid || 0,
    isactive: location.isactive !== false,
    createdby: location.createdby || 0,
    createdon: String(location.createdon || ""),
    modifiedby: location.modifiedby || 0,
    modifiedon: String(location.modifiedon || ""),
    version: location.version || 0,
  };
}

/** Persist active organisation location for sidebar + other org pages. */
export function persistOrganisationLocationSelection(
  location: OrganisationLocation,
  options?: { refreshAuth?: () => void },
): void {
  if (!location?.id) return;

  try {
    const userContextStr = localStorage.getItem("user_context");
    if (userContextStr) {
      const userContext = JSON.parse(userContextStr);
      userContext.organisationlocationid = location.id;
      userContext.organisationlocationname = formatOrganisationLocationLabel(location);
      localStorage.setItem("user_context", JSON.stringify(userContext));
    }
  } catch {
    // ignore malformed user_context
  }

  localStorage.setItem("organizationlocationid", String(location.id));
  LocationService.saveLocationToStorage(organisationLocationToDetail(location));

  window.dispatchEvent(
    new CustomEvent("userContextUpdated", {
      detail: { organisationlocationid: location.id },
    }),
  );
  window.dispatchEvent(
    new CustomEvent("organizationlocationidChanged", {
      detail: { organizationlocationid: location.id },
    }),
  );

  options?.refreshAuth?.();
}
