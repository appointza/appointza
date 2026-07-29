import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  CreditCard,
  Clock,
  AlertCircle,
  Edit,
} from "lucide-react";
import type { Student } from "@/models/student.model";
import { getStudentStatusColor, getStudentStatusLabel } from "@/models/student.model";
import { studentService } from "@/services/student.service";
import { studentPromotionService } from "@/services/student-promotion.service";
import { staffService } from "@/services/staff.service";
import type { StudentAcademicHistory, StudentPromotion } from "@/models/student-promotion.model";

const AdminStudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<StudentPromotion[]>([]);
  const [academicHistory, setAcademicHistory] = useState<StudentAcademicHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadStudent = async () => {
      setLoading(true);
      try {
        const data = await studentService.getById(id);
        setStudent(data);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const orgId = staffService.getOrganizationId();
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const [promos, history] = await Promise.all([
          studentPromotionService.selectPromotions({ studentId: id, organizationId: orgId }),
          studentPromotionService.getAcademicHistory(id, orgId),
        ]);
        setPromotions(promos);
        setAcademicHistory(history);
      } catch (e) {
        console.error("Failed to load promotion history", e);
        setPromotions([]);
        setAcademicHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [id]);

  const timelineEvents = useMemo(() => {
    if (!student) return [];
    type Ev = {
      id: string;
      at: number;
      title: string;
      body: string;
      sub?: string;
      badge: string;
      badgeClass: string;
      borderClass: string;
    };
    const rows: Ev[] = [];
    const tCreated = Date.parse(student.createdAt);
    rows.push({
      id: "evt-created",
      at: Number.isFinite(tCreated) ? tCreated : 0,
      title: "Student record created",
      body: "Student profile added in the system",
      sub: student.createdBy ? `Created by: ${student.createdBy}` : undefined,
      badge: "Creation",
      badgeClass: "bg-slate-100 text-slate-800",
      borderClass: "border-primary",
    });
    const tAdm = Date.parse(student.admissionDate);
    rows.push({
      id: "evt-admission",
      at: Number.isFinite(tAdm) ? tAdm : 0,
      title: "Admission",
        body: `Admitted to ${student.className}${student.grade ? ` (Grade ${student.grade})` : ""}`,
      sub: `Academic year: ${student.currentAcademicYear}`,
      badge: "Admission",
      badgeClass: "bg-green-100 text-green-800",
      borderClass: "border-green-500",
    });
    promotions.forEach((p) => {
      let at = p.promotionDate ? Date.parse(p.promotionDate) : NaN;
      if (!Number.isFinite(at) && p.createdAt) at = Date.parse(p.createdAt);
      rows.push({
        id: `evt-promo-${p.id}`,
        at: Number.isFinite(at) ? at : 0,
        title: `Promotion — ${p.promotionType}`,
        body: `Before: Grade ${p.fromGrade} · ${p.fromClassName || "—"} → After: Grade ${p.toGrade} · ${p.toClassName || "—"}`,
        sub: [
          `Years: ${p.academicYearFrom} → ${p.academicYearTo}`,
          p.promotedBy ? `By: ${p.promotedBy}` : "",
          p.notes ? `Notes: ${p.notes}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        badge: "Promotion",
        badgeClass: "bg-amber-100 text-amber-900",
        borderClass: "border-amber-500",
      });
    });
    academicHistory.forEach((h) => {
      let at = h.promotionDate ? Date.parse(h.promotionDate) : NaN;
      if (!Number.isFinite(at)) at = h.createdAt ? Date.parse(h.createdAt) : NaN;
      rows.push({
        id: `evt-snap-${h.id}`,
        at: Number.isFinite(at) ? at : 0,
        title: "Archived class snapshot (before promotion)",
        body: `${h.academicYear}: Grade ${h.grade} · ${h.className || "—"}${h.section ? ` · Section ${h.section}` : ""}${h.rollNumber != null ? ` · Roll ${h.rollNumber}` : ""}`,
        sub: [
          `Status: ${h.promotionStatus}`,
          h.promotionDate ? `Recorded: ${new Date(h.promotionDate).toLocaleString()}` : "",
          h.createdAt ? `Snapshot saved: ${new Date(h.createdAt).toLocaleString()}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        badge: "Snapshot",
        badgeClass: "bg-blue-100 text-blue-900",
        borderClass: "border-blue-500",
      });
    });
    return rows.sort((a, b) => b.at - a.at);
  }, [student, promotions, academicHistory]);

  const certificates: any[] = [];
  const fees: any[] = [];
  const auditLogsForStudent: any[] = [];
  const termRecords: any[] = [];

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="space-y-6">
          <Button variant="outline" onClick={() => navigate("/admin/students")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading student...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
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
            <Button variant="outline" onClick={() => navigate("/admin/students")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Student Profile & History</h1>
              <p className="text-muted-foreground mt-1">Complete information and history for {student.fullName}</p>
            </div>
          </div>
          <Button variant="hero" onClick={() => navigate(`/admin/students/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Student
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="history">Timeline</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-4xl font-bold">
                    {student.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold">{student.fullName}</h3>
                    <p className="text-muted-foreground">{student.className}</p>
                    <Badge className={getStudentStatusColor(student.status)}>
                      {getStudentStatusLabel(student.status)}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{student.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{student.bloodGroup || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  <p className="font-medium">
                    {student.address?.street || "-"}, {student.address?.city || "-"}, {student.address?.state || "-"} {student.address?.zipCode || "-"}, {student.address?.country || "-"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Medical Conditions</p>
                  <p className="font-medium">{student.medicalConditions || "None"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Parent/Guardian Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{student.parentGuardian.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Relationship</p>
                    <p className="font-medium capitalize">{student.parentGuardian.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{student.parentGuardian.occupation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.parentGuardian.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.parentGuardian.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{student.emergencyContact?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Relationship</p>
                    <p className="font-medium">{student.emergencyContact?.relationship || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.emergencyContact?.phone || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Information Tab */}
          <TabsContent value="academic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium text-lg">{student.className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="font-medium text-lg">{student.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admission Date</p>
                    <p className="font-medium">{new Date(student.admissionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Academic Year</p>
                    <p className="font-medium">{student.currentAcademicYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Semester</p>
                    <p className="font-medium capitalize">{student.currentSemesterType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Term</p>
                    <p className="font-medium">{student.currentTermName || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents History Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents History
                </CardTitle>
                <CardDescription>All documents issued or collected for this student</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No documents found for this student.
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell>{cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell className="capitalize">{cert.type.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cert.status === "issued" ? "Issued" : "Collected"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              cert.status === "issued" ? "bg-green-100 text-green-700" :
                              cert.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              cert.status === "not_required" ? "bg-gray-100 text-gray-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{cert.issuedBy || "N/A"}</TableCell>
                          <TableCell>{cert.termName || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promotion History Tab */}
          <TabsContent value="promotions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Promotion History
                </CardTitle>
                <CardDescription>Complete history of student promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">Initial admission</p>
                        <p className="text-sm text-muted-foreground">
                          {student.currentAcademicYear} — {student.currentSemesterType.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Admitted to {student.className}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-muted-foreground">
                          {new Date(student.admissionDate).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          Admission
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {promotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      No promotion events in the system yet for this student.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>Before</TableHead>
                          <TableHead>After</TableHead>
                          <TableHead>Years</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promotions.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {p.promotionDate
                                ? new Date(p.promotionDate).toLocaleString()
                                : p.createdAt
                                  ? new Date(p.createdAt).toLocaleString()
                                  : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="font-medium">G{p.fromGrade}</span>
                              {p.fromClassName ? ` · ${p.fromClassName}` : ""}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="font-medium">G{p.toGrade}</span>
                              {p.toClassName ? ` · ${p.toClassName}` : ""}
                            </TableCell>
                            <TableCell className="text-sm">
                              {p.academicYearFrom} → {p.academicYearTo}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {p.promotionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate" title={p.promotedBy}>
                              {p.promotedBy || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee History Tab */}
          <TabsContent value="fees" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Fee Payment History
                </CardTitle>
                <CardDescription>All fee payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No fee records found for this student.
                        </TableCell>
                      </TableRow>
                    ) : (
                      fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.termName || "N/A"}</TableCell>
                          <TableCell>${fee.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>${fee.paidAmount.toLocaleString()}</TableCell>
                          <TableCell>${(fee.totalAmount - fee.paidAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              fee.status === "paid" ? "bg-green-100 text-green-700" :
                              fee.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                              fee.status === "unpaid" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }>
                              {fee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "N/A"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline/History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Complete History Timeline
                </CardTitle>
                <CardDescription>Chronological history of all student activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading timeline…</p>
                  ) : (
                    <>
                      {timelineEvents.map((ev) => (
                        <div key={ev.id} className={`border-l-4 ${ev.borderClass} pl-4 pb-4`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold">{ev.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{ev.body}</p>
                              {ev.sub ? (
                                <p className="text-xs text-muted-foreground mt-1 break-words">{ev.sub}</p>
                              ) : null}
                            </div>
                            <div className="text-right shrink-0">
                              <p title="Event time (local)" className="text-sm text-muted-foreground whitespace-nowrap">
                                {ev.at > 0 ? new Date(ev.at).toLocaleString() : "—"}
                              </p>
                              <Badge className={`mt-1 ${ev.badgeClass}`}>{ev.badge}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                      {auditLogsForStudent.length === 0 ? null : (
                        auditLogsForStudent.map((log) => {
                          const getBorderColor = () => {
                            if (log.action.includes("Payment")) return "border-purple-500";
                            if (log.action.includes("Certificate")) return "border-blue-500";
                            if (log.action.includes("Term")) return "border-green-500";
                            return "border-gray-500";
                          };
                          const getBadgeColor = () => {
                            if (log.action.includes("Payment")) return "bg-purple-100 text-purple-700";
                            if (log.action.includes("Certificate")) return "bg-blue-100 text-blue-700";
                            if (log.action.includes("Term")) return "bg-green-100 text-green-700";
                            return "bg-gray-100 text-gray-700";
                          };
                          return (
                            <div key={log.id} className={`border-l-4 ${getBorderColor()} pl-4 pb-4`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold">{log.action}</p>
                                  <p className="text-sm text-muted-foreground">{log.details}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Performed by: {log.performedBy} ({log.performedByRole})
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">{log.timestamp}</p>
                                  <Badge className={`${getBadgeColor()} mt-1`}>{log.entity}</Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {certificates.filter((c) => c.issuedDate).map((cert) => (
                        <div key={cert.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold capitalize">
                                {cert.type.replace("_", " ")} {cert.status === "issued" ? "Issued" : "Updated"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {cert.type.replace("_", " ")} certificate for {cert.termName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : "N/A"}
                              </p>
                              <Badge className="bg-blue-100 text-blue-700 mt-1">Document</Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                      {fees.flatMap((fee) => fee.payments || []).map((payment) => (
                        <div key={payment.id} className="border-l-4 border-purple-500 pl-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">Fee payment recorded</p>
                              <p className="text-sm text-muted-foreground">
                                Payment of ${payment.amount.toLocaleString()} via {payment.paymentMode} — Receipt:{" "}
                                {payment.receiptNo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</p>
                              <Badge className="bg-purple-100 text-purple-700 mt-1">Payment</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudentDetail;

