import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  BedDouble,
  Home,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-4",
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          isActive ? "text-white" : "text-zinc-500",
        )}
        strokeWidth={2}
        aria-hidden
      />
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

  const profileImageId = useMemo(() => {
    void imageVersion;
    return resolveProfileImageId(undefined, user?.imageid);
  }, [user?.imageid, imageVersion]);

  const { blobUrl: userImageUrl } = useAuthenticatedProfileImage(profileImageId, imageVersion);

  const hideSidebar =
    location.pathname.startsWith("/campusza");

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
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-zinc-800 bg-black shadow-none transition-all duration-200 lg:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {user ? (
        <div
          className={cn(
            "relative shrink-0 border-b border-zinc-800",
            isCollapsed ? "flex flex-col items-center gap-2 p-4" : "px-5 py-5 pr-12",
          )}
        >
          {isCollapsed ? (
            <>
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10">
                <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                <AvatarFallback className="bg-zinc-800 text-zinc-200">
                  {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-8 w-8 text-zinc-500 hover:bg-white/10 hover:text-white"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-[18px]" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10">
                  <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-200">
                    {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium text-white">
                    {user.firstname || user.username || "User"}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 text-zinc-500 hover:bg-white/10 hover:text-white"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-[18px]" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="relative flex shrink-0 justify-center border-b border-zinc-800 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 text-zinc-500 hover:bg-white/10 hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
          </Button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto", isCollapsed ? "px-2 py-4" : "px-3 py-5")}>
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
            Events
          </SidebarLink>
          <SidebarLink to="/user/my-room-bookings" icon={BedDouble} collapsed={isCollapsed}>
            Rooms
          </SidebarLink>
        </div>

        <div className="mt-auto shrink-0 border-t border-zinc-800 p-3">
          <SidebarLink to="/user/profile" icon={Settings} collapsed={isCollapsed}>
            Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
