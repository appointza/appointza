import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { OrganisationSiteTemplateView } from "@/components/template/OrganisationSiteTemplateView";
import { environment } from "@/utils/environment";
import { extractOrganisationCustomSubdomain, isOrgLocTempId } from "@/utils/orgPublicSiteUrl.util";
import {
  readPublicSiteSubdomainResolve,
  shouldForcePublicSiteRefresh,
  writePublicSiteSubdomainResolve,
} from "@/utils/publicSiteCache.util";
import Index from "./Index";

type SubdomainResolveResult = {
  organisationlocationid?: number;
  orgloctempid?: string;
};

const CustomDomainRedirect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationId, setLocationId] = useState(0);

  useEffect(() => {
    const handleCustomDomainRedirect = async () => {
      let redirecting = false;
      try {
        setIsLoading(true);

        const customUrlSlug = extractOrganisationCustomSubdomain(window.location.host);
        if (!customUrlSlug) {
          setError("main-page");
          return;
        }

        if (!shouldForcePublicSiteRefresh()) {
          const cachedResolve = readPublicSiteSubdomainResolve(customUrlSlug);
          if (cachedResolve?.orgloctempid && isOrgLocTempId(cachedResolve.orgloctempid)) {
            redirecting = true;
            window.location.replace(`/template/${encodeURIComponent(cachedResolve.orgloctempid)}`);
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
          };

          try {
            const sameOriginResponse = await fetch(path, options);
            if (sameOriginResponse.ok) {
              return sameOriginResponse.json();
            }
          } catch {
            // fall through to absolute URL fallback
          }

          const fallbackResponse = await fetch(`${environment.baseurl}${path}`, options);
          if (!fallbackResponse.ok) {
            throw new Error(`Failed to call ${path}: ${fallbackResponse.statusText || fallbackResponse.status}`);
          }
          return fallbackResponse.json();
        };

        const payload = await postJson("/api/OrganisationSite/ResolveTemplateBySubdomain", {
          item: { customUrl: customUrlSlug },
        });
        const resolved = (payload?.item || payload) as SubdomainResolveResult | null;

        writePublicSiteSubdomainResolve(customUrlSlug, {
          orgloctempid: resolved?.orgloctempid,
          organisationlocationid: resolved?.organisationlocationid,
        });

        const orgLocTempId = (resolved?.orgloctempid || "").trim();
        if (orgLocTempId && isOrgLocTempId(orgLocTempId)) {
          redirecting = true;
          window.location.replace(`/template/${encodeURIComponent(orgLocTempId)}`);
          return;
        }

        const resolvedLocationId = resolved?.organisationlocationid || 0;
        if (!resolvedLocationId) {
          throw new Error("No location found for this subdomain. Check organisationlocation.customurl.");
        }

        setLocationId(resolvedLocationId);
      } catch (resolveError) {
        console.error("Error processing custom domain:", resolveError);
        setError(resolveError instanceof Error ? resolveError.message : "Unknown error occurred");
      } finally {
        if (!redirecting) {
          setIsLoading(false);
        }
      }
    };

    void handleCustomDomainRedirect();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Booking Page</h2>
          <p className="text-gray-600">Resolving {extractOrganisationCustomSubdomain(window.location.host) || "subdomain"}…</p>
        </div>
      </div>
    );
  }

  if (locationId > 0) {
    return <OrganisationSiteTemplateView locationId={locationId} />;
  }

  if (error === "main-page") {
    // Index stays in the main chunk (eager home route). Avoid a cancelled dynamic import.
    return <Index />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomDomainRedirect;
