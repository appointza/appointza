import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  MapPin,
  BookOpen,
  UserCog,
  Mail,
  Phone,
  UserCheck,
  X
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import { staffService } from "@/services/staff.service";
import { referenceValueService } from "@/services/reference-value.service";
import type { Class } from "@/models/class.model";
import type { Term } from "@/models/term.model";
import type { Staff } from "@/models/staff.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueId,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

type ClassData = {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  students: number;
  room: string;
  schedule: string;
  mentorId?: string;
  mentorName?: string;
  assistantMentorId?: string;
  assistantMentorName?: string;
  grade?: string;
  section?: string;
  capacity?: number;
  academicYear?: string;
  termId?: string;
  status?: string;
};

type StaffOption = {
  id: string;
  name: string;
  department: string;
};

const colorVariants = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-purple to-purple/70",
];

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: number;
  status: string;
};

// Mock student data for each class
const getStudentsForClass = (classId: string): Student[] => {
  const allStudents: Record<string, Student[]> = {
    "CLS001": [
      { id: "STU001", name: "John Smith", email: "john.smith@school.com", phone: "+1 234 567 890", rollNumber: 1, status: "active" },
      { id: "STU002", name: "Emma Johnson", email: "emma.j@school.com", phone: "+1 234 567 891", rollNumber: 2, status: "active" },
      { id: "STU003", name: "Michael Brown", email: "m.brown@school.com", phone: "+1 234 567 892", rollNumber: 3, status: "active" },
      { id: "STU004", name: "Sarah Davis", email: "sarah.d@school.com", phone: "+1 234 567 893", rollNumber: 4, status: "active" },
      { id: "STU005", name: "James Wilson", email: "j.wilson@school.com", phone: "+1 234 567 894", rollNumber: 5, status: "active" },
    ],
    "CLS002": [
      { id: "STU006", name: "Emily Taylor", email: "emily.t@school.com", phone: "+1 234 567 895", rollNumber: 1, status: "active" },
      { id: "STU007", name: "David Anderson", email: "d.anderson@school.com", phone: "+1 234 567 896", rollNumber: 2, status: "active" },
      { id: "STU008", name: "Olivia Martinez", email: "o.martinez@school.com", phone: "+1 234 567 897", rollNumber: 3, status: "active" },
    ],
    "CLS003": [
      { id: "STU009", name: "William Garcia", email: "w.garcia@school.com", phone: "+1 234 567 898", rollNumber: 1, status: "active" },
      { id: "STU010", name: "Sophia Rodriguez", email: "s.rodriguez@school.com", phone: "+1 234 567 899", rollNumber: 2, status: "active" },
    ],
  };
  return allStudents[classId] || [];
};

const AdminClasses = () => {
  const { toast } = useToast();
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewStudentsDialogOpen, setIsViewStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [editFormData, setEditFormData] = useState<ClassData | null>(null);
  const [addFormData, setAddFormData] = useState<Partial<ClassData>>({
    grade: "",
    section: "",
    academicYear: "",
    termId: "",
    room: "",
    capacity: 30,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [classes, staff, refs, termData] = await Promise.all([
          classService.getAll(),
          staffService.getAll(),
          referenceValueService.getAll(),
          termService.getAll(),
        ]);

        setClassesData(classes.map(mapClassToUi));
        setStaffOptions(staff.map(mapStaffOption));
        setReferenceValues(refs);
        setTerms(termData);
      } catch (error) {
        toast({
          title: "Failed to load classes",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const mapStaffOption = (staff: Staff): StaffOption => ({
    id: staff.staffId || staff.id,
    name: staff.fullName || `${staff.firstName} ${staff.lastName}`.trim() || staff.email,
    department: staff.department,
  });

  const mapClassToUi = (cls: Class): ClassData => ({
    id: cls.id,
    name: cls.name,
    subject: "All Subjects",
    teacher: cls.classTeacherName || "Not Assigned",
    students: cls.currentEnrollment || 0,
    room: cls.room || "",
    schedule: "Mon-Fri, 8:00 AM - 3:00 PM",
    mentorId: cls.classTeacherId || undefined,
    mentorName: cls.classTeacherName || undefined,
    assistantMentorId: cls.assistantMentorId || undefined,
    assistantMentorName: cls.assistantMentorName || undefined,
    grade: cls.grade,
    section: cls.section,
    capacity: cls.capacity,
    academicYear: cls.academicYear,
    termId: cls.termId,
    status: cls.status,
  });

  const buildClassPayload = (data: ClassData): Partial<Class> => {
    const [gradePart, sectionPart] = (data.name || "").split("-");
    const grade = data.grade || gradePart?.trim() || "";
    const section = data.section || sectionPart?.trim() || "";

    const status = data.status === "inactive" || data.status === "archived" ? data.status : "active";

    return {
      id: data.id,
      name: data.name,
      grade,
      section,
      room: data.room || "",
    capacity: data.capacity ?? 0,
    currentEnrollment: data.students ?? 0,
      classTeacherId: data.mentorId || "",
      classTeacherName: data.mentorName || data.teacher || "",
      assistantMentorId: data.assistantMentorId || "",
      assistantMentorName: data.assistantMentorName || "",
    academicYear: getAcademicYearName(data.academicYear || ""),
    termId: data.termId || "",
    status,
    };
  };

  const gradeOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.GRADE),
    [referenceValues]
  );
  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );
  const sectionOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.CLASS_SECTION),
    [referenceValues]
  );
  const roomOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ROOM_NUMBER),
    [referenceValues]
  );
  const filteredTerms = useMemo(() => {
    if (!addFormData.academicYear) return terms;
    const yearName = resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, addFormData.academicYear);
    return terms.filter((term) => term.academicYear === yearName);
  }, [terms, addFormData.academicYear, referenceValues]);
  const filteredEditTerms = useMemo(() => {
    if (!editFormData?.academicYear) return terms;
    const yearName = resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, editFormData.academicYear);
    return terms.filter((term) => term.academicYear === yearName);
  }, [terms, editFormData?.academicYear, referenceValues]);

  const getGradeName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.GRADE, value);
  const getAcademicYearName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, value);
  const getSectionName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.CLASS_SECTION, value);
  const getRoomName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ROOM_NUMBER, value);

  const filteredClasses = classesData.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (cls: ClassData) => {
    setEditFormData({
      ...cls,
      grade: resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, cls.grade),
      section: resolveReferenceValueId(referenceValues, ReferenceValueCategory.CLASS_SECTION, cls.section),
      room: resolveReferenceValueId(referenceValues, ReferenceValueCategory.ROOM_NUMBER, cls.room),
      academicYear: resolveReferenceValueId(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, cls.academicYear),
    });
    setSelectedClass(cls);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editFormData && selectedClass) {
      if (!editFormData.grade || !editFormData.section || !editFormData.academicYear || !editFormData.termId) {
        toast({
          title: "Missing fields",
          description: "Grade, section, academic year, and term are required.",
          variant: "destructive",
        });
        return;
      }
      setLoading(true);
      try {
        const payload = buildClassPayload(editFormData);
        const updated = await classService.update(payload);
        const updatedUi = mapClassToUi(updated);
        setClassesData(prev => prev.map(cls =>
          cls.id === selectedClass.id ? updatedUi : cls
        ));
        setIsEditDialogOpen(false);
        setSelectedClass(null);
        setEditFormData(null);
        toast({
          title: "Class Updated",
          description: `${updatedUi.name}'s information has been updated successfully.`,
        });
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClass) {
      setLoading(true);
      try {
        await classService.delete(selectedClass.id);
        setClassesData(prev => prev.filter(cls => cls.id !== selectedClass.id));
        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
        toast({
          title: "Class Removed",
          description: `${selectedClass.name} has been removed from the system.`,
          variant: "destructive",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddClass = async () => {
    if (!addFormData.grade || !addFormData.section || !addFormData.academicYear || !addFormData.termId || !addFormData.room || !addFormData.capacity) {
      toast({
        title: "Missing fields",
        description: "Grade, section, academic year, term, room, and capacity are required.",
        variant: "destructive",
      });
      return;
    }

    const gradeName = getGradeName(String(addFormData.grade || ""));
    const sectionName = getSectionName(String(addFormData.section || ""));
    const name = `${gradeName || String(addFormData.grade || "")}-${sectionName || String(addFormData.section || "").toUpperCase()}`;
    const payload: ClassData = {
      id: "",
      name,
      subject: "All Subjects",
      teacher: addFormData.mentorName || "Not Assigned",
      students: 0,
      room: addFormData.room || "",
      schedule: "Mon-Fri, 8:00 AM - 3:00 PM",
      mentorId: addFormData.mentorId,
      mentorName: addFormData.mentorName,
      grade: addFormData.grade || "",
      section: addFormData.section || "",
      capacity: Number(addFormData.capacity),
      academicYear: addFormData.academicYear || "",
      termId: addFormData.termId || "",
      status: "active",
    };

    setLoading(true);
    try {
      const created = await classService.create(buildClassPayload(payload));
      const createdUi = mapClassToUi(created);
      setClassesData(prev => [createdUi, ...prev]);
      setIsAddDialogOpen(false);
      setAddFormData({ grade: "", section: "", academicYear: "", termId: "", room: "", capacity: 30 });
      toast({
        title: "Class Added",
        description: `${createdUi.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Create failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsViewStudentsDialogOpen(true);
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground mt-1">Manage all classes and sections</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Enter the class details below to create a new class.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select
                      value={addFormData.academicYear ? String(addFormData.academicYear) : ""}
                      onValueChange={(value) =>
                        setAddFormData({ ...addFormData, academicYear: value, termId: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
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
                    <Label htmlFor="term">Term</Label>
                    <Select
                      value={addFormData.termId ? String(addFormData.termId) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, termId: value })}
                      disabled={!addFormData.academicYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTerms.length === 0 ? (
                          <SelectItem value="no-terms" disabled>
                            No terms available
                          </SelectItem>
                        ) : (
                          filteredTerms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={addFormData.grade ? String(addFormData.grade) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, grade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeOptions.length === 0 ? (
                          <SelectItem value="no-grades" disabled>
                            No grades available
                          </SelectItem>
                        ) : (
                          gradeOptions.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={addFormData.section ? String(addFormData.section) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.length === 0 ? (
                          <SelectItem value="no-sections" disabled>
                            No sections available
                          </SelectItem>
                        ) : (
                          sectionOptions.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room Number</Label>
                  <Select
                    value={addFormData.room || ""}
                    onValueChange={(value) => setAddFormData({ ...addFormData, room: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomOptions.length === 0 ? (
                        <SelectItem value="no-rooms" disabled>
                          No rooms available
                        </SelectItem>
                      ) : (
                        roomOptions.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Student Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="35"
                    value={addFormData.capacity ?? 30}
                    onChange={(e) => setAddFormData({ ...addFormData, capacity: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor">Class Mentor</Label>
                  <Select
                    value={addFormData.mentorId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setAddFormData({ ...addFormData, mentorId: undefined, mentorName: undefined });
                      } else {
                        const selected = staffOptions.find((staff) => staff.id === value);
                        setAddFormData({ ...addFormData, mentorId: value, mentorName: selected?.name });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the class mentor/class teacher
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistant-mentor">Assistant Mentor</Label>
                  <Select
                    value={addFormData.assistantMentorId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setAddFormData({ ...addFormData, assistantMentorId: undefined, assistantMentorName: undefined });
                      } else {
                        const selected = staffOptions.find((staff) => staff.id === value);
                        setAddFormData({ ...addFormData, assistantMentorId: value, assistantMentorName: selected?.name });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Assistant Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the assistant class mentor
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleAddClass} disabled={loading}>
                  {loading ? "Adding..." : "Add Class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((cls, index) => (
            <Card key={cls.id} className="shadow-lg border-border/50 overflow-hidden hover:shadow-xl transition-shadow">
              <div className={`h-3 bg-gradient-to-r ${colorVariants[index % colorVariants.length]}`} />
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground">{cls.id}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(cls)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(cls)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(cls)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{cls.students} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="text-muted-foreground">{getRoomName(cls.room) || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-purple" />
                    <span className="text-muted-foreground">
                      Mentor: {cls.mentorName || "Not Assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-purple/70" />
                    <span className="text-muted-foreground">
                      Asst: {cls.assistantMentorName || "Not Assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-muted-foreground">Mon-Fri, 8AM - 3PM</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleViewStudents(cls)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Class Details</DialogTitle>
              <DialogDescription>
                View detailed information about the class.
              </DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {selectedClass.name.split("-")[1]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedClass.name}</h3>
                    <p className="text-muted-foreground">Class ID: {selectedClass.id}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-medium">{selectedClass.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserCog className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teacher</p>
                      <p className="font-medium">{selectedClass.teacher}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="font-medium">{selectedClass.students} Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-medium">{getRoomName(selectedClass.room) || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Schedule</p>
                      <p className="font-medium">{selectedClass.schedule}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Class Mentor</p>
                      <p className="font-medium">{selectedClass.mentorName || "Not Assigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-muted-foreground opacity-70" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assistant Mentor</p>
                      <p className="font-medium">{selectedClass.assistantMentorName || "Not Assigned"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>
                Update the class information below.
              </DialogDescription>
            </DialogHeader>
            {editFormData && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Class Name</Label>
                    <Input 
                      id="edit-name" 
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-id">Class ID</Label>
                    <Input 
                      id="edit-id" 
                      value={editFormData.id}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-academicYear">Academic Year</Label>
                    <Select
                      value={editFormData.academicYear || ""}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, academicYear: value, termId: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="edit-term">Term</Label>
                    <Select
                      value={editFormData.termId || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, termId: value })}
                      disabled={!editFormData.academicYear}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEditTerms.length === 0 ? (
                          <SelectItem value="no-terms" disabled>
                            No terms available
                          </SelectItem>
                        ) : (
                          filteredEditTerms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input 
                    id="edit-subject" 
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-teacher">Teacher</Label>
                  <Input 
                    id="edit-teacher" 
                    value={editFormData.teacher}
                    onChange={(e) => setEditFormData({ ...editFormData, teacher: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-room">Room</Label>
                    <Select
                      value={editFormData.room || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, room: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomOptions.length === 0 ? (
                          <SelectItem value="no-rooms" disabled>
                            No rooms available
                          </SelectItem>
                        ) : (
                          roomOptions.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-students">Number of Students</Label>
                    <Input 
                      id="edit-students" 
                      type="number"
                      value={editFormData.students}
                      onChange={(e) => setEditFormData({ ...editFormData, students: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Input 
                    id="edit-schedule" 
                    value={editFormData.schedule}
                    onChange={(e) => setEditFormData({ ...editFormData, schedule: e.target.value })}
                    placeholder="Mon-Fri, 8:00 AM - 3:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mentor">Class Mentor</Label>
                  <Select 
                    value={editFormData.mentorId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setEditFormData({ 
                          ...editFormData, 
                          mentorId: undefined,
                          mentorName: undefined
                        });
                      } else {
                        const selectedStaff = staffOptions.find(s => s.id === value);
                        setEditFormData({ 
                          ...editFormData, 
                          mentorId: value,
                          mentorName: selectedStaff?.name
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the class mentor/class teacher
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assistant-mentor">Assistant Mentor</Label>
                  <Select 
                    value={editFormData.assistantMentorId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setEditFormData({ 
                          ...editFormData, 
                          assistantMentorId: undefined,
                          assistantMentorName: undefined
                        });
                      } else {
                        const selectedStaff = staffOptions.find(s => s.id === value);
                        setEditFormData({ 
                          ...editFormData, 
                          assistantMentorId: value,
                          assistantMentorName: selectedStaff?.name
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Assistant Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the assistant class mentor
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Students Full Screen - Only Right Side */}
        {isViewStudentsDialogOpen && selectedClass && (
          <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background lg:left-64">
            <div className="flex flex-col h-full">
              {/* Header */}
              <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
                <div className="flex items-center justify-between min-h-16 px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsViewStudentsDialogOpen(false)}
                      className="shrink-0"
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">
                        Students in {selectedClass.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        View all students enrolled in this class
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{getStudentsForClass(selectedClass.id).length}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsViewStudentsDialogOpen(false)}
                      className="shrink-0"
                    >
                      <span className="hidden sm:inline">Close</span>
                      <X className="w-4 h-4 sm:hidden" />
                    </Button>
                  </div>
                </div>
              </header>

              {/* Content */}
              <main className="flex-1 overflow-y-auto p-6">
                <div className="w-full space-y-6">
                  {/* Class Info Card */}
                  <Card className="shadow-lg border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {selectedClass.name.split("-")[1]}
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Class Name</p>
                            <p className="font-semibold">{selectedClass.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Class ID</p>
                            <p className="font-semibold">{selectedClass.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Room</p>
                            <p className="font-semibold">{getRoomName(selectedClass.room) || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Teacher</p>
                            <p className="font-semibold">{selectedClass.teacher}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Mentor</p>
                            <p className="font-semibold">{selectedClass.mentorName || "Not Assigned"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Assistant Mentor</p>
                            <p className="font-semibold">{selectedClass.assistantMentorName || "Not Assigned"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Students Table */}
                  {getStudentsForClass(selectedClass.id).length > 0 ? (
                    <Card className="shadow-lg border-border/50">
                      <CardHeader>
                        <CardTitle className="font-display">
                          Students List ({getStudentsForClass(selectedClass.id).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Roll #</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getStudentsForClass(selectedClass.id).map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{student.rollNumber}</TableCell>
                                  <TableCell className="font-medium">{student.id}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                        {student.name.charAt(0)}
                                      </div>
                                      <span className="font-medium">{student.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <span>{student.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-muted-foreground" />
                                      <span>{student.phone}</span>
                                    </div>
                                  </TableCell>
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
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-lg border-border/50">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
                          <p className="text-muted-foreground">
                            No students are currently enrolled in this class.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </main>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-semibold">{selectedClass?.name}</span> from the class list.
                All associated data will be removed.
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

export default AdminClasses;
