using System.Text.Json.Serialization;
using System.Text.Json;

namespace appointza.Models
{
    // Task Management Request Models
    public class AddAppointmentTaskReq
    {
        public long appointmentid { get; set; }
        public long organizationid { get; set; }
        public long organisationlocationid { get; set; }
        public string taskname { get; set; }
        public string description { get; set; }
    }

    public class UpdateAppointmentTaskReq
    {
        public long taskid { get; set; }
        public long appointmentid { get; set; }
        public long organizationid { get; set; }
        public long organisationlocationid { get; set; }
        public string taskname { get; set; }
        public string description { get; set; }
        public int version { get; set; }
    }

    public class DeleteAppointmentTaskReq
    {
        public long taskid { get; set; }
        public long appointmentid { get; set; }
        public long organizationid { get; set; }
        public long organisationlocationid { get; set; }
        public int version { get; set; }
    }

    public class GetAppointmentTasksReq
    {
        public long appointmentid { get; set; }
        public long organizationid { get; set; }
    }
}
