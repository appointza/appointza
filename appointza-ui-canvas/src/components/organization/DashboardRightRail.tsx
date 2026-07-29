import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TOP_CUSTOMERS = [
  { initials: "PS", name: "Priya Sharma", phone: "+91 98765 43210", visits: 24 },
  { initials: "AK", name: "Ananya Kapoor", phone: "+91 91234 56789", visits: 18 },
  { initials: "RM", name: "Rahul Mehta", phone: "+91 99887 76655", visits: 15 },
  { initials: "SD", name: "Sneha Desai", phone: "+91 97654 32109", visits: 12 },
];

const DashboardRightRail = ({ className }: { className?: string }) => {
  return (
    <aside className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[0_1px_12px_-4px_rgba(26,31,44,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-appointza-navy">Top customers</h2>
          <Link
            to="/organization/clients"
            className="text-xs font-medium text-appointza-coral hover:text-[#E85D4C]"
          >
            View all
          </Link>
        </div>
        <ul className="space-y-3">
          {TOP_CUSTOMERS.map((c) => (
            <li key={c.initials} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-coral text-xs font-semibold text-white">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-appointza-navy">{c.name}</p>
                <p className="truncate text-xs text-stone-500">{c.phone}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Visits</p>
                <p className="text-sm font-semibold tabular-nums text-appointza-navy">{c.visits}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-coral p-5 text-white shadow-[0_8px_32px_-8px_rgba(255,107,107,0.45)]">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" aria-hidden />
        <div className="relative">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold leading-snug">WhatsApp on autopilot</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            142 reminders & confirmations sent this week
          </p>
          <Link
            to="/organization/templates"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-sm transition-opacity hover:opacity-95"
          >
            Manage templates
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightRail;
