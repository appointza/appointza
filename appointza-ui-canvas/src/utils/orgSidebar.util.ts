export const ORG_SIDEBAR_COLLAPSED_KEY = "org_sidebar_collapsed";

export const ORG_SIDEBAR_WIDTH_CLASS = {
  expanded: "w-64",
  collapsed: "w-[4.5rem]",
} as const;

export const ORG_SIDEBAR_OFFSET_CLASS = {
  expanded: "lg:pl-64",
  collapsed: "lg:pl-[4.5rem]",
} as const;

export function readOrgSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ORG_SIDEBAR_COLLAPSED_KEY) === "1";
}

export function writeOrgSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(ORG_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
}
