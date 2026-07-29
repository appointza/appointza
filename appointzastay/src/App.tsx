import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StaffRoute, PlatformAdminRoute } from "@/components/auth/ProtectedRoute";
import IndexPage from "@/pages/Index";
import LoginPage, { RegisterPage } from "@/pages/Login";
import StaffDashboard from "@/pages/staff/Dashboard";
import OnboardingPage from "@/pages/staff/Onboarding";
import RoomStatusPage from "@/pages/staff/RoomStatus";
import RoomDefinitionsPage from "@/pages/staff/RoomDefinitions";
import CustomersPage from "@/pages/staff/Customers";
import UsersPage from "@/pages/staff/Users";
import CreditsPage from "@/pages/staff/Credits";
import OrganisationPage from "@/pages/staff/Organisation";
import SiteBuilderPage from "@/pages/staff/SiteBuilder";
import PropertyPage from "@/pages/public/Property";
import BookingPage from "@/pages/public/Booking";
import StaffBookingsPage from "@/pages/staff/Bookings";
import PlatformOrganisationsPage from "@/pages/platform/Organisations";
import PlatformTodayBookingsPage from "@/pages/platform/TodayBookings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const routerBasename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          basename={routerBasename}
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_skipActionErrorRevalidation: true,
          }}
        >
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/property" element={<PropertyPage />} />
            <Route path="/book" element={<BookingPage />} />

            <Route path="/staff/dashboard" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
            <Route path="/staff/onboarding" element={<StaffRoute><OnboardingPage /></StaffRoute>} />
            <Route path="/staff/rooms/status" element={<StaffRoute><RoomStatusPage /></StaffRoute>} />
            <Route path="/staff/bookings" element={<StaffRoute><StaffBookingsPage /></StaffRoute>} />
            <Route path="/staff/rooms/definitions" element={<StaffRoute><RoomDefinitionsPage /></StaffRoute>} />
            <Route path="/staff/customers" element={<StaffRoute><CustomersPage /></StaffRoute>} />
            <Route path="/staff/users" element={<StaffRoute><UsersPage /></StaffRoute>} />
            <Route path="/staff/credits" element={<StaffRoute><CreditsPage /></StaffRoute>} />
            <Route path="/staff/organisation" element={<StaffRoute><OrganisationPage /></StaffRoute>} />
            <Route path="/staff/site-builder" element={<StaffRoute><SiteBuilderPage /></StaffRoute>} />

            <Route
              path="/platform/organisations"
              element={<PlatformAdminRoute><PlatformOrganisationsPage /></PlatformAdminRoute>}
            />
            <Route
              path="/platform/bookings/today"
              element={<PlatformAdminRoute><PlatformTodayBookingsPage /></PlatformAdminRoute>}
            />

            <Route path="/dashboard" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
