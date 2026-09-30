// Runtime URLs from public/config.js (and VITE_API_BASE_URL / VITE_UI_BASE_URL at build).
// baseurl  = backend API the frontend calls
// uiBaseUrl = frontend site URL
import { isOrganisationSubdomainHost } from "@/utils/orgPublicSiteUrl.util";

const LOCAL_DEV_UI_ORIGIN = "http://localhost:8083";

const normalizeBaseUrl = (url: string) => {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/+$/, "");
  }

  return `https://${url.replace(/\/+$/, "")}`;
};

type AppConfig = {
  baseurl?: string;
  templateBaseUrl?: string;
  uiBaseUrl?: string;
  marketingDomain?: string;
  domainname?: string;
  [key: string]: unknown;
};

const getRawAppConfig = (): AppConfig => {
  if (typeof window !== "undefined" && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG as AppConfig;
  }
  return {};
};

const getConfig = () => {
  const raw = getRawAppConfig();
  const pageOrigin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const baseurl = normalizeBaseUrl(raw.baseurl || pageOrigin);
  const uiBaseUrl =
    raw.uiBaseUrl ||
    (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".localhost"))
      ? `http://localhost:${window.location.port || "8083"}`
      : baseurl);

  return {
    ...raw,
    baseurl,
    templateBaseUrl: normalizeBaseUrl(raw.templateBaseUrl || (baseurl ? `${baseurl}/template` : "")),
    uiBaseUrl,
    marketingDomain: raw.marketingDomain || "appointza.com",
    domainname: raw.domainname || "appointza.com",
  };
};

/** Always reads current `window.APP_CONFIG` so API base URL is never "stuck" from an early module init (e.g. Vite :8083). */
export const environment = new Proxy(
  {} as ReturnType<typeof getConfig> & { baseurl: string; templateBaseUrl: string },
  {
    get(_, prop: string) {
      return (getConfig() as any)[prop];
    }
  }
) as ReturnType<typeof getConfig> & { baseurl: string; templateBaseUrl: string };

const getDomainFromBaseUrl = (baseUrl: string) => {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch {
    return '';
  }
};

export function getMarketingDomain(): string {
  const config = getConfig() as { marketingDomain?: string; domainname?: string };
  if (config.marketingDomain) {
    return config.marketingDomain;
  }
  if (config.domainname) {
    return config.domainname;
  }
  const apiDomain = getAppDomain();
  if (apiDomain === "localhost" || apiDomain === "127.0.0.1") {
    return "appointza.com";
  }
  return apiDomain;
}

/** API base URL from `APP_CONFIG.baseurl` in public/config.js. */
export function getApiBaseUrl(): string {
  return getConfig().baseurl;
}

/**
 * Host for org public booking sites: `{slug}.{this}`.
 * Always `appointza.com` — never the local UI host (localhost:8083).
 */
export function getOrganisationPublicSiteDomain(): string {
  return "appointza.com";
}

/** Org subdomain parent host — from config (`domainname` or `baseurl` in local dev). */
export function getDomainName(): string {
  return getOrganisationPublicSiteDomain();
}

function normalizeUiBaseUrlFromConfig(raw?: string): string | null {
  if (!raw) return null;
  const normalized = normalizeBaseUrl(raw);
  const apiBase = normalizeBaseUrl(getRawAppConfig().baseurl || "");
  try {
    const parsed = new URL(normalized);
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    // uiBaseUrl must not point at the API host in local dev.
    if (isLocal && apiBase && normalized === apiBase) {
      return LOCAL_DEV_UI_ORIGIN;
    }
  } catch {
    return normalized;
  }
  return normalized;
}

/** UI origin for login / Google Sign-In — never an org subdomain or API port. */
export function getUiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (!isOrganisationSubdomainHost(window.location.host)) {
      return window.location.origin;
    }

    const h = window.location.hostname.toLowerCase();
    if (h.endsWith(".localhost") || h === "localhost" || h === "127.0.0.1") {
      const fromConfig = normalizeUiBaseUrlFromConfig(
        (getConfig() as { uiBaseUrl?: string }).uiBaseUrl,
      );
      return fromConfig ?? LOCAL_DEV_UI_ORIGIN;
    }
  }

  const fromConfig = normalizeUiBaseUrlFromConfig(
    (getConfig() as { uiBaseUrl?: string }).uiBaseUrl,
  );
  if (fromConfig) {
    return fromConfig;
  }

  return normalizeBaseUrl(`https://${getMarketingDomain()}`);
}

/** Browser UI origin. API services must use `environment.baseurl` instead. */
export function getAppBaseUrl(): string {
  return getUiBaseUrl();
}

export function getAppDomain(): string {
  return getDomainFromBaseUrl(getAppBaseUrl()) || 'appointza.com';
}
