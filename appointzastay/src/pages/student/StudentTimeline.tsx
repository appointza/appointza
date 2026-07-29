import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Calendar, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { studentPromotionService } from "@/services/student-promotion.service";
import { studentService } from "@/services/student.service";
import type { StudentAcademicHistory } from "@/models/student-promotion.model";

const StudentTimeline = () => {
  const { toast } = useToast();
  const [academicHistory, setAcademicHistory] = useState<StudentAcademicHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>("");

  const organizationId = studentService.getOrganizationId();
  const studentId = studentService.getStudentId();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!studentId) {
          toast({
            title: "Error",
            description: "Student ID not found.",
            variant: "destructive",
          });
          return;
        }

        // Get student info
        const student = await studentService.getById(studentId);
        if (student) {
          setStudentName(student.fullName);
        }

        // Get academic history
        const history = await studentPromotionService.getAcademicHistory(studentId, organizationId);
        setAcademicHistory(history);
      } catch (error) {
        console.error("Failed to load academic history", error);
        toast({
          title: "Error",
          description: "Failed to load your academic history.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId, studentId, toast]);

  const getPromotionStatusColor = (status: string) => {
    switch (status) {
      case "promoted":
        return "bg-green-100 text-green-800";
      case "current":
        return "bg-blue-100 text-blue-800";
      case "retained":
        return "bg-yellow-100 text-yellow-800";
      case "transferred":
        return "bg-purple-100 text-purple-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPromotionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      promoted: "Promoted",
      current: "Current",
      retained: "Retained",
      transferred: "Transferred",
      dropped: "Dropped",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout role="student" userName="Student">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Academic Timeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Your academic journey and progression through grades
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading your academic history...
            </CardContent>
          </Card>
        ) : academicHistory.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No academic history available yet.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Timeline */}
            <div className="space-y-4">
              {academicHistory.map((history, index) => (
                <Card key={history.id} className="relative">
                  {/* Timeline connector */}
                  {index < academicHistory.length - 1 && (
                    <div className="absolute left-7 top-20 w-0.5 h-12 bg-border" />
                  )}

                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-4 h-4 rounded-full bg-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {history.academicYear}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Grade {history.grade} • {history.className}
                            </p>
                          </div>
                          <Badge className={getPromotionStatusColor(history.promotionStatus)}>
                            {getPromotionStatusLabel(history.promotionStatus)}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          {/* Section */}
                          <div>
                            <p className="text-xs text-muted-foreground">Section</p>
                            <p className="font-medium">{history.section || "—"}</p>
                          </div>

                          {/* Roll Number */}
                          <div>
                            <p className="text-xs text-muted-foreground">Roll Number</p>
                            <p className="font-medium">{history.rollNumber || "—"}</p>
                          </div>

                          {/* Percentage */}
                          {history.percentage !== null && history.percentage !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Percentage
                              </p>
                              <p className="font-medium">{history.percentage.toFixed(2)}%</p>
                            </div>
                          )}

                          {/* GPA */}
                          {history.gpa !== null && history.gpa !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Award className="w-3 h-3" /> GPA
                              </p>
                              <p className="font-medium">{history.gpa.toFixed(2)}</p>
                            </div>
                          )}

                          {/* Grade Letter */}
                          {history.gradeLetter && (
                            <div>
                              <p className="text-xs text-muted-foreground">Grade</p>
                              <p className="font-medium text-lg">{history.gradeLetter}</p>
                            </div>
                          )}

                          {/* Total Marks */}
                          {history.totalMarks !== null && history.totalMarks !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground">Total Marks</p>
                              <p className="font-medium">{history.totalMarks.toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        {/* Promotion Date */}
                        {history.promotionDate && history.promotionStatus !== "current" && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {getPromotionStatusLabel(history.promotionStatus)} on{" "}
                              {new Date(history.promotionDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Grade</p>
                      <p className="text-2xl font-bold">
                        {academicHistory[0]?.grade || "—"}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Years in System</p>
                      <p className="text-2xl font-bold">{academicHistory.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Promotions</p>
                      <p className="text-2xl font-bold">
                        {academicHistory.filter((h) => h.promotionStatus === "promoted").length}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTimeline;
