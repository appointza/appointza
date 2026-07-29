import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Settings,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import CrmBottomNav from "./CrmBottomNav";

const SidebarLink = ({
  to,
  icon: Icon,
  children,
  collapsed,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  collapsed?: boolean;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-4",
        isActive
          ? "bg-gradient-coral text-white shadow-md shadow-orange-500/20"
          : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-700",
      )}
    >
      <Icon
        className={cn("size-5 shrink-0", isActive ? "text-white" : "text-slate-400")}
        strokeWidth={2}
        aria-hidden
      />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
};

const CrmSidebar = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("crm_sidebar_collapsed");
    setIsCollapsed(stored === "1");
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("crm_sidebar_collapsed", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("crm-sidebar-toggle", { detail: { collapsed: next } }));
  };

  if (isMobile) {
    return <CrmBottomNav />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-blue-50 bg-gradient-to-b from-white via-white to-blue-50/40 shadow-[6px_0_30px_-20px_rgba(36,76,170,0.28)] lg:flex transition-all duration-200",
        isCollapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-blue-50",
          isCollapsed ? "justify-center p-4" : "gap-3 p-5 pr-12",
        )}
      >
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-coral text-white">
            <Users className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block text-xl font-bold tracking-tight text-zinc-900">CRM</span>
              <span className="block text-xs text-zinc-500">Appointza</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "absolute h-8 w-8 text-slate-400 hover:bg-blue-50 hover:text-blue-700",
            isCollapsed ? "right-1 top-4" : "right-3 top-1/2 -translate-y-1/2",
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col min-h-0">
        <div className={cn("flex-1 overflow-y-auto space-y-1", isCollapsed ? "px-2 py-4" : "px-3 py-5")}>
          <SidebarLink to="/crm/lead" icon={Target} collapsed={isCollapsed}>
            Lead
          </SidebarLink>
          <SidebarLink to="/crm/client" icon={UserPlus} collapsed={isCollapsed}>
            Client
          </SidebarLink>
          <SidebarLink to="/crm/template" icon={LayoutTemplate} collapsed={isCollapsed}>
            Template
          </SidebarLink>
        </div>

        <div className="mt-auto shrink-0 border-t border-blue-50 p-3">
          <SidebarLink to="/organization/profile" icon={Settings} collapsed={isCollapsed}>
            Back to Appointza
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default CrmSidebar;
