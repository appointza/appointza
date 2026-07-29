import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CalendarClock,
  Home,
  Users,
  Briefcase,
  Settings,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ElementType;
  /** Full label (accessibility + tablet) */
  label: string;
  /** Compact single-line label for narrow phones */
  shortLabel: string;
  hasAccess: boolean;
}

const OrganizationBottomNav = () => {
  const location = useLocation();

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
  const isStaff =
    userContext?.isStaff === true ||
    (userContext?.organisationlocationid &&
      userContext?.organisationlocationid > 0 &&
      (!userContext?.organisationid || userContext?.organisationid === 0));

  const hasDashboardAccess = !isStaff || userpermission?.editandviewDashboard === true;
  const hasAppointmentsAccess = !isStaff || userpermission?.editandviewAppointments === true;
  const hasEventsAccess = !isStaff || userpermission?.editandviewEvents === true;
  const hasServicesAccess =
    !isStaff ||
    (userpermission?.editandviewCreateService === true ||
      userpermission?.editandviewCreateEvent === true);
  const hasClientsAccess = !isStaff || userpermission?.editandviewClients === true;

  const navItems: NavItem[] = [
    {
      to: '/organization/dashboard',
      icon: Home,
      label: 'Dashboard',
      shortLabel: 'Dash',
      hasAccess: hasDashboardAccess,
    },
    {
      to: '/organization/appointments',
      icon: CalendarDays,
      label: 'Bookings',
      shortLabel: 'Bookings',
      hasAccess: hasAppointmentsAccess,
    },
    {
      to: '/organization/calendar',
      icon: CalendarClock,
      label: 'Calendar',
      shortLabel: 'Calendar',
      hasAccess: hasAppointmentsAccess,
    },
    {
      to: '/organization/event-bookings',
      icon: Calendar,
      label: 'Event Participants',
      shortLabel: 'Events',
      hasAccess: hasEventsAccess,
    },
    {
      to: '/organization/services',
      icon: Briefcase,
      label: 'Services & Events',
      shortLabel: 'Services',
      hasAccess: hasServicesAccess,
    },
    {
      to: '/organization/clients',
      icon: Users,
      label: 'Customers',
      shortLabel: 'Clients',
      hasAccess: hasClientsAccess,
    },
    {
      to: '/organization/profile',
      icon: Settings,
      label: 'Settings',
      shortLabel: 'Settings',
      hasAccess: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.hasAccess);
  const colCount = Math.min(visibleNavItems.length, 6);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-50 bg-white/95 shadow-[0_-8px_30px_-18px_rgba(36,76,170,0.28)] backdrop-blur-xl safe-area-sides lg:hidden"
      aria-label="Organization navigation"
    >
      <div
        className="grid min-h-[3.75rem] w-full max-w-full items-stretch pb-[env(safe-area-inset-bottom,0px)] pt-1"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/organization/dashboard' && location.pathname.startsWith(item.to));

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 touch-manipulation transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-700'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isActive ? 'bg-gradient-appointza text-white shadow-md shadow-blue-500/20' : 'bg-transparent'
                )}
              >
                <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span
                className={cn(
                  'block w-full max-w-full truncate text-center text-[10px] font-semibold leading-tight tracking-tight',
                  isActive ? 'text-blue-600' : 'text-slate-400'
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

export default OrganizationBottomNav;
