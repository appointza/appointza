import type { ReactNode, ElementType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

export const serviceFormInputClass = cn(org.input, "h-11 min-h-11");
export const serviceFormLabelClass = org.label;

type ServiceFormShellProps = {
  title: string;
  description: string;
  icon?: ElementType;
  children: ReactNode;
  footer?: ReactNode;
  /** When true, renders only form fields (for use inside ResponsiveEditSheet). */
  embedded?: boolean;
};

export function ServiceFormShell({
  title,
  description,
  icon: Icon,
  children,
  footer,
  embedded = false,
}: ServiceFormShellProps) {
  if (embedded) {
    return <div className="grid gap-5">{children}</div>;
  }

  return (
    <Card className={cn(org.card, "overflow-hidden rounded-3xl border-stone-100")}>
      <CardHeader className="space-y-1 border-b border-stone-100 bg-gradient-to-br from-[#FFF8F5] to-white p-5 md:p-6">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-xl font-semibold text-appointza-navy">{title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-500">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 md:p-6">
        {children}
        {footer ?
          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        : null}
      </CardContent>
    </Card>
  );
}

export default ServiceFormShell;
