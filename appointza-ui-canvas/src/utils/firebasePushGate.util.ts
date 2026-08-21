import { isPublicBookingPagePath } from "@/utils/publicBookingRoute.util";

/**
 * Firebase Analytics / Messaging / push should not run on anonymous marketing pages
 * (especially `/` on appointza.com). Enable only for authenticated sessions, and never
 * on public org booking surfaces.
 */
export function shouldEnableFirebasePush(
  pathname: string,
  isAuthenticated: boolean,
): boolean {
  if (isPublicBookingPagePath(pathname)) {
    return false;
  }

  return isAuthenticated;
}
