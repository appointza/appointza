import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useManagedOrganisation } from "@/hooks/useManagedOrganisation";

export function PlatformManagedOrgBanner() {
  const { isPlatformAdmin } = useAuth();
  const { managedOrg, clearManagedOrganisation } = useManagedOrganisation();

  if (!isPlatformAdmin || !managedOrg) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 min-w-0">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <p className="font-medium">Platform admin — managing property</p>
          <p className="truncate text-amber-900/80">
            Changes apply to <span className="font-semibold">{managedOrg.name}</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" className="bg-white" asChild>
          <Link to="/platform/organisations">All organisations</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={clearManagedOrganisation} className="gap-1">
          <X className="h-4 w-4" />
          Exit manage mode
        </Button>
      </div>
    </div>
  );
}
