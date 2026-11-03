import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { superAdminService } from "@/services/superAdmin.service";

/**
 * Route guard for /super-admin/*. Display-level only: every super admin API also verifies
 * users.isfactory in the database, so bypassing this guard exposes nothing.
 */
export default function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [serverCheck, setServerCheck] = useState<"idle" | "checking" | "yes" | "no" | "unauth">("idle");

  useEffect(() => {
    if (!authReady || !isAuthenticated || isSuperAdmin) return;
    let cancelled = false;
    setServerCheck("checking");
    superAdminService
      .status()
      .then((ok) => {
        if (cancelled) return;
        if (ok) {
          try {
            const raw = localStorage.getItem("user_context");
            if (raw) {
              const ctx = JSON.parse(raw) as Record<string, unknown>;
              ctx.issuperadmin = true;
              localStorage.setItem("user_context", JSON.stringify(ctx));
            }
          } catch {
            // ignore
          }
          setServerCheck("yes");
          return;
        }
        setServerCheck("no");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status =
          typeof err === "object" && err && "response" in err
            ? Number((err as { response?: { status?: number } }).response?.status || 0)
            : 0;
        setServerCheck(status === 401 ? "unauth" : "no");
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated, isSuperAdmin]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated || serverCheck === "unauth") {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (isSuperAdmin || serverCheck === "yes") return <>{children}</>;

  if (serverCheck === "idle" || serverCheck === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Checking access" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-appointza-cream px-6 text-center">
      <ShieldAlert className="h-10 w-10 text-[#E85D4C]" aria-hidden />
      <h1 className="text-xl font-semibold text-[#1a1a1a]">Super admin access required</h1>
      <Link to="/" className="text-sm font-medium text-[#2a5af5] hover:underline">
        Back to home
      </Link>
    </div>
  );
}
