// Term/Semester Types
export type TermStatus = "active" | "completed" | "upcoming";
export type FeeStatus = "paid" | "partial" | "unpaid";
export type PaymentMode = "cash" | "card" | "bank_transfer" | "online" | "cheque";
export type CertificateType = "bonafide" | "transfer" | "course_completion" | "id_card" | "character" | "migration";
export type CertificateStatus = "issued" | "pending" | "not_required";

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  academicYear: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  receiptNo: string;
  paymentMode: PaymentMode;
  remarks?: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  termId: string;
  totalAmount: number;
  paidAmount: number;
  status: FeeStatus;
  dueDate: string;
  payments: PaymentRecord[];
}

export interface Certificate {
  id: string;
  studentId: string;
  termId: string;
  type: CertificateType;
  status: CertificateStatus;
  issuedDate?: string;
  issuedBy?: string;
  remarks?: string;
}

export interface StudentTermAssignment {
  id: string;
  studentId: string;
  termId: string;
  assignedBy: string;
  assignedDate: string;
  remarks?: string;
}

export interface StudentTermRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  termId: string;
  termName: string;
  fee: StudentFee;
  certificates: Certificate[];
  remarks: string;
  assignedStaffId: string;
  assignedStaffName: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  performedByRole: "admin" | "staff";
  timestamp: string;
  details: string;
}

// Helper function to get status colors
export const getFeeStatusColor = (status: FeeStatus): string => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700";
    case "partial": return "bg-yellow-100 text-yellow-700";
    case "unpaid": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getCertificateStatusColor = (status: CertificateStatus): string => {
  switch (status) {
    case "issued": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "not_required": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getCertificateTypeLabel = (type: CertificateType): string => {
  const labels: Record<CertificateType, string> = {
    bonafide: "Bonafide Certificate",
    transfer: "Transfer Certificate",
    course_completion: "Course Completion",
    id_card: "ID Card",
    character: "Character Certificate",
    migration: "Migration Certificate",
  };
  return labels[type];
};

export const getPaymentModeLabel = (mode: PaymentMode): string => {
  const labels: Record<PaymentMode, string> = {
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    online: "Online Payment",
    cheque: "Cheque",
  };
  return labels[mode];
};
