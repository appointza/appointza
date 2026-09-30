import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarDays, 
  Home, 
  User,
  Calendar,
  BedDouble,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const UserBottomNav = () => {
  const location = useLocation();

  // Campusza has its own product navigation.
  const hideNav = location.pathname.startsWith("/campusza");
  
  if (hideNav) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      to: '/explore',
      icon: Home,
      label: 'Home'
    },
    {
      to: '/user/appointments',
      icon: CalendarDays,
      label: 'Appointments'
    },
    {
      to: '/user/my-event-bookings',
      icon: Calendar,
      label: 'Events'
    },
    {
      to: '/user/my-room-bookings',
      icon: BedDouble,
      label: 'Rooms'
    },
    {
      to: '/user/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-50 bg-white shadow-[0_-8px_30px_-18px_rgba(36,76,170,0.28)] md:bg-white/95 md:backdrop-blur-xl" style={{ paddingBottom: 'max(var(--safe-area-inset-bottom), env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || 
            (item.to !== '/explore' && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center transition-colors",
                isActive 
                  ? "text-blue-600" 
                  : "text-slate-400 hover:text-blue-600"
              )}
            >
              <span className={cn("mb-0.5 flex h-8 w-8 items-center justify-center rounded-xl", isActive && "bg-gradient-appointza text-white shadow-md shadow-blue-500/20")}>
                <Icon size={19} />
              </span>
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-blue-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default UserBottomNav;

