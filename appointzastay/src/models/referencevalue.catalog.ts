import { ReferenceValueCategory, normalizeReferenceValueCategory } from "./referencevalue.model";

export type ReferenceCatalogItem = {
  category: ReferenceValueCategory | string;
  label: string;
  required: boolean;
  /** App pages / modules that read this category */
  usedBy: string;
  /** Plain-language hint shown when the category is selected */
  usageHint: string;
};

export type ReferenceCatalogGroup = {
  id: string;
  title: string;
  description: string;
  items: ReferenceCatalogItem[];
};

/** Curated list — only categories the app actually uses in dropdowns. */
export const REFERENCE_SETUP_GROUPS: ReferenceCatalogGroup[] = [
  {
    id: "core",
    title: "Core setup",
    description: "Set these up first — Classes, Terms, and Students need them.",
    items: [
      {
        category: ReferenceValueCategory.ACADEMIC_YEAR,
        label: "Academic Year",
        required: true,
        usedBy: "Classes, Terms, Students, Promotions",
        usageHint:
          "Dropdown when creating a class, term, or student record, and when running year-end promotions. Add one entry per school year (e.g. 2025-26).",
      },
      {
        category: ReferenceValueCategory.GRADE,
        label: "Grade",
        required: true,
        usedBy: "Classes, Class Config, Promotions",
        usageHint:
          "Dropdown when creating a class — combined with section to name the class (e.g. Grade 10 + Section A). Also used when promoting students to the next grade.",
      },
      {
        category: ReferenceValueCategory.CLASS_SECTION,
        label: "Class Section",
        required: true,
        usedBy: "Classes",
        usageHint:
          "Dropdown when creating a class. Section is paired with grade (e.g. Grade 9 Section B). Add A, B, C or your school’s section names.",
      },
      {
        category: ReferenceValueCategory.ROOM_NUMBER,
        label: "Room",
        required: false,
        usedBy: "Classes, Schedule",
        usageHint:
          "Optional room dropdown when creating a class and when building the staff timetable. Use room numbers or names your school uses (e.g. Room 101).",
      },
    ],
  },
  {
    id: "people",
    title: "Staff & students",
    description: "Departments, subjects, and student status options.",
    items: [
      {
        category: ReferenceValueCategory.DEPARTMENT,
        label: "Department",
        required: true,
        usedBy: "Staff, Attendance",
        usageHint:
          "Dropdown when adding or editing staff, and when filtering attendance by department. Examples: Science, Mathematics, English.",
      },
      {
        category: ReferenceValueCategory.SUBJECT,
        label: "Subject",
        required: true,
        usedBy: "Staff, Schedule",
        usageHint:
          "Subjects a staff member can teach (Staff page) and subjects placed on the timetable (Schedule). Examples: Physics, History.",
      },
      {
        category: ReferenceValueCategory.STUDENT_STATUS,
        label: "Student Status",
        required: true,
        usedBy: "Students",
        usageHint:
          "Status dropdown on student enrollment — whether the student is Active, Graduated, Transferred, etc.",
      },
      {
        category: ReferenceValueCategory.GENDER,
        label: "Gender",
        required: false,
        usedBy: "Student profile",
        usageHint:
          "Gender options on the student profile form. Add the options your school collects (e.g. Male, Female, Other).",
      },
    ],
  },
  {
    id: "operations",
    title: "Daily operations",
    description: "Timetable periods, attendance, and grading.",
    items: [
      {
        category: ReferenceValueCategory.PERIOD,
        label: "Period / Time Slot",
        required: true,
        usedBy: "Schedule",
        usageHint:
          "Time slots on the Schedule grid. Code is the period id (P1, P2…); name is the time shown to users (e.g. 8:00 AM).",
      },
      {
        category: ReferenceValueCategory.ATTENDANCE_STATUS,
        label: "Attendance Status",
        required: true,
        usedBy: "Attendance",
        usageHint:
          "Marks teachers choose when recording attendance — Present, Absent, Late, Excused, and any custom statuses you need.",
      },
      {
        category: ReferenceValueCategory.ASSESSMENT,
        label: "Assessment",
        required: false,
        usedBy: "Staff Grades",
        usageHint:
          "Assessment types on Staff → Grades when entering marks. Examples: Mid Term, Final Exam, Quiz, Assignment.",
      },
      {
        category: ReferenceValueCategory.ASSESSMENT_COMPONENT,
        label: "Assessment Component",
        required: false,
        usedBy: "Staff Grades (Theory / Practical)",
        usageHint:
          "Split grades into components on Staff → Grades — typically Theory and Practical, or other breakdowns your school uses.",
      },
    ],
  },
];

export const REFERENCE_CATALOG_ITEMS: ReferenceCatalogItem[] = REFERENCE_SETUP_GROUPS.flatMap(
  (g) => g.items
);

export const REQUIRED_REFERENCE_CATEGORIES = REFERENCE_CATALOG_ITEMS.filter((i) => i.required).map(
  (i) => i.category
);

export function getCatalogItem(category: string): ReferenceCatalogItem | undefined {
  return REFERENCE_CATALOG_ITEMS.find((i) => i.category === category);
}

/** Example placeholders for Add / Edit reference value forms, per category. */
export type ReferenceValuePlaceholders = {
  code: string;
  name: string;
  displayOrder: string;
  hint: string;
};

const REFERENCE_VALUE_PLACEHOLDERS: Record<string, ReferenceValuePlaceholders> = {
  [ReferenceValueCategory.ACADEMIC_YEAR]: {
    code: "2025_26",
    name: "2025-26",
    displayOrder: "1",
    hint: "School year shown in Classes and Terms — code is stored uppercase (e.g. 2025_26).",
  },
  [ReferenceValueCategory.GRADE]: {
    code: "GRADE_10",
    name: "Grade 10",
    displayOrder: "10",
    hint: "Grade level for classes — use GRADE_1 … GRADE_12 or your own naming.",
  },
  [ReferenceValueCategory.CLASS_SECTION]: {
    code: "SEC_A",
    name: "Section A",
    displayOrder: "1",
    hint: "Section letter or name combined with grade to form a class (e.g. Grade 10 — Section A).",
  },
  [ReferenceValueCategory.ROOM_NUMBER]: {
    code: "R101",
    name: "Room 101",
    displayOrder: "1",
    hint: "Classroom or lab used in Classes and Schedule.",
  },
  [ReferenceValueCategory.DEPARTMENT]: {
    code: "MATH",
    name: "Mathematics",
    displayOrder: "2",
    hint: "Department for staff — short code plus full name (e.g. SCI → Science).",
  },
  [ReferenceValueCategory.SUBJECT]: {
    code: "PHY",
    name: "Physics",
    displayOrder: "4",
    hint: "Subject taught by staff and assigned on the timetable.",
  },
  [ReferenceValueCategory.STUDENT_STATUS]: {
    code: "ACTIVE",
    name: "Active",
    displayOrder: "1",
    hint: "Enrollment status on student records — e.g. Active, Graduated, Transferred.",
  },
  [ReferenceValueCategory.GENDER]: {
    code: "MALE",
    name: "Male",
    displayOrder: "1",
    hint: "Gender options on student profile.",
  },
  [ReferenceValueCategory.PERIOD]: {
    code: "P3",
    name: "10:00 AM",
    displayOrder: "3",
    hint: "Timetable slot — code is the period id; name is the time shown on Schedule.",
  },
  [ReferenceValueCategory.ATTENDANCE_STATUS]: {
    code: "LATE",
    name: "Late",
    displayOrder: "3",
    hint: "Mark options for Attendance — e.g. Present, Absent, Late, Excused.",
  },
  [ReferenceValueCategory.ASSESSMENT]: {
    code: "QUIZ",
    name: "Quiz",
    displayOrder: "3",
    hint: "Assessment types for Staff Grades — e.g. Mid Term, Final Exam, Quiz.",
  },
  [ReferenceValueCategory.ASSESSMENT_COMPONENT]: {
    code: "THEORY",
    name: "Theory",
    displayOrder: "1",
    hint: "Grade breakdown — typically Theory and Practical.",
  },
};

const DEFAULT_REFERENCE_PLACEHOLDERS: ReferenceValuePlaceholders = {
  code: "SHORT_CODE",
  name: "Display name",
  displayOrder: "1",
  hint: "Short unique code (uppercase) and the label shown in dropdowns.",
};

export function getReferenceValuePlaceholders(category: string): ReferenceValuePlaceholders {
  const key = normalizeReferenceValueCategory(category);
  return REFERENCE_VALUE_PLACEHOLDERS[key] ?? DEFAULT_REFERENCE_PLACEHOLDERS;
}
