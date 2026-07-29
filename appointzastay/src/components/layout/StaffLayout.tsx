import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { getStaffNav } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlatformManagedOrgBanner } from "@/components/platform/PlatformManagedOrgBanner";
import { useManagedOrganisation } from "@/hooks/useManagedOrganisation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffLayoutProps {
  children: ReactNode;
  /** Full-height page with no main padding (site builder, etc.) */
  fullBleed?: boolean;
}

export function StaffLayout({ children, fullBleed = false }: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { managedOrg } = useManagedOrganisation();
  const navGroups = getStaffNav(user?.role);

  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries();
    };
    window.addEventListener("appointzastay:managed-org-changed", invalidate);
    return () => window.removeEventListener("appointzastay:managed-org-changed", invalidate);
  }, [queryClient]);

  const displayName = user?.name || user?.email || "Staff";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const roleLabel = (user?.role || "staff").replace(/_/g, " ");
  const propertyLabel = managedOrg?.name || user?.organizationName || "Property";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const closeSidebar = () => setSidebarOpen(false);

  const sidebar = (mobile?: boolean) => (
    <>
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border shrink-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={closeSidebar}>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            AS
          </div>
          <span className="font-display font-bold text-base truncate">
            Appointza<span className="text-primary">Stay</span>
          </span>
        </Link>
        {mobile && (
          <button className="p-2 hover:bg-muted rounded-lg" onClick={closeSidebar} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-3 py-2 shrink-0">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
          {roleLabel}
        </span>
      </div>

      <nav className="flex-1 min-h-0 px-2 py-1 overflow-y-auto space-y-4 overscroll-contain">
        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={closeSidebar}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                {avatarInitial}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{propertyLabel}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div
      className={`bg-muted/30 flex w-full ${
        fullBleed ? "h-dvh max-h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-dvh z-30">
        {sidebar()}
      </aside>

      <aside
        className={`fixed top-0 left-0 h-dvh w-[min(100vw,16rem)] bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar(true)}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-dvh lg:h-auto lg:min-h-dvh">
        <header className="lg:hidden sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Appointza<span className="text-primary">Stay</span>
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{propertyLabel}</p>
          </div>
        </header>

        <div className={fullBleed ? "shrink-0 px-3 pt-2 sm:px-4" : undefined}>
          {fullBleed ? <PlatformManagedOrgBanner /> : null}
        </div>

        <main
          className={
            fullBleed
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0"
              : "flex min-h-0 min-w-0 flex-1 w-full flex-col overflow-x-hidden px-3 py-3 sm:px-4 lg:px-5 lg:py-5"
          }
        >
          {!fullBleed ? <PlatformManagedOrgBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
