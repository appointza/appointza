import { Suspense, lazy, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationProvider } from "@/contexts/LocationContext";
import { GlobalIdProvider } from "@/contexts/GlobalIdContext";
import { useAuth } from "@/contexts/AuthContext";
import { shouldEnableFirebasePush } from "@/utils/firebasePushGate.util";

const FirebasePushBootstrap = lazy(
  () => import("@/components/notifications/FirebasePushBootstrap"),
);

const FirebasePushGate = () => {
  const location = useLocation();
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return null;
  }

  if (!shouldEnableFirebasePush(location.pathname, isAuthenticated)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <FirebasePushBootstrap />
    </Suspense>
  );
};

/** Dashboard/app chrome — not mounted on public template surfaces. */
export default function FullAppChrome({ children }: { children: ReactNode }) {
  return (
    <LocationProvider>
      <GlobalIdProvider>
        <TooltipProvider>
          <FirebasePushGate />
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </GlobalIdProvider>
    </LocationProvider>
  );
}
