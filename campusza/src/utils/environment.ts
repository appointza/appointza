/** Normalize to .../api (no trailing slash). */
export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

/** API base URL for Campusza UI → appointza server. */
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

  // Dev: UI on :8087, server on :7117
  if (import.meta.env.DEV) {
    return "https://localhost:7117/api";
  }

  return "/api";
}
