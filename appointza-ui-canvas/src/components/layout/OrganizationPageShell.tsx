import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { settingsEmbedded } from "@/lib/settingsEmbedded";

interface OrganizationPageShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** When true, header uses transparent cream style (no white band). Default: true */
  transparentHeader?: boolean;
  /** Renders children inside the profile-settings card (no page chrome). */
  embedded?: boolean;
}

export const OrganizationPageShell = ({
  title,
  description,
  actions,
  children,
  className,
  transparentHeader = true,
  embedded = false,
}: OrganizationPageShellProps) => {
  if (embedded) {
    return (
      <Card className={cn(settingsEmbedded.shell, className)}>
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(org.page, className)}>
      {(title || description || actions) && (
      <div
        className={cn(
          transparentHeader ? org.pageHeader : org.panelSection
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {title ? <h1 className={org.title}>{title}</h1> : null}
            {description ? <p className={org.description}>{description}</p> : null}
          </div>
          {actions ? (
            <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-shrink-0 sm:flex-wrap sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      )}
      {children}
    </div>
  );
};

export default OrganizationPageShell;
