import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePublicSiteTemplate } from "@/hooks/usePublicSiteTemplate";
import {
  handleTemplateFrameMessage,
  syncParentFromTemplateIframe,
} from "@/utils/templateBookingNav.util";
import { publishMainAppOrigin } from "@/utils/authNavigation.util";

type OrganisationSiteTemplateViewProps = {
  locationId: number;
};

export function OrganisationSiteTemplateView({ locationId }: OrganisationSiteTemplateViewProps) {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { renderedHtml, loading } = usePublicSiteTemplate(locationId);

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

  if (loading) {
    return (
      <div className="flex min-h-dvh min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading booking page" />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        ref={iframeRef}
        srcDoc={renderedHtml}
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Template"
        onLoad={() => syncParentFromTemplateIframe(iframeRef.current, navigate)}
      />
    </div>
  );
}
