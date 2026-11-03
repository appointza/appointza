import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small "Super Admin" pill shown wherever a super admin (users.isfactory) is signed in. */
export default function SuperAdminBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      data-testid="super-admin-badge"
      title="You are signed in as a Super Admin"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800",
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      {compact ? "Admin" : "Super Admin"}
    </span>
  );
}