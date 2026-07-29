
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrganizationSidebar from "./OrganizationSidebar";
import DashboardSwitcher from "./DashboardSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { UserTypeUtil } from "@/utils/userType.util";
import { PrivilegeUtil } from "@/utils/privilege.util";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldX } from "lucide-react";
import BillingOverdueScreen from "@/components/organization/BillingOverdueScreen";
import { OrganisationSubscriptionStatusRes } from "@/models/subscription.model";
import { SubscriptionService } from "@/services/subscription.service";
import { OnboardingSetupScreen } from "@/components/onboarding/OrganizationOnboarding";

interface OrganizationLayoutProps {
  children: ReactNode;
}

const OrganizationLayout = ({ children }: OrganizationLayoutProps) => {
  const { userType, isAuthenticated, canSwitchMode, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const { hasServices, hasTiming, isComplete, isLoading: isLoadingOnboarding, nextStep } = useOnboardingStatus();
  
  // Get user context from localStorage
  const getUserContext = () => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) return null;
      return JSON.parse(userContextStr);
    } catch (error) {
      console.error('Error parsing user_context:', error);
      return null;
    }
  };
  
  const userContext = getUserContext();
  const userpermission = userContext?.userpermission || {};
  // Use isStaff from user_context if available, otherwise use from user object
  const isStaff = userContext?.isStaff === true || user?.isStaff === true;
  
  // Routes that are allowed even during onboarding
  const onboardingRoutes = [
    '/organization/services',
    '/organization/timing',
  ];
  
  const isOnboardingRoute = onboardingRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  // Check if staff user has access to current route based on new permission structure
  const checkRouteAccess = (route: string): boolean => {
    // Non-staff users (organization owners) have full access
    if (!isStaff) return true;
    
    // Map routes to permission properties
    const routePermissionMap: Record<string, string> = {
      '/organization/dashboard': 'editandviewDashboard',
      '/organization/appointments': 'editandviewAppointments',
      '/organization/calendar': 'editandviewAppointments',
      '/organization/event-bookings': 'editandviewEvents',
      '/organization/services': 'editandviewCreateService', // Check for service or event permission
      '/organization/clients': 'editandviewClients',
    };
    
    // Check exact match first
    const permissionKey = routePermissionMap[route];
    if (permissionKey) {
      if (route === '/organization/services') {
        // Services route needs either service or event permission
        return userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true;
      }
      return userpermission?.[permissionKey] === true;
    }
    
    // Check if route starts with any mapped route
    for (const [mappedRoute, permissionKey] of Object.entries(routePermissionMap)) {
      if (route.startsWith(mappedRoute)) {
        if (mappedRoute === '/organization/services') {
          return userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true;
        }
        return userpermission?.[permissionKey] === true;
      }
    }
    
    // If route not in map, allow access (for routes like /organization/profile, etc.)
    return true;
  };

  const staffHasAccess = checkRouteAccess(location.pathname);

  // -----------------------------------------------------------------------
  // Billing overdue gate
  // Org owners (not staff) lose access to all org pages while booking-fee
  // overage is unpaid. The gate calls /Subscription/GetStatus and refreshes
  // after payment verification.
  // -----------------------------------------------------------------------
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const orgIdForBilling = user?.organisationid ?? 0;
  const shouldEnforceBilling = userType === 'organization' && !isStaff && orgIdForBilling > 0;
  const [billingStatus, setBillingStatus] = useState<OrganisationSubscriptionStatusRes | null>(null);
  const [billingChecked, setBillingChecked] = useState(false);

  const refreshBillingStatus = useCallback(async () => {
    if (!shouldEnforceBilling) {
      setBillingStatus(null);
      setBillingChecked(true);
      return;
    }
    try {
      const status = await subscriptionService.getStatus(orgIdForBilling);
      setBillingStatus(status);
    } catch (err) {
      console.error('Could not load subscription status', err);
      setBillingStatus(null);
    } finally {
      setBillingChecked(true);
    }
  }, [shouldEnforceBilling, subscriptionService, orgIdForBilling]);

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  useEffect(() => {
    if (!shouldEnforceBilling) return;
    const id = window.setInterval(() => {
      void refreshBillingStatus();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [shouldEnforceBilling, refreshBillingStatus]);

  useEffect(() => {
    const stored = localStorage.getItem('org_sidebar_collapsed');
    setSidebarCollapsed(stored === '1');
    const handler = (e: any) => setSidebarCollapsed(!!e?.detail?.collapsed || localStorage.getItem('org_sidebar_collapsed') === '1');
    window.addEventListener('org-sidebar-toggle', handler as any);
    return () => window.removeEventListener('org-sidebar-toggle', handler as any);
  }, []);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    } 
    
    if (userType === 'user' && !canSwitchMode) {
      navigate('/user/dashboard');
      return;
    }
  }, [isAuthenticated, userType, canSwitchMode, navigate, location]);

  if (!isAuthenticated || (userType !== 'organization' && !canSwitchMode)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-gray-600">
            {!isAuthenticated ? 'Please log in to access this page' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // For staff users, check privileges instead of onboarding
  if (isStaff && !staffHasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ShieldX className="h-6 w-6 text-red-600" />
              <CardTitle className="text-xl">Access Denied</CardTitle>
            </div>
            <CardDescription className="mt-2">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Please contact your administrator to request access to this feature.
            </p>
            <Button
              onClick={() => {
                // Redirect to dashboard if they have access, otherwise go to a safe route
                if (userpermission?.editandviewDashboard === true || !isStaff) {
                  navigate('/organization/dashboard');
                } else {
                  // Find first accessible route or go to profile
                  const accessibleRoutes = [
                    { path: '/organization/appointments', perm: 'editandviewAppointments' },
                    { path: '/organization/calendar', perm: 'editandviewAppointments' },
                    { path: '/organization/event-bookings', perm: 'editandviewEvents' },
                    { path: '/organization/services', perm: 'editandviewCreateService' },
                    { path: '/organization/clients', perm: 'editandviewClients' },
                    { path: '/organization/profile', perm: null }, // Profile is always accessible
                  ];
                  
                  const accessibleRoute = accessibleRoutes.find(route => 
                    !route.perm || userpermission?.[route.perm] === true
                  );
                  
                  navigate(accessibleRoute?.path || '/organization/profile');
                }
              }}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show onboarding blocking screen if incomplete and not on onboarding routes
  // Skip onboarding check for staff users - they don't need to set up services/timing
  if (userType === 'organization' && !isOnboardingRoute && !isStaff) {
    if (isLoadingOnboarding) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">Checking setup status...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!isComplete) {
      return (
        <OnboardingSetupScreen
          hasServices={hasServices}
          hasTiming={hasTiming}
          nextStep={nextStep}
        />
      );
    }
  }

  // Billing overdue lock — org owners with unpaid booking-fee overage get
  // a payment-only screen. While the very first status request is in flight
  // we briefly show a spinner so the dashboard never flashes before locking.
  if (shouldEnforceBilling && !billingChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm">Checking billing status…</p>
        </div>
      </div>
    );
  }

  if (
    shouldEnforceBilling &&
    billingStatus &&
    Number(billingStatus.outstanding_amount_inr ?? 0) > 0
  ) {
    return (
      <BillingOverdueScreen
        status={billingStatus}
        onPaid={() => refreshBillingStatus()}
      />
    );
  }

  const isTemplateBuilder = location.pathname.includes("/template-builder");

  return (
    <div className="app-shell h-dvh overflow-hidden safe-area-sides">
      <OrganizationSidebar />
      <div
        className={cn(
          "h-dvh overflow-hidden transition-all duration-300",
          isMobile ?
            "safe-area-top pl-0 pb-20"
          : sidebarCollapsed ?
            "pt-0 lg:pl-16"
          : "pt-0 lg:pl-64"
        )}
        style={isMobile ? { paddingBottom: 'calc(5rem + var(--safe-area-bottom))' } : undefined}
      >
        {/* No top padding on desktop: aligns main column with sidebar; mobile uses safe-area-top only */}
        <main
          className={cn(
            "h-full w-full max-w-none",
            isTemplateBuilder
              ? "overflow-hidden p-0"
              : "overflow-y-auto px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5 lg:px-10 lg:pb-8 lg:pt-6 xl:px-12",
          )}
        >
          {canSwitchMode && !isTemplateBuilder && (
            <div className="mb-6">
              <DashboardSwitcher />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default OrganizationLayout;
