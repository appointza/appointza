import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { OrganizationAssetsPanel } from "@/components/organization/OrganizationAssetsPanel";

const OrganizationAssetsPage = () => (
  <OrganizationPageShell
    title="Assets"
    description="Upload and manage images for your organisation."
    className="px-4 pb-6 pt-2 sm:px-6 lg:px-8"
  >
    <OrganizationAssetsPanel />
  </OrganizationPageShell>
);

export default OrganizationAssetsPage;
