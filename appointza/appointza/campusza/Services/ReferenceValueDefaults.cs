namespace appointza.Services.Campusza
{
    internal sealed class ReferenceValueDefault
    {
        public string Category { get; init; } = "";
        public string Code { get; init; } = "";
        public string Name { get; init; } = "";
        public int DisplayOrder { get; init; }
        public bool IsDefault { get; init; }
    }

    /// <summary>Default lookup values seeded per organization on signup or from Settings.</summary>
    internal static class ReferenceValueDefaults
    {
        public static IReadOnlyList<ReferenceValueDefault> ForOrganization(int? year = null)
        {
            int y = year ?? DateTime.UtcNow.Year;
            string year1 = $"{y}-{(y + 1) % 100:D2}";
            string year2 = $"{y - 1}-{y % 100:D2}";

            var list = new List<ReferenceValueDefault>();

            void Add(string category, string code, string name, int order, bool isDefault = false) =>
                list.Add(new ReferenceValueDefault
                {
                    Category = category,
                    Code = code,
                    Name = name,
                    DisplayOrder = order,
                    IsDefault = isDefault,
                });

            Add("academic_year", year1.Replace("-", "_").ToUpperInvariant(), year1, 1, true);
            Add("academic_year", year2.Replace("-", "_").ToUpperInvariant(), year2, 2);

            for (int g = 1; g <= 12; g++)
                Add("grade", $"GRADE_{g}", $"Grade {g}", g, g == 9);

            Add("class_section", "SEC_A", "Section A", 1, true);
            Add("class_section", "SEC_B", "Section B", 2);
            Add("class_section", "SEC_C", "Section C", 3);
            Add("class_section", "SEC_D", "Section D", 4);

            Add("department", "SCI", "Science", 1);
            Add("department", "MATH", "Mathematics", 2);
            Add("department", "ENG", "English", 3);
            Add("department", "SOC", "Social Studies", 4);
            Add("department", "COMP", "Computer Science", 5);

            Add("subject", "MATH", "Mathematics", 1);
            Add("subject", "ENG", "English", 2);
            Add("subject", "SCI", "Science", 3);
            Add("subject", "PHY", "Physics", 4);
            Add("subject", "CHEM", "Chemistry", 5);
            Add("subject", "BIO", "Biology", 6);
            Add("subject", "HIST", "History", 7);
            Add("subject", "GEO", "Geography", 8);

            Add("room_number", "R101", "Room 101", 1);
            Add("room_number", "R102", "Room 102", 2);
            Add("room_number", "R103", "Room 103", 3);
            Add("room_number", "R201", "Room 201", 4);
            Add("room_number", "R202", "Room 202", 5);

            Add("student_status", "ACTIVE", "Active", 1, true);
            Add("student_status", "INACTIVE", "Inactive", 2);
            Add("student_status", "GRADUATED", "Graduated", 3);
            Add("student_status", "TRANSFERRED", "Transferred", 4);
            Add("student_status", "SUSPENDED", "Suspended", 5);

            Add("attendance_status", "PRESENT", "Present", 1, true);
            Add("attendance_status", "ABSENT", "Absent", 2);
            Add("attendance_status", "LATE", "Late", 3);
            Add("attendance_status", "EXCUSED", "Excused", 4);

            Add("period", "P1", "8:00 AM", 1);
            Add("period", "P2", "9:00 AM", 2);
            Add("period", "P3", "10:00 AM", 3);
            Add("period", "P4", "11:00 AM", 4);
            Add("period", "P5", "12:00 PM", 5);
            Add("period", "P6", "1:00 PM", 6);
            Add("period", "P7", "2:00 PM", 7);
            Add("period", "P8", "3:00 PM", 8);

            Add("gender", "MALE", "Male", 1);
            Add("gender", "FEMALE", "Female", 2);
            Add("gender", "OTHER", "Other", 3);

            Add("assessment", "MIDTERM", "Mid Term", 1);
            Add("assessment", "FINAL", "Final Exam", 2);
            Add("assessment", "QUIZ", "Quiz", 3);
            Add("assessment", "ASSIGNMENT", "Assignment", 4);

            Add("assessment_component", "THEORY", "Theory", 1, true);
            Add("assessment_component", "PRACTICAL", "Practical", 2);

            return list;
        }
    }
}
