import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/platform/organisations", label: "Organisations", icon: Building2 },
  { href: "/platform/bookings/today", label: "Today's bookings", icon: CalendarDays },
] as const;

interface PlatformShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PlatformShell({ title, subtitle, children }: PlatformShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-dvh flex-col bg-muted/30">
      <header className="shrink-0 border-b bg-background">
        <div className="flex items-center justify-between gap-4 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base truncate">
                Appointza<span className="text-primary">Stay</span>
                <span className="ml-2 font-normal text-muted-foreground">· Platform</span>
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Signed in as {user?.name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link to="/staff/dashboard">Staff dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-3 sm:px-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="shrink-0 border-b px-4 py-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
