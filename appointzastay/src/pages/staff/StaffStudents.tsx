import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  Search,
  Eye,
  Mail,
  Phone
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { staffService } from "@/services/staff.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import type { Student } from "@/models/student.model";
import type { Class } from "@/models/class.model";
import { useToast } from "@/hooks/use-toast";

type StudentWithDetails = {
  id: string;
  name: string;
  class: string;
  email: string;
  phone: string;
  attendance: number;
  grade: string;
};

const StaffStudents = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [allStudents, setAllStudents] = useState<StudentWithDetails[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
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

        // Prefer staff_id from login (staff table id); fallback to userId
        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        const staffIdFromStorage =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        // Fallback: resolve staff by email if no userId in storage
        let staffId = staffIdFromStorage;
        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const currentStaff = allStaff.find((s) => s.email === userEmail);
          if (currentStaff?.id) staffId = currentStaff.id;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (userId or staff record required).",
            variant: "destructive",
          });
          return;
        }

        // Get schedules for this staff member (using userId from localStorage or resolved staff id)
        const schedules = await staffScheduleService.getByStaff(staffId);
        
        // Get unique class IDs from schedules
        const classIds = [...new Set(schedules.map((s) => s.classId).filter(Boolean))];
        
        // Get classes where staff is class teacher (sends classteacherid from localStorage userId)
        const teacherClasses = await classService.getByTeacher(staffId);

        // Ensure we also include any classes from schedules where the staff is not the class teacher
        const classesById: Record<string, Class> = {};
        teacherClasses.forEach((cls) => {
          if (cls.id) {
            classesById[cls.id] = cls;
          }
        });

        for (const classId of classIds) {
          if (!classId || classesById[classId]) continue;
          try {
            const cls = await classService.getById(classId);
            if (cls?.id) {
              classesById[cls.id] = cls;
            }
          } catch (err) {
            console.error(`Failed to get class ${classId}:`, err);
          }
        }

        const assignedClasses = Object.values(classesById);

        setClasses(assignedClasses);
        setClassOptions([
          { id: "all", name: "All Classes" },
          ...assignedClasses.map((cls) => ({ id: cls.id, name: cls.name })),
        ]);

        // Get all students from assigned classes
        const allStudentsData: StudentWithDetails[] = [];
        for (const cls of assignedClasses) {
          try {
            const classStudents = await studentService.getByClass(cls.id);
            classStudents.forEach((student) => {
              const fullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
              allStudentsData.push({
                id: student.id,
                name: fullName,
                class: cls.name,
                email: student.email || "",
                phone: student.phone || "",
                attendance: 95, // TODO: Calculate from attendance records
                grade: "A", // TODO: Calculate from grade records
              });
            });
          } catch (err) {
            console.error(`Failed to get students for class ${cls.id}:`, err);
          }
        }

        setAllStudents(allStudentsData);
        setStudents(allStudentsData);
      } catch (error) {
        console.error("Failed to load students:", error);
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  useEffect(() => {
    let filtered = allStudents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((student) => {
        const studentClass = classes.find((c) => c.id === selectedClass);
        return studentClass && student.class === studentClass.name;
      });
    }

    setStudents(filtered);
  }, [searchTerm, selectedClass, allStudents, classes]);

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading students...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground mt-1">View students in your assigned classes</p>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students table */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Current Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                student.attendance >= 95 ? "bg-green-500" :
                                student.attendance >= 90 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-sm">{student.attendance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.grade.startsWith("A") ? "bg-green-100 text-green-700" :
                          student.grade.startsWith("B") ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {student.grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Student Details</DialogTitle>
                            </DialogHeader>
                            {selectedStudent && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                                    {selectedStudent.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                                    <p className="text-muted-foreground">{selectedStudent.id}</p>
                                  </div>
                                </div>
                                <div className="grid gap-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    <span>{selectedStudent.class}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-secondary" />
                                    <span>{selectedStudent.email || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-accent" />
                                    <span>{selectedStudent.phone || "N/A"}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">{selectedStudent.attendance}%</div>
                                    <div className="text-xs text-muted-foreground">Attendance</div>
                                  </div>
                                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-secondary">{selectedStudent.grade}</div>
                                    <div className="text-xs text-muted-foreground">Current Grade</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffStudents;
