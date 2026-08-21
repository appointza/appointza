import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePublicSiteTemplate } from "@/hooks/usePublicSiteTemplate";
import { navigateToTemplateBooking } from "@/utils/templateBookingNav.util";
import { publishMainAppOrigin, redirectToLogin } from "@/utils/authNavigation.util";

type OrganisationSiteTemplateViewProps = {
  locationId: number;
};

export function OrganisationSiteTemplateView({ locationId }: OrganisationSiteTemplateViewProps) {
  const navigate = useNavigate();
  const { renderedHtml, loading } = usePublicSiteTemplate(locationId);

  useEffect(() => {
    publishMainAppOrigin();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === "appointza:login-required") {
        const returnUrl: string = event.data.returnUrl || "";
        if (returnUrl) {
          try {
            sessionStorage.setItem("appointza_auth_return", returnUrl);
          } catch {
            // ignore
          }
        }
        redirectToLogin(returnUrl);
        return;
      }

      if (event.data.type !== "appointza:booking-nav") return;
      const url: string = event.data.url || "";
      if (!url) return;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }
      navigateToTemplateBooking(url, navigate);
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
        srcDoc={renderedHtml}
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Template"
      />
    </div>
  );
}
