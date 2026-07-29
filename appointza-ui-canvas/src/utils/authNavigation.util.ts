import type { NavigateFunction } from "react-router-dom";
import { getAppDomain, getUiBaseUrl } from "@/utils/environment";
import { resolvePostLoginPath } from "@/utils/postAuthNavigation";
import { parseSubdomainLocation } from "@/utils/subdomain.util";

declare global {
  interface Window {
    __APPOINTZA_MAIN_ORIGIN__?: string;
  }
}

export const AUTH_RETURN_STORAGE_KEY = "appointza_auth_return";

/** Marketing / auth host — never an org subdomain (e.g. always localhost:8083 in dev). */
export function getMainAppOrigin(): string {
  if (typeof window !== "undefined" && window.__APPOINTZA_MAIN_ORIGIN__) {
    return window.__APPOINTZA_MAIN_ORIGIN__;
  }
  return getUiBaseUrl();
}

export function publishMainAppOrigin(): void {
  if (typeof window !== "undefined") {
    window.__APPOINTZA_MAIN_ORIGIN__ = getUiBaseUrl();
  }
}

export function isOrgSubdomainHost(host: string = window.location.host): boolean {
  return !!parseSubdomainLocation(host, getAppDomain());
}

/** Auth pages must run on main UI host, not org *.localhost / *.appointza.com. */
export function mustUseMainAppForAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mainHost = new URL(getMainAppOrigin()).host;
    return mainHost !== window.location.host;
  } catch {
    return isOrgSubdomainHost();
  }
}

export function isUserLoggedIn(): boolean {
  return !!localStorage.getItem("auth_token");
}

/** `from` value for post-login navigation. */
export function buildLoginReturnValue(returnPath: string): string {
  const raw = (returnPath || "").trim();
  if (!raw) {
    return isOrgSubdomainHost()
      ? window.location.origin
      : `${window.location.pathname}${window.location.search}`;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;

  if (path.includes("/book-appointment/") || path.includes("/user/events/")) {
    return getMainAppAuthUrl(path);
  }

  if (isOrgSubdomainHost()) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Remember where to send the user after login (keeps `/login` URL clean). */
export function stashAuthReturnPath(returnPath?: string): void {
  const value = buildLoginReturnValue(
    returnPath || `${window.location.pathname}${window.location.search}`,
  );
  if (!value || value === "/") return;
  try {
    sessionStorage.setItem(AUTH_RETURN_STORAGE_KEY, value);
  } catch {
    // ignore private mode / blocked storage
  }
}

/** Login URL on the main app, optionally carrying a cross-origin return destination. */
export function getMainAppLoginUrl(returnPath?: string): string {
  const base = `${getMainAppOrigin()}/login`;
  const value = returnPath ? buildLoginReturnValue(returnPath) : "";
  return value ? `${base}?from=${encodeURIComponent(value)}` : base;
}

export function getMainAppAuthUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getMainAppOrigin()}${normalized}`;
}

/** Read return path after login: sessionStorage first, then legacy query/state. */
export function resolveLoginReturnPath(location: {
  search: string;
  state?: { from?: string | { pathname?: string } };
}): string {
  try {
    const stored = sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    // ignore
  }

  const fromQuery = new URLSearchParams(location.search).get("from") || "";
  const fromState = location.state?.from;
  const fromStatePath =
    typeof fromState === "string"
      ? fromState
      : fromState?.pathname || "";

  return fromQuery || fromStatePath || "/";
}

/** Go to main-app `/login` only (return path stored in sessionStorage). */
export function redirectToLogin(returnPath?: string, _navigate?: NavigateFunction): void {
  stashAuthReturnPath(returnPath);
  window.location.href = getMainAppLoginUrl(returnPath);
}

export function completeAuthNavigation(
  navigate: NavigateFunction,
  userType: "user" | "organization",
  from?: string,
): void {
  const target = resolvePostLoginPath(userType, from);
  try {
    sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
  } catch {
    // ignore
  }
  if (target.startsWith("http://") || target.startsWith("https://")) {
    window.location.replace(target);
    return;
  }
  navigate(target, { replace: true });
}
