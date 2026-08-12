function resolveDomainSuffix(): string {
  const fromEnv = (import.meta.env.VITE_DOMAIN_SUFFIX as string | undefined)?.trim();
  if (fromEnv) return fromEnv;

  const fromConfig = (
    window as unknown as { APP_CONFIG?: { domainSuffix?: string } }
  ).APP_CONFIG?.domainSuffix?.trim();
  if (fromConfig) return fromConfig;

  // Production tenant parent: ootyroomstay.stay.appointza.com
  return "stay.appointza.com";
}

const DOMAIN_SUFFIX = resolveDomainSuffix();

/** Parent host for tenant subdomains, e.g. `localhost:5001` or `stay.appointza.com` */
export function getSubdomainParentHost(): string {
  const { hostname, port } = window.location;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return port ? `localhost:${port}` : "localhost";
  }
  return DOMAIN_SUFFIX;
}

/**
 * Parse tenant subdomain from hostname.
 * Local: ootyroomstay.localhost → ootyroomstay
 * Prod:  ootyroomstay.stay.appointza.com → ootyroomstay
 */
export function parseSubdomainFromHostname(hostname = window.location.hostname): string | null {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || sub.includes(".")) return null;
    return sub.length >= 3 ? sub : null;
  }

  const suffixes = [DOMAIN_SUFFIX.toLowerCase(), "appointzastay.com"];
  for (const suffix of suffixes) {
    if (!host.endsWith(`.${suffix}`)) continue;
    const sub = host.slice(0, -(suffix.length + 1));
    if (!sub || sub === "www" || sub.includes(".")) return null;
    return sub.length >= 3 ? sub : null;
  }

  return null;
}

export function getRequestSubdomain(): string | null {
  return parseSubdomainFromHostname();
}

export function isTenantSubdomainHost(): boolean {
  return getRequestSubdomain() != null;
}

/** Canonical public website URL for a property subdomain on this environment. */
export function buildPropertyWebsiteUrl(subdomain: string): string {
  const sub = subdomain.trim().toLowerCase();
  if (!sub) return "";
  const protocol = window.location.protocol;
  const parent = getSubdomainParentHost();
  // Tenant hosts serve Stay at domain root (local :8088 and *.stay.appointza.com)
  return `${protocol}//${sub}.${parent}/`;
}

export function getDomainSuffix(): string {
  return DOMAIN_SUFFIX;
}
