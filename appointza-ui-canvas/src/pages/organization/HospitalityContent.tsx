import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { HospitalityProfilePanel } from "@/components/organization/HospitalityProfilePanel";
import { useAuth } from "@/contexts/AuthContext";

const HospitalityContentPage = () => {
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;

  return (
    <OrganizationPageShell embedded className="flex h-full min-h-0 flex-col">
      <HospitalityProfilePanel organisationId={organisationId} />
    </OrganizationPageShell>
  );
};

export default HospitalityContentPage;
