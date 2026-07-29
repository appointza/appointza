import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteBuilderApp } from "@/components/site-builder/SiteBuilderApp";
import { normalizeSiteBuilderPayload } from "@/components/site-builder/normalizeSiteBuilderPayload";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { keysToCamelCase } from "@/models/organisationProfile";
import { stayApi } from "@/services/stay.service";
import { Loader2 } from "lucide-react";

export default function SiteBuilderPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["site-builder"],
    queryFn: () => stayApi.siteBuilder.index(),
  });

  const { blocks, pageSettings, siteName, templateMode, customHtml, renderedHtml } =
    normalizeSiteBuilderPayload(
    data as Record<string, unknown> | undefined,
  );

  const liveRooms = useMemo(() => {
    const raw = (data as Record<string, unknown> | undefined)?.rooms;
    return Array.isArray(raw) ? keysToCamelCase(raw) : [];
  }, [data]);

  const syncFromOrganisation = useCallback(async () => {
    await stayApi.siteBuilder.syncFromProfile();
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["property"] });
    setReloadKey((k) => k + 1);
  }, [queryClient, refetch]);

  if (isLoading) {
    return (
      <StaffLayout fullBleed>
        <div className="flex flex-1 items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StaffLayout>
    );
  }

  if (isError) {
    return (
      <StaffLayout fullBleed>
        <div className="flex flex-1 items-center justify-center bg-white">
          <p className="text-sm text-destructive">Could not load website builder.</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout fullBleed>
      <SiteBuilderApp
      key={reloadKey}
      initialBlocks={blocks}
      pageSettings={pageSettings}
      siteName={siteName}
      initialTemplateMode={templateMode}
      initialCustomHtml={customHtml}
      initialRenderedHtml={renderedHtml}
      liveRooms={liveRooms}
      onSyncFromOrganisation={syncFromOrganisation}
    />
    </StaffLayout>
  );
}
