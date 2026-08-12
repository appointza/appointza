/** Normalize to .../api (no trailing slash). */
export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

/**
 * API base URL resolution order:
 * 1. VITE_API_URL
 * 2. window.APP_CONFIG.baseurl from public/config.js (config.dev.js or config.prod.js)
 * 3. Dev fallback: local API
 * 4. Prod fallback: same-origin /api
 */
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
    return normalizeApiBaseUrl("http://localhost:5000");
  }

  return "/api";
}
