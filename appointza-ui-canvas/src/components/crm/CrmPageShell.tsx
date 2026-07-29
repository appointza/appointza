import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

interface CrmPageShellProps {
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
}

const CrmPageShell = ({ title, description, children, actions }: CrmPageShellProps) => {
  return (
    <div className={cn(org.page, "min-h-0 py-4 md:py-6")}>
      <div className={org.pageHeader}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className={org.title}>{title}</h1>
            <p className={org.description}>{description}</p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className={org.pageSection}>{children}</div>
    </div>
  );
};

export default CrmPageShell;
