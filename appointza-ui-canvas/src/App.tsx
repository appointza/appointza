import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { GlobalIdProvider } from "./contexts/GlobalIdContext";
import { OnboardingGuard } from "./components/onboarding/OnboardingGuard";
import { SafeArea } from "./components/common/SafeArea";
import { GOOGLE_WEB_CLIENT_ID } from "./config/google";
import { initializeFirebase } from "./config/firebase.config";
import { useSafeArea } from "./hooks/useSafeArea";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { NotificationHandler } from "./components/notifications/NotificationHandler";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import OtpVerification from "./pages/OtpVerification";
import PricingPlans from "./pages/PricingPlans";
import DemoRequest from "./pages/DemoRequest";
import UseCases from "./pages/UseCases";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import HelpCenter from "./pages/HelpCenter";
import Blog from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import OrganizationDashboard from "./pages/organization/Dashboard";
import OrganizationTimingSetup from "./pages/organization/TimingSetup";
import TimingScreen from "./pages/organization/Timing";
import OrganizationServices from "./pages/organization/Services";
import OrganizationAppointments from "./pages/organization/Appointments";
import OrganizationCalendar from "./pages/organization/OrganizationCalendar";
import OrganizationLocations from "./pages/organization/Locations";
import LocationsScreen from "./pages/organization/Locations";
import AddStaff from "./pages/organization/AddStaff";
import StaffManagement from "./pages/organization/StaffManagement";
import OrganizationTemplates from "./pages/organization/Templates";
import TemplateBuilder from "./pages/organization/TemplateBuilder";
import OrganizationSettings from "./pages/organization/Settings";
import OrganizationProfile from "./pages/organization/Profile";
import PaymentSettings from "./pages/organization/PaymentSettings";
import ReferenceValuesPage from "./pages/organization/ReferenceValues";
import BookingPagePreview from "./pages/organization/BookingPagePreview";
import ClientManagement from "./pages/organization/ClientManagement";
import OnSpotRegistration from "./pages/organization/OnSpotRegistration";
import ClientBookAppointment from "./pages/organization/ClientBookAppointment";
import AppointmentRecordPage from "./pages/organization/AppointmentRecord";
import ExploreServices from "./pages/ExploreServices";
import PublicBrowseEventsPage from "./pages/PublicBrowseEventsPage";
import PublicBrowseServicesPage from "./pages/PublicBrowseServicesPage";
import PublicBrowseOrganisationsPage from "./pages/PublicBrowseOrganisationsPage";
import OrganizationTemplate from "./pages/OrganizationTemplate";
import ExploreOrganizations from "./pages/user/ExploreOrganizations";
import OrganizationDetail from "./pages/user/OrganizationDetail";
import UserDashboard from "./pages/user/Dashboard";
import UserProfile from "./pages/user/UserProfile";
import UserSettings from "./pages/user/Settings";
import UserAppointments from "./pages/user/Appointments";
import UserEvents from "./pages/user/UserEvents";
import EventBookingPage from "./pages/user/EventBookingPage";
import MyEventBookings from "./pages/user/MyEventBookings";
import AppointmentBooking from "./pages/user/AppointmentBooking";
import EventBookings from "./pages/organization/EventBookings";
import OrganizationPublicPage from "./pages/OrganizationPublicPage";
import DynamicTemplatePage from "./pages/DynamicTemplatePage";
import CustomDomainRedirect from "./pages/CustomDomainRedirect";
import TurfDirectoryPage from "./pages/TurfDirectoryPage";
import MomantzaBooking from "./pages/momantza/Booking";
import CampuszaStaff from "./pages/campusza/Staff";
import CrmLayout from "./components/layout/CrmLayout";
import CrmLeadPage from "./pages/crm/CrmLeadPage";
import CrmClientPage from "./pages/crm/CrmClientPage";
import CrmTemplatePage from "./pages/crm/CrmTemplatePage";
import CrmBillingPage from "./pages/crm/CrmBillingPage";
import { parseSubdomainLocation } from "@/utils/subdomain.util";
import { mustUseMainAppForAuth, redirectToLogin } from "@/utils/authNavigation.util";
import { EnsureAuthOnMainHost } from "@/components/auth/EnsureAuthOnMainHost";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import UserLayout from "@/components/layout/UserLayout";

// Sends unauthenticated users on org subdomains to main-app `/login`.
const MainAppLoginRedirect = ({ returnPath }: { returnPath: string }) => {
  useEffect(() => {
    redirectToLogin(returnPath);
  }, [returnPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
      <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Redirecting to login" />
    </div>
  );
};

// Protected Route component - defined inside the app so it can be used after AuthProvider exists
const ProtectedRouteWrapper = ({ children, redirectTo }: { children: React.ReactNode; redirectTo: string }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login from:', returnPath);
    if (mustUseMainAppForAuth()) {
      return <MainAppLoginRedirect returnPath={returnPath} />;
    }
    return <Navigate to={redirectTo} replace state={{ from: returnPath }} />;
  }

  return <>{children}</>;
};

// Organization Route wrapper that includes onboarding guard
const OrganizationRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <OnboardingGuard>
      {children}
    </OnboardingGuard>
  );
};

// Route layouts (React Router "router-outlet" equivalent)
const OrganizationOutletLayout = () => (
  <OrganizationLayout>
    <Outlet />
  </OrganizationLayout>
);

const CrmOutletLayout = () => (
  <CrmLayout>
    <Outlet />
  </CrmLayout>
);

const UserOutletLayout = () => (
  <UserLayout>
    <Outlet />
  </UserLayout>
);

// Push Notification Initializer Component
const PushNotificationInitializer = () => {
  const { isInitialized, pushToken, updateTokenForUser } = usePushNotifications();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    if (isInitialized && pushToken) {
      console.log('✅ Push notifications ready with token:', pushToken.substring(0, 20) + '...');
      
      // Ensure token is updated on server when user is authenticated
      if (isAuthenticated && user?.id) {
        updateTokenForUser(user.id).catch(error => {
          console.error('❌ Error updating push token on app load:', error);
        });
      }
    }
  }, [isInitialized, pushToken, isAuthenticated, user?.id, updateTokenForUser]);
  
  return null; // This component doesn't render anything
};

const NOTIF_DISMISSED_KEY = "appointza:notif-prompt-dismissed-until";
const NOTIF_SNOOZE_DAYS = 30;

// Web-only prompt to enable notifications when permission is not granted
const PushNotificationPrompt = () => {
  const { initialize, isLoading } = usePushNotifications();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    // Hide if user dismissed recently
    const until = localStorage.getItem(NOTIF_DISMISSED_KEY);
    if (until && Date.now() < Number(until)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const until = Date.now() + NOTIF_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(NOTIF_DISMISSED_KEY, String(until));
    setDismissed(true);
  };

  const handleEnable = async () => {
    await initialize();
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  };

  if (
    Capacitor.isNativePlatform() ||
    dismissed ||
    permission === "granted" ||
    permission === "unsupported"
  ) {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-between gap-3">
      <span className="flex-1">
        Enable notifications to get appointment updates.
        {permission === "denied" && (
          <span className="ml-1 text-amber-700">
            (Browser blocked — allow in site settings to enable.)
          </span>
        )}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {permission !== "denied" && (
          <button
            className="px-3 py-1 rounded bg-amber-600 text-white text-sm disabled:opacity-60"
            onClick={handleEnable}
            disabled={isLoading}
          >
            Enable
          </button>
        )}
        <button
          className="px-2 py-1 rounded text-amber-700 hover:bg-amber-100 text-lg leading-none"
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          title="Don't show for 30 days"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Only show the enable-notifications banner after entering dashboards (not on marketing/home pages).
const RouteScopedPushNotificationPrompt = () => {
  const location = useLocation();
  const path = location.pathname || "";
  const show = path === "/organization/dashboard" || path === "/user/dashboard";
  return show ? <PushNotificationPrompt /> : null;
};

// Routes component that uses the protected route - this will be used after AuthProvider is established
const AppRoutes = () => {
  // Initialize Firebase
  useEffect(() => {
    initializeFirebase();
  }, []);

  const isCustomDomain = !!parseSubdomainLocation(window.location.host);
  
  return (
    <Routes>
      <Route path="/" element={isCustomDomain ? <CustomDomainRedirect /> : <Index />} />
      <Route path="/login" element={<EnsureAuthOnMainHost><Login /></EnsureAuthOnMainHost>} />
      <Route path="/register" element={<EnsureAuthOnMainHost><Register /></EnsureAuthOnMainHost>} />
      <Route path="/otp" element={<EnsureAuthOnMainHost><OtpVerification /></EnsureAuthOnMainHost>} />
      <Route path="/plans" element={<PricingPlans />} />
      <Route path="/demo" element={<DemoRequest />} />
      <Route path="/use-cases" element={<UseCases />} />
      <Route path="/features" element={<Features />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      
      {/* Public routes - accessible without login */}
      <Route path="/explore-services" element={<ExploreServices />} />
      <Route path="/explore" element={<ExploreServices />} />
      <Route path="/events" element={<PublicBrowseEventsPage />} />
      <Route path="/services" element={<PublicBrowseServicesPage />} />
      <Route path="/organisations" element={<PublicBrowseOrganisationsPage />} />
      <Route path="/turf" element={<TurfDirectoryPage />} />
      <Route path="/organization/:id" element={<OrganizationDetail />} />
      <Route path="/org/template/:orgId/:templateType" element={<OrganizationTemplate />} />
      <Route path="/public/org/:organizationId" element={<OrganizationPublicPage />} />
      <Route path="/template/:templateId" element={<DynamicTemplatePage />} />
      <Route path="/organization/:id/template" element={<DynamicTemplatePage />} />
      
      {/* User routes - all protected with proper paths */}
      <Route
        path="/user"
        element={
          <ProtectedRouteWrapper redirectTo="/login">
            <UserOutletLayout />
          </ProtectedRouteWrapper>
        }
      >
        <Route index element={<UserDashboard />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="appointments" element={<UserAppointments />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="settings" element={<UserSettings />} />
        <Route path="events" element={<UserEvents />} />
        <Route path="my-event-bookings" element={<MyEventBookings />} />
      </Route>
      <Route path="/user/events/:eventId/book" element={<EventBookingPage />} />
      <Route path="/book-appointment/:organisationId/:organisationLocationId" element={<AppointmentBooking />} />
      
      {/* Legacy user routes - redirect to new paths */}
      <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/user/settings" replace />} />
      
      {/* Organization routes - all protected with onboarding guard */}
      {/* Dynamic organization routes must come before static ones */}
      <Route
        path="/organization"
        element={
          <ProtectedRouteWrapper redirectTo="/login">
            <OrganizationRouteWrapper>
              <OrganizationOutletLayout />
            </OrganizationRouteWrapper>
          </ProtectedRouteWrapper>
        }
      >
        <Route path=":id/dashboard" element={<OrganizationDashboard />} />
        <Route path="dashboard" element={<OrganizationDashboard />} />
        <Route path="timing" element={<TimingScreen />} />
        <Route path="services" element={<OrganizationServices />} />
        <Route path="appointments/:id/record" element={<AppointmentRecordPage />} />
        <Route path="appointments" element={<OrganizationAppointments />} />
        <Route path="calendar" element={<OrganizationCalendar />} />
        <Route path="event-bookings" element={<EventBookings />} />
        <Route path="locations" element={<LocationsScreen />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/add" element={<AddStaff />} />
        <Route path="templates" element={<OrganizationTemplates />} />
        <Route path="template-builder" element={<TemplateBuilder />} />
        <Route path="settings" element={<OrganizationSettings />} />
        <Route path="reference-values" element={<ReferenceValuesPage />} />
        <Route path="profile" element={<OrganizationProfile />} />
        <Route path="payment-settings" element={<PaymentSettings />} />
        <Route path="booking-page" element={<Navigate to="/organization/profile?tab=templates" replace />} />
        <Route path="clients" element={<ClientManagement />} />
        <Route path="clients/on-spot-registration" element={<OnSpotRegistration />} />
        <Route path="clients/:clientId/book" element={<ClientBookAppointment />} />
      </Route>
      
      {/* Momantza and Campusza routes - no layout (sidebar/bottom nav hidden) */}
      <Route path="/momantza/booking" element={
        <ProtectedRouteWrapper redirectTo="/login">
          <MomantzaBooking />
        </ProtectedRouteWrapper>
      } />
      <Route path="/campusza/staff" element={
        <ProtectedRouteWrapper redirectTo="/login">
          <CampuszaStaff />
        </ProtectedRouteWrapper>
      } />
      <Route path="/crm" element={
        <ProtectedRouteWrapper redirectTo="/login">
          <CrmOutletLayout />
        </ProtectedRouteWrapper>
      }>
        <Route index element={<Navigate to="/crm/lead" replace />} />
        <Route path="lead" element={<CrmLeadPage />} />
        <Route path="client" element={<CrmClientPage />} />
        <Route path="template" element={<CrmTemplatePage />} />
      </Route>
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once by default
      retryDelay: 2000, // 2 second delay between retries
      staleTime: 30000, // 30 seconds
      gcTime: 60000, // 1 minute (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent constant refetching
    },
  },
});

/** Syncs safe-area CSS vars on native; initializes native Google Sign-In (WebView GIS often fails). */
function NativeBootstrap({ children }: { children: ReactNode }) {
  useSafeArea();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    (async () => {
      try {
        const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
        if (cancelled) return;
        await GoogleAuth.initialize({
          scopes: ["openid", "profile", "email"],
        });
      } catch (e) {
        console.warn("GoogleAuth.initialize:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={routerBasename}>
        <SafeArea
          className="min-h-dvh min-h-screen"
          padding={Capacitor.isNativePlatform() ? "all" : "none"}
        >
          <NativeBootstrap>
            <AuthProvider>
              <LocationProvider>
                <GlobalIdProvider>
                  <TooltipProvider>
                    <PushNotificationInitializer />
                    <RouteScopedPushNotificationPrompt />
                    <NotificationHandler />
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                  </TooltipProvider>
                </GlobalIdProvider>
              </LocationProvider>
            </AuthProvider>
          </NativeBootstrap>
        </SafeArea>
      </BrowserRouter>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
