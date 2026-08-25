import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SiteDetailsService } from "@/services/siteDetails.service";
import {
  readPublicSiteGuidMap,
  shouldForcePublicSiteRefresh,
  writePublicSiteGuidMap,
  writePublicSiteCache,
  readPublicSiteCache,
  isPublicSiteCacheStale,
} from "@/utils/publicSiteCache.util";
import { isOrgLocTempId } from "@/utils/orgPublicSiteUrl.util";
import { publishMainAppOrigin, redirectToLogin } from "@/utils/authNavigation.util";
import { navigateToTemplateBooking } from "@/utils/templateBookingNav.util";
import { nextHtmlIfChanged } from "@/utils/publicTemplateHtml.util";
import { useNavigate } from "react-router-dom";

const DynamicTemplatePage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const token = decodeURIComponent(templateId?.trim() || "");

  const mapped = isOrgLocTempId(token) && !shouldForcePublicSiteRefresh()
    ? readPublicSiteGuidMap(token)
    : null;
  const cachedHtml =
    mapped?.locationId && !isPublicSiteCacheStale(mapped.locationId)
      ? readPublicSiteCache(mapped.locationId)?.renderedHtml
      : "";

  const [html, setHtml] = useState(cachedHtml || "");
  const [loading, setLoading] = useState(!cachedHtml);
  const [error, setError] = useState("");

  useEffect(() => {
    publishMainAppOrigin();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === "appointza:login-required") {
        const returnUrl: string = event.data.returnUrl || "";
        if (returnUrl) {
          try {
            sessionStorage.setItem("appointza_auth_return", returnUrl);
          } catch {
            // ignore
          }
        }
        redirectToLogin(returnUrl);
        return;
      }

      if (event.data.type !== "appointza:booking-nav") return;
      const url: string = event.data.url || "";
      if (!url) return;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }
      navigateToTemplateBooking(url, navigate);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isOrgLocTempId(token)) {
        if (!cancelled) {
          setError("Invalid or expired booking link.");
          setLoading(false);
        }
        return;
      }

      // Cached HTML is already in state from the initial render. Do not setHtml
      // again with the same string — that reloads iframe srcDoc.
      const existingMap = readPublicSiteGuidMap(token);
      if (existingMap?.locationId && !shouldForcePublicSiteRefresh()) {
        const cached = readPublicSiteCache(existingMap.locationId);
        if (cached?.renderedHtml && !cancelled) {
          setLoading(false);
        }
      }

      try {
        const siteService = new SiteDetailsService();
        const result = await siteService.getPublicHtml(token);
        if (cancelled) return;

        const locationId = result?.organisationlocationid || 0;
        const renderedHtml = result?.html || "";
        const versionKey = result?.versionKey || `loc:${locationId}`;

        if (locationId > 0) {
          writePublicSiteGuidMap(token, locationId);
        }

        if (!renderedHtml) {
          setError("Invalid or expired booking link.");
          setLoading(false);
          return;
        }

        const previous = locationId > 0 ? readPublicSiteCache(locationId) : null;
        const changed = !previous || previous.versionKey !== versionKey;

        if (changed || !previous?.renderedHtml) {
          setHtml((prev) => nextHtmlIfChanged(prev, renderedHtml));
          if (locationId > 0) {
            writePublicSiteCache(locationId, { versionKey, renderedHtml });
          }
        } else if (locationId > 0) {
          // Same version — refresh cache timestamp / clear stale flag.
          writePublicSiteCache(locationId, {
            versionKey,
            renderedHtml: previous.renderedHtml,
          });
        }

        setError("");
      } catch (e) {
        if (cancelled) return;
        const hasCached =
          !!existingMap?.locationId && !!readPublicSiteCache(existingMap.locationId)?.renderedHtml;
        if (!hasCached) {
          setError(e instanceof Error ? e.message : "Failed to load template");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when GUID changes
  }, [token]);

  if (loading && !html) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
      </div>
    );
  }

  if (error && !html) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Template"
      />
    </div>
  );
};

export default DynamicTemplatePage;
