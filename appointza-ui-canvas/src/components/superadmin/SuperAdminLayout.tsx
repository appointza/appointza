import { Suspense, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  Database,
  FileBarChart2,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Users,
  X,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import SuperAdminBadge from "./SuperAdminBadge";

function RightPaneFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[#7a8494]">
      <Loader2 className="h-6 w-6 animate-spin text-[#2a5af5]" aria-label="Loading" />
    </div>
  );
}

const NAV = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/super-admin/organisations", label: "All organisations", icon: Building2, end: false },
  { to: "/super-admin/locations", label: "Locations", icon: MapPin, end: false },
  { to: "/super-admin/users", label: "Users", icon: Users, end: false },
  { to: "/super-admin/reference", label: "Reference data", icon: Database, end: false },
  { to: "/super-admin/reports", label: "Report Builder", icon: FileBarChart2, end: false },
] as const;

/** Standalone shell for the super admin console (users.isfactory). */
export default function SuperAdminLayout() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const homePath = userType === "organization" ? "/organization/dashboard" : "/explore";

  const nav = (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium",
              isActive ? "bg-[#eef2f7] text-[#1a1a1a]" : "text-[#5b6572] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]",
            )
          }
        >
          <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="org-razorpay-shell min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-3 bg-[#0d1117] px-3 sm:px-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:bg-white/5 lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/super-admin" className="flex items-center gap-2 no-underline">
          <img src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight text-white">Appointza</span>
        </Link>
        <SuperAdminBadge />
        <div className="ml-auto flex items-center gap-2">
          <Link
            to={homePath}
            className="hidden items-center gap-1 rounded-md px-2 py-1 text-[12px] text-zinc-300 no-underline hover:bg-white/5 hover:text-white sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
          <span className="hidden max-w-[200px] truncate text-[12px] text-zinc-400 md:inline">
            {user?.email || user?.username}
          </span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:bg-white/5 hover:text-white"
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <aside className="org-workspace-curve fixed left-0 top-12 z-40 hidden h-[calc(100dvh-3rem)] w-56 overflow-hidden border-r border-[#e6eaf0] bg-white lg:block">
        {nav}
      </aside>
      {open ? (
        <div className="fixed inset-x-0 top-12 z-40 border-b border-[#e6eaf0] bg-white shadow-md lg:hidden">{nav}</div>
      ) : null}

      <div className="h-dvh overflow-hidden pt-12 lg:pl-56">
        <main className="org-workspace-curve-right h-full w-full overflow-y-auto bg-[#f5f7f9] px-4 pb-8 pt-4 sm:px-6 lg:pr-8">
          {/* Suspense only around the page outlet — sidebar/header never unmount on nav. */}
          <Suspense fallback={<RightPaneFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
