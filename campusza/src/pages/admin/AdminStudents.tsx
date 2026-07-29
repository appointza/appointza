import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  GraduationCap, 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  Mail,
  Phone,
  User,
  BookOpen,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { referenceValueService } from "@/services/reference-value.service";
import type { Student } from "@/models/student.model";
import type { Class } from "@/models/class.model";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueId, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extended Student type for the table (simplified)
type StudentTable = {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  email: string;
  phone: string;
  status: string;
};

const mapStudentToRow = (student: Student): StudentTable => {
  const fullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
  const gradeLabel = student.className || [student.grade, student.section].filter(Boolean).join("-") || student.grade;
  return {
    id: student.id,
    studentId: student.studentId || student.id,
    name: fullName || student.email || "Student",
    grade: gradeLabel || "",
    email: student.email || "",
    phone: student.phone || "",
    status: student.status || "active",
  };
};

const AdminStudents = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState<StudentTable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [classOptions, setClassOptions] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTable | null>(null);
  const [editFormData, setEditFormData] = useState<StudentTable | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const [students, classes, refs] = await Promise.all([
          studentService.getAll(),
          classService.getAll(),
          referenceValueService.getAll(),
        ]);
        setStudentsData(students.map(mapStudentToRow));
        setClassOptions(classes);
        setReferenceValues(refs);
      } catch (error) {
        toast({
          title: "Failed to load students",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [toast]);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );
  const studentStatusOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.STUDENT_STATUS),
    [referenceValues]
  );

  const [addFormData, setAddFormData] = useState<Partial<Student>>({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
    parentGuardian: {
      name: "",
      relationship: "guardian",
      phone: "",
    },
    classId: "",
    rollNumber: 1,
    currentAcademicYear: "",
    status: "active",
  });

  const resetAddForm = () => {
    setAddFormData({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "male",
      dateOfBirth: "",
      parentGuardian: {
        name: "",
        relationship: "guardian",
        phone: "",
      },
      classId: "",
      rollNumber: 1,
      currentAcademicYear: "",
      status: "active",
    });
  };

  const handleAddStudent = async () => {
    if (!addFormData.firstName || !addFormData.lastName || !addFormData.phone || !addFormData.classId || !addFormData.currentAcademicYear) {
      toast({
        title: "Missing fields",
        description: "First name, last name, phone, class, and academic year are required.",
        variant: "destructive",
      });
      return;
    }

    const selectedClass = classOptions.find((cls) => cls.id === addFormData.classId);
    const academicYearName = resolveReferenceValueName(
      referenceValues,
      ReferenceValueCategory.ACADEMIC_YEAR,
      addFormData.currentAcademicYear
    );
    const statusId = resolveReferenceValueId(
      referenceValues,
      ReferenceValueCategory.STUDENT_STATUS,
      addFormData.status
    );

    const payload: Partial<Student> = {
      ...addFormData,
      fullName: `${addFormData.firstName} ${addFormData.lastName}`.trim(),
      className: selectedClass?.name || "",
      grade: selectedClass?.grade || "",
      section: selectedClass?.section || "",
      admissionDate: new Date().toISOString().split("T")[0],
      currentAcademicYear: academicYearName,
      currentSemesterType: "term_based",
      status: statusId || "active",
    };

    setLoading(true);
    try {
      const created = await studentService.create(payload);
      setStudentsData((prev) => [mapStudentToRow(created), ...prev]);
      setIsAddDialogOpen(false);
      resetAddForm();
      toast({
        title: "Student Added",
        description: `${created.fullName || created.firstName} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add student",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentsData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (student: StudentTable) => {
    navigate(`/admin/students/${student.id}`);
  };

  const handleRowClick = (student: StudentTable) => {
    handleViewProfile(student);
  };

  const handleEdit = (student: StudentTable) => {
    setEditFormData({ ...student });
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editFormData && selectedStudent) {
      setStudentsData(prev => prev.map(student => 
        student.id === selectedStudent.id ? editFormData : student
      ));
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      setEditFormData(null);
      toast({
        title: "Student Updated",
        description: `${editFormData.name}'s information has been updated successfully.`,
      });
    }
  };

  const handleDelete = (student: StudentTable) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      setStudentsData(prev => prev.filter(student => student.id !== selectedStudent.id));
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Student Removed",
        description: `${selectedStudent.name} has been removed from the system.`,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1">Manage all student records and enrollments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student details below to add a new student to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={addFormData.firstName || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={addFormData.lastName || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="ADM-001"
                      value={addFormData.studentId || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, studentId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={addFormData.gender || "male"}
                      onValueChange={(value) => setAddFormData({ ...addFormData, gender: value as Student["gender"] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.smith@school.com"
                    value={addFormData.email || ""}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      value={addFormData.phone || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={addFormData.dateOfBirth || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Select
                    value={addFormData.classId || ""}
                    onValueChange={(value) => setAddFormData({ ...addFormData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classOptions.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select
                      value={addFormData.currentAcademicYear || ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, currentAcademicYear: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYearOptions.length === 0 ? (
                          <SelectItem value="no-years" disabled>
                            No academic years available
                          </SelectItem>
                        ) : (
                          academicYearOptions.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      type="number"
                      min="1"
                      value={addFormData.rollNumber || 1}
                      onChange={(e) => setAddFormData({ ...addFormData, rollNumber: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Parent/Guardian Name</Label>
                    <Input
                      id="guardianName"
                      placeholder="Parent name"
                      value={addFormData.parentGuardian?.name || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          parentGuardian: {
                            ...addFormData.parentGuardian,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Parent/Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+1 234 567 890"
                      value={addFormData.parentGuardian?.phone || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          parentGuardian: {
                            ...addFormData.parentGuardian,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetAddForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleAddStudent} disabled={loading}>
                  {loading ? "Saving..." : "Add Student"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and filters */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, ID, or grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students table */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">All Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(student)}
                    >
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </div>
                    </TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {student.status}
                      </span>
                    </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(student)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>


        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update the student's information below.
              </DialogDescription>
            </DialogHeader>
            {editFormData && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input 
                      id="edit-name" 
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-id">Student ID</Label>
                    <Input 
                      id="edit-id" 
                      value={editFormData.id}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-grade">Grade</Label>
                    <Select 
                      value={editFormData.grade.toLowerCase().replace(/\s+/g, '-')}
                      onValueChange={(value) => {
                        const gradeMap: Record<string, string> = {
                          'grade-9-a': 'Grade 9-A',
                          'grade-9-b': 'Grade 9-B',
                          'grade-10-a': 'Grade 10-A',
                          'grade-10-b': 'Grade 10-B',
                          'grade-11-a': 'Grade 11-A',
                          'grade-11-b': 'Grade 11-B',
                          'grade-12-a': 'Grade 12-A',
                          'grade-12-b': 'Grade 12-B',
                        };
                        setEditFormData({ ...editFormData, grade: gradeMap[value] || value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grade-9-a">Grade 9-A</SelectItem>
                        <SelectItem value="grade-9-b">Grade 9-B</SelectItem>
                        <SelectItem value="grade-10-a">Grade 10-A</SelectItem>
                        <SelectItem value="grade-10-b">Grade 10-B</SelectItem>
                        <SelectItem value="grade-11-a">Grade 11-A</SelectItem>
                        <SelectItem value="grade-11-b">Grade 11-B</SelectItem>
                        <SelectItem value="grade-12-a">Grade 12-A</SelectItem>
                        <SelectItem value="grade-12-b">Grade 12-B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-semibold">{selectedStudent?.name}</span> from the student list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
