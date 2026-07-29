import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { OrganisationSiteTemplateView } from "@/components/template/OrganisationSiteTemplateView";
import { getAppDomain, environment } from "@/utils/environment";
import { parseSubdomainLocation } from "@/utils/subdomain.util";

const CustomDomainRedirect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [locationId, setLocationId] = useState(0);

  useEffect(() => {
    const handleCustomDomainRedirect = async () => {
      try {
        setIsLoading(true);

        const hostname = window.location.host;
        const parsedLocation = parseSubdomainLocation(hostname, getAppDomain());
        if (!parsedLocation) {
          setError("main-page");
          return;
        }

        const normalizePart = (value: string) =>
          (value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/-/g, "");

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

        const resolveSubdomain = async (area: string, city: string) => {
          const payload = await postJson("/api/OrganisationSite/ResolveTemplateBySubdomain", {
            item: {
              organizationName: normalizePart(parsedLocation.organization),
              area: normalizePart(area),
              city: normalizePart(city),
              state: normalizePart(parsedLocation.state),
            },
          });
          return payload?.item || payload;
        };

        let resolved = await resolveSubdomain(parsedLocation.area, parsedLocation.city);
        if (!resolved?.organisationlocationid) {
          resolved = await resolveSubdomain(parsedLocation.city, parsedLocation.area);
        }

        const resolvedLocationId = resolved?.organisationlocationid || 0;
        if (!resolvedLocationId) {
          throw new Error("Location not found for this subdomain");
        }

        setLocationId(resolvedLocationId);
      } catch (resolveError) {
        console.error("Error processing custom domain:", resolveError);
        setError(resolveError instanceof Error ? resolveError.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    handleCustomDomainRedirect();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Booking Page</h2>
          <p className="text-gray-600">Please wait while we find your business location...</p>
        </div>
      </div>
    );
  }

  if (locationId > 0) {
    return <OrganisationSiteTemplateView locationId={locationId} />;
  }

  if (error) {
    if (error === "main-page") {
      const Index = React.lazy(() => import("./Index"));
      return (
        <React.Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <Index />
        </React.Suspense>
      );
    }

    if (isNotVerified) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-xl shadow-lg">
            <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Organization Not Verified</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This organization is currently not verified or the booking page has not been set up yet.
              Please contact the administrator for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:support@appointza.com"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Support
              </a>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@appointza.com"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomDomainRedirect;
