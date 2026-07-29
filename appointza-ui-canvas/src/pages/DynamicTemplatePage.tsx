import { useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OrganisationSiteTemplateView } from "@/components/template/OrganisationSiteTemplateView";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { EncryptionUtil } from "@/utils/encryption.util";
import { getAppDomain } from "@/utils/environment";
import {
  customSiteOriginsMatch,
  isMainAppHostname,
  parseCustomSiteOrigin,
} from "@/utils/slug.util";
import { parseSubdomainLocation } from "@/utils/subdomain.util";
import { isLegacyTemplatePathOnOrgSubdomain } from "@/utils/orgPublicSiteUrl.util";

function decodeTemplateLocationId(templateId?: string): number {
  if (!templateId) return 0;

  try {
    let locationId = EncryptionUtil.decodeLocationId(templateId);
    if (locationId === 0) {
      locationId = EncryptionUtil.decodeLocationIdSimple(templateId);
    }
    return locationId;
  } catch {
    return 0;
  }
}

const DynamicTemplatePage = () => {
  const { templateId, id: organizationId } = useParams();
  const [locationId, setLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [canonicalizing, setCanonicalizing] = useState(() => isLegacyTemplatePathOnOrgSubdomain());

  // Org subdomain: `/template/:id` → `/` (single canonical URL).
  useLayoutEffect(() => {
    if (!isLegacyTemplatePathOnOrgSubdomain()) return;
    window.location.replace("/");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (isLegacyTemplatePathOnOrgSubdomain()) {
        return;
      }

      const templateIdToUse = templateId || organizationId;
      const decodedLocationId = decodeTemplateLocationId(templateIdToUse);

      if (decodedLocationId <= 0) {
        if (!cancelled) {
          setLocationId(0);
          setLoading(false);
        }
        return;
      }

      const onOrgSubdomain = !!parseSubdomainLocation(window.location.host, getAppDomain());
      if (onOrgSubdomain) {
        window.location.replace("/");
        return;
      }

      if (!isMainAppHostname(window.location.hostname)) {
        if (!cancelled) {
          setLocationId(decodedLocationId);
          setLoading(false);
        }
        return;
      }

      try {
        const siteService = new SiteDetailsService();
        const siteResponse = await siteService.select(decodedLocationId);
        const customUrl = siteResponse?.[0]?.locationdetail?.customurl?.trim();

        if (customUrl) {
          const customOrigin = parseCustomSiteOrigin(customUrl, window.location.protocol);
          if (customOrigin && !customSiteOriginsMatch(window.location.href, customOrigin)) {
            window.location.replace(new URL("/", customOrigin).toString());
            return;
          }
        }
      } catch (error) {
        console.warn("Could not resolve custom domain for template redirect:", error);
      }

      if (!cancelled) {
        setLocationId(decodedLocationId);
        setLoading(false);
        setCanonicalizing(false);
      }
    };

    setLoading(true);
    resolve();

    return () => {
      cancelled = true;
    };
  }, [templateId, organizationId]);

  if (canonicalizing || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
      </div>
    );
  }

  if (!locationId || locationId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-red-600">
        Invalid or expired booking link.
      </div>
    );
  }

  return <OrganisationSiteTemplateView locationId={locationId} />;
};

export default DynamicTemplatePage;
