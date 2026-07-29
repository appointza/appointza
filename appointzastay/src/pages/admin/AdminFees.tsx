import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  DollarSign,
  Filter,
  Download,
  CreditCard,
  FileText,
  GraduationCap
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { studentTermRecords, termsData, feeStructures, getDashboardSummary } from "@/data/mock-student-management";
import { getFeeStatusColor, getPaymentModeLabel } from "@/types/student-management";
import { StatCard } from "@/components/dashboard/StatCard";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory, getReferenceValuesByCategory, type ReferenceValue } from "@/models/referencevalue.model";

const AdminFees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<typeof studentTermRecords[0] | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);

  const summary = getDashboardSummary();

  const feeStatusOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.FEE_STATUS),
    [referenceValues]
  );

  const resolveFeeStatusCode = (value?: string) => {
    if (!value) return "";
    return feeStatusOptions.find(option => option.id === value)?.code || value;
  };

  const getFeeStatusName = (value?: string) => {
    if (!value) return "";
    const byCode = feeStatusOptions.find(option => option.code === value);
    if (byCode) return byCode.name;
    const byId = feeStatusOptions.find(option => option.id === value);
    if (byId) return byId.name;
    return value;
  };

  useEffect(() => {
    const loadReferenceValues = async () => {
      try {
        const data = await referenceValueService.getByCategory(ReferenceValueCategory.FEE_STATUS);
        setReferenceValues(data);
      } catch {
        setReferenceValues([]);
      }
    };
    loadReferenceValues();
  }, []);

  const filteredRecords = studentTermRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTerm = selectedTerm === "all" || record.termId === selectedTerm;
    const matchesStatus = selectedStatus === "all" || record.fee.status === resolveFeeStatusCode(selectedStatus);
    return matchesSearch && matchesTerm && matchesStatus;
  });

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Fees Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage student fees across all terms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Collected"
            value={`$${summary.totalFeesCollected.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Pending Amount"
            value={`$${summary.totalFeesDue.toLocaleString()}`}
            icon={<CreditCard className="w-6 h-6" />}
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Pending Fees"
            value={summary.pendingFeesCount.toString()}
            icon={<FileText className="w-6 h-6" />}
          />
          <StatCard
            title="Students Assigned"
            value={summary.totalStudentsAssigned.toString()}
            icon={<GraduationCap className="w-6 h-6" />}
          />
        </div>

        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="fees">Fee Records</TabsTrigger>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-6">
            <Card className="shadow-lg border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
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
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {termsData.map(term => (
                        <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {feeStatusOptions.length === 0 ? (
                        <SelectItem value="no-status">No statuses found</SelectItem>
                      ) : (
                        feeStatusOptions.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Fee Records ({filteredRecords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Total Fee</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                              {record.studentName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{record.studentName}</div>
                              <div className="text-xs text-muted-foreground">{record.studentId} • {record.studentGrade}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{record.termName}</TableCell>
                        <TableCell className="font-medium">${record.fee.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">${record.fee.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">${(record.fee.totalAmount - record.fee.paidAmount).toLocaleString()}</TableCell>
                        <TableCell>{new Date(record.fee.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getFeeStatusColor(record.fee.status)}`}>
                            {getFeeStatusName(record.fee.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{record.assignedStaffName}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedRecord(record)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedRecord(record); setIsPaymentDialogOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Fee
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display">Fee Structure</CardTitle>
                  <CardDescription>Define fee amounts per term and grade</CardDescription>
                </div>
                <Button variant="hero" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Structure
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map((structure, index) => {
                      const term = termsData.find(t => t.id === structure.termId);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{term?.name}</TableCell>
                          <TableCell>{structure.grade}</TableCell>
                          <TableCell className="font-medium">${structure.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {selectedRecord && `Recording payment for ${selectedRecord.studentName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Date</Label>
                  <Input id="paymentDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptNo">Receipt Number</Label>
                <Input id="receiptNo" placeholder="REC-2025-XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Input id="remarks" placeholder="Any additional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={() => setIsPaymentDialogOpen(false)}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRecord && !isPaymentDialogOpen} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Fee Details</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {selectedRecord.studentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedRecord.studentName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedRecord.studentId} • {selectedRecord.studentGrade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-xl font-bold text-foreground">${selectedRecord.fee.totalAmount}</div>
                    <div className="text-xs text-muted-foreground">Total Fee</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">${selectedRecord.fee.paidAmount}</div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">${selectedRecord.fee.totalAmount - selectedRecord.fee.paidAmount}</div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Payment History</h4>
                  {selectedRecord.fee.payments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRecord.fee.payments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">${payment.amount}</div>
                            <div className="text-xs text-muted-foreground">
                              {payment.receiptNo} • {getPaymentModeLabel(payment.paymentMode)}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No payments recorded</p>
                  )}
                </div>

                {selectedRecord.remarks && (
                  <div>
                    <h4 className="font-medium mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{selectedRecord.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminFees;
