export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv?.trim()) {
    return normalizeApiBaseUrl(fromEnv.trim());
  }

  const runtimeBaseUrl = (window as unknown as { APP_CONFIG?: { baseurl?: string } })
    ?.APP_CONFIG?.baseurl;
  if (runtimeBaseUrl?.trim()) {
    return normalizeApiBaseUrl(runtimeBaseUrl.trim());
  }

  if (import.meta.env.DEV) {
    return "https://localhost:7117/api";
  }

  return "/api";
}

/** API host origin (no `/api` suffix) — use for `/uploads/...` and other static files. */
export function getApiOrigin(): string {
  const apiBase = getApiBaseUrl();
  if (/^https?:\/\//i.test(apiBase)) {
    return apiBase.replace(/\/api\/?$/i, "");
  }
  return window.location.origin;
}

/** Optional override for uploaded image host; defaults to the API origin. */
export function getMediaOrigin(): string {
  const fromEnv = import.meta.env.VITE_MEDIA_ORIGIN as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/+$/, "");
  }
  return getApiOrigin();
}

/** Rewrite legacy absolute upload URLs (e.g. Lodge :5226) to the current API host. */
function normalizeLegacyUploadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/uploads/")) return url;
    const apiOrigin = getApiOrigin();
    if (!/^https?:\/\//i.test(apiOrigin)) return url;
    const api = new URL(apiOrigin);
    if (parsed.origin === api.origin) return url;
    return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/** Turn backend-relative upload paths into browser-loadable URLs. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeLegacyUploadUrl(trimmed);
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (path.startsWith("/uploads/")) {
    return `${getMediaOrigin()}${path}`;
  }

  return `${getApiOrigin()}${path}`;
}
