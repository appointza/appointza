import { LayoutTemplate } from "lucide-react";
import CrmPageShell from "@/components/crm/CrmPageShell";
import CrmEmptyState from "@/components/crm/CrmEmptyState";

const CrmTemplatePage = () => {
  return (
    <CrmPageShell
      title="Template"
      description="Design and publish booking page templates for your CRM brand."
    >
      <CrmEmptyState
        icon={LayoutTemplate}
        title="Template workspace"
        description="This is a new CRM screen. Template gallery, editor, and publish settings will live here."
      />
    </CrmPageShell>
  );
};

export default CrmTemplatePage;
