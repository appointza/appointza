import type { OrganisationDetail } from "@/models/organisation.model";
import { getUiBaseUrl } from "@/utils/environment";
import {
  buildOrganisationPublicSiteUrl,
  buildOrganisationTemplateBookingUrl,
  isOrgLocTempId,
} from "@/utils/orgPublicSiteUrl.util";

export function organisationInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Final public profile / book URL for marketing browse cards.
 * Prefer subdomain + /template/{guid} so the tab opens the renderer directly
 * (skips about:blank + subdomain root resolve hop).
 */
export function organisationPublicUrls(org: OrganisationDetail) {
  const subdomainOrigin = buildOrganisationPublicSiteUrl({
    customUrl: org.organisationlocationcustomurl,
  });
  const guid = (org.organisationlocationorgloctempid || "").trim();
  const templateOnMain = buildOrganisationTemplateBookingUrl(guid);

  let fullUrl = "";
  if (subdomainOrigin && guid && isOrgLocTempId(guid)) {
    fullUrl = `${subdomainOrigin.replace(/\/+$/, "")}/template/${encodeURIComponent(guid)}`;
  } else if (subdomainOrigin) {
    fullUrl = subdomainOrigin;
  } else if (templateOnMain) {
    fullUrl = templateOnMain;
  } else if (org.organisationid > 0 && org.organisationlocationid > 0) {
    fullUrl = `${getUiBaseUrl()}/book-appointment/${org.organisationid}/${org.organisationlocationid}`;
  }

  if (!fullUrl) {
    return { fullUrl: "", displayUrl: "Booking page not set up yet" };
  }

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
