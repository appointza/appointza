import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  ClipboardList,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { classService } from "@/services/class.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffService } from "@/services/staff.service";
import { studentService } from "@/services/student.service";
import type { Class } from "@/models/class.model";
import { useToast } from "@/hooks/use-toast";

const colorVariants = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-purple to-purple/70",
];

type ClassWithDetails = {
  id: string;
  name: string;
  subject: string;
  students: number;
  room: string;
  schedule: string;
};

const StaffClasses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myClasses, setMyClasses] = useState<ClassWithDetails[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        // Get current staff member by email
        const raw = localStorage.getItem('campusza_user');
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

        // Prefer staffId from login (business staff code STF-...); fallback to userId
        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        const staffIdFromStorage =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        // Fallback: resolve staff by email if staffId not present in login payload
        let staffId = staffIdFromStorage;
        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const currentStaff = allStaff.find((s) => s.email === userEmail);
          if (currentStaff?.staffId) staffId = currentStaff.staffId;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (userId or staff record required).",
            variant: "destructive",
          });
          return;
        }

        // Get schedules for this staff member (for time/subject summaries)
        const [schedules, allClasses] = await Promise.all([
          staffScheduleService.getByStaff(staffId),
          classService.getAll(),
        ]);

        // Only show classes where this staff is mentor or assistant mentor
        const assignedClasses = allClasses.filter(
          (cls) =>
            cls.classTeacherId === staffId ||
            cls.assistantMentorId === staffId
        );

        // Get class details with student counts
        const classesWithDetails: ClassWithDetails[] = await Promise.all(
          assignedClasses.map(async (cls) => {
            const classSchedules = schedules.filter((s) => s.classId === cls.id);
            const subjects = [...new Set(classSchedules.map((s) => s.subject).filter(Boolean))];
            const subject = subjects.join(", ") || "N/A";
            
            // Get schedule summary
            const scheduleDays = [...new Set(classSchedules.map((s) => s.day).filter(Boolean))];
            const scheduleTimes = classSchedules
              .map((s) => `${s.startTime} - ${s.endTime}`)
              .filter(Boolean);
            const schedule = scheduleDays.length > 0 
              ? `${scheduleDays.join(", ")} - ${scheduleTimes[0] || ""}`
              : "N/A";

            // Get student count
            let students = 0;
            try {
              const classStudents = await studentService.getByClass(cls.id);
              students = classStudents.length;
            } catch (err) {
              console.error(`Failed to get students for class ${cls.id}:`, err);
            }

            return {
              id: cls.id,
              name: cls.name,
              subject,
              students,
              room: cls.room || "N/A",
              schedule,
            };
          })
        );

        setMyClasses(classesWithDetails);
        setTotalStudents(classesWithDetails.reduce((sum, c) => sum + c.students, 0));
        
        // Calculate total hours per week
        const totalMinutes = schedules.reduce((sum, s) => {
          const start = new Date(`2000-01-01T${s.startTime}`);
          const end = new Date(`2000-01-01T${s.endTime}`);
          const diff = (end.getTime() - start.getTime()) / (1000 * 60);
          return sum + diff;
        }, 0);
        setTotalHours(Math.round(totalMinutes / 60));

      } catch (error) {
        console.error("Failed to load classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [toast]);

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading classes...</p>
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
            <h1 className="text-3xl font-display font-bold text-foreground">My Classes</h1>
            <p className="text-muted-foreground mt-1">View and manage your assigned classes</p>
          </div>
        </div>

        {myClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No classes assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Classes grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myClasses.map((cls, index) => (
                <Card key={cls.id} className="shadow-lg border-border/50 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${colorVariants[index % colorVariants.length]}`} />
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-display font-bold text-foreground">{cls.name}</h3>
                        <p className="text-primary font-medium">{cls.subject}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {cls.name.split("-")[1] || cls.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="text-foreground font-medium">{cls.students} Students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">{cls.room}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-purple" />
                        <span className="text-muted-foreground">{cls.schedule}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/staff/students")}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Students
                      </Button>
                      <Button variant="cyan" size="sm" onClick={() => navigate("/staff/attendance")}>
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Class Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <div className="text-3xl font-display font-bold text-primary">{myClasses.length}</div>
                    <div className="text-sm text-muted-foreground">Total Classes</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <div className="text-3xl font-display font-bold text-secondary">
                      {totalStudents}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <div className="text-3xl font-display font-bold text-accent">{myClasses.length}</div>
                    <div className="text-sm text-muted-foreground">Classes/Week</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <div className="text-3xl font-display font-bold text-purple">{totalHours}</div>
                    <div className="text-sm text-muted-foreground">Hours/Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffClasses;
