import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { stayApi } from "@/services/stay.service";
import { isPlatformAdminRole } from "@/models/stay";
import { isOnboardingAllowedPath, normalizeOnboarding } from "@/config/onboardingSteps";

export function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isStaff, authReady } = useAuth();
  const location = useLocation();

  const needsOnboardingCheck =
    authReady && !!user && isStaff && !isPlatformAdminRole(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-gate"],
    queryFn: () => stayApi.dashboard.onboarding(),
    enabled: needsOnboardingCheck,
    staleTime: 30_000,
  });

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isStaff) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsOnboardingCheck && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsOnboardingCheck && data) {
    const onboarding = normalizeOnboarding(data.onboarding);
    if (!onboarding.isComplete && !isOnboardingAllowedPath(location.pathname)) {
      const step = onboarding.currentStepId || onboarding.steps.find((s) => !s.done)?.id || "basic";
      return <Navigate to={`/staff/onboarding?step=${encodeURIComponent(step)}`} replace />;
    }
  }

  return <>{children}</>;
}

export function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isPlatformAdmin, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isPlatformAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { authReady } = useAuth();
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
