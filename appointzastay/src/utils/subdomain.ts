const DOMAIN_SUFFIX = (import.meta.env.VITE_DOMAIN_SUFFIX as string | undefined)?.trim() || "appointzastay.com";

const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") || "";

/** Parent host for tenant subdomains, e.g. `localhost:8088` or `appointzastay.com` */
export function getSubdomainParentHost(): string {
  const { hostname, port } = window.location;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return port ? `localhost:${port}` : "localhost";
  }
  return DOMAIN_SUFFIX;
}

/** Parse tenant subdomain from the current hostname (hello.localhost → hello). */
export function parseSubdomainFromHostname(hostname = window.location.hostname): string | null {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return sub.length >= 3 ? sub : null;
  }

  const suffix = DOMAIN_SUFFIX.toLowerCase();
  if (host.endsWith(`.${suffix}`)) {
    const sub = host.slice(0, -(suffix.length + 1));
    if (!sub || sub === "www") return null;
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
  return `${protocol}//${sub}.${parent}${APP_BASE}/`;
}

export function getDomainSuffix(): string {
  return DOMAIN_SUFFIX;
}
