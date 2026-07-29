import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import type { Student } from "@/models/student.model";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueId, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";
import type { Class } from "@/models/class.model";

const AdminStudentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Student ID is missing.",
          variant: "destructive",
        });
        navigate("/admin/students");
        return;
      }

      setLoading(true);
      try {
        const [studentData, classesData, refValues] = await Promise.all([
          studentService.getById(id),
          classService.getAll(),
          referenceValueService.getAll(),
        ]);

        setStudent(studentData);
        setClasses(classesData);
        setReferenceValues(refValues);

        // Initialize form data
        setFormData({
          ...studentData,
          address: {
            street: studentData.address?.street || "",
            city: studentData.address?.city || "",
            state: studentData.address?.state || "",
            zipCode: studentData.address?.zipCode || "",
            country: studentData.address?.country || "",
          },
          parentGuardian: {
            name: studentData.parentGuardian?.name || "",
            relationship: studentData.parentGuardian?.relationship || "guardian",
            email: studentData.parentGuardian?.email || "",
            phone: studentData.parentGuardian?.phone || "",
            occupation: studentData.parentGuardian?.occupation || "",
          },
          emergencyContact: {
            name: studentData.emergencyContact?.name || "",
            relationship: studentData.emergencyContact?.relationship || "",
            phone: studentData.emergencyContact?.phone || "",
          },
        });
      } catch (err) {
        console.error("Failed to load data:", err);
        toast({
          title: "Error",
          description: "Failed to load student data. Please try again.",
          variant: "destructive",
        });
        navigate("/admin/students");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const academicYearOptions = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR);
  const statusOptions = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.STUDENT_STATUS);

  const handleSave = async () => {
    if (!formData || !id) return;

    setSaving(true);
    try {
      const selectedClass = classes.find((c) => c.id === formData.classId);
      const academicYearName = formData.currentAcademicYear || "";

      const payload: Partial<Student> = {
        ...formData,
        id,
        fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        className: selectedClass?.name || "",
        grade: selectedClass?.grade || "",
        section: selectedClass?.section || "",
      };

      await studentService.update(payload);
      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });
      navigate(`/admin/students/${id}`);
    } catch (error) {
      console.error("Failed to update student:", error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="space-y-6">
          <p>Loading student data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student || !formData) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="space-y-6">
          <Button variant="outline" onClick={() => navigate("/admin/students")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Student not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(`/admin/students/${id}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Student
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Edit Student</h1>
              <p className="text-muted-foreground mt-1">Update student information</p>
            </div>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic student information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  value={formData.studentId || ""}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender || "male"}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Student["gender"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={formData.bloodGroup || ""}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Medical Conditions</Label>
              <Textarea
                id="medicalConditions"
                value={formData.medicalConditions || ""}
                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Student's residential address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressStreet">Street</Label>
              <Input
                id="addressStreet"
                value={formData.address?.street || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressCity">City</Label>
                <Input
                  id="addressCity"
                  value={formData.address?.city || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressState">State</Label>
                <Input
                  id="addressState"
                  value={formData.address?.state || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressZipCode">Zip Code</Label>
                <Input
                  id="addressZipCode"
                  value={formData.address?.zipCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressCountry">Country</Label>
                <Input
                  id="addressCountry"
                  value={formData.address?.country || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Information</CardTitle>
            <CardDescription>Primary guardian details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Name *</Label>
              <Input
                id="guardianName"
                value={formData.parentGuardian?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentGuardian: { ...formData.parentGuardian, name: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianRelationship">Relationship *</Label>
                <Select
                  value={formData.parentGuardian?.relationship || "guardian"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parentGuardian: { ...formData.parentGuardian, relationship: value as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianOccupation">Occupation</Label>
                <Input
                  id="guardianOccupation"
                  value={formData.parentGuardian?.occupation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentGuardian: { ...formData.parentGuardian, occupation: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Email</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.parentGuardian?.email || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentGuardian: { ...formData.parentGuardian, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Phone *</Label>
                <Input
                  id="guardianPhone"
                  value={formData.parentGuardian?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentGuardian: { ...formData.parentGuardian, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Emergency contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Name</Label>
              <Input
                id="emergencyName"
                value={formData.emergencyContact?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyContact?.relationship || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Class and enrollment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classId">Class *</Label>
                <Select
                  value={formData.classId || ""}
                  onValueChange={(value) => {
                    const selected = classes.find((c) => c.id === value);
                    setFormData({
                      ...formData,
                      classId: value,
                      className: selected?.name,
                      grade: selected?.grade,
                      section: selected?.section,
                      academicYear: selected?.academicYear,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="no-classes" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.academicYear})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  type="number"
                  min="1"
                  value={formData.rollNumber || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, rollNumber: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select
                  value={formData.currentAcademicYear || ""}
                  onValueChange={(value) => setFormData({ ...formData, currentAcademicYear: value })}
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
                        <SelectItem key={year.id} value={year.name}>
                          {year.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={resolveReferenceValueName(referenceValues, ReferenceValueCategory.STUDENT_STATUS, formData.status) || ""}
                  onValueChange={(value) => {
                    const statusId = resolveReferenceValueId(referenceValues, ReferenceValueCategory.STUDENT_STATUS, value);
                    setFormData({ ...formData, status: statusId || value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.length === 0 ? (
                      <SelectItem value="no-status" disabled>
                        No status options available
                      </SelectItem>
                    ) : (
                      statusOptions.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          {status.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate || ""}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudentEdit;
