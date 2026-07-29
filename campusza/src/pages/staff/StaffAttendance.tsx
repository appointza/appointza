import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { classService } from "@/services/class.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffService } from "@/services/staff.service";
import { attendanceService, type StudentWithAttendanceItem } from "@/services/attendance.service";
import type { Class } from "@/models/class.model";

type AttendanceStatusValue = "present" | "absent" | "late" | null;

const StaffAttendance = () => {
  const { toast } = useToast();
  const [classesLoading, setClassesLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [studentsWithAttendance, setStudentsWithAttendance] = useState<StudentWithAttendanceItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatusValue>>({});
  const [saving, setSaving] = useState(false);

  // Resolve staffId from user context (localStorage)
  useEffect(() => {
    const loadClasses = async () => {
      setClassesLoading(true);
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
          if (currentStaff?.id) staffId = currentStaff.id;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (staffId or staff record required).",
            variant: "destructive",
          });
          setClassesLoading(false);
          return;
        }

        const schedules = await staffScheduleService.getByStaff(staffId);
        const classIds = [...new Set(schedules.map((s) => s.classId).filter(Boolean))];
        const teacherClasses = await classService.getByTeacher(staffId);

        const classesById: Record<string, Class> = {};
        teacherClasses.forEach((cls) => {
          if (cls.id) classesById[cls.id] = cls;
        });
        for (const classId of classIds) {
          if (!classId || classesById[classId]) continue;
          try {
            const cls = await classService.getById(classId);
            if (cls?.id) classesById[cls.id] = cls;
          } catch {
            // skip
          }
        }

        const assignedClasses = Object.values(classesById);
        setClasses(assignedClasses);
        if (assignedClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(assignedClasses[0].id);
          setSelectedClassName(assignedClasses[0].name);
        }
      } catch (error) {
        console.error("Failed to load classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes.",
          variant: "destructive",
        });
      } finally {
        setClassesLoading(false);
      }
    };

    loadClasses();
  }, [toast]);

  // Single API: fetch students with attendance for class + date, bind to UI
  useEffect(() => {
    if (!selectedClassId || !selectedDate) {
      setStudentsWithAttendance([]);
      setAttendance({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setDataLoading(true);
      try {
        const list = await attendanceService.getStudentsWithAttendance(selectedClassId, selectedDate);
        if (cancelled) return;
        setStudentsWithAttendance(list);
        const name = classes.find((c) => c.id === selectedClassId)?.name;
        if (name) setSelectedClassName(name);
        const byStudent: Record<string, AttendanceStatusValue> = {};
        list.forEach((r) => {
          if (r.id && r.attendancestatus) {
            const s = r.attendancestatus as AttendanceStatusValue;
            if (s === "present" || s === "absent" || s === "late") byStudent[r.id] = s;
          }
        });
        setAttendance(byStudent);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load students with attendance:", error);
          toast({
            title: "Error",
            description: "Failed to load data for this class and date.",
            variant: "destructive",
          });
          setStudentsWithAttendance([]);
          setAttendance({});
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedDate, classes]);

  const handleAttendance = (studentId: string, status: AttendanceStatusValue) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) {
      toast({
        title: "Error",
        description: "Select a class and date.",
        variant: "destructive",
      });
      return;
    }
    const toSave = Object.entries(attendance).filter(([, s]) => s != null);
    if (toSave.length === 0) {
      toast({
        title: "No attendance to save",
        description: "Mark at least one student's attendance.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      for (const [studentId, status] of toSave) {
        const row = studentsWithAttendance.find((s) => s.id === studentId);
        const name = row?.fullname || [row?.firstname, row?.lastname].filter(Boolean).join(" ").trim() || "";
        await attendanceService.save({
          type: "student",
          date: selectedDate,
          classId: selectedClassId,
          className: selectedClassName,
          studentId,
          studentName: name,
          status: status as "present" | "absent" | "late",
          organizationId: staffService.getOrganizationId(),
        });
      }
      toast({
        title: "Attendance Saved",
        description: "Attendance has been recorded successfully.",
      });
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, AttendanceStatusValue> = {};
    studentsWithAttendance.forEach((s) => {
      allPresent[s.id] = "present";
    });
    setAttendance(allPresent);
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;

  const displayDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Mark Attendance</h1>
            <p className="text-muted-foreground mt-1">Record daily attendance for your classes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-muted rounded-lg font-medium min-w-[180px] text-center">
              {displayDate || "Select date"}
            </div>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Select
                value={selectedClassId}
                onValueChange={(id) => {
                  setSelectedClassId(id);
                  const c = classes.find((x) => x.id === id);
                  if (c) setSelectedClassName(c.name);
                }}
                disabled={classesLoading || classes.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleMarkAllPresent}
                  disabled={studentsWithAttendance.length === 0}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="hero"
                  onClick={handleSave}
                  disabled={saving || studentsWithAttendance.length === 0 || Object.keys(attendance).filter((k) => attendance[k] != null).length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving…" : "Save Attendance"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-display font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-display font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-display font-bold text-yellow-600">{lateCount}</div>
              <div className="text-sm text-muted-foreground">Late</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">
              Students {selectedClassName ? `- ${selectedClassName}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <p className="text-muted-foreground">Loading classes…</p>
            ) : dataLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : studentsWithAttendance.length === 0 ? (
              <p className="text-muted-foreground">
                {selectedClassId ? "No students in this class." : "Select a class."}
              </p>
            ) : (
              <div className="space-y-3">
                {studentsWithAttendance.map((student) => {
                  const name =
                    student.fullname ||
                    [student.firstname, student.lastname].filter(Boolean).join(" ").trim() ||
                    "—";
                  const rollNo = student.rollnumber ?? 0;
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {rollNo}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.studentid || student.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={attendance[student.id] === "present" ? "default" : "outline"}
                          size="sm"
                          className={
                            attendance[student.id] === "present"
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }
                          onClick={() => handleAttendance(student.id, "present")}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={attendance[student.id] === "absent" ? "default" : "outline"}
                          size="sm"
                          className={
                            attendance[student.id] === "absent"
                              ? "bg-red-600 hover:bg-red-700"
                              : ""
                          }
                          onClick={() => handleAttendance(student.id, "absent")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={attendance[student.id] === "late" ? "default" : "outline"}
                          size="sm"
                          className={
                            attendance[student.id] === "late"
                              ? "bg-yellow-600 hover:bg-yellow-700"
                              : ""
                          }
                          onClick={() => handleAttendance(student.id, "late")}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
