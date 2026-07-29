import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  LayoutGrid, 
  Users, 
  Package,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import OrganizationBottomNav from './OrganizationBottomNav';

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
          ? "bg-gradient-coral text-white shadow-md shadow-orange-500/20"
          : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-700"
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          isActive ? "text-white" : "text-slate-400"
        )}
        strokeWidth={2}
        aria-hidden
      />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
};

const OrganizationSidebar = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
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
  const hasServicesAccess = !isStaff || (userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true);
  const hasClientsAccess = !isStaff || userpermission?.editandviewClients === true;
  
  useEffect(() => {
    const stored = localStorage.getItem('org_sidebar_collapsed');
    setIsCollapsed(stored === '1');
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('org_sidebar_collapsed', next ? '1' : '0');
    window.dispatchEvent(new CustomEvent('org-sidebar-toggle', { detail: { collapsed: next } }));
  };

  if (isMobile) {
    return <OrganizationBottomNav />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-blue-50 bg-gradient-to-b from-white via-white to-blue-50/40 shadow-[6px_0_30px_-20px_rgba(36,76,170,0.28)] lg:flex transition-all duration-200",
        isCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-blue-50",
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
            <span className="bg-gradient-appointza bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Appointza
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "absolute h-8 w-8 text-slate-400 hover:bg-blue-50 hover:text-blue-700",
            isCollapsed ? "right-1 top-4" : "right-3 top-1/2 -translate-y-1/2"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col min-h-0">
        <div className={cn("flex-1 overflow-y-auto space-y-1", isCollapsed ? "px-2 py-4" : "px-3 py-5")}>
          {hasDashboardAccess && (
            <SidebarLink to="/organization/dashboard" icon={LayoutGrid} collapsed={isCollapsed}>
              Dashboard
            </SidebarLink>
          )}
          {hasAppointmentsAccess && (
            <SidebarLink to="/organization/appointments" icon={CalendarDays} collapsed={isCollapsed}>
              Bookings
            </SidebarLink>
          )}
          {hasAppointmentsAccess && (
            <SidebarLink to="/organization/calendar" icon={CalendarClock} collapsed={isCollapsed}>
              Calendar
            </SidebarLink>
          )}
          {hasEventsAccess && (
            <SidebarLink to="/organization/event-bookings" icon={CalendarCheck} collapsed={isCollapsed}>
              Event Participants
            </SidebarLink>
          )}
          {hasServicesAccess && (
            <SidebarLink to="/organization/services" icon={Package} collapsed={isCollapsed}>
              Services & Events
            </SidebarLink>
          )}
          {hasClientsAccess && (
            <SidebarLink to="/organization/clients" icon={Users} collapsed={isCollapsed}>
              Customers
            </SidebarLink>
          )}
        </div>

        <div className={cn("mt-auto shrink-0 border-t border-blue-50 p-3")}>
          <SidebarLink to="/organization/profile" icon={Settings} collapsed={isCollapsed}>
            Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default OrganizationSidebar;
