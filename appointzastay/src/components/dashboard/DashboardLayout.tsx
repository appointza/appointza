import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNavGroupsByRole, type UserRole } from "@/config/navigation";

function getSessionDisplayName(fallback: string): string {
  try {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) return fallback;
    const u = JSON.parse(raw) as { email?: string; username?: string };
    if (typeof u.username === "string" && u.username.trim()) {
      return u.username.trim();
    }
    const email = typeof u.email === "string" ? u.email.trim() : "";
    if (email && email.includes("@")) {
      return email.split("@")[0].replace(/[._-]+/g, " ").trim() || fallback;
    }
    if (email) return email;
  } catch {
    /* ignore */
  }
  return fallback;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  userName?: string;
}

function SidebarContent({
  role,
  displayName,
  avatarInitial,
  profileHref,
  navGroups,
  isActive,
  onNavigate,
  onLogout,
  onClose,
  showClose,
}: {
  role: UserRole;
  displayName: string;
  avatarInitial: string;
  profileHref: string;
  navGroups: ReturnType<typeof getNavGroupsByRole>;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
  onLogout: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const getRoleLabel = (r: UserRole): string => {
    switch (r) {
      case "admin": return "Administrator";
      case "admin_staff": return "Admin Staff";
      case "staff": return "Staff Member";
      case "student": return "Student";
      case "parent": return "Parent";
      default: return "User";
    }
  };

  const getRoleBadgeClass = (r: UserRole): string => {
    switch (r) {
      case "admin":
      case "admin_staff":
        return "bg-primary/10 text-primary";
      case "staff":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border shrink-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={onNavigate}>
          <img src={logo} alt="Campusza" className="h-9 w-9 rounded-lg object-cover shrink-0" />
          <span className="font-display font-bold text-base truncate">
            Campu<span className="text-primary">sza</span>
          </span>
        </Link>
        {showClose && (
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-3 py-2 shrink-0">
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(role)}`}>
          {getRoleLabel(role)}
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-2 py-1 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={item.description}
                    className={`
                      flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all
                      ${active
                        ? "bg-primary text-primary-foreground shadow-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                    onClick={onNavigate}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                {avatarInitial}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-foreground truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="text-xs text-muted-foreground truncate">{getRoleLabel(role)}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card">
            <DropdownMenuItem asChild>
              <Link to={profileHref} className="cursor-pointer flex items-center" onClick={onNavigate}>
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onNavigate(); onLogout(); }} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export const DashboardLayout = ({
  children,
  role,
  userName = "User",
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navGroups = getNavGroupsByRole(role);
  const displayName = getSessionDisplayName(userName);
  const avatarInitial = (displayName || "?").charAt(0).toUpperCase();

  const profileHref =
    role === "staff"
      ? "/staff/profile"
      : role === "student"
        ? "/student/profile"
        : "/admin/profile";

  const handleLogout = () => {
    localStorage.removeItem("campusza_user");
    localStorage.removeItem("auth_token");
    navigate("/signin");
  };

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/staff" || href === "/student") {
      return location.pathname === href;
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const currentPageLabel = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isActive(item.href)) return item.label;
      }
    }
    return "Campusza";
  }, [location.pathname, navGroups]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop sidebar — sticky, full height */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen z-30">
        <SidebarContent
          role={role}
          displayName={displayName}
          avatarInitial={avatarInitial}
          profileHref={profileHref}
          navGroups={navGroups}
          isActive={isActive}
          onNavigate={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[min(100vw,16rem)] bg-card border-r border-border z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent
          role={role}
          displayName={displayName}
          avatarInitial={avatarInitial}
          profileHref={profileHref}
          navGroups={navGroups}
          isActive={isActive}
          onNavigate={closeSidebar}
          onLogout={handleLogout}
          onClose={closeSidebar}
          showClose
        />
      </aside>

      {/* Main column — fills remaining width */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-3 py-2 sm:px-4 lg:px-5 shrink-0">
          <button
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-display font-semibold text-foreground truncate lg:text-base">
              {currentPageLabel}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="lg:hidden flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {avatarInitial}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card">
              <DropdownMenuItem asChild>
                <Link to={profileHref} className="cursor-pointer flex items-center">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5 xl:px-6 xl:py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
