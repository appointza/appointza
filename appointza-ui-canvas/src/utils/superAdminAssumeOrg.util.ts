import { getStoredUserContext } from "@/utils/authSession.util";

const RETURN_KEY = "superadmin_return_session";
const ASSUME_KEY = "superadmin_assuming_org";

export type SuperAdminAssumeOrgMeta = {
  organisationid: number;
  organisationname: string;
  returnPath?: string;
};

type StoredSession = {
  auth_token: string;
  refresh_token: string;
  user_context: string;
  user_type: string;
};

/** True when the current browser session is a super admin editing an organisation workspace. */
export function isAssumingOrganisation(): boolean {
  try {
    return !!localStorage.getItem(ASSUME_KEY) && !!localStorage.getItem(RETURN_KEY);
  } catch {
    return false;
  }
}

export function getAssumedOrganisation(): SuperAdminAssumeOrgMeta | null {
  try {
    const raw = localStorage.getItem(ASSUME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SuperAdminAssumeOrgMeta;
  } catch {
    return null;
  }
}

/** Snapshot the current super-admin session before switching into an organisation workspace. */
export function stashSuperAdminSession(meta: SuperAdminAssumeOrgMeta) {
  const ctx = getStoredUserContext();
  const payload: StoredSession = {
    auth_token: localStorage.getItem("auth_token") || "",
    refresh_token: localStorage.getItem("refresh_token") || "",
    user_context: localStorage.getItem("user_context") || JSON.stringify(ctx || {}),
    user_type: localStorage.getItem("user_type") || "user",
  };
  localStorage.setItem(RETURN_KEY, JSON.stringify(payload));
  localStorage.setItem(ASSUME_KEY, JSON.stringify(meta));
}

/** Apply an AssumeOrganisation API response into localStorage and mark org mode. */
export function applyAssumedOrganisationSession(userContext: Record<string, unknown>) {
  const token = String(userContext.accesstoken || "");
  localStorage.setItem("auth_token", token);
  if (userContext.refreshtoken) {
    localStorage.setItem("refresh_token", String(userContext.refreshtoken));
  }
  localStorage.setItem("user_context", JSON.stringify(userContext));
  localStorage.setItem("user_type", "organization");
  const locationId = Number(userContext.organisationlocationid || 0);
  if (locationId > 0) {
    localStorage.setItem("organizationlocationid", String(locationId));
  }
}

/** Restore the previous super-admin session. Returns the path to navigate back to. */
export function restoreSuperAdminSession(): string {
  let returnPath = "/super-admin/organisations";
  try {
    const assumed = getAssumedOrganisation();
    if (assumed?.organisationid) {
      returnPath = assumed.returnPath || `/super-admin/organisations/${assumed.organisationid}`;
    }
    const raw = localStorage.getItem(RETURN_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as StoredSession;
      localStorage.setItem("auth_token", saved.auth_token || "");
      localStorage.setItem("refresh_token", saved.refresh_token || "");
      localStorage.setItem("user_context", saved.user_context || "{}");
      localStorage.setItem("user_type", saved.user_type || "user");
    }
  } catch {
    // ignore
  }
  localStorage.removeItem(RETURN_KEY);
  localStorage.removeItem(ASSUME_KEY);
  return returnPath;
}
