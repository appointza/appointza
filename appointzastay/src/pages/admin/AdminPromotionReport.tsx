import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { studentPromotionService } from "@/services/student-promotion.service";
import { staffService } from "@/services/staff.service";
import type { StudentPromotion } from "@/models/student-promotion.model";

const AdminPromotionReport = () => {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<StudentPromotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<StudentPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [promotionTypeFilter, setPromotionTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const organizationId = staffService.getOrganizationId();

  // Load promotions
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await studentPromotionService.selectPromotions({
          organizationId,
        });
        setPromotions(data);
        setFilteredPromotions(data);
      } catch (error) {
        console.error("Failed to load promotions", error);
        toast({
          title: "Error",
          description: "Failed to load promotion records.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId, toast]);

  // Apply filters
  useEffect(() => {
    let filtered = promotions;

    if (academicYearFilter !== "all") {
      filtered = filtered.filter((p) => p.academicYearFrom === academicYearFilter);
    }

    if (promotionTypeFilter !== "all") {
      filtered = filtered.filter((p) => p.promotionType === promotionTypeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.studentName.toLowerCase().includes(term) ||
        p.studentId.toLowerCase().includes(term)
      );
    }

    setFilteredPromotions(filtered);
  }, [academicYearFilter, promotionTypeFilter, searchTerm, promotions]);

  // Get unique academic years
  const academicYears = [
    ...new Set(
      promotions.map((p) => p.academicYearFrom).filter((y): y is string => Boolean(y && y.trim()))
    ),
  ].sort((a, b) => b.localeCompare(a));

  // Get promotion type color
  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case "promoted":
        return "bg-green-100 text-green-800";
      case "retained":
        return "bg-yellow-100 text-yellow-800";
      case "transferred":
        return "bg-blue-100 text-blue-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPromotions.length === 0) {
      toast({
        title: "No Data",
        description: "No promotions to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Student Name",
      "Student ID",
      "From Grade",
      "To Grade",
      "From Class",
      "To Class",
      "Academic Year From",
      "Academic Year To",
      "Type",
      "Promotion Date",
      "Promoted By",
      "Notes",
    ];

    const rows = filteredPromotions.map((p) => [
      p.studentName,
      p.studentId,
      p.fromGrade,
      p.toGrade,
      p.fromClassName || "—",
      p.toClassName || "—",
      p.academicYearFrom,
      p.academicYearTo,
      p.promotionType,
      new Date(p.promotionDate).toLocaleDateString(),
      p.promotedBy,
      p.notes || "—",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `promotion-report-${new Date().toISOString().split("T")[0]}.csv`);
    link.click();

    toast({
      title: "Success",
      description: "Promotion report exported successfully.",
    });
  };

  // Stats
  const stats = {
    total: filteredPromotions.length,
    promoted: filteredPromotions.filter((p) => p.promotionType === "promoted").length,
    retained: filteredPromotions.filter((p) => p.promotionType === "retained").length,
    transferred: filteredPromotions.filter((p) => p.promotionType === "transferred").length,
    dropped: filteredPromotions.filter((p) => p.promotionType === "dropped").length,
  };

  return (
    <DashboardLayout role="admin" userName="Administrator">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Promotion Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              View and analyze all student promotions
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={loading}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Promotions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Promoted</p>
                <p className="text-2xl font-bold text-green-700">{stats.promoted}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Retained</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.retained}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Transferred</p>
                <p className="text-2xl font-bold text-blue-700">{stats.transferred}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Dropped</p>
                <p className="text-2xl font-bold text-red-700">{stats.dropped}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search by Name or ID</Label>
                <Input
                  id="search"
                  placeholder="Student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Promotion Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Promotion Type</Label>
                <Select value={promotionTypeFilter} onValueChange={setPromotionTypeFilter}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="promoted">Promoted</SelectItem>
                    <SelectItem value="retained">Retained</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Promotion Records</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : `Showing ${filteredPromotions.length} records`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredPromotions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No promotions found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Promotion Date</TableHead>
                    <TableHead>Promoted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promotion.studentName}</p>
                          <p className="text-sm text-muted-foreground">{promotion.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p>{promotion.fromGrade} {promotion.fromClassName && `(${promotion.fromClassName})`}</p>
                          <p className="text-muted-foreground">↓</p>
                          <p>{promotion.toGrade} {promotion.toClassName && `(${promotion.toClassName})`}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {promotion.academicYearFrom} → {promotion.academicYearTo}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPromotionTypeColor(promotion.promotionType)}>
                          {promotion.promotionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(promotion.promotionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{promotion.promotedBy}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              {promotion.notes ? (
                                <span>{promotion.notes}</span>
                              ) : (
                                <span className="text-muted-foreground">No notes</span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

export default AdminPromotionReport;
