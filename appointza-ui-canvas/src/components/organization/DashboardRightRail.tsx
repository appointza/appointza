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
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-appointza-navy">Top customers</h2>
          <Link
            to="/organization/clients"
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        <ul className="space-y-3">
          {TOP_CUSTOMERS.map((c) => (
            <li key={c.initials} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-semibold text-white">
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

      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-appointza-navy shadow-none">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <MessageCircle className="h-6 w-6 text-blue-600" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold leading-snug">WhatsApp on autopilot</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            142 reminders & confirmations sent this week
          </p>
          <Link
            to="/organization/templates"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-none hover:bg-blue-700"
          >
            Manage templates
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightRail;
