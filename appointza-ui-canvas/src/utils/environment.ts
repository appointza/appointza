// Runtime URLs and keys from public/config.js (loaded in index.html as /config.js).
// Edit appointza-ui-canvas/public/config.js — used for dev, production build, and server startup.
const getConfig = () => {
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG;
  }

  const fallbackBaseUrl = 'http://localhost:5000';

  return {
    baseurl: fallbackBaseUrl,
    templateBaseUrl: `${fallbackBaseUrl}/template`,
    /** Browser UI origin for login/auth (dev: http://localhost:8083). */
    uiBaseUrl:
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".localhost"))
        ? `http://localhost:${window.location.port || "8083"}`
        : fallbackBaseUrl,
    marketingDomain: "appointza.com",
    domainname: "appointza.com",
    production: false,
    debugMode: true,
    googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',
    razorpayKeyId: 'rzp_test_xxxxxxxxxxxxx',
    razorpayKeySecret: 'xxxxxxxxxxxxxxxxxxxxx',
    razorpayTestMode: true,
    appTitle: 'Appointza',
    version: '1.0.0',
    features: {
      enableDebugLogs: true,
      enableAnalytics: false,
      enableErrorReporting: false
    }
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

const normalizeBaseUrl = (url: string) => {
  if (!url) {
    return '';
  }

  // Ensure scheme exists so URL parsing works.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/\/+$/, '');
  }

  return `https://${url.replace(/\/+$/, '')}`;
};

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

/** API base URL from `APP_CONFIG.baseurl` (never hardcoded). */
export function getApiBaseUrl(): string {
  const config = getConfig() as { baseurl?: string };
  if (config.baseurl) {
    return normalizeBaseUrl(config.baseurl);
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5000";
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

/** UI origin for login / Google Sign-In — never an org subdomain or API port. */
export function getUiBaseUrl(): string {
  const config = getConfig() as { uiBaseUrl?: string };
  if (config.uiBaseUrl) {
    return normalizeBaseUrl(config.uiBaseUrl);
  }

  if (typeof window !== "undefined") {
    const h = window.location.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) {
      const port = window.location.port || "8083";
      return `http://localhost:${port}`;
    }
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
