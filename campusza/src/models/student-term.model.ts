// Student Term Model - For managing student-term relationships and records
import type { StudentFee } from "./fee.model";
import type { Certificate } from "./certificate.model";

/**
 * StudentTermRecord - Comprehensive record linking a student to a term
 * Contains fee information, certificates, and staff assignments
 */
export interface StudentTermRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  termId: string;
  termName: string;
  academicYear?: string;
  fee: StudentFee;
  certificates: Certificate[];
  remarks?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface StudentTermAssignment {
  id: string;
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  academicYear: string;
  assignedBy: string;
  assignedByName?: string;
  assignedDate: string;
  status: "active" | "completed" | "withdrawn";
  remarks?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export const getStudentTermStatusColor = (status: StudentTermAssignment["status"]): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "completed": return "bg-blue-100 text-blue-700";
    case "withdrawn": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getStudentTermStatusLabel = (status: StudentTermAssignment["status"]): string => {
  const labels: Record<StudentTermAssignment["status"], string> = {
    active: "Active",
    completed: "Completed",
    withdrawn: "Withdrawn",
  };
  return labels[status];
};

