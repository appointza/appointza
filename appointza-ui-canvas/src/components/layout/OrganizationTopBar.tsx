import { useEffect, useState } from "react";
import { Bell, Search, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdminAssumeOrg } from "@/hooks/useSuperAdminAssumeOrg";
import { cn } from "@/lib/utils";
import OrganizationScreenSearch from "@/components/layout/OrganizationScreenSearch";
import SuperAdminBadge from "@/components/superadmin/SuperAdminBadge";
import {
  getAssumedOrganisation,
  isAssumingOrganisation,
} from "@/utils/superAdminAssumeOrg.util";

function initialsFromUser(user: {
  firstname?: string;
  username?: string;
  email?: string;
} | null): string {
  const raw = (user?.firstname || user?.username || user?.email || "A").trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}

const topLinks = [
  { label: "Home", to: "/organization/dashboard" },
  { label: "Operations", to: "/organization/appointments" },
  { label: "CRM", to: "/organization/crm" },
  { label: "Billing", to: "/organization/profile?tab=billing" },
] as const;

/** Razorpay-style dark product top bar for organisation app. */
export default function OrganizationTopBar({ className }: { className?: string }) {
  const { user, isSuperAdmin } = useAuth();
  const { exitAssumedOrganisation } = useSuperAdminAssumeOrg();
  const location = useLocation();
  const initials = initialsFromUser(user);
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  const assuming = isAssumingOrganisation();
  const assumed = assuming ? getAssumedOrganisation() : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchFocusToken((n) => n + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden h-12 items-center gap-4 border-b border-zinc-800 bg-[#0d1117] px-4 lg:flex",
        className,
      )}
    >
      <Link to="/organization/dashboard" className="flex min-w-0 shrink-0 items-center gap-2.5 no-underline">
        <img
          src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
          alt=""
          className="h-7 w-7 object-contain"
        />
        <span className="text-[15px] font-semibold tracking-tight text-white">Appointza</span>
      </Link>

      {isSuperAdmin ? (
        assuming ? (
          <div className="flex max-w-[280px] items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-100/95 px-2 py-1">
            <SuperAdminBadge compact />
            <span className="truncate text-[11px] font-medium text-amber-900" title={assumed?.organisationname}>
              Editing {assumed?.organisationname || "organisation"}
            </span>
            <button
              type="button"
              className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-amber-800 hover:bg-amber-200"
              title="Exit organisation editor"
              aria-label="Exit organisation editor"
              onClick={exitAssumedOrganisation}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link to="/super-admin" className="no-underline" aria-label="Open Super Admin console">
            <SuperAdminBadge />
          </Link>
        )
      ) : null}

      <nav className="ml-4 hidden min-w-0 items-center gap-0.5 xl:flex">
        {topLinks.map((item) => {
          const pathOnly = item.to.split("?")[0];
          const active =
            pathOnly === "/organization/crm"
              ? location.pathname.startsWith("/organization/crm")
              : pathOnly === "/organization/profile"
                ? location.pathname.startsWith("/organization/profile") &&
                  location.search.includes("tab=billing")
                : location.pathname === pathOnly ||
                  (pathOnly !== "/organization/dashboard" &&
                    location.pathname.startsWith(`${pathOnly}/`));
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "relative px-3 py-3 text-[13px] font-medium no-underline",
                active ? "text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#2a5af5]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
        <OrganizationScreenSearch focusToken={searchFocusToken} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Search screens"
          onClick={() => setSearchFocusToken((n) => n + 1)}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          to="/organization/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a5af5] text-[11px] font-semibold text-white no-underline"
          aria-label="Account"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
