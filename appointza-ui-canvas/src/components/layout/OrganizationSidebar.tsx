import {
  ORG_SIDEBAR_WIDTH_CLASS,
} from '@/utils/orgSidebar.util';
import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarDays,
  LayoutGrid, 
  Users, 
  Package,
  ConciergeBell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Images,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import OrganizationBottomNav from './OrganizationBottomNav';
import { OrganizationSidebarLocation } from './OrganizationSidebarLocation';

const SidebarLink = ({ 
  to, 
  icon: Icon, 
  children,
  onClick,
  collapsed
}: { 
  to: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  onClick?: () => void;
  collapsed?: boolean;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== '/organization/dashboard' && location.pathname.startsWith(`${to}/`));

  return (
    <Link
      to={to}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-4",
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          isActive ? "text-white" : "text-zinc-500"
        )}
        strokeWidth={2}
        aria-hidden
      />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
};

interface OrganizationSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const OrganizationSidebar = ({ collapsed, onCollapsedChange }: OrganizationSidebarProps) => {
  const isMobile = useIsMobile();
  const isCollapsed = collapsed;

  const getUserContext = () => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) return null;
      return JSON.parse(userContextStr);
    } catch (error) {
      console.error('Error parsing user_context:', error);
      return null;
    }
  };
  
  const userContext = getUserContext();
  const userpermission = userContext?.userpermission || {};
  const isStaff = userContext?.isStaff === true || (userContext?.organisationlocationid && userContext?.organisationlocationid > 0 && (!userContext?.organisationid || userContext?.organisationid === 0));
  
  const hasDashboardAccess = !isStaff || userpermission?.editandviewDashboard === true;
  const hasAppointmentsAccess = !isStaff || userpermission?.editandviewAppointments === true;
  const hasEventsAccess = !isStaff || userpermission?.editandviewEvents === true;
  const hasBookingsAccess = hasAppointmentsAccess || hasEventsAccess;
  const hasServicesAccess = !isStaff || (userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true);
  const hasClientsAccess = !isStaff || userpermission?.editandviewClients === true;
  
  const toggleCollapse = () => {
    onCollapsedChange(!isCollapsed);
  };

  if (isMobile) {
    return <OrganizationBottomNav />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-zinc-800 bg-black shadow-none lg:flex transition-all duration-200",
        isCollapsed ? ORG_SIDEBAR_WIDTH_CLASS.collapsed : ORG_SIDEBAR_WIDTH_CLASS.expanded
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-zinc-800",
          isCollapsed ? "justify-center p-4" : "gap-3 p-5 pr-12"
        )}
      >
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <img
            src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
            alt="Appointza Logo"
            className="h-9 w-9 shrink-0 object-contain"
          />
          {!isCollapsed && (
            <span className="text-xl font-extrabold tracking-tight text-white">
              Appointza
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "absolute h-8 w-8 text-zinc-500 hover:bg-white/10 hover:text-white",
            isCollapsed ? "right-1 top-4" : "right-3 top-1/2 -translate-y-1/2"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
        </Button>
      </div>

      <OrganizationSidebarLocation collapsed={isCollapsed} />

      <nav className="flex flex-1 flex-col min-h-0">
        <div className={cn("flex-1 overflow-y-auto space-y-1", isCollapsed ? "px-2 py-4" : "px-3 py-5")}>
          {hasDashboardAccess && (
            <SidebarLink to="/organization/dashboard" icon={LayoutGrid} collapsed={isCollapsed}>
              Dashboard
            </SidebarLink>
          )}
          {hasBookingsAccess && (
            <SidebarLink to="/organization/appointments" icon={CalendarDays} collapsed={isCollapsed}>
              Bookings
            </SidebarLink>
          )}
          {hasServicesAccess && (
            <SidebarLink to="/organization/services" icon={Package} collapsed={isCollapsed}>
              Services & Events
            </SidebarLink>
          )}
          {hasClientsAccess && (
            <SidebarLink to="/organization/leads" icon={Target} collapsed={isCollapsed}>
              Leads
            </SidebarLink>
          )}
          {hasClientsAccess && (
            <SidebarLink to="/organization/clients" icon={Users} collapsed={isCollapsed}>
              Customers
            </SidebarLink>
          )}
          {!isStaff && (
            <SidebarLink to="/organization/hospitality" icon={ConciergeBell} collapsed={isCollapsed}>
              Hospitality
            </SidebarLink>
          )}
          {!isStaff && (
            <SidebarLink to="/organization/assets" icon={Images} collapsed={isCollapsed}>
              Assets
            </SidebarLink>
          )}
        </div>

        <div className={cn("mt-auto shrink-0 border-t border-zinc-800 p-3")}>
          <SidebarLink to="/organization/profile" icon={Settings} collapsed={isCollapsed}>
            Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default OrganizationSidebar;
