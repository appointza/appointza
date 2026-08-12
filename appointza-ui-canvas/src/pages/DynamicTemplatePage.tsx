import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OrganisationSiteTemplateView } from "@/components/template/OrganisationSiteTemplateView";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { isOrgLocTempId } from "@/utils/orgPublicSiteUrl.util";

const DynamicTemplatePage = () => {
  const { templateId } = useParams();
  const [locationId, setLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const token = decodeURIComponent(templateId?.trim() || "");
      if (!isOrgLocTempId(token)) {
        if (!cancelled) {
          setLocationId(0);
          setLoading(false);
        }
        return;
      }

      try {
        const siteService = new SiteDetailsService();
        const siteResponse = await siteService.selectByOrgLocTempId(token);
        const resolvedId = siteResponse?.[0]?.locationdetail?.id ?? 0;
        if (!cancelled) {
          setLocationId(resolvedId);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLocationId(0);
          setLoading(false);
        }
      }
    };

    setLoading(true);
    resolve();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (loading) {
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
