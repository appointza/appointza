/** Where customers land after sign-in when no safer return URL is present. */
export const USER_POST_LOGIN_PATH = "/explore";

/** Where business / staff users land after sign-in when no return URL applies. */
export const ORGANIZATION_POST_LOGIN_PATH = "/organization/dashboard";

const LEGACY_USER_HOME = "/user/dashboard";

/**
 * Decide where to send the user after auth. Honors `location.state.from` /
 * OTP `from`, but sends customers to Explore instead of the old user dashboard by default.
 */
export function resolvePostLoginPath(userType: "user" | "organization", from?: string): string {
  const normalized = (from || "").trim() || "";

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const isBlank = normalized === "" || normalized === "/";
  const isAuthScreens =
    normalized === "/login" || normalized === "/register" || normalized === "/otp";

  /** Treat the retired user dashboard path like the default customer destination. */
  const isLegacyUserHome = userType === "user" && normalized === LEGACY_USER_HOME;

  if (!isBlank && !isAuthScreens && !isLegacyUserHome) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  return userType === "organization" ? ORGANIZATION_POST_LOGIN_PATH : USER_POST_LOGIN_PATH;
}
