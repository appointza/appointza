import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  UserPlus,
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Settings2,
  Clock,
} from "lucide-react";
import { studentService } from "@/services/student.service";
import { staffService } from "@/services/staff.service";
import { classService } from "@/services/class.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { referenceValueService } from "@/services/reference-value.service";
import { termService } from "@/services/term.service";
import { getCampuszaUser } from "@/services/auth.service";
import { ADMIN_SETUP_STEPS, type UserRole } from "@/config/navigation";
import { useToast } from "@/hooks/use-toast";

type RecentActivity = {
  action: string;
  name: string;
  time: string;
  timestamp: number;
};

function layoutRoleFromSession(): UserRole {
  const r = (getCampuszaUser()?.role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "admin_staff") return "admin_staff";
  return "admin";
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const role = layoutRoleFromSession();
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalStaff, setTotalStaff] = useState<number | null>(null);
  const [totalClasses, setTotalClasses] = useState<number | null>(null);
  const [classesToday, setClassesToday] = useState<number | null>(null);
  const [lookupCount, setLookupCount] = useState<number | null>(null);
  const [termCount, setTermCount] = useState<number | null>(null);
  const [scheduleCount, setScheduleCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const formatTimeAgo = (iso?: string): string => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [students, staff, classes, schedules, lookups, terms] = await Promise.all([
          studentService.getAll(),
          staffService.getAll(),
          classService.getAll(),
          staffScheduleService.getAll(),
          referenceValueService.getAll().catch(() => []),
          termService.getAll().catch(() => []),
        ]);

        setTotalStudents(students.length);
        setTotalStaff(staff.length);
        setTotalClasses(classes.length);
        setLookupCount(lookups.length);
        setTermCount(terms.length);
        setScheduleCount(schedules.length);

        const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const classIdsToday = new Set(
          schedules
            .filter((s) => s.day === todayDay)
            .map((s) => s.classId)
            .filter(Boolean)
        );
        setClassesToday(classIdsToday.size);

        const studentActivities: RecentActivity[] = students
          .slice()
          .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
          .slice(0, 5)
          .map((s) => ({
            action: "Student enrolled",
            name: s.fullName || `${s.firstName} ${s.lastName}`.trim() || s.studentId,
            time: formatTimeAgo(s.createdAt),
            timestamp: new Date(s.createdAt || "").getTime() || Date.now(),
          }));

        const staffActivities: RecentActivity[] = staff
          .slice()
          .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
          .slice(0, 5)
          .map((st) => ({
            action: "Staff added",
            name: st.fullName || `${st.firstName} ${st.lastName}`.trim() || st.staffId,
            time: formatTimeAgo(st.createdAt),
            timestamp: new Date(st.createdAt || "").getTime() || Date.now(),
          }));

        setRecentActivities(
          [...studentActivities, ...staffActivities]
            .filter((a) => !!a.timestamp)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Failed to load admin dashboard data", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const setupSteps = useMemo(() => {
    const visible = ADMIN_SETUP_STEPS.filter((s) => s.roles.includes(role));
    const doneFor = (step: number): boolean => {
      if (loading) return false;
      switch (step) {
        case 1:
          return (lookupCount ?? 0) > 0;
        case 2:
          return (termCount ?? 0) > 0;
        case 3:
          return (totalClasses ?? 0) > 0;
        case 4:
          return (totalStaff ?? 0) > 0;
        case 5:
          return (totalStudents ?? 0) > 0;
        case 6:
          return (scheduleCount ?? 0) > 0;
        default:
          return false;
      }
    };
    return visible.map((s) => ({ ...s, done: doneFor(s.step) }));
  }, [role, loading, lookupCount, termCount, totalClasses, totalStaff, totalStudents, scheduleCount]);

  const setupComplete = setupSteps.length > 0 && setupSteps.every((s) => s.done);
  const nextSetupStep = setupSteps.find((s) => !s.done);

  return (
    <DashboardLayout role={role} userName="Admin User">
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {setupComplete
                ? "Your school is set up. Use the sidebar to manage daily work."
                : "Follow the setup guide below, then use the sidebar for day-to-day tasks."}
            </p>
          </div>
          <Button variant="hero" className="shrink-0" asChild>
            <Link to="/admin/students">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>

        <div className={`grid gap-4 lg:gap-5 ${!setupComplete ? "xl:grid-cols-12" : ""}`}>
          {!setupComplete && (
            <Card className="shadow-lg border-primary/20 bg-primary/5 xl:col-span-4 2xl:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                School setup guide
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete these steps in order. Each step unlocks the next part of the app.
              </p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {setupSteps.map((step) => (
                  <li key={step.step}>
                    <Link
                      to={step.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        step.done
                          ? "text-muted-foreground"
                          : step.step === nextSetupStep?.step
                            ? "bg-card border border-primary/30 font-medium text-foreground shadow-sm"
                            : "hover:bg-card/80 text-foreground"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1">
                        <span className="text-muted-foreground mr-2">{step.step}.</span>
                        {step.label}
                      </span>
                      {!step.done && step.step === nextSetupStep?.step && (
                        <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
              {nextSetupStep && (
                <Button className="mt-4" variant="hero" asChild>
                  <Link to={nextSetupStep.href}>
                    Continue: {nextSetupStep.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
          )}

          <div className={`space-y-4 lg:space-y-5 ${!setupComplete ? "xl:col-span-8 2xl:col-span-9" : ""}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            title="Students"
            value={loading ? "—" : String(totalStudents ?? 0)}
            icon={<GraduationCap className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Staff"
            value={loading ? "—" : String(totalStaff ?? 0)}
            icon={<Users className="w-6 h-6" />}
            color="secondary"
          />
          <StatCard
            title="Classes"
            value={loading ? "—" : String(totalClasses ?? 0)}
            icon={<BookOpen className="w-6 h-6" />}
            color="accent"
          />
          <StatCard
            title="Scheduled today"
            value={loading ? "—" : String(classesToday ?? 0)}
            icon={<Calendar className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No recent enrollments yet. Add staff and students to see activity here.
                </p>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-foreground">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.name}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/admin/students">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  <span>Students</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/admin/staff">
                  <Users className="w-6 h-6 text-secondary" />
                  <span>Staff</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/admin/attendance">
                  <FileText className="w-6 h-6 text-accent" />
                  <span>Attendance</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/admin/schedule">
                  <Clock className="w-6 h-6 text-purple" />
                  <span>Schedule</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
