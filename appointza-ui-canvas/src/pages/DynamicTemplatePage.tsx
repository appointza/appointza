import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const LOAD_TIMEOUT_MS = 20_000;

const TemplateSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 h-10 w-48 animate-pulse rounded-md bg-slate-200" />
      <div className="mb-4 h-6 w-72 animate-pulse rounded-md bg-slate-200" />
      <div className="mb-10 h-4 w-full max-w-md animate-pulse rounded-md bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your booking page…
      </div>
    </div>
  </div>
);

const DynamicTemplatePage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const titleSetRef = useRef(false);
  const token = decodeURIComponent(templateId?.trim() || "");

  const mapped =
    isOrgLocTempId(token) && !shouldForcePublicSiteRefresh()
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
  const [retryToken, setRetryToken] = useState(0);

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
    let timedOut = false;
    titleSetRef.current = false;

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      if (!cancelled) {
        setLoading(false);
        setError((prev) => prev || "This booking page is taking too long to load.");
      }
    }, LOAD_TIMEOUT_MS);

    const setBusinessTitle = (name?: string) => {
      if (titleSetRef.current) return;
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      document.title = trimmed;
      titleSetRef.current = true;
    };

    const load = async () => {
      if (!isOrgLocTempId(token)) {
        if (!cancelled) {
          setError("Invalid or expired booking link.");
          setLoading(false);
        }
        return;
      }

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
        if (cancelled || timedOut) return;

        setBusinessTitle(result?.organisationname);

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
          writePublicSiteCache(locationId, {
            versionKey,
            renderedHtml: previous.renderedHtml,
          });
        }

        setError("");
      } catch (e) {
        if (cancelled || timedOut) return;
        const hasCached =
          !!existingMap?.locationId &&
          !!readPublicSiteCache(existingMap.locationId)?.renderedHtml;
        if (!hasCached) {
          setError(e instanceof Error ? e.message : "Failed to load template");
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when GUID or retry changes
  }, [token, retryToken]);

  if (loading && !html) {
    return <TemplateSkeleton />;
  }

  if (error && !html) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" aria-hidden />
        <p className="max-w-md text-red-600">{error}</p>
        <Button
          type="button"
          onClick={() => {
            setError("");
            setLoading(true);
            setRetryToken((n) => n + 1);
          }}
        >
          Retry
        </Button>
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
        title="Booking page"
        onLoad={() => syncParentFromTemplateIframe(iframeRef.current, navigate)}
      />
    </div>
  );
};

export default DynamicTemplatePage;
