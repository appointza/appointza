import type { OrganisationDetail } from "@/models/organisation.model";
import { buildOrganisationPublicSiteUrl } from "@/utils/orgPublicSiteUrl.util";

export function organisationInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Subdomain visitor URL + display label for marketing / public browse cards. */
export function organisationPublicUrls(org: OrganisationDetail) {
  const fullUrl = buildOrganisationPublicSiteUrl({
    customUrl: org.organisationlocationcustomurl,
  });

  try {
    const parsed = new URL(fullUrl);
    return {
      fullUrl,
      displayUrl: `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`,
    };
  } catch {
    return { fullUrl, displayUrl: fullUrl.replace(/^https?:\/\//, "") };
  }
}
