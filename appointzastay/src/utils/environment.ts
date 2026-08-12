export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  if (!trimmed || trimmed === "/api") return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

type StayAppConfig = {
  baseurl?: string;
  apiBaseUrl?: string;
  /** When true, always use same-origin `/api` (Vite preview/dev proxy). */
  useRelativeApi?: boolean;
};

function getAppConfig(): StayAppConfig | undefined {
  return (window as unknown as { APP_CONFIG?: StayAppConfig })?.APP_CONFIG;
}

function resolveAbsoluteApiOrigin(config: StayAppConfig): string | null {
  const candidate = (config.apiBaseUrl || config.baseurl || "").trim();
  if (!candidate || candidate === "/api") return null;

  try {
    const withScheme = /^https?:\/\//i.test(candidate)
      ? candidate
      : `http://${candidate.replace(/^\/\//, "")}`;
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/**
 * API base URL resolution order:
 * 1. VITE_API_URL
 * 2. Same-origin `/api` when UI runs on a different port than the API (multi-port preview)
 * 3. window.APP_CONFIG.apiBaseUrl or baseurl
 * 4. Dev fallback: local API
 * 5. Prod fallback: same-origin /api
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv?.trim()) {
    return normalizeApiBaseUrl(fromEnv.trim());
  }

  const config = getAppConfig();
  if (config?.useRelativeApi) {
    return "/api";
  }

  if (typeof window !== "undefined" && config) {
    const apiOrigin = resolveAbsoluteApiOrigin(config);
    if (apiOrigin && apiOrigin !== window.location.origin) {
      // Stay UI on :5001 (or :8088 dev) — proxy /api to API on :5000
      return "/api";
    }
  }

  const runtimeBaseUrl = config?.apiBaseUrl?.trim() || config?.baseurl?.trim();
  if (runtimeBaseUrl && runtimeBaseUrl !== "/api") {
    return normalizeApiBaseUrl(runtimeBaseUrl);
  }

  if (import.meta.env.DEV) {
    return normalizeApiBaseUrl("http://localhost:5000");
  }

  return "/api";
}

/** API host origin (no `/api` suffix) — use for `/uploads/...` and other static files. */
export function getApiOrigin(): string {
  const apiBase = getApiBaseUrl();
  if (/^https?:\/\//i.test(apiBase)) {
    return apiBase.replace(/\/api\/?$/i, "");
  }
  const config = getAppConfig();
  const apiOrigin = config ? resolveAbsoluteApiOrigin(config) : null;
  if (apiOrigin) return apiOrigin;
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

/** Stay UI origin for links (current browser host, e.g. localhost:5001). */
export function getStayUiOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
