import { Navigate } from "react-router-dom";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { StayHomePage } from "@/components/landing/StayHomePage";
import { StayHomeSeo } from "@/components/landing/StayHomeSeo";
import { isTenantSubdomainHost } from "@/utils/subdomain";

export default function IndexPage() {
  if (isTenantSubdomainHost()) {
    return <Navigate to="/property" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <StayHomeSeo />
      <MarketingHeader />
      <main>
        <StayHomePage />
      </main>
      <MarketingFooter />
    </div>
  );
}
