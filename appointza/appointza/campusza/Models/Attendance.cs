using System.Text.Json.Serialization;
using System.Text.Json;
using appointza.Models;

namespace appointza.Models.Campusza
{
    public class Attendance
    {
        public string id { get; set; } = "";
        public string type { get; set; } = ""; // student, staff
        public DateTime date { get; set; }
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string status { get; set; } = ""; // present, absent, late, excused, half_day
        public string checkintime { get; set; } = "";
        public string checkouttime { get; set; } = "";
        public string remarks { get; set; } = "";
        public string markedby { get; set; } = "";
        public DateTime markedat { get; set; }

        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
    }

    public class AttendanceSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string staffid { get; set; } = "";
        public DateTime? fromdate { get; set; }
        public DateTime? todate { get; set; }
        public string type { get; set; } = "";
    }

    public class AttendanceDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    /// <summary>Request for one API that returns students of a class with their attendance status for a given date.</summary>
    public class StudentsWithAttendanceReq
    {
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string date { get; set; } = ""; // yyyy-MM-dd
    }

    /// <summary>Student row with attendance status for a specific date (present, absent, late, excused, half_day, or empty if not marked).</summary>
    public class StudentWithAttendanceItem
    {
        public string id { get; set; } = "";
        public string studentid { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public int rollnumber { get; set; }
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string attendancestatus { get; set; } = ""; // present, absent, late, excused, half_day, or ""
    }
}
