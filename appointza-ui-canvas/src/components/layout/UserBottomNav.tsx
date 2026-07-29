import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarDays, 
  Home, 
  User,
  Calendar,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { OrganizationSwitchService, OrganizationInfo } from "@/services/organizationSwitch.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const UserBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationInfo[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("appointza");
  const orgSwitchService = useMemo(() => new OrganizationSwitchService(), []);

  // Hide bottom nav for Momantza, Campusza, and CRM routes
  const hideNav = location.pathname.startsWith("/momantza") || 
                  location.pathname.startsWith("/campusza") ||
                  location.pathname.startsWith("/crm");
  
  if (hideNav) {
    return null;
  }

  // Load available organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!user?.mobilenumber) return;
      
      try {
        const orgs = await orgSwitchService.getAvailableOrganizations(user.mobilenumber);
        setAvailableOrganizations(orgs);
        
        const currentOrg = orgs.find(o => o.isCurrent);
        if (currentOrg) {
          setSelectedOrganization(currentOrg.organizationId);
          localStorage.setItem('selectedOrganization', currentOrg.organizationId);
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
      }
    };

    loadOrganizations();
  }, [user?.mobilenumber, orgSwitchService]);

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
      to: '/user/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-50 bg-white/95 shadow-[0_-8px_30px_-18px_rgba(36,76,170,0.28)] backdrop-blur-xl" style={{ paddingBottom: 'max(var(--safe-area-inset-bottom), env(safe-area-inset-bottom, 0px))' }}>
      {/* Organization Switcher for Mobile */}
      {availableOrganizations.length > 1 && (
        <div className="px-2 py-1 border-b border-gray-200">
          <Select 
            value={selectedOrganization} 
            onValueChange={(value) => {
              setSelectedOrganization(value);
              localStorage.setItem('selectedOrganization', value);
            }}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOrganizations.map((org) => (
                <SelectItem key={org.organizationId} value={org.organizationId}>
                  {org.organizationName}
                  {org.isCurrent && " (Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
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

