import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SitePreview } from "@/components/site-builder/SitePreview";
import { CustomHtmlFrame } from "@/components/site-builder/CustomHtmlFrame";
import { stayApi } from "@/services/stay.service";
import { getRequestSubdomain } from "@/utils/subdomain";
import { Loader2 } from "lucide-react";

export default function PropertyPage() {
  const subdomain = getRequestSubdomain();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["property", subdomain],
    queryFn: () => stayApi.home.property(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const org = data?.organisation ?? {};
  const name = String(org.name || data?.siteName || "Property");
  const tagline = String(org.tagline || "");
  const websiteUrl = String(org.websiteUrl || data?.websiteUrl || "");
  const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
  const hasBookableRooms = rooms.some((r: { status?: string; Status?: string }) => {
    const status = String(r?.status ?? r?.Status ?? "").toLowerCase();
    return status === "available";
  });

  const err = error as { response?: { data?: { error?: string } } } | undefined;
  const errorMessage = err?.response?.data?.error;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Property not found</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage ||
              (subdomain
                ? `No property is registered for subdomain "${subdomain}".`
                : "Could not load this property website.")}
          </p>
          {!subdomain && (
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (data?.templateMode === "html" && data.renderedHtml) {
    return (
      <div className="h-dvh overflow-hidden bg-white">
        <CustomHtmlFrame
          html={data.renderedHtml}
          title={`${name} website`}
          className="h-dvh min-h-0"
        />
      </div>
    );
  }

  const hasBlocks = (data?.blocks?.length ?? 0) > 0;
  const hasBuiltInNav = (data?.blocks ?? []).some(
    (b: { type?: string; Type?: string }) =>
      String(b?.type ?? b?.Type ?? "").toLowerCase() === "nav",
  );

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      {!hasBuiltInNav ? (
        <header className="border-b sticky top-0 z-40 bg-[#FAF9F7]/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-elegant font-medium tracking-tight">{name}</h1>
              {tagline ? <p className="text-sm text-muted-foreground font-elegantBody">{tagline}</p> : null}
            </div>
            {hasBookableRooms ? (
              <Button asChild>
                <Link to="/book">Book now</Link>
              </Button>
            ) : rooms.length > 0 ? (
              <span className="text-sm text-muted-foreground">No rooms available</span>
            ) : null}
          </div>
        </header>
      ) : null}

      <main>
        {hasBlocks ? (
          <SitePreview blocks={data.blocks} pageSettings={data.pageSettings} />
        ) : (
          <div className="max-w-5xl mx-auto px-4 py-20 text-center text-muted-foreground">
            <p>No website sections yet.</p>
            {websiteUrl ? (
              <p className="text-xs mt-2">
                Public URL:{" "}
                <a href={websiteUrl} className="text-primary underline">
                  {websiteUrl}
                </a>
              </p>
            ) : null}
            <Button className="mt-4" asChild variant="outline">
              <Link to="/staff/site-builder">Open website builder</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
