import { ReactNode } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  ClipboardList,
  BookOpen,
  FileText,
  Settings2,
  Award,
  History,
  TrendingUp,
  BarChart3,
  UserCircle,
  Clock,
  Layers,
} from "lucide-react";

export type UserRole = "admin" | "admin_staff" | "staff" | "student" | "parent";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: UserRole[];
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  /** Hide entire group unless user has one of these roles */
  roles?: UserRole[];
}

const adminNavGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <LayoutDashboard className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
    ],
  },
  {
    id: "setup",
    label: "1 · School setup",
    roles: ["admin"],
    items: [
      {
        label: "Lookup Values",
        href: "/admin/settings",
        icon: <Settings2 className="w-5 h-5" />,
        description: "Grades, years, departments — do this first",
        roles: ["admin"],
      },
      {
        label: "Terms",
        href: "/admin/terms",
        icon: <Calendar className="w-5 h-5" />,
        description: "Academic periods with dates",
        roles: ["admin", "admin_staff"],
      },
      {
        label: "Classes",
        href: "/admin/classes",
        icon: <BookOpen className="w-5 h-5" />,
        description: "Grade, section, room, teacher",
        roles: ["admin", "admin_staff"],
      },
      {
        label: "Fees & Documents",
        href: "/admin/class-config",
        icon: <Layers className="w-5 h-5" />,
        description: "Per-class fees and required documents",
        roles: ["admin"],
      },
    ],
  },
  {
    id: "people",
    label: "2 · People",
    items: [
      {
        label: "Students",
        href: "/admin/students",
        icon: <GraduationCap className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
      {
        label: "Staff",
        href: "/admin/staff",
        icon: <Users className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
    ],
  },
  {
    id: "operations",
    label: "3 · Daily operations",
    items: [
      {
        label: "Schedule",
        href: "/admin/schedule",
        icon: <Clock className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
      {
        label: "Attendance",
        href: "/admin/attendance",
        icon: <ClipboardList className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
    ],
  },
  {
    id: "year-end",
    label: "4 · Year-end",
    items: [
      {
        label: "Promotions",
        href: "/admin/promotions",
        icon: <TrendingUp className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
      {
        label: "Promotion Reports",
        href: "/admin/promotion-reports",
        icon: <BarChart3 className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      {
        label: "Reports",
        href: "/admin/reports",
        icon: <FileText className="w-5 h-5" />,
        roles: ["admin", "admin_staff"],
      },
    ],
  },
];

/** Flat list for admin_staff — setup items limited to terms & classes only */
const adminStaffExtraGroup: NavGroup = {
  id: "setup-staff",
  label: "School setup",
  items: [
    {
      label: "Terms",
      href: "/admin/terms",
      icon: <Calendar className="w-5 h-5" />,
      roles: ["admin_staff"],
    },
    {
      label: "Classes",
      href: "/admin/classes",
      icon: <BookOpen className="w-5 h-5" />,
      roles: ["admin_staff"],
    },
  ],
};

const staffNavGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/staff", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["staff"] },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    items: [
      { label: "My Classes", href: "/staff/classes", icon: <BookOpen className="w-5 h-5" />, roles: ["staff"] },
      { label: "Students", href: "/staff/students", icon: <GraduationCap className="w-5 h-5" />, roles: ["staff"] },
      { label: "Grades", href: "/staff/grades", icon: <Award className="w-5 h-5" />, roles: ["staff"] },
    ],
  },
  {
    id: "operations",
    label: "Daily",
    items: [
      { label: "Schedule", href: "/staff/schedule", icon: <Calendar className="w-5 h-5" />, roles: ["staff"] },
      { label: "Attendance", href: "/staff/attendance", icon: <ClipboardList className="w-5 h-5" />, roles: ["staff"] },
      { label: "Documents", href: "/staff/documents", icon: <FileText className="w-5 h-5" />, roles: ["staff"] },
    ],
  },
];

const studentNavGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["student"] },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    items: [
      { label: "My Classes", href: "/student/classes", icon: <BookOpen className="w-5 h-5" />, roles: ["student"] },
      { label: "Grades", href: "/student/grades", icon: <Award className="w-5 h-5" />, roles: ["student"] },
      { label: "Timeline", href: "/student/timeline", icon: <History className="w-5 h-5" />, roles: ["student"] },
    ],
  },
];

function filterNavItem(item: NavItem, role: UserRole): boolean {
  return !item.roles || item.roles.includes(role);
}

function filterNavGroup(group: NavGroup, role: UserRole): NavGroup | null {
  if (group.roles && !group.roles.includes(role)) return null;
  const items = group.items.filter((item) => filterNavItem(item, role));
  if (items.length === 0) return null;
  return { ...group, items };
}

export function getNavGroupsByRole(role: UserRole): NavGroup[] {
  if (role === "admin") {
    return adminNavGroups
      .map((g) => filterNavGroup(g, role))
      .filter((g): g is NavGroup => g != null);
  }
  if (role === "admin_staff") {
    const groups: NavGroup[] = [];
    for (const g of adminNavGroups) {
      if (g.id === "setup") {
        const staffSetup = filterNavGroup(adminStaffExtraGroup, role);
        if (staffSetup) groups.push(staffSetup);
        continue;
      }
      const filtered = filterNavGroup(g, role);
      if (filtered) groups.push(filtered);
    }
    return groups;
  }
  if (role === "staff") {
    return staffNavGroups.map((g) => filterNavGroup(g, role)).filter((g): g is NavGroup => g != null);
  }
  if (role === "student") {
    return studentNavGroups.map((g) => filterNavGroup(g, role)).filter((g): g is NavGroup => g != null);
  }
  return [];
}

/** Flat list (legacy helpers) */
export function getNavItemsByRole(role: UserRole): NavItem[] {
  return getNavGroupsByRole(role).flatMap((g) => g.items);
}

export function hasAccessToRoute(route: string, role: UserRole): boolean {
  return getNavItemsByRole(role).some((item) => item.href === route);
}

/** Ordered setup steps shown on admin dashboard */
export const ADMIN_SETUP_STEPS = [
  { step: 1, label: "Load lookup values", href: "/admin/settings", roles: ["admin"] as UserRole[] },
  { step: 2, label: "Create terms", href: "/admin/terms", roles: ["admin", "admin_staff"] as UserRole[] },
  { step: 3, label: "Create classes", href: "/admin/classes", roles: ["admin", "admin_staff"] as UserRole[] },
  { step: 4, label: "Add staff", href: "/admin/staff", roles: ["admin", "admin_staff"] as UserRole[] },
  { step: 5, label: "Enroll students", href: "/admin/students", roles: ["admin", "admin_staff"] as UserRole[] },
  { step: 6, label: "Build schedule", href: "/admin/schedule", roles: ["admin", "admin_staff"] as UserRole[] },
];
