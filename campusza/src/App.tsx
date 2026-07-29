import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import OrganizationSignup from "./pages/OrganizationSignup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminStudentEdit from "./pages/admin/AdminStudentEdit";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFees from "./pages/admin/AdminFees";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminClassConfig from "./pages/admin/AdminClassConfig";
import AdminTerms from "./pages/admin/AdminTerms";
import AdminPromotion from "./pages/admin/AdminPromotion";
import AdminPromotionReport from "./pages/admin/AdminPromotionReport";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffClasses from "./pages/staff/StaffClasses";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffSchedule from "./pages/staff/StaffSchedule";
import StaffStudents from "./pages/staff/StaffStudents";
import StaffGrades from "./pages/staff/StaffGrades";
import StaffDocuments from "./pages/staff/StaffDocuments";
import StaffDocumentStudents from "./pages/staff/StaffDocumentStudents";
import StudentTimeline from "./pages/student/StudentTimeline";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Vite `base` (/campusza/) → React Router basename (/campusza). Dev uses `/`. */
const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<OrganizationSignup />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
          <Route path="/admin/students/:id/edit" element={<AdminStudentEdit />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/classes" element={<AdminClasses />} />
          <Route path="/admin/terms" element={<AdminTerms />} />
          <Route path="/admin/schedule" element={<AdminSchedule />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/fees" element={<AdminFees />} />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/class-config" element={<AdminClassConfig />} />
          <Route path="/admin/promotions" element={<AdminPromotion />} />
          <Route path="/admin/promotion-reports" element={<AdminPromotionReport />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/profile" element={<Profile />} />
          {/* Staff Routes */}
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/classes" element={<StaffClasses />} />
          <Route path="/staff/attendance" element={<StaffAttendance />} />
          <Route path="/staff/schedule" element={<StaffSchedule />} />
          <Route path="/staff/students" element={<StaffStudents />} />
          <Route path="/staff/grades" element={<StaffGrades />} />
          <Route path="/staff/documents" element={<StaffDocuments />} />
          <Route path="/staff/documents/:documentId/students" element={<StaffDocumentStudents />} />
          <Route path="/staff/profile" element={<Profile />} />
          {/* Student Routes */}
          <Route path="/student/timeline" element={<StudentTimeline />} />
          <Route path="/student/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
