import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  Home,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OrganizationSwitchService, OrganizationInfo } from "@/services/organizationSwitch.service";
import UserBottomNav from "./UserBottomNav";
import {
  resolveProfileImageId,
  useAuthenticatedProfileImage,
} from "@/hooks/useAuthenticatedProfileImage";

const SidebarLink = ({
  to,
  icon: Icon,
  children,
  onClick,
  collapsed,
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
    (to === "/user/dashboard" &&
      (location.pathname === "/user" || location.pathname === "/user/dashboard"));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-5",
        isActive
          ? cn(
              "bg-gradient-appointza font-semibold text-white shadow-md shadow-blue-500/20",
              !collapsed && "border-l-4 border-transparent pl-4",
            )
          : cn("text-slate-600 hover:bg-blue-50 hover:text-blue-700", !collapsed && "border-l-4 border-transparent"),
        collapsed && "border-l-0",
      )}
      onClick={onClick}
    >
      <Icon className="size-5 shrink-0 stroke-[2]" aria-hidden />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
};

const UserSidebar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationInfo[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("appointza");
  const orgSwitchService = useMemo(() => new OrganizationSwitchService(), []);

  const profileImageId = useMemo(() => {
    void imageVersion;
    return resolveProfileImageId(undefined, user?.imageid);
  }, [user?.imageid, imageVersion]);

  const { blobUrl: userImageUrl } = useAuthenticatedProfileImage(profileImageId, imageVersion);

  const hideSidebar =
    location.pathname.startsWith("/momantza") ||
    location.pathname.startsWith("/campusza") ||
    location.pathname.startsWith("/crm");

  const userMobile = user?.mobile || (user as { mobilenumber?: string })?.mobilenumber;

  useEffect(() => {
    const stored = localStorage.getItem("user_sidebar_collapsed");
    setIsCollapsed(stored === "1");
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("user_sidebar_collapsed", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("user-sidebar-toggle", { detail: { collapsed: next } }));
  };

  useEffect(() => {
    const loadOrganizations = async () => {
      if (!userMobile) return;
      try {
        const orgs = await orgSwitchService.getAvailableOrganizations(userMobile);
        setAvailableOrganizations(orgs);
        const currentOrg = orgs.find((o) => o.isCurrent);
        if (currentOrg) {
          setSelectedOrganization(currentOrg.organizationId);
        }
        localStorage.setItem("selectedOrganization", currentOrg?.organizationId || "appointza");
      } catch (error) {
        console.error("Error loading organizations:", error);
      }
    };
    loadOrganizations();
  }, [userMobile, orgSwitchService]);

  useEffect(() => {
    const onContextUpdated = () => setImageVersion((v) => v + 1);
    window.addEventListener("userContextUpdated", onContextUpdated);
    return () => window.removeEventListener("userContextUpdated", onContextUpdated);
  }, []);

  if (hideSidebar) {
    return null;
  }

  if (isMobile) {
    return <UserBottomNav />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-blue-50 bg-gradient-to-b from-white via-white to-blue-50/40 shadow-[6px_0_30px_-20px_rgba(36,76,170,0.28)] transition-all duration-200 lg:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
      style={{
        backgroundColor: "hsl(var(--app-sidebar))",
        borderColor: "hsl(var(--app-sidebar-border))",
      }}
    >
      {user ? (
        <div className="shrink-0 border-b border-blue-50 bg-transparent px-3 py-4">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-blue-500/20">
                <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-8 w-8 shrink-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-[18px]" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-blue-500/20">
                  <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.firstname || user.username || "User"}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="mt-0.5 h-8 w-8 shrink-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="size-[18px]" />
                </Button>
              </div>
              {availableOrganizations.length > 1 && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Organization</label>
                  <Select
                    value={selectedOrganization}
                    onValueChange={(value) => {
                      setSelectedOrganization(value);
                      localStorage.setItem("selectedOrganization", value);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-xs focus:ring-orange-500/25">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {availableOrganizations.map((org) => (
                      <SelectItem key={org.organizationId} value={org.organizationId}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          <span>{org.organizationName}</span>
                          {org.isCurrent && (
                            <span className="text-xs text-orange-600">(Current)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 justify-center border-b border-gray-200 px-2 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
          </Button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto", isCollapsed ? "px-2 py-4" : "px-4 py-6")}>
          <SidebarLink to="/explore" icon={Home} collapsed={isCollapsed}>
            Home
          </SidebarLink>
          <SidebarLink to="/user/dashboard" icon={LayoutDashboard} collapsed={isCollapsed}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/user/appointments" icon={CalendarDays} collapsed={isCollapsed}>
            Appointments
          </SidebarLink>
          <SidebarLink to="/user/my-event-bookings" icon={CalendarCheck} collapsed={isCollapsed}>
            My Event Bookings
          </SidebarLink>
        </div>

        <div className="mt-auto shrink-0 border-t border-blue-50 bg-transparent p-4">
          <SidebarLink to="/user/profile" icon={Settings} collapsed={isCollapsed}>
            Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
