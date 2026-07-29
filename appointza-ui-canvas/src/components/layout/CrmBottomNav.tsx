import { Link, useLocation } from "react-router-dom";
import { LayoutTemplate, Settings, Target, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/crm/lead", icon: Target, label: "Lead", shortLabel: "Lead" },
  { to: "/crm/client", icon: UserPlus, label: "Client", shortLabel: "Client" },
  { to: "/crm/template", icon: LayoutTemplate, label: "Template", shortLabel: "Template" },
  { to: "/organization/profile", icon: Settings, label: "Appointza", shortLabel: "Back" },
];

const CrmBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-50 bg-white/95 shadow-[0_-8px_30px_-18px_rgba(36,76,170,0.28)] backdrop-blur-xl safe-area-sides lg:hidden"
      aria-label="CRM navigation"
    >
      <div
        className="grid min-h-[3.75rem] w-full max-w-full items-stretch pb-[env(safe-area-inset-bottom,0px)] pt-1"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 touch-manipulation transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 active:text-slate-700",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isActive ? "bg-gradient-appointza text-white shadow-md shadow-blue-500/20" : "bg-transparent",
                )}
              >
                <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span
                className={cn(
                  "block w-full max-w-full truncate text-center text-[10px] font-semibold leading-tight tracking-tight",
                  isActive ? "text-blue-600" : "text-slate-400",
                )}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CrmBottomNav;
