import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  ClipboardList,
  BookOpen,
  CheckCircle,
  Clock,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { classService } from "@/services/class.service";
import { studentService } from "@/services/student.service";
import type { StaffSchedule } from "@/models/staff.model";
import type { Class } from "@/models/class.model";

type TodayClass = {
  class: string;
  grade: string;
  time: string;
  status: "completed" | "ongoing" | "upcoming";
};

const statusColors = {
  completed: "bg-green-100 text-green-700",
  ongoing: "bg-primary/10 text-primary",
  upcoming: "bg-muted text-muted-foreground",
};

const StaffDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [classesToday, setClassesToday] = useState(0);
  const [attendanceMarked, setAttendanceMarked] = useState("0/0");
  const [nextClassIn, setNextClassIn] = useState<string>("—");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("campusza_user");
        if (!raw) {
          toast({
            title: "Error",
            description: "User session not found.",
            variant: "destructive",
          });
          return;
        }

        const user = JSON.parse(raw) as {
          email?: string;
          staffId?: string;
          staff_id?: string;
          userId?: string | number;
          userid?: string | number;
          user_id?: string | number;
        };
        const userEmail = user?.email;

        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        let staffId =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const currentStaff = allStaff.find((s) => s.email === userEmail);
          if (currentStaff?.staffId) staffId = currentStaff.staffId;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (staffId or staff record required).",
            variant: "destructive",
          });
          return;
        }

        // Load schedules and classes
        const [allSchedules, allClasses] = await Promise.all([
          staffScheduleService.getByStaff(staffId),
          classService.getAll(),
        ]);

        // Prefer classes where this staff is mentor or assistant mentor.
        // If none are configured yet, fall back to all classes where they have schedule entries.
        const mentorClasses = allClasses.filter(
          (c) => c.classTeacherId === staffId || c.assistantMentorId === staffId
        );

        let schedules: StaffSchedule[] = allSchedules;
        const classById: Record<string, Class> = {};

        if (mentorClasses.length > 0) {
          const allowedClassIds = new Set(
            mentorClasses.map((c) => c.id).filter(Boolean) as string[]
          );
          schedules = allSchedules.filter((s) => allowedClassIds.has(s.classId));
          mentorClasses.forEach((c) => {
            if (c.id) classById[c.id] = c;
          });
        } else {
          // Fallback: use any class that appears in this staff member's schedule
          const allowedClassIds = new Set(
            allSchedules.map((s) => s.classId).filter(Boolean) as string[]
          );
          allClasses
            .filter((c) => c.id && allowedClassIds.has(c.id))
            .forEach((c) => {
              if (c.id) classById[c.id] = c;
            });
        }

        // Compute today's schedule
        const now = new Date();
        const dayIndex = now.getDay(); // 0=Sunday
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const todayKey = dayNames[dayIndex];

        const todays = schedules.filter(
          (s) => (s.day || "").toLowerCase() === todayKey
        );

        const parseTime = (time: string): Date | null => {
          if (!time) return null;
          const [hh, mm] = time.split(":");
          const d = new Date();
          d.setSeconds(0, 0);
          d.setHours(parseInt(hh, 10), parseInt(mm || "0", 10), 0, 0);
          return d;
        };

        const formatTimeRange = (start: string, end: string) => {
          const fmt = (time: string) => {
            if (!time) return "";
            const parts = time.split(":");
            const hours = parseInt(parts[0], 10);
            const minutes = parts[1] || "00";
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes} ${ampm}`;
          };
          return `${fmt(start)} - ${fmt(end)}`;
        };

        const todayClassCards: TodayClass[] = todays.map((slot) => {
          const start = parseTime(slot.startTime);
          const end = parseTime(slot.endTime);
          let status: TodayClass["status"] = "upcoming";
          if (start && end) {
            if (now > end) status = "completed";
            else if (now >= start && now <= end) status = "ongoing";
          }

          const cls = classById[slot.classId];
          const gradeLabel = cls?.name || slot.className || "Class";
          const subjectLabel = slot.subject || "Lesson";

          return {
            class: subjectLabel,
            grade: gradeLabel,
            time: formatTimeRange(slot.startTime, slot.endTime),
            status,
          };
        });

        setTodayClasses(todayClassCards);
        setClassesToday(todayClassCards.length);

        // Compute next class in
        const upcoming = todayClassCards
          .map((tc) => {
            const start = parseTime(tc.time.split(" - ")[0].replace(/ (AM|PM)$/i, ""));
            return { tc, start };
          })
          .filter((x) => x.start && x.start > now)
          .sort((a, b) => (a.start!.getTime() - b.start!.getTime()));

        if (upcoming.length > 0) {
          const diffMs = upcoming[0].start!.getTime() - now.getTime();
          const diffMin = Math.round(diffMs / (1000 * 60));
          const hours = Math.floor(diffMin / 60);
          const minutes = diffMin % 60;
          setNextClassIn(
            hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`
          );
        } else {
          setNextClassIn("—");
        }

        // Count students across the classes we are showing on the dashboard
        const uniqueClassIds = Object.keys(classById);
        let studentTotal = 0;
        for (const cid of uniqueClassIds) {
          try {
            const classStudents = await studentService.getByClass(cid);
            studentTotal += classStudents.length;
          } catch {
            // ignore per-class errors
          }
        }
        setTotalStudents(studentTotal);

        // For now, attendance marked is placeholder using classesToday
        setAttendanceMarked(`0/${todayClassCards.length || 0}`);
      } catch (error) {
        console.error("Failed to load staff dashboard:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Here's your schedule and tasks for today.</p>
          </div>
          <Button variant="cyan">
            <ClipboardList className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="My Students" 
            value={totalStudents.toString()} 
            icon={<GraduationCap className="w-6 h-6" />}
            color="primary"
          />
          <StatCard 
            title="Classes Today" 
            value={classesToday.toString()} 
            icon={<BookOpen className="w-6 h-6" />}
            color="secondary"
          />
          <StatCard 
            title="Attendance Marked" 
            value={attendanceMarked} 
            icon={<CheckCircle className="w-6 h-6" />}
            color="accent"
          />
          <StatCard 
            title="Next Class In" 
            value={nextClassIn} 
            icon={<Clock className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Today's Schedule */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayClasses.map((item, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {item.grade.split("-")[1]}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{item.class}</div>
                      <div className="text-sm text-muted-foreground">{item.grade}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status as keyof typeof statusColors]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex-col gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <span>Take Attendance</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <BookOpen className="w-6 h-6 text-secondary" />
            <span>View Students</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            <span>My Schedule</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <GraduationCap className="w-6 h-6 text-purple" />
            <span>Enter Grades</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
