import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  UserCircle,
  CreditCard,
  PenTool,
  CalendarDays,
  Shield,
} from "lucide-react";
import { isPlatformAdminRole } from "@/models/stay";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const PLATFORM_NAV_GROUP: NavGroup = {
  id: "platform",
  label: "Platform",
  items: [
    { href: "/platform/organisations", label: "All organisations", icon: <Shield className="w-4 h-4" /> },
    { href: "/platform/bookings/today", label: "Today's bookings", icon: <CalendarDays className="w-4 h-4" /> },
  ],
};

export const STAFF_NAV: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    items: [
      { href: "/staff/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/staff/organisation", label: "Organisation detail", icon: <Building2 className="w-4 h-4" /> },
      { href: "/staff/credits", label: "Credits", icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/staff/rooms/status", label: "Room status", icon: <BedDouble className="w-4 h-4" /> },
      { href: "/staff/bookings", label: "Bookings calendar", icon: <CalendarDays className="w-4 h-4" /> },
      { href: "/staff/rooms/definitions", label: "Room definitions", icon: <Building2 className="w-4 h-4" /> },
      { href: "/staff/customers", label: "Customers", icon: <UserCircle className="w-4 h-4" /> },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { href: "/staff/users", label: "Users", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    id: "website",
    label: "Website",
    items: [
      { href: "/staff/site-builder", label: "Site builder", icon: <PenTool className="w-4 h-4" /> },
    ],
  },
];

export function getStaffNav(role?: string): NavGroup[] {
  if (!isPlatformAdminRole(role)) return STAFF_NAV;
  return [PLATFORM_NAV_GROUP, ...STAFF_NAV];
}
