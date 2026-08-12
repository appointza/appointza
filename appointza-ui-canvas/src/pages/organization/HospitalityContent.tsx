import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { HospitalityProfilePanel } from "@/components/organization/HospitalityProfilePanel";
import { useAuth } from "@/contexts/AuthContext";

const HospitalityContentPage = () => {
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;

  return (
    <OrganizationPageShell className="px-5 pb-4 pt-2 sm:px-8 sm:pt-4 lg:px-10">
      <HospitalityProfilePanel organisationId={organisationId} />
    </OrganizationPageShell>
  );
};

export default HospitalityContentPage;
