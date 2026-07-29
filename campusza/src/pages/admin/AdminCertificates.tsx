import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Award,
  CheckCircle,
  Clock,
  XCircle
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentTermRecords, termsData, getDashboardSummary } from "@/data/mock-student-management";
import { getCertificateStatusColor, getCertificateTypeLabel } from "@/types/student-management";
import type { Certificate, CertificateType, CertificateStatus } from "@/types/student-management";
import { StatCard } from "@/components/dashboard/StatCard";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory, getReferenceValuesByCategory, type ReferenceValue } from "@/models/referencevalue.model";

const AdminCertificates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<{ cert: Certificate; studentName: string; studentId: string } | null>(null);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);

  const summary = getDashboardSummary();

  const certificateTypeOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.CERTIFICATE_TYPE),
    [referenceValues]
  );
  const certificateStatusOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.CERTIFICATE_STATUS),
    [referenceValues]
  );

  const resolveCertificateTypeCode = (value?: string) => {
    if (!value) return "";
    return certificateTypeOptions.find(option => option.id === value)?.code || value;
  };

  const resolveCertificateStatusCode = (value?: string) => {
    if (!value) return "";
    return certificateStatusOptions.find(option => option.id === value)?.code || value;
  };

  const getCertificateTypeName = (value?: string) => {
    if (!value) return "";
    const byCode = certificateTypeOptions.find(option => option.code === value);
    if (byCode) return byCode.name;
    const byId = certificateTypeOptions.find(option => option.id === value);
    if (byId) return byId.name;
    return getCertificateTypeLabel(value as CertificateType);
  };

  const getCertificateStatusName = (value?: string) => {
    if (!value) return "";
    const byCode = certificateStatusOptions.find(option => option.code === value);
    if (byCode) return byCode.name;
    const byId = certificateStatusOptions.find(option => option.id === value);
    if (byId) return byId.name;
    return value.replace("_", " ");
  };

  useEffect(() => {
    const loadReferenceValues = async () => {
      try {
        const data = await referenceValueService.getAll();
        setReferenceValues(data);
      } catch {
        setReferenceValues([]);
      }
    };
    loadReferenceValues();
  }, []);

  const allCertificates = studentTermRecords.flatMap(record => 
    record.certificates.map(cert => ({
      ...cert,
      studentName: record.studentName,
      studentId: record.studentId,
      studentGrade: record.studentGrade,
      termName: record.termName,
      assignedStaffName: record.assignedStaffName,
    }))
  );

  const filteredCertificates = allCertificates.filter(cert => {
    const matchesSearch = cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTerm = selectedTerm === "all" || cert.termId === selectedTerm;
    const matchesType = selectedType === "all" || cert.type === resolveCertificateTypeCode(selectedType);
    const matchesStatus = selectedStatus === "all" || cert.status === resolveCertificateStatusCode(selectedStatus);
    return matchesSearch && matchesTerm && matchesType && matchesStatus;
  });

  const pendingCount = allCertificates.filter(c => c.status === "pending").length;
  const issuedCount = allCertificates.filter(c => c.status === "issued").length;

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Certificate Management</h1>
            <p className="text-muted-foreground mt-1">Track and issue student certificates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Certificates"
            value={allCertificates.length.toString()}
            icon={<Award className="w-6 h-6" />}
          />
          <StatCard
            title="Issued"
            value={issuedCount.toString()}
            icon={<CheckCircle className="w-6 h-6" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Pending"
            value={pendingCount.toString()}
            icon={<Clock className="w-6 h-6" />}
            trend={{ value: 3, isPositive: false }}
          />
        </div>

        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {termsData.map(term => (
                    <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                  <SelectItem value="transfer">Transfer Certificate</SelectItem>
                  <SelectItem value="course_completion">Course Completion</SelectItem>
                  <SelectItem value="id_card">ID Card</SelectItem>
                  <SelectItem value="character">Character Certificate</SelectItem>
                  <SelectItem value="migration">Migration Certificate</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not_required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">All Certificates ({filteredCertificates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                          {cert.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{cert.studentName}</div>
                          <div className="text-xs text-muted-foreground">{cert.studentId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cert.termName}</TableCell>
                    <TableCell className="font-medium">{getCertificateTypeLabel(cert.type)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCertificateStatusColor(cert.status)}`}>
                        {cert.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>{cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{cert.issuedBy || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cert.status === "pending" && (
                            <DropdownMenuItem onClick={() => { setSelectedCert({ cert, studentName: cert.studentName, studentId: cert.studentId }); setIsIssueDialogOpen(true); }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Issue Certificate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          {cert.status === "issued" && (
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Issue Certificate</DialogTitle>
              <DialogDescription>
                {selectedCert && `Issuing ${getCertificateTypeLabel(selectedCert.cert.type)} for ${selectedCert.studentName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuedBy">Issued By</Label>
                <Input id="issuedBy" placeholder="Admin Name" defaultValue="Admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certRemarks">Remarks (Optional)</Label>
                <Input id="certRemarks" placeholder="Any additional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={() => setIsIssueDialogOpen(false)}>Issue Certificate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificates;
