import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  Users,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import { studentPromotionService } from "@/services/student-promotion.service";
import { staffService } from "@/services/staff.service";
import { referenceValueService } from "@/services/reference-value.service";
import type {
  Student,
  StudentWithPerformance,
  ClassForPromotion,
  BulkPromotionRequest,
} from "@/models/student.model";
import type { Class } from "@/models/class.model";
import type { Term } from "@/models/term.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  type ReferenceValue,
} from "@/models/referencevalue.model";

const AdminPromotion = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [promoting, setPomoting] = useState(false);

  // Form state
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [currentClass, setCurrentClass] = useState<string>("");
  const [targetGrade, setTargetGrade] = useState<string>("");
  const [targetClass, setTargetClass] = useState<string>("");
  const [fromAcademicYear, setFromAcademicYear] = useState<string>("");
  const [toAcademicYear, setToAcademicYear] = useState<string>("");
  const [targetTerm, setTargetTerm] = useState<string>("");
  const [promotionNotes, setPromotionNotes] = useState<string>("");

  // Data - Raw from API (like AdminStudents pattern)
  const [classOptions, setClassOptions] = useState<Class[]>([]);  // Raw classes from DB
  const [termOptions, setTermOptions] = useState<Term[]>([]);    // Raw terms from DB
  
  // Data - Filtered and displayed
  const [students, setStudents] = useState<StudentWithPerformance[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Filtered classes for dropdowns - using useMemo to ensure always recalculated
  const currentClasses = useMemo(() => {
    if (!currentGrade) {
      console.log("currentGrade is empty");
      return [];
    }
    console.log("Filtering classes - currentGrade:", currentGrade);
    console.log("Available classOptions:", classOptions);
    const filtered = classOptions.filter((c) => c.grade === currentGrade);
    console.log("Filtered currentClasses:", filtered);
    return filtered;
  }, [classOptions, currentGrade]);
  
  const targetClasses = useMemo(() => {
    if (!targetGrade) return [];
    console.log("Filtering target classes - targetGrade:", targetGrade);
    const filtered = classOptions.filter((c) => c.grade === targetGrade);
    console.log("Filtered targetClasses:", filtered);
    return filtered;
  }, [classOptions, targetGrade]);
  
  // Filtered terms for dropdown
  const filteredTerms = useMemo(
    () => termOptions.filter((t) => t.academicYear === toAcademicYear),
    [termOptions, toAcademicYear]
  );

  // Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const organizationId = staffService.getOrganizationId();
  const currentStaffId = staffService.getStaffId();

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        console.log("Loading promotion data...");

        // Load all data in parallel - calls /api/campusza/class/Select
        const organizationid = staffService.getOrganizationId();
        console.log("Using organizationId for API calls:", organizationid);
        
        const [classes, allTerms, refs] = await Promise.all([
          classService.getAll({ organizationid }),
          termService.getAll(),
          referenceValueService.getAll(),
        ]);

        // Store raw data (like AdminStudents does)
        console.log("Classes loaded from API:", classes);
        console.log("Terms loaded from API:", allTerms);
        console.log("Reference values loaded:", refs);
        
        setClassOptions(classes);   // ← Raw classes
        setTermOptions(allTerms);   // ← Raw terms
        setReferenceValues(refs);

        // Extract unique NUMERIC grades from classes only (filter out sections like 'a', 'b', 'c')
        const uniqueGrades = [...new Set(
          classes
            .map(c => c.grade)
            .filter(grade => grade && /^\d+$/.test(grade)) // Only keep numeric grades
        )].sort((a, b) => {
          const aNum = parseInt(a || '0');
          const bNum = parseInt(b || '0');
          return aNum - bNum;
        });
        
        console.log("Unique grades from classes:", uniqueGrades);
        console.log("All classes:", classes);
        
        // Set defaults: first grade for "From Grade", second for "To Grade" (or increment by 1)
        if (uniqueGrades.length > 0) {
          setCurrentGrade(uniqueGrades[0]);
          console.log("Setting currentGrade to:", uniqueGrades[0]);
          
          if (uniqueGrades.length > 1) {
            setTargetGrade(uniqueGrades[1]);
            console.log("Setting targetGrade to:", uniqueGrades[1]);
          } else {
            // If only one grade, increment it
            const nextGrade = (parseInt(uniqueGrades[0]) + 1).toString();
            setTargetGrade(nextGrade);
            console.log("Setting targetGrade to incremented:", nextGrade);
          }
        }

        // Set default academic years from reference values
        const years = refs.filter((v) => v.category === ReferenceValueCategory.ACADEMIC_YEAR).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (years.length > 0) {
          setFromAcademicYear(years[0].name || "");
          if (years.length > 1) {
            setToAcademicYear(years[years.length - 1].name || "");
          } else {
            setToAcademicYear(years[0].name || "");
          }
        }

        // Pre-populate target term (first term of new academic year)
        const targetYear = years.length > 1 ? years[years.length - 1].name : (years[0]?.name || "");
        const term1 = allTerms.find((t) => t.academicYear === targetYear && t.name?.includes("TERM1"));
        if (term1) {
          setTargetTerm(term1.id);
        }
      } catch (error) {
        console.error("Failed to load data", error);
        toast({
          title: "Error",
          description: "Failed to load classes and terms.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId, toast]);

  // Get dropdown options from classes (most reliable) or reference values as fallback
  const gradeOptions = useMemo(() => {
    // First, try to get grades from classOptions
    const classGrades = [...new Set(classOptions.map(c => c.grade))].sort((a, b) => {
      const aNum = parseInt(a || '0');
      const bNum = parseInt(b || '0');
      return aNum - bNum;
    });
    
    if (classGrades.length > 0) {
      return classGrades.map(grade => ({
        id: grade,
        name: `Grade ${grade}`,
        category: ReferenceValueCategory.GRADE
      }));
    }
    
    // Fallback to reference values
    return referenceValues
      .filter((v) => v.category === ReferenceValueCategory.GRADE)
      .sort((a, b) => {
        const aNum = parseInt(a.name?.replace(/\D/g, '') || '0');
        const bNum = parseInt(b.name?.replace(/\D/g, '') || '0');
        return aNum - bNum;
      });
  }, [classOptions, referenceValues]);

  const academicYearOptions = referenceValues
    .filter((v) => v.category === ReferenceValueCategory.ACADEMIC_YEAR)
    .sort((a, b) => (b.name || '').localeCompare(a.name || ''));

  // Filter students when current grade/class changes
  useEffect(() => {
    const filterStudents = async () => {
      if (!currentGrade || !currentClass) {
        setStudents([]);
        return;
      }

      try {
        const allStudents = await studentService.getAll({
          organizationid: organizationId,
        });

        const filtered = allStudents
          .filter((s) => s.grade === currentGrade && s.classId === currentClass)
          .map((s) => ({
            ...s,
            selected: false,
          }));

        setStudents(filtered);
        setSelectedStudents(new Set()); // Reset selection
      } catch (error) {
        console.error("Failed to filter students", error);
      }
    };

    filterStudents();
  }, [currentGrade, currentClass, organizationId]);

  // Handle student selection
  const handleSelectStudent = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    }
  };

  // Handle promotion
  const handlePromote = async () => {
    if (!currentGrade || !currentClass || !targetGrade || !targetClass || !targetTerm) {
      toast({
        title: "Validation Error",
        description: "Please select current grade, class, target grade, class, and term.",
        variant: "destructive",
      });
      return;
    }

    if (selectedStudents.size === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one student to promote.",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  // Confirm promotion
  const confirmPromotion = async () => {
    setConfirmDialogOpen(false);
    setPomoting(true);

    try {
      const targetClassData = targetClasses.find((c) => c.id === targetClass);
      if (!targetClassData) {
        throw new Error("Target class not found");
      }

      // Build promotion request
      const promotionRequest: BulkPromotionRequest = {
        organizationId,
        studentIds: Array.from(selectedStudents),
        fromGrade: currentGrade,
        toClassId: targetClass,
        toClassName: targetClassData.name,
        toSection: targetClassData.section,
        fromAcademicYear,
        toAcademicYear,
        newTermId: targetTerm,
        newTermName: "TERM1",
        promotedBy: currentStaffId,
        notes: promotionNotes,
      };

      // Debug log
      console.log("Promotion Request:", promotionRequest);
      console.log("Selected Students:", Array.from(selectedStudents));
      console.log("Target Class Data:", targetClassData);

      const result = await studentPromotionService.bulkPromoteStudents(promotionRequest);

      toast({
        title: "Success",
        description: `Successfully promoted ${result.length} students to ${targetGrade}.`,
      });

      // Reset form
      setSelectedStudents(new Set());
      setPromotionNotes("");
      setCurrentClass("");
    } catch (error) {
      console.error("Promotion failed", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote students.",
        variant: "destructive",
      });
    } finally {
      setPomoting(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Administrator">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Student Promotions
            </h1>
            <p className="text-muted-foreground mt-1">
              Promote students to the next grade/class for new academic year
            </p>
          </div>
        </div>

        {/* Promotion Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Promotion Configuration</CardTitle>
            <CardDescription>
              Select current and target grades, classes, and academic year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Grade */}
              <div className="space-y-2">
                <Label htmlFor="current-grade">From Grade</Label>
                <Select value={currentGrade} onValueChange={setCurrentGrade}>
                  <SelectTrigger id="current-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id || ''}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Class */}
              <div className="space-y-2">
                <Label htmlFor="current-class">
                  From Class {currentGrade && `(Grade ${currentGrade})`}
                </Label>
                <Select value={currentClass} onValueChange={setCurrentClass}>
                  <SelectTrigger id="current-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Grade */}
              <div className="space-y-2">
                <Label htmlFor="target-grade">To Grade</Label>
                <Select value={targetGrade} onValueChange={setTargetGrade}>
                  <SelectTrigger id="target-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id || ''}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Class */}
              <div className="space-y-2">
                <Label htmlFor="target-class">To Class</Label>
                <Select value={targetClass} onValueChange={setTargetClass}>
                  <SelectTrigger id="target-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year From */}
              <div className="space-y-2">
                <Label htmlFor="from-year">From Academic Year</Label>
                <Select value={fromAcademicYear} onValueChange={setFromAcademicYear}>
                  <SelectTrigger id="from-year">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year.id} value={year.name || ''}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year To */}
              <div className="space-y-2">
                <Label htmlFor="to-year">To Academic Year</Label>
                <Select value={toAcademicYear} onValueChange={setToAcademicYear}>
                  <SelectTrigger id="to-year">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year.id} value={year.name || ''}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Term */}
              <div className="space-y-2">
                <Label htmlFor="target-term">First Term of New Year</Label>
                <Select value={targetTerm} onValueChange={setTargetTerm}>
                  <SelectTrigger id="target-term">
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

            {/* Promotion Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Promotion Notes (Optional)</Label>
              <Input
                id="notes"
                value={promotionNotes}
                onChange={(e) => setPromotionNotes(e.target.value)}
                placeholder="Add any notes about this promotion batch..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Students ({students.length})</CardTitle>
                <CardDescription>
                  Select students to promote to {targetGrade}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                <Users className="inline w-4 h-4 mr-1" />
                {selectedStudents.size} selected
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a grade and class to view students
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            students.length > 0 && selectedStudents.size === students.length
                          }
                          onChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.fullName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.studentId}
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={selectedStudents.has(student.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectStudent(student.id)}
                          >
                            {selectedStudents.has(student.id) ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handlePromote}
            disabled={selectedStudents.size === 0 || loading || promoting}
            size="lg"
            className="gap-2"
          >
            {promoting && <Loader2 className="w-4 h-4 animate-spin" />}
            Promote {selectedStudents.size} Student{selectedStudents.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Promotion</DialogTitle>
            <DialogDescription>
              You are about to promote {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""} from Grade {currentGrade} to Grade {targetGrade}.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This action will update student records permanently. Please ensure you have backed up your data.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 text-sm">
            <p>
              <strong>From:</strong> Grade {currentGrade}
            </p>
            <p>
              <strong>To:</strong> Grade {targetGrade} • {targetClasses.find((c) => c.id === targetClass)?.name}
            </p>
            <p>
              <strong>Academic Year:</strong> {fromAcademicYear} → {toAcademicYear}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPromotion} disabled={promoting}>
              {promoting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPromotion;
