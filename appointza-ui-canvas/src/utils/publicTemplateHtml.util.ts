import { injectContactFormSupport } from "@/utils/templateContactForm.util";
import { environment } from "@/utils/environment";
import { injectTemplateNavScript } from "@/utils/templateBookingNav.util";

/** Avoid iframe srcDoc reloads when the bound HTML string is unchanged. */
export function nextHtmlIfChanged(previous: string, next: string): string {
  return previous === next ? previous : next;
}

/** Public `/template/...` iframe HTML — contact handler + keep SPA links on the parent URL. */
export function preparePublicSiteIframeHtml(
  html: string,
  organisationId = 0,
): string {
  if (!html) return html;
  const apiBase =
    (typeof window !== "undefined" && environment.baseurl) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return injectContactFormSupport(
    injectTemplateNavScript(html),
    organisationId,
    apiBase,
  );
}
