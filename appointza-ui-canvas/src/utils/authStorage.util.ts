/**
 * Auth is stored in localStorage (host-scoped). Org sites run on
 * `{slug}.appointza.com`, so they cannot see `appointza.com` localStorage.
 * Mirror a slim auth payload in a cookie on `.appointza.com` so both hosts share a session.
 */

const AUTH_COOKIE_NAME = "appointza_auth_v1";
const MAX_COOKIE_CHARS = 3500;

type AuthSnapshot = {
  auth_token?: string;
  refresh_token?: string;
  user_type?: string;
  user_context?: string;
};

function canUseParentCookie(hostname: string = window.location.hostname): boolean {
  const host = hostname.toLowerCase();
  return host === "appointza.com" || host.endsWith(".appointza.com");
}

function parentCookieDomain(): string {
  return ".appointza.com";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        return part.slice(prefix.length);
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined" || !canUseParentCookie()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
    `; Path=/; Domain=${parentCookieDomain()}; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined" || !canUseParentCookie()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(name)}=; Path=/; Domain=${parentCookieDomain()}; Max-Age=0; SameSite=Lax${secure}`;
}

/** Drop bulky fields so the shared cookie stays under browser size limits. */
function slimUserContextJson(raw: string): string {
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    return JSON.stringify({
      userid: u.userid,
      usermobile: u.usermobile,
      organisationid: u.organisationid,
      organisationlocationid: u.organisationlocationid,
      username: u.username,
      useremail: u.useremail,
      userimageid: u.userimageid,
      accesstoken: u.accesstoken,
      refreshtoken: u.refreshtoken,
    });
  } catch {
    return raw;
  }
}

function readSnapshotFromLocalStorage(): AuthSnapshot {
  return {
    auth_token: localStorage.getItem("auth_token") || undefined,
    refresh_token: localStorage.getItem("refresh_token") || undefined,
    user_type: localStorage.getItem("user_type") || undefined,
    user_context: localStorage.getItem("user_context") || undefined,
  };
}

function writeSnapshotToLocalStorage(snap: AuthSnapshot): void {
  if (snap.auth_token) localStorage.setItem("auth_token", snap.auth_token);
  if (snap.refresh_token) localStorage.setItem("refresh_token", snap.refresh_token);
  if (snap.user_type) localStorage.setItem("user_type", snap.user_type);
  if (snap.user_context) localStorage.setItem("user_context", snap.user_context);
}

function encodeSnapshot(snap: AuthSnapshot): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
}

function decodeSnapshot(raw: string): AuthSnapshot | null {
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json) as AuthSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist current localStorage auth onto `.appointza.com` cookie (production only). */
export function publishAuthToSharedCookie(): void {
  if (typeof window === "undefined" || !canUseParentCookie()) return;

  const snap = readSnapshotFromLocalStorage();
  if (!snap.auth_token || !snap.user_context) {
    clearCookie(AUTH_COOKIE_NAME);
    return;
  }

  const slim: AuthSnapshot = {
    auth_token: snap.auth_token,
    refresh_token: snap.refresh_token,
    user_type: snap.user_type,
    user_context: slimUserContextJson(snap.user_context),
  };

  const encoded = encodeSnapshot(slim);
  if (encoded.length > MAX_COOKIE_CHARS) {
    console.warn("Auth cookie too large; subdomain session sync skipped.");
    clearCookie(AUTH_COOKIE_NAME);
    return;
  }

  writeCookie(AUTH_COOKIE_NAME, encoded, 60 * 60 * 24 * 30);
}

/** If this host has no token, hydrate from the shared `.appointza.com` cookie. */
export function hydrateAuthFromSharedCookie(): boolean {
  if (typeof window === "undefined" || !canUseParentCookie()) return false;
  if (localStorage.getItem("auth_token") && localStorage.getItem("user_context")) {
    return false;
  }

  const raw = readCookie(AUTH_COOKIE_NAME);
  if (!raw) return false;
  const snap = decodeSnapshot(raw);
  if (!snap?.auth_token || !snap.user_context) return false;

  writeSnapshotToLocalStorage(snap);
  return true;
}

export function clearSharedAuthCookie(): void {
  clearCookie(AUTH_COOKIE_NAME);
}
