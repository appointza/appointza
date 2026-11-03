import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { superAdminService, superAdminErrorMessage } from "@/services/superAdmin.service";
import {
  applyAssumedOrganisationSession,
  restoreSuperAdminSession,
  stashSuperAdminSession,
} from "@/utils/superAdminAssumeOrg.util";

/** Open the full organisation workspace as a super admin (edit everything). */
export function useSuperAdminAssumeOrg() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  /** Dedicated super-admin edit screen (sidebar stays; right pane updates). */
  const openOrganisationEditor = (organisationId: number) => {
    navigate(`/super-admin/organisations/${organisationId}/edit`);
  };

  /** Optional: jump into the live organisation workspace (org chrome). */
  const assumeOrganisation = async (organisationId: number, organisationName?: string) => {
    try {
      const ctx = await superAdminService.assumeOrganisation(organisationId);
      if (!ctx?.accesstoken) {
        throw new Error("Could not open organisation workspace");
      }
      stashSuperAdminSession({
        organisationid: organisationId,
        organisationname: organisationName || String(ctx.organisationname || `Organisation #${organisationId}`),
        returnPath: `/super-admin/organisations/${organisationId}`,
      });
      applyAssumedOrganisationSession(ctx);
      refreshAuth();
      toast({
        title: "Editing organisation",
        description: "You can change locations, services, rooms, hours, website and more.",
      });
      navigate("/organization/dashboard", { replace: true });
    } catch (e) {
      toast({
        title: "Could not open editor",
        description: superAdminErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  const exitAssumedOrganisation = () => {
    const path = restoreSuperAdminSession();
    refreshAuth();
    navigate(path, { replace: true });
  };

  return { openOrganisationEditor, assumeOrganisation, exitAssumedOrganisation };
}
