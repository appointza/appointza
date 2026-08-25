import { useEffect, useState } from "react";
import { SiteDetailsService } from "@/services/siteDetails.service";
import {
  isPublicSiteCacheStale,
  readPublicSiteCache,
  readPublicSiteGuidMap,
  shouldForcePublicSiteRefresh,
  writePublicSiteCache,
  writePublicSiteGuidMap,
} from "@/utils/publicSiteCache.util";
import { nextHtmlIfChanged } from "@/utils/publicTemplateHtml.util";

type UsePublicSiteTemplateResult = {
  renderedHtml: string;
  loading: boolean;
  fromCache: boolean;
};

function errorPageHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .error { color: #dc2626; font-size: 1.2rem; }
    </style>
</head>
<body>
    <div class="error">
        <h1>${title}</h1>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

/** Single server API: resolve + bind template + return HTML. */
async function fetchPublicHtmlByLocation(locationId: number): Promise<{ renderedHtml: string; versionKey: string }> {
  const siteService = new SiteDetailsService();
  const result = await siteService.getPublicHtmlByLocation(locationId);
  return {
    renderedHtml: result?.html || errorPageHtml("Site Details Not Found", "No site details were returned for this location."),
    versionKey: result?.versionKey || `loc:${locationId}`,
  };
}

export function usePublicSiteTemplate(locationId: number): UsePublicSiteTemplateResult {
  const cachedEntry = locationId > 0 ? readPublicSiteCache(locationId) : null;
  const cacheValid = !!cachedEntry && !isPublicSiteCacheStale(locationId);

  const [renderedHtml, setRenderedHtml] = useState(() => cachedEntry?.renderedHtml ?? "");
  const [loading, setLoading] = useState(() => !cacheValid);
  const [fromCache, setFromCache] = useState(cacheValid);

  useEffect(() => {
    if (locationId <= 0) {
      setRenderedHtml(
        errorPageHtml("Invalid or Expired Link", "This booking link is invalid or has expired."),
      );
      setLoading(false);
      setFromCache(false);
      return;
    }

    const cached = readPublicSiteCache(locationId);
    const canUseCache = !!cached && !isPublicSiteCacheStale(locationId);

    if (canUseCache || cached?.renderedHtml) {
      setRenderedHtml((prev) => nextHtmlIfChanged(prev, cached!.renderedHtml));
      setLoading(false);
      setFromCache(true);
    } else {
      setLoading(true);
      setFromCache(false);
    }

    let cancelled = false;

    const load = async () => {
      try {
        const result = await fetchPublicHtmlByLocation(locationId);
        if (cancelled) return;

        const previousVersion = cached?.versionKey;
        const changed = previousVersion !== result.versionKey || !canUseCache;

        if (changed || !cached?.renderedHtml) {
          setRenderedHtml((prev) => nextHtmlIfChanged(prev, result.renderedHtml));
          writePublicSiteCache(locationId, {
            versionKey: result.versionKey,
            renderedHtml: result.renderedHtml,
          });
          setFromCache(false);
        } else {
          writePublicSiteCache(locationId, {
            versionKey: result.versionKey,
            renderedHtml: result.renderedHtml,
          });
        }
      } catch (error) {
        if (cancelled) return;
        if (!cached?.renderedHtml) {
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          setRenderedHtml(errorPageHtml("Failed to Load Template", message));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return { renderedHtml, loading, fromCache };
}

/** Prefer GetPublicHtml GUID path; this remains for legacy location-id callers. */
export async function resolveLocationIdByOrgLocTempId(orgLocTempId: string): Promise<number> {
  const token = orgLocTempId.trim();
  const forceRefresh = shouldForcePublicSiteRefresh();

  if (!forceRefresh) {
    const mapped = readPublicSiteGuidMap(token);
    if (mapped?.locationId) {
      return mapped.locationId;
    }
  }

  const siteService = new SiteDetailsService();
  const htmlResult = await siteService.getPublicHtml(token);
  const locationId = htmlResult?.organisationlocationid ?? 0;

  if (locationId > 0) {
    writePublicSiteGuidMap(token, locationId);
    if (htmlResult?.html) {
      writePublicSiteCache(locationId, {
        versionKey: htmlResult.versionKey || `loc:${locationId}`,
        renderedHtml: htmlResult.html,
      });
    }
  }

  return locationId;
}
