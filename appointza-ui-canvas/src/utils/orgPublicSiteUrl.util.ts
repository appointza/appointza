import { getAppDomain, getMarketingDomain } from "@/utils/environment";
import { generateSubdomainSlug, parseCustomSiteOrigin } from "@/utils/slug.util";
import { parseSubdomainLocation } from "@/utils/subdomain.util";

export type OrganisationSiteUrlInput = {
  organisationName: string;
  areaName: string;
  cityName: string;
  stateName: string;
  customUrl?: string | null;
};

function resolveSubdomainParentHost(): string {
  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    const h = hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) {
      return port ? `localhost:${port}` : "localhost";
    }
  }
  return getMarketingDomain();
}

/**
 * Canonical public booking page URL — org subdomain root only (never `/template/:id`).
 */
export function buildOrganisationPublicSiteUrl(input: OrganisationSiteUrlInput): string {
  const custom = (input.customUrl || "").trim();
  if (custom) {
    const origin = parseCustomSiteOrigin(
      custom,
      typeof window !== "undefined" && window.location.protocol === "http:" ? "http:" : "https:",
    );
    if (origin) {
      return origin;
    }
  }

  const slug = generateSubdomainSlug(
    input.organisationName || "organization",
    input.areaName || "area",
    input.cityName || "city",
    input.stateName || "state",
  );
  const parentHost = resolveSubdomainParentHost();
  const protocol =
    typeof window !== "undefined" && window.location.protocol === "http:" ? "http" : "https";
  return `${protocol}://${slug}.${parentHost}`;
}

/** True when the current path is a legacy `/template/:id` URL on an org subdomain. */
export function isLegacyTemplatePathOnOrgSubdomain(): boolean {
  if (typeof window === "undefined") return false;

  return (
    !!parseSubdomainLocation(window.location.host, getAppDomain()) &&
    /^\/template\//i.test(window.location.pathname)
  );
}

/** Redirect org subdomain `/template/:id` → `/` (canonical public URL). */
export function redirectLegacyOrgTemplatePathToRoot(): void {
  if (!isLegacyTemplatePathOnOrgSubdomain()) return;
  window.location.replace("/");
}
