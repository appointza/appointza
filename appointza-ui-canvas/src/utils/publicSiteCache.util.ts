const CACHE_PREFIX = "appointza:public-site:v1";
const STALE_PREFIX = "appointza:public-site:stale";
const GUID_MAP_PREFIX = "appointza:public-site:guid-map:v1";
const SUBDOMAIN_PREFIX = "appointza:public-site:subdomain:v1";

export type PublicSiteCacheEntry = {
  locationId: number;
  versionKey: string;
  renderedHtml: string;
  cachedAt: number;
};

export type PublicSiteGuidMapEntry = {
  orgLocTempId: string;
  locationId: number;
  cachedAt: number;
};

export type PublicSiteSubdomainEntry = {
  customUrl: string;
  orgLocTempId?: string;
  organisationlocationid?: number;
  cachedAt: number;
};

function cacheKey(locationId: number): string {
  return `${CACHE_PREFIX}:${locationId}`;
}

function staleKey(locationId: number): string {
  return `${STALE_PREFIX}:${locationId}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled — ignore
  }
}

export function shouldForcePublicSiteRefresh(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("refresh");
}

/** ETag sent to GetPublicHtml (quoted, stripped of embedded quotes). */
export function formatPublicHtmlEtag(versionKey: string): string {
  const safe = versionKey.replace(/"/g, "");
  return `"${safe}"`;
}

/** Valid non-stale cache entry — skip network when present unless ?refresh. */
export function readFreshPublicSiteCache(locationId: number): PublicSiteCacheEntry | null {
  if (locationId <= 0 || isPublicSiteCacheStale(locationId)) return null;
  return readPublicSiteCache(locationId);
}

export function readPublicSiteCache(locationId: number): PublicSiteCacheEntry | null {
  if (locationId <= 0) return null;
  const entry = readJson<PublicSiteCacheEntry>(cacheKey(locationId));
  if (!entry?.renderedHtml || entry.locationId !== locationId) return null;
  return entry;
}

export function writePublicSiteCache(locationId: number, entry: Omit<PublicSiteCacheEntry, "locationId" | "cachedAt">): void {
  if (locationId <= 0 || !entry.renderedHtml) return;
  writeJson(cacheKey(locationId), {
    locationId,
    versionKey: entry.versionKey,
    renderedHtml: entry.renderedHtml,
    cachedAt: Date.now(),
  } satisfies PublicSiteCacheEntry);
  clearPublicSiteCacheStale(locationId);
}

export function isPublicSiteCacheStale(locationId: number): boolean {
  if (locationId <= 0) return true;
  if (shouldForcePublicSiteRefresh()) return true;
  return localStorage.getItem(staleKey(locationId)) != null;
}

export function markPublicSiteCacheStale(locationId: number): void {
  if (locationId <= 0) return;
  try {
    localStorage.setItem(staleKey(locationId), String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearPublicSiteCacheStale(locationId: number): void {
  if (locationId <= 0) return;
  try {
    localStorage.removeItem(staleKey(locationId));
  } catch {
    // ignore
  }
}

export function invalidatePublicSiteCacheForLocation(locationId: number): void {
  if (locationId <= 0) return;
  try {
    localStorage.removeItem(cacheKey(locationId));
    localStorage.setItem(staleKey(locationId), String(Date.now()));
  } catch {
    // ignore
  }
}

export function readPublicSiteGuidMap(orgLocTempId: string): PublicSiteGuidMapEntry | null {
  const slug = orgLocTempId.trim().toLowerCase();
  if (!slug) return null;
  const entry = readJson<PublicSiteGuidMapEntry>(`${GUID_MAP_PREFIX}:${slug}`);
  if (!entry || entry.orgLocTempId.toLowerCase() !== slug || entry.locationId <= 0) return null;
  return entry;
}

export function writePublicSiteGuidMap(orgLocTempId: string, locationId: number): void {
  const slug = orgLocTempId.trim().toLowerCase();
  if (!slug || locationId <= 0) return;
  writeJson(`${GUID_MAP_PREFIX}:${slug}`, {
    orgLocTempId: slug,
    locationId,
    cachedAt: Date.now(),
  } satisfies PublicSiteGuidMapEntry);
}

export function readPublicSiteSubdomainResolve(customUrl: string): PublicSiteSubdomainEntry | null {
  const slug = customUrl.trim().toLowerCase();
  if (!slug) return null;
  return readJson<PublicSiteSubdomainEntry>(`${SUBDOMAIN_PREFIX}:${slug}`);
}

export function writePublicSiteSubdomainResolve(
  customUrl: string,
  resolved: Pick<PublicSiteSubdomainEntry, "orgLocTempId" | "organisationlocationid">,
): void {
  const slug = customUrl.trim().toLowerCase();
  if (!slug) return;
  writeJson(`${SUBDOMAIN_PREFIX}:${slug}`, {
    customUrl: slug,
    orgLocTempId: resolved.orgLocTempId,
    organisationlocationid: resolved.organisationlocationid,
    cachedAt: Date.now(),
  } satisfies PublicSiteSubdomainEntry);
}

export function markPublicSiteSubdomainStale(customUrl: string): void {
  const slug = customUrl.trim().toLowerCase();
  if (!slug) return;
  try {
    localStorage.removeItem(`${SUBDOMAIN_PREFIX}:${slug}`);
  } catch {
    // ignore
  }
}

/** Fingerprint site payload — refetch only when this changes or cache is marked stale. */
export function buildPublicSiteVersionKey(
  siteData: {
    locationdetail?: { id?: number; version?: number; modifiedon?: string | Date; templateid?: number };
    organisationdetail?: { version?: number; modifiedon?: string | Date };
    orgnaisatinservice?: Array<{ id?: number; version?: number; modifiedon?: string | Date }>;
    OrganisationServiceTiming?: Array<{ id?: number; version?: number; modifiedon?: string | Date }>;
    template_html?: string;
    hospitality_profile?: { updated_at?: string } | null;
    hospitality_rooms?: Array<{ id?: number; updated_at?: string }>;
  },
  publicEvents: Array<{ id?: number; updated_at?: string | Date; modifiedon?: string | Date }> = [],
): string {
  const loc = siteData.locationdetail ?? {};
  const org = siteData.organisationdetail ?? {};
  const services = siteData.orgnaisatinservice ?? [];
  const timings = siteData.OrganisationServiceTiming ?? [];
  const rooms = siteData.hospitality_rooms ?? [];

  const part = (items: Array<{ id?: number; version?: number; modifiedon?: string | Date }>) =>
    items
      .map((item) => `${item.id ?? 0}:${item.version ?? 0}:${String(item.modifiedon ?? "")}`)
      .join("|");

  const eventsPart = publicEvents
    .map((item) => `${item.id ?? 0}:${String(item.updated_at ?? item.modifiedon ?? "")}`)
    .join("|");

  return [
    loc.id ?? 0,
    loc.version ?? 0,
    String(loc.modifiedon ?? ""),
    loc.templateid ?? 0,
    org.version ?? 0,
    String(org.modifiedon ?? ""),
    (siteData.template_html ?? "").length,
    part(services),
    part(timings),
    eventsPart,
    String(siteData.hospitality_profile?.updated_at ?? ""),
    rooms.map((r) => `${r.id}:${r.updated_at ?? ""}`).join("|"),
  ].join("::");
}
