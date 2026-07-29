import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { EventService } from "@/services/event.service";
import { renderSiteTemplateHtml } from "@/utils/templateRenderer.util";
import { navigateToTemplateBooking } from "@/utils/templateBookingNav.util";
import { publishMainAppOrigin, redirectToLogin } from "@/utils/authNavigation.util";

type OrganisationSiteTemplateViewProps = {
  locationId: number;
};

export function OrganisationSiteTemplateView({ locationId }: OrganisationSiteTemplateViewProps) {
  const navigate = useNavigate();
  const [renderedHtml, setRenderedHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publishMainAppOrigin();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      try {
        if (locationId <= 0) {
          setRenderedHtml(invalidLinkHtml());
          return;
        }

        const siteService = new SiteDetailsService();
        const siteResponse = await siteService.select(locationId);

        if (cancelled) return;

        if (!siteResponse?.length) {
          setRenderedHtml(siteNotFoundHtml());
          return;
        }

        const siteData = siteResponse[0];
        const eventService = new EventService();
        const templateRefId = (siteData.locationdetail as { templateid?: number })?.templateid;
        const templateHtml = (siteData as { template_html?: string }).template_html;

        let htmlTemplate = "";

        if (templateHtml?.trim()) {
          htmlTemplate = templateHtml;
        } else if (templateRefId && templateRefId > 0) {
          const referenceValueService = new ReferenceValueService();
          const templateResponse = await referenceValueService.select({
            id: templateRefId,
            referencetypeid: 0,
            organisationid: 0,
            parentid: 0,
          });

          if (cancelled) return;

          if (templateResponse?.length) {
            htmlTemplate = templateResponse[0].description || "";
          } else {
            htmlTemplate = templateNotFoundHtml(templateRefId);
          }
        } else {
          htmlTemplate = noTemplateAssignedHtml();
        }

        let publicEvents: unknown[] = [];
        try {
          const eventsResponse = await eventService.select({
            id: 0,
            organisation_id: siteData.organisationdetail?.id || 0,
            organisation_location_id: siteData.locationdetail?.id || 0,
            status: "",
            is_public: true,
          });
          publicEvents = (eventsResponse || []).filter((event: { is_public?: boolean }) => event?.is_public === true);
        } catch (eventsError) {
          console.warn("Failed to load events for template rendering:", eventsError);
        }

        if (cancelled) return;

        setRenderedHtml(
          renderSiteTemplateHtml(htmlTemplate, {
            ...(siteData as object),
            events: publicEvents,
          }),
        );
      } catch (error) {
        if (!cancelled) {
          setRenderedHtml(loadFailedHtml(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

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
    return <div>Loading...</div>;
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

function invalidLinkHtml(): string {
  return errorPageHtml("Invalid or Expired Link", "This booking link is invalid or has expired.");
}

function siteNotFoundHtml(): string {
  return errorPageHtml("Site Details Not Found", "No site details were returned for this location.");
}

function templateNotFoundHtml(templateId: number): string {
  return errorPageHtml("Template Not Found", `Template with ID ${templateId} was not found in the system.`);
}

function noTemplateAssignedHtml(): string {
  return errorPageHtml("No Template Assigned", "No template has been assigned to this location.");
}

function loadFailedHtml(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error occurred";
  return errorPageHtml("Failed to Load Template", message);
}

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
