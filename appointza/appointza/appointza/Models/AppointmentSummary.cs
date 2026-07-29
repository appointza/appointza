using System.ComponentModel.DataAnnotations;

namespace appointza.Models
{
    public class AppointmentSummary
    {
        public int id { get; set; }
        public int userid { get; set; }
        public string username { get; set; } = string.Empty;
        public string useremail { get; set; } = string.Empty;
        public string usermobile { get; set; } = string.Empty;
        
        // Organization Details
        public int organisationid { get; set; }
        public string organisationname { get; set; } = string.Empty;
        public string organisationaddress { get; set; } = string.Empty;
        public string organisationphone { get; set; } = string.Empty;
        public string organisationemail { get; set; } = string.Empty;
        
        // Location Details
        public int organisationlocationid { get; set; }
        public string locationname { get; set; } = string.Empty;
        public string locationaddress { get; set; } = string.Empty;
        public string locationphone { get; set; } = string.Empty;
        
        // Appointment Details
        public DateTime appointmentdate { get; set; }
        public TimeSpan fromtime { get; set; }
        public TimeSpan totime { get; set; }
        public string status { get; set; } = string.Empty;
        public string statuscode { get; set; } = string.Empty;
        public DateTime createdon { get; set; }
        public DateTime modifiedon { get; set; }
        
        // Staff Details
        public int? staffid { get; set; }
        public string staffname { get; set; } = string.Empty;
        public string staffphone { get; set; } = string.Empty;
        public string staffemail { get; set; } = string.Empty;
        
        // Payment Details
        public int? paymentid { get; set; }
        public decimal totalamount { get; set; }
        public string paymentstatus { get; set; } = string.Empty;
        public string paymentmethod { get; set; } = string.Empty;
        public string paymentreference { get; set; } = string.Empty;
        public DateTime? paymentdate { get; set; }
        
        // Services
        public List<AppointmentServiceSummary> services { get; set; } = new List<AppointmentServiceSummary>();
        
        // Timeline
        public List<AppointmentTimelineSummary> timeline { get; set; } = new List<AppointmentTimelineSummary>();
        
        // Additional Information
        public string notes { get; set; } = string.Empty;
        public Dictionary<string, object> attributes { get; set; } = new Dictionary<string, object>();
    }

    public class AppointmentServiceSummary
    {
        public int serviceid { get; set; }
        public string servicename { get; set; } = string.Empty;
        public string servicedescription { get; set; } = string.Empty;
        public decimal serviceprice { get; set; }
        public int duration { get; set; } // in minutes
        public string category { get; set; } = string.Empty;
    }

    public class AppointmentTimelineSummary
    {
        public int id { get; set; }
        public string taskcode { get; set; } = string.Empty;
        public string tasktype { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public string staffname { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public DateTime createdon { get; set; }
        public string notes { get; set; } = string.Empty;
    }

    public class AppointmentSummarySelectReq
    {
        public int appointmentid { get; set; }
    }
}
