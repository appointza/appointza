import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  readPublicSiteGuidMap,
  shouldForcePublicSiteRefresh,
  writePublicSiteGuidMap,
  writePublicSiteCache,
  readPublicSiteCache,
  isPublicSiteCacheStale,
  readFreshPublicSiteCache,
} from "@/utils/publicSiteCache.util";
import { isOrgLocTempId } from "@/utils/orgPublicSiteUrl.util";
import { publishMainAppOrigin } from "@/utils/authNavigation.util";
import {
  handleTemplateFrameMessage,
  syncParentFromTemplateIframe,
} from "@/utils/templateBookingNav.util";
import { nextHtmlIfChanged, preparePublicSiteIframeHtml } from "@/utils/publicTemplateHtml.util";
import { getPublicHtmlByGuid } from "@/services/publicHtml.service";
import { useNavigate } from "react-router-dom";

const DynamicTemplatePage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const token = decodeURIComponent(templateId?.trim() || "");

  const mapped = isOrgLocTempId(token) && !shouldForcePublicSiteRefresh()
    ? readPublicSiteGuidMap(token)
    : null;
  const cachedHtml =
    mapped?.locationId && !isPublicSiteCacheStale(mapped.locationId)
      ? readPublicSiteCache(mapped.locationId)?.renderedHtml
      : "";

  const [html, setHtml] = useState(cachedHtml || "");
  const [organisationId, setOrganisationId] = useState(0);
  const [loading, setLoading] = useState(!cachedHtml);
  const [error, setError] = useState("");

  const iframeHtml = useMemo(
    () => preparePublicSiteIframeHtml(html, organisationId),
    [html, organisationId],
  );

  useEffect(() => {
    publishMainAppOrigin();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      handleTemplateFrameMessage(event, navigate);
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
      const forceRefresh = shouldForcePublicSiteRefresh();
      const cachedFromMap =
        existingMap?.locationId && !forceRefresh
          ? readFreshPublicSiteCache(existingMap.locationId)
          : null;

      if (cachedFromMap?.renderedHtml) {
        if (!cancelled) setLoading(false);
        return;
      }

      const staleCache =
        existingMap?.locationId && !forceRefresh
          ? readPublicSiteCache(existingMap.locationId)
          : null;

      try {
        const result = await getPublicHtmlByGuid(token, {
          versionKey: staleCache?.versionKey,
        });
        if (cancelled) return;

        if (result.notModified && staleCache?.renderedHtml) {
          writePublicSiteCache(existingMap!.locationId, {
            versionKey: staleCache.versionKey,
            renderedHtml: staleCache.renderedHtml,
          });
          setError("");
          return;
        }

        const locationId = result?.organisationlocationid || 0;
        const orgId = result?.organisationid || 0;
        const renderedHtml = result?.html || "";
        const versionKey = result?.versionKey || `loc:${locationId}`;

        if (orgId > 0) {
          setOrganisationId(orgId);
        }

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
        ref={iframeRef}
        srcDoc={iframeHtml}
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Template"
        onLoad={() => syncParentFromTemplateIframe(iframeRef.current, navigate)}
      />
    </div>
  );
};

export default DynamicTemplatePage;
