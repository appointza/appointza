import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Briefcase,
  MapPin
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
import { staffService } from "@/services/staff.service";
import type { Staff } from "@/models/staff.model";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory, getReferenceValuesByCategory, normalizeReferenceValueIds, resolveReferenceValueId, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  on_leave: "bg-yellow-100 text-yellow-700",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-red-100 text-red-700",
};

const AdminStaff = () => {
  const { toast } = useToast();
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Staff> | null>(null);
  const [addFormData, setAddFormData] = useState<Partial<Staff>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "teacher",
    department: "",
    status: "active",
  });

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      try {
        const [data, refs] = await Promise.all([
          staffService.getAll(),
          referenceValueService.getAll(),
        ]);
        setStaffData(data);
        setReferenceValues(refs);
      } catch (error) {
        toast({
          title: "Failed to load staff",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [toast]);

  const departmentOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.DEPARTMENT),
    [referenceValues]
  );
  const subjectOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT),
    [referenceValues]
  );

  const getDepartmentName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.DEPARTMENT, value);
  const getSubjectNames = (values?: string[]) =>
    (values || []).map((value) => resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, value)).filter(Boolean);

  const getDisplayName = (staff: Staff) =>
    staff.fullName || `${staff.firstName || ""} ${staff.lastName || ""}`.trim() || staff.email || "Staff";

  const filteredStaff = staffData.filter(staff =>
    getDisplayName(staff).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (staff.staffId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDepartmentName(staff.department).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditFormData({
      ...staff,
      department: resolveReferenceValueId(referenceValues, ReferenceValueCategory.DEPARTMENT, staff.department),
      subjects: normalizeReferenceValueIds(referenceValues, ReferenceValueCategory.SUBJECT, staff.subjects || []),
    });
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editFormData && selectedStaff) {
      setLoading(true);
      try {
        const updated = await staffService.update({
          ...editFormData,
          id: selectedStaff.id,
          staffId: selectedStaff.staffId,
          fullName: editFormData.fullName || `${editFormData.firstName || ""} ${editFormData.lastName || ""}`.trim(),
        });
        setStaffData(prev => prev.map(staff => staff.id === selectedStaff.id ? updated : staff));
        setIsEditDialogOpen(false);
        setSelectedStaff(null);
        setEditFormData(null);
        toast({
          title: "Staff Updated",
          description: `${getDisplayName(updated)}'s information has been updated successfully.`,
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

  const handleDelete = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedStaff) {
      setLoading(true);
      try {
        await staffService.delete(selectedStaff.id);
        setStaffData(prev => prev.filter(staff => staff.id !== selectedStaff.id));
        setIsDeleteDialogOpen(false);
        setSelectedStaff(null);
        toast({
          title: "Staff Removed",
          description: `${getDisplayName(selectedStaff)} has been removed from the system.`,
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

  const handleAddStaff = async () => {
    if (!addFormData.firstName || !addFormData.lastName || !addFormData.email || !addFormData.department || !addFormData.role) {
      toast({
        title: "Missing fields",
        description: "First name, last name, email, department, and role are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newStaff = await staffService.create({
        ...addFormData,
        staffId: addFormData.staffId || `STF-${Date.now()}`,
        fullName: `${addFormData.firstName} ${addFormData.lastName}`.trim(),
        joiningDate: new Date().toISOString(),
        status: addFormData.status || "active",
        subjects: addFormData.subjects || [],
      });
      setStaffData(prev => [newStaff, ...prev]);
      setIsAddDialogOpen(false);
      setAddFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "teacher",
        department: "",
        status: "active",
      });
      toast({
        title: "Staff Added",
        description: `${getDisplayName(newStaff)} has been added successfully.`,
      });
      if (newStaff.generatedPassword) {
        toast({
          title: "Staff User Created",
          description: `Temporary password: ${newStaff.generatedPassword}`,
        });
      }
    } catch (error: any) {
      let message = "Please try again.";
      const responseData = error?.response?.data;
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData);
          message = parsed?.message || parsed?.key || message;
        } catch {
          message = responseData || message;
        }
      } else if (responseData) {
        message = responseData?.message || responseData?.error || message;
      }

      toast({
        title: "Add failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Staff</h1>
            <p className="text-muted-foreground mt-1">Manage all staff members and their roles</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Enter the staff member details below to add them to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Sarah"
                        value={addFormData.firstName || ""}
                        onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                      />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Johnson"
                        value={addFormData.lastName || ""}
                        onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sarah.j@school.com"
                      value={addFormData.email || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      value={addFormData.phone || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                      <Select
                        value={addFormData.role || "teacher"}
                        onValueChange={(value) => setAddFormData({ ...addFormData, role: value as Staff["role"] })}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="librarian">Librarian</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                        value={addFormData.department || ""}
                        onValueChange={(value) => setAddFormData({ ...addFormData, department: value })}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.length === 0 ? (
                          <SelectItem value="no-departments" disabled>
                            No departments available
                          </SelectItem>
                        ) : (
                          departmentOptions.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subjects</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!value || value === "no-subjects") return;
                      const existing = addFormData.subjects || [];
                      if (existing.includes(value)) return;
                      setAddFormData({ ...addFormData, subjects: [...existing, value] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject(s)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>
                          No subjects available
                        </SelectItem>
                      ) : (
                        subjectOptions.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {getSubjectNames(addFormData.subjects).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getSubjectNames(addFormData.subjects).map((name, index) => (
                        <Badge key={`${name}-${index}`} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleAddStaff} disabled={loading}>
                  {loading ? "Adding..." : "Add Staff"}
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
                  placeholder="Search staff by name, ID, or department..."
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

        {/* Staff cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="shadow-lg border-border/50 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full gradient-secondary flex items-center justify-center text-secondary-foreground text-xl font-bold">
                      {getDisplayName(staff).charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{getDisplayName(staff)}</h3>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                      <p className="text-xs text-muted-foreground">{getDepartmentName(staff.department)}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewProfile(staff)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(staff)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(staff)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {staff.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {staff.phone}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ID: {staff.staffId || staff.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[staff.status] || statusColors.active}`}>
                    {staff.status === "on_leave" ? "On Leave" : staff.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Profile Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Staff Profile</DialogTitle>
              <DialogDescription>
                View detailed information about the staff member.
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-20 h-20 rounded-full gradient-secondary flex items-center justify-center text-secondary-foreground text-3xl font-bold">
                    {getDisplayName(selectedStaff).charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{getDisplayName(selectedStaff)}</h3>
                    <p className="text-muted-foreground">{selectedStaff.role}</p>
                    <p className="text-sm text-muted-foreground">{getDepartmentName(selectedStaff.department)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Staff ID</p>
                      <p className="font-medium">{selectedStaff.staffId || selectedStaff.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{selectedStaff.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{getDepartmentName(selectedStaff.department)}</p>
                    </div>
                  </div>
                  {getSubjectNames(selectedStaff.subjects).length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {getSubjectNames(selectedStaff.subjects).map((name, index) => (
                            <Badge key={`${name}-${index}`} variant="secondary">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedStaff.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedStaff.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className={`w-3 h-3 rounded-full ${statusColors[selectedStaff.status] || statusColors.active}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">
                        {selectedStaff.status === "on_leave" ? "On Leave" : selectedStaff.status}
                      </p>
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
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update the staff member's information below.
              </DialogDescription>
            </DialogHeader>
            {editFormData && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-first-name">First Name</Label>
                    <Input
                      id="edit-first-name"
                      value={editFormData.firstName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-last-name">Last Name</Label>
                    <Input
                      id="edit-last-name"
                      value={editFormData.lastName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
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
                    <Label htmlFor="edit-role">Role</Label>
                    <Select
                      value={editFormData.role || "teacher"}
                      onValueChange={(value) => setEditFormData({ ...editFormData, role: value as Staff["role"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Select
                      value={editFormData.department || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.length === 0 ? (
                          <SelectItem value="no-departments" disabled>
                            No departments available
                          </SelectItem>
                        ) : (
                          departmentOptions.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subjects</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!value || value === "no-subjects") return;
                      const existing = editFormData.subjects || [];
                      if (existing.includes(value)) return;
                      setEditFormData({ ...editFormData, subjects: [...existing, value] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject(s)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>
                          No subjects available
                        </SelectItem>
                      ) : (
                        subjectOptions.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {getSubjectNames(editFormData.subjects).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getSubjectNames(editFormData.subjects).map((name, index) => (
                        <Badge key={`${name}-${index}`} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status || "active"}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Staff["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSaveEdit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
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
                <span className="font-semibold">{selectedStaff?.name}</span> from the staff list.
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

export default AdminStaff;
