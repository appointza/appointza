import { isOrganisationSubdomainHost } from "@/utils/orgPublicSiteUrl.util";

/** Public org booking surfaces — skip Firebase, push, and other logged-in-only boot work. */
export function isPublicBookingPagePath(pathname: string, host?: string): boolean {
  const path = (pathname || "").trim();
  if (path.startsWith("/template/")) {
    return true;
  }

  const resolvedHost =
    host ?? (typeof window !== "undefined" ? window.location.host : "");

  return path === "/" && isOrganisationSubdomainHost(resolvedHost);
}
