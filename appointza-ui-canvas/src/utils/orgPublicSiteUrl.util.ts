import { getDomainName, getUiBaseUrl } from "@/utils/environment";
import { normalizeCustomUrlSlug } from "@/utils/slug.util";

export type OrganisationSiteUrlInput = {
  customUrl?: string | null;
};

/** Display host: `{customurl slug}.{domainname from config}`. */
export function buildOrganisationCustomUrlHost(input: Pick<OrganisationSiteUrlInput, "customUrl">): string {
  const slug = normalizeCustomUrlSlug(input.customUrl);
  if (!slug) return "";
  return `${slug}.${getDomainName()}`;
}

export function buildOrganisationPublicSiteOriginFromHost(host: string): string {
  const hostname = host.split("/")[0].toLowerCase();
  const protocol = hostname.endsWith("appointza.com") || hostname === "appointza.com" ? "https:" : (
    typeof window !== "undefined" && window.location.protocol === "http:" ? "http:" : "https:"
  );
  return `${protocol}//${host}`;
}

/** Canonical public site URL — `{customurl}.{domain}`. */
export function buildOrganisationPublicSiteUrl(input: OrganisationSiteUrlInput): string {
  const host = buildOrganisationCustomUrlHost(input);
  if (!host) return "";
  return buildOrganisationPublicSiteOriginFromHost(host);
}

/** UUID assigned once when an organisation location is created (`orgloctempid`). */
const ORG_LOC_TEMP_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOrgLocTempId(value?: string | null): boolean {
  return !!value?.trim() && ORG_LOC_TEMP_ID_REGEX.test(value.trim());
}

/** Booking URL using stable location GUID: `/template/{orgloctempid}`. */
export function buildOrganisationTemplateBookingUrl(orgloctempid?: string | null): string {
  const guid = orgloctempid?.trim();
  if (!guid || !isOrgLocTempId(guid)) return "";
  return `${getUiBaseUrl()}/template/${encodeURIComponent(guid)}`;
}

/** Subdomain slug from host, e.g. awonderonesurprise.localhost:5000 → awonderonesurprise */
export function extractOrganisationCustomSubdomain(host: string): string | null {
  const hostOnly = (host || "").replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  if (!hostOnly) return null;

  const colonIdx = hostOnly.lastIndexOf(":");
  const hostname = colonIdx > -1 ? hostOnly.slice(0, colonIdx) : hostOnly;
  const port = colonIdx > -1 ? hostOnly.slice(colonIdx + 1) : "";
  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  const domain = getDomainName().toLowerCase();
  const domainColonIdx = domain.lastIndexOf(":");
  const domainHost = domainColonIdx > -1 ? domain.slice(0, domainColonIdx) : domain;
  const domainPort = domainColonIdx > -1 ? domain.slice(domainColonIdx + 1) : "";
  const domainWithPort = domainPort ? `${domainHost}:${domainPort}` : domainHost;

  if (
    hostWithPort === domainWithPort ||
    hostWithPort === `www.${domainWithPort}` ||
    hostname === domainHost ||
    hostname === `www.${domainHost}`
  ) {
    return null;
  }

  const suffixWithPort = `.${domainWithPort}`;
  if (hostWithPort.endsWith(suffixWithPort)) {
    const slug = hostWithPort.slice(0, -suffixWithPort.length);
    if (slug && !slug.includes(".")) {
      return slug;
    }
  }

  // Dev subdomains: {slug}.localhost with any port (e.g. awonderonesurprise.localhost:5000)
  if (hostname.endsWith(".localhost") && hostname !== "localhost") {
    const slug = hostname.slice(0, -".localhost".length);
    if (slug && !slug.includes(".")) {
      return slug;
    }
  }

  return null;
}

export function isOrganisationSubdomainHost(host: string = typeof window !== "undefined" ? window.location.host : ""): boolean {
  return !!extractOrganisationCustomSubdomain(host);
}
