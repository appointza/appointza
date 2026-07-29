import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  getMainAppLoginUrl,
  getMainAppOrigin,
  mustUseMainAppForAuth,
  stashAuthReturnPath,
} from "@/utils/authNavigation.util";

const AUTH_PATHS = new Set(["/login", "/register", "/otp"]);

/**
 * Google Sign-In only works on the main UI host (localhost:8083 / appointza.com),
 * never on org subdomains like *.localhost or *.appointza.com.
 */
export function EnsureAuthOnMainHost({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const mustRedirect = mustUseMainAppForAuth() && AUTH_PATHS.has(location.pathname);

  useLayoutEffect(() => {
    if (!mustRedirect) return;

    const fromQuery = new URLSearchParams(location.search).get("from");
    if (fromQuery) {
      stashAuthReturnPath(fromQuery);
    }

    const target =
      location.pathname === "/login"
        ? getMainAppLoginUrl()
        : `${getMainAppOrigin()}${location.pathname}`;

    window.location.replace(target);
  }, [mustRedirect, location.pathname, location.search]);

  if (mustRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Redirecting to login" />
      </div>
    );
  }

  return <>{children}</>;
}
