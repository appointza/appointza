// Student Model
export type StudentStatus = "active" | "inactive" | "graduated" | "transferred" | "suspended";

export interface Student {
  id: string;
  studentId: string;          // Roll / admission number

  firstName: string;
  lastName: string;
  fullName?: string;

  email?: string;
  phone: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  parentGuardian: {
    name: string;
    relationship: "father" | "mother" | "guardian" | "other";
    email?: string;
    phone: string;
    occupation?: string;
  };

  classId: string;
  className?: string;
  grade?: string;
  section?: string;
  rollNumber: number;
  admissionDate?: string;
  currentAcademicYear: string;       // e.g., "2024-25"
  currentSemesterType?: "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";
  currentTermId?: string;
  currentTermName?: string;
  status?: StudentStatus | string;

  photoUrl?: string;
  bloodGroup?: string;
  medicalConditions?: string;

  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  organizationId: string;
  isActive: boolean;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}


export interface StudentEnrollment {
  id: string;
  studentId: string;
  classId: string;
  termId: string;
  termName?: string;
  academicYear: string;
  semesterType: "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";
  enrollmentDate: string;
  status: "enrolled" | "withdrawn" | "completed";
  remarks?: string;
  organizationId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Student Promotion - Track student progression across academic years and semesters
export interface StudentPromotion {
  id: string;
  studentId: string;
  studentName: string;
  fromAcademicYear: string;
  fromSemesterType: "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";
  fromClassId?: string;
  fromClassName?: string;
  fromGrade?: string;
  toAcademicYear: string;
  toSemesterType: "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";
  toClassId: string;
  toClassName: string;
  toGrade: string;
  promotionDate: string;
  promotedBy: string;
  promotedByName?: string;
  remarks?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export const getStudentStatusColor = (status: StudentStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "graduated": return "bg-blue-100 text-blue-700";
    case "transferred": return "bg-yellow-100 text-yellow-700";
    case "suspended": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getStudentStatusLabel = (status: StudentStatus): string => {
  const labels: Record<StudentStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    graduated: "Graduated",
    transferred: "Transferred",
    suspended: "Suspended",
  };
  return labels[status];
};

