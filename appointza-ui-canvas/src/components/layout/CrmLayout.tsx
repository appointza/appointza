import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CrmSidebar from "./CrmSidebar";

interface CrmLayoutProps {
  children: ReactNode;
}

const CrmLayout = ({ children }: CrmLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("crm_sidebar_collapsed");
    setSidebarCollapsed(stored === "1");
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ collapsed?: boolean }>;
      setSidebarCollapsed(
        !!ce.detail?.collapsed || localStorage.getItem("crm_sidebar_collapsed") === "1",
      );
    };
    window.addEventListener("crm-sidebar-toggle", handler as EventListener);
    return () => window.removeEventListener("crm-sidebar-toggle", handler as EventListener);
  }, []);

  return (
    <div className="app-shell h-dvh overflow-hidden safe-area-sides">
      <CrmSidebar />
      <div
        className={cn(
          "h-dvh overflow-hidden transition-all duration-300",
          isMobile ? "safe-area-top pl-0 pb-20" : sidebarCollapsed ? "pt-0 lg:pl-16" : "pt-0 lg:pl-64",
        )}
        style={isMobile ? { paddingBottom: "calc(5rem + var(--safe-area-bottom))" } : undefined}
      >
        <main className="h-full w-full max-w-none overflow-y-auto px-4 pb-4 pt-0 md:px-6 md:pb-6 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CrmLayout;
