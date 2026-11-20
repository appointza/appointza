import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { environment } from "@/utils/environment";
import { extractOrganisationCustomSubdomain, isOrgLocTempId } from "@/utils/orgPublicSiteUrl.util";
import {
  readPublicSiteSubdomainResolve,
  shouldForcePublicSiteRefresh,
  writePublicSiteSubdomainResolve,
} from "@/utils/publicSiteCache.util";

const Index = lazy(() => import("./Index"));
const OrganisationSiteTemplateView = lazy(() =>
  import("@/components/template/OrganisationSiteTemplateView").then((m) => ({
    default: m.OrganisationSiteTemplateView,
  })),
);

const RESOLVE_TIMEOUT_MS = 12_000;

const PublicSiteSkeleton = ({ subdomain }: { subdomain: string }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 h-10 w-48 animate-pulse rounded-md bg-slate-200" />
      <div className="mb-4 h-6 w-72 animate-pulse rounded-md bg-slate-200" />
      <div className="mb-10 h-4 w-full max-w-md animate-pulse rounded-md bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        Loading booking page for {subdomain || "this business"}…
      </p>
    </div>
  </div>
);

type SubdomainResolveResult = {
  organisationlocationid?: number;
  orgloctempid?: string;
  organisationname?: string;
};

const CustomDomainRedirect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationId, setLocationId] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const subdomain = extractOrganisationCustomSubdomain(window.location.host) || "";

  const resolveSubdomain = useCallback(async () => {
    let redirecting = false;
    try {
      setIsLoading(true);
      setError("");

      if (!subdomain) {
        setError("main-page");
        return;
      }

      if (!shouldForcePublicSiteRefresh()) {
        const cachedResolve = readPublicSiteSubdomainResolve(subdomain);
        if (cachedResolve?.orgloctempid && isOrgLocTempId(cachedResolve.orgloctempid)) {
          redirecting = true;
          // Client-side navigate — avoid full document reload / about:blank flash.
          navigate(`/template/${encodeURIComponent(cachedResolve.orgloctempid)}`, {
            replace: true,
          });
          return;
        }
        if (cachedResolve?.organisationlocationid) {
          setLocationId(cachedResolve.organisationlocationid);
          return;
        }
      }

      const postJson = async (path: string, body: unknown) => {
        const options: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
        };

        const apiBase = (environment.baseurl || "").replace(/\/+$/, "");
        // Prefer configured API origin first (subdomain same-origin often has no /api proxy).
        if (apiBase) {
          const response = await fetch(`${apiBase}${path}`, options);
          if (!response.ok) {
            throw new Error(
              `Failed to call ${path}: ${response.statusText || response.status}`,
            );
          }
          return response.json();
        }

        const sameOriginResponse = await fetch(path, options);
        if (!sameOriginResponse.ok) {
          throw new Error(
            `Failed to call ${path}: ${sameOriginResponse.statusText || sameOriginResponse.status}`,
          );
        }
        return sameOriginResponse.json();
      };

      const payload = await postJson("/api/OrganisationSite/ResolveTemplateBySubdomain", {
        item: { customUrl: subdomain },
      });
      const resolved = (payload?.item || payload) as SubdomainResolveResult | null;

      writePublicSiteSubdomainResolve(subdomain, {
        orgloctempid: resolved?.orgloctempid,
        organisationlocationid: resolved?.organisationlocationid,
      });

      const orgName = (resolved?.organisationname || "").trim();
      if (orgName) {
        document.title = orgName;
      }

      const orgLocTempId = (resolved?.orgloctempid || "").trim();
      if (orgLocTempId && isOrgLocTempId(orgLocTempId)) {
        redirecting = true;
        navigate(`/template/${encodeURIComponent(orgLocTempId)}`, { replace: true });
        return;
      }

      const resolvedLocationId = resolved?.organisationlocationid || 0;
      if (!resolvedLocationId) {
        throw new Error("No location found for this subdomain. Check organisationlocation.customurl.");
      }

      setLocationId(resolvedLocationId);
    } catch (resolveError) {
      console.error("Error processing custom domain:", resolveError);
      setError(
        resolveError instanceof Error ? resolveError.message : "Unknown error occurred",
      );
    } finally {
      if (!redirecting) {
        setIsLoading(false);
      }
    }
  }, [navigate, subdomain]);

  useEffect(() => {
    void resolveSubdomain();
  }, [resolveSubdomain, retryToken]);

  if (isLoading) {
    return <PublicSiteSkeleton subdomain={subdomain} />;
  }

  if (locationId > 0) {
    return (
      <Suspense fallback={<PublicSiteSkeleton subdomain={subdomain} />}>
        <OrganisationSiteTemplateView locationId={locationId} />
      </Suspense>
    );
  }

  if (error === "main-page") {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <Index />
      </Suspense>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Couldn’t load booking page</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button type="button" onClick={() => setRetryToken((n) => n + 1)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomDomainRedirect;
