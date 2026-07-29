import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

interface CrmEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CrmEmptyState = ({ icon: Icon, title, description }: CrmEmptyStateProps) => {
  return (
    <div
      className={cn(
        org.card,
        "flex min-h-[min(420px,60dvh)] flex-col items-center justify-center px-6 py-16 text-center",
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0EB] text-[#E85D4C]">
        <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-appointza-navy">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600">{description}</p>
    </div>
  );
};

export default CrmEmptyState;
