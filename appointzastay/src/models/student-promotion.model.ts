export interface StudentAcademicHistory {
  id: string;
  organizationId: string;
  studentId: string;
  academicYear: string;
  grade: string;
  classId?: string;
  className?: string;
  section?: string;
  rollNumber?: number;
  // Performance data
  totalMarks?: number;
  percentage?: number;
  gpa?: number;
  gradeLetter?: string;
  // Status
  promotionStatus: "current" | "promoted" | "retained" | "transferred" | "dropped";
  promotionDate?: string;
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface StudentPromotion {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  fromGrade: string;
  fromClassId?: string;
  fromClassName?: string;
  toGrade: string;
  toClassId?: string;
  toClassName?: string;
  academicYearFrom: string;
  academicYearTo: string;
  // Performance for promotion decision
  finalPercentage?: number;
  gpa?: number;
  // Decision
  promotionType: "promoted" | "retained" | "transferred" | "dropped";
  promotionDate: string;
  promotedBy: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface BulkPromotionRequest {
  organizationId: string;
  studentIds: string[]; // UUIDs of students to promote
  fromGrade: string; // e.g., "9"
  toClassId: string; // New class ID (UUID)
  toClassName: string; // New class name (e.g., "A-10TH-A")
  toSection: string; // New section (e.g., "A")
  fromAcademicYear: string; // e.g., "2024-2025"
  toAcademicYear: string; // e.g., "2025-2026"
  newTermId: string; // First term of new academic year
  newTermName: string; // e.g., "TERM1"
  promotedBy: string; // Staff ID who performed promotion
  notes?: string;
}

export interface StudentWithPerformance {
  id: string;
  studentId: string;
  fullName: string;
  className: string;
  classId: string;
  grade: string;
  rollNumber: number;
  totalMarks?: number;
  percentage?: number;
  gpa?: number;
  selected?: boolean;
}

export interface ClassForPromotion {
  id: string;
  name: string;
  grade: string;
  section: string;
}
