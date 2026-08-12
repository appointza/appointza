// Runtime URLs and keys: window.APP_CONFIG from /config.js (load /config.js first in index.html). For production deploy, edit
// appointzabuild/production/config.js (copied to wwwroot on Vite build) — PlanItNoww also reads the same file for baseUrl.
// Get configuration from window.APP_CONFIG (loaded from config.js)
const getConfig = () => {
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG;
  }

  const fallbackBaseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://appointza.com';

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
        : "https://appointza.com",
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

/** Org subdomain parent host — `domainname` from config.js, or localhost:port in dev. */
export function getDomainName(): string {
  if (typeof window !== "undefined") {
    const h = window.location.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) {
      const port = window.location.port || "8083";
      return port ? `localhost:${port}` : "localhost";
    }
  }

  const config = getConfig() as { domainname?: string; marketingDomain?: string };
  return config.domainname || config.marketingDomain || "appointza.com";
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

/** Call at use site so values reflect `config.js` after it loads (not one snapshot at import time). */
export function getAppBaseUrl(): string {
  return normalizeBaseUrl(environment.baseurl || 'https://appointza.com');
}

export function getAppDomain(): string {
  return getDomainFromBaseUrl(getAppBaseUrl()) || 'appointza.com';
}
