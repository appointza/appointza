/** Where customers land after sign-in when no safer return URL is present. */
export const USER_POST_LOGIN_PATH = "/explore";

/** Where business / staff users land after sign-in when no return URL applies. */
export const ORGANIZATION_POST_LOGIN_PATH = "/organization/dashboard";

/** Where users.isfactory (super admin) land after sign-in. */
export const SUPER_ADMIN_POST_LOGIN_PATH = "/super-admin";

const LEGACY_USER_HOME = "/user/dashboard";

export type PostLoginOptions = {
  /** True when users.isfactory / JWT issuperadmin — open the platform console. */
  isSuperAdmin?: boolean;
};

/**
 * Decide where to send the user after auth. Honors `location.state.from` /
 * OTP `from`, but sends customers to Explore instead of the old user dashboard by default.
 * Super admins (users.isfactory) go to /super-admin unless already headed into that console.
 */
export function resolvePostLoginPath(
  userType: "user" | "organization",
  from?: string,
  options?: PostLoginOptions,
): string {
  const normalized = (from || "").trim() || "";

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const path = normalized.startsWith("/") || !normalized ? normalized : `/${normalized}`;

  if (options?.isSuperAdmin) {
    if (path.startsWith("/super-admin") || path.startsWith("/admin")) {
      return path;
    }
    return SUPER_ADMIN_POST_LOGIN_PATH;
  }

  const isBlank = path === "" || path === "/";
  const isAuthScreens = path === "/login" || path === "/register" || path === "/otp";

  /** Treat the retired user dashboard path like the default customer destination. */
  const isLegacyUserHome = userType === "user" && path === LEGACY_USER_HOME;

  if (!isBlank && !isAuthScreens && !isLegacyUserHome) {
    return path;
  }

  return userType === "organization" ? ORGANIZATION_POST_LOGIN_PATH : USER_POST_LOGIN_PATH;
}
