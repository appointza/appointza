using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class Appoinment
    {
        public long id { get; set; }
public long userid { get; set; }
public long organizationid { get; set; }
public TimeSpan fromtime { get; set; }
public TimeSpan totime { get; set; }
public DateTime appoinmentdate { get; set; }
public int status { get; set; }
public string statuscode { get; set; }
public int version { get; set; }
public long createdby { get; set; }
public DateTime createdon { get; set; }
public long modifiedby { get; set; }
public DateTime modifiedon { get; set; }

                                    public AttributesData attributes { get; set; }
                                    [JsonIgnore]
                                    public string attributes_json
                                    {
                                        get { return JsonSerializer.Serialize(attributes); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                attributes = JsonSerializer.Deserialize<AttributesData>(value);
                                        }
                                    }
                                
public bool isactive { get; set; }
public bool issuspended { get; set; }
public long organisationlocationid { get; set; }
public bool isfactory { get; set; }
        public bool isusercancel { get; set; }
public string notes { get; set; }
        
        public long staffid { get; set; }
        public string staffname { get; set; }
        public bool ispaid {  get; set; }
        
        // New columns added to database
        public FileData fileid { get; set; } = new FileData();
        [JsonIgnore]
        public string fileid_json
        {
            get { return JsonSerializer.Serialize(fileid ?? new FileData()); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    fileid = JsonSerializer.Deserialize<FileData>(value) ?? new FileData();
                else
                    fileid = new FileData();
            }
        }
        
        public TaskListData tasklist { get; set; } = new TaskListData();
        [JsonIgnore]
        public string tasklist_json
        {
            get { return JsonSerializer.Serialize(tasklist ?? new TaskListData()); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                {
                    tasklist = JsonSerializer.Deserialize<TaskListData>(value) ?? new TaskListData();
                    // Ensure all tasks have the required fields after deserialization
                    tasklist.EnsureTaskFields();
                }
                else
                {
                    tasklist = new TaskListData();
                }
            }
        }
        
        public DateTime? resheduledate { get; set; }
        public bool ishasreshedule { get; set; }

        /// <summary>Concurrent seats left in this time window (counter minus overlapping bookings). Not a DB column.</summary>
        public int remaining { get; set; }
        /// <summary>Max concurrent bookings for this window (timing.counter). Not a DB column.</summary>
        public int capacity { get; set; }
        /// <summary>False when appointmentdate is beyond timing.openbefore. Not a DB column.</summary>
        public bool is_within_booking_window { get; set; } = true;
                public class AttributesData
                {

         public   List<SelectedService> servicelist { get; set; } = new List<SelectedService>();
        }
        
        public class FileData
        {
            public List<FileItem> files { get; set; } = new List<FileItem>();
        }
        
        public class FileItem
        {
            public long id { get; set; }
            public string filename { get; set; }
            public string filepath { get; set; }
            public string filetype { get; set; }
            public long filesize { get; set; }
            public DateTime uploadedon { get; set; }
            public string uploadedby { get; set; }
        }
        
        public class TaskListData
        {
            public List<TaskItem> tasks { get; set; } = new List<TaskItem>();
            
            // Ensure all tasks have the required fields after deserialization
            public void EnsureTaskFields()
            {
                if (tasks != null)
                {
                    foreach (var task in tasks)
                    {
                        // Set default values if not present
                        if (string.IsNullOrEmpty(task.datatype))
                        {
                            task.datatype = "string";
                        }
                        if (task.value == null)
                        {
                            task.value = GetDefaultValueForDataType(task.datatype);
                        }
                    }
                }
            }
            
            private object GetDefaultValueForDataType(string datatype)
            {
                switch (datatype?.ToLower())
                {
                    case "string":
                    case "text":
                        return "";
                    case "number":
                    case "integer":
                    case "decimal":
                    case "float":
                        return 0;
                    case "boolean":
                        return false;
                    case "date":
                    case "datetime":
                        return DateTime.Now;
                    case "time":
                        return DateTime.Now;
                    default:
                        return "";
                }
            }
        }
        
        public class TaskItem
        {
            public long id { get; set; }
            public string taskname { get; set; }
            public string description { get; set; }
            public bool iscompleted { get; set; }
            public DateTime? completedon { get; set; }
            public string completedby { get; set; }
            public int priority { get; set; }
            public string datatype { get; set; } = "string";  // Data type from reference value (string, number, boolean, etc.)
            public object value { get; set; } = null;         // Actual value based on data type
        }
                
    }



    public class SelectedService
    {
        public long id { get; set; }
        public string servicename { get; set; } 
        public decimal serviceprice { get; set; } 
        public long servicetimetaken { get; set; } 
        public bool iscombo { get; set; } 
    }


    public class AppoinmentSelectReq
    {
        public long id { get; set; }

        public long organisationid { get; set; } 
        public long organisationlocationid { get; set; }
        public long userid { get; set; }
         
        public DateTime? appointmentdate {  get; set; }
    }
    public class AppoinmentDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }

    public class BookedAppoinmentRes :Appoinment
    {
     

        // From joined users table
        public string username { get; set; }
        public string mobile { get; set; }

        // From joined organisation table
        public string organisationname { get; set; }
        public string secondarytypecode { get; set; }
        public string primarytypecode { get; set; }

        // From joined organisationlocation table
        public string city { get; set; }
    }


    public class ClientsSelectReq
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public string mobilenumber { get; set; }
        /// <summary>When true, include guests from active organisation room bookings.</summary>
        public bool include_room_customers { get; set; }
        /// <summary>0 = return all rows (legacy). When take &gt; 0, apply OFFSET skip LIMIT take.</summary>
        public int skip { get; set; }
        public int take { get; set; }
    }

    public class ClientInfoRes
    {
        public long userid { get; set; }
        public string username { get; set; }
        public string mobile { get; set; }
        public string city { get; set; }
        public bool is_room_customer { get; set; }
        public long room_id { get; set; }
        public string room_number { get; set; } = "";
        public string booking_reference { get; set; } = "";
        public string guest_email { get; set; } = "";
    }


    public class AddStaffReq
    {
        public long appoinmentid { get; set; }
        public string staffname { get; set; }

        public long staffid { get; set; }

        public long organisationid { get; set; }
        public long organisationlocationid { get;set; }
    }

    public class UpdateStatusReq
    {
        public long appoinmentid { get; set; }
        public string statuscode { get; set; }
        public string statustype {  get; set; }
        public long statusid { get; set; }

        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
    }

    public class UpdatePaymentReq
    {
        public long appoinmentid { get; set; }
        public string paymentname { get; set; }
        public string paymentcode { get; set; }
        public string paymenttype { get; set; }
        public long paymenttypeid { get; set; }
        public long statusid { get; set; }

        public string customername { get; set; }
        public long customerid { get; set; }

        public long amount {  get; set; }

        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
    }


    public enum PaymentStatus
    {
        Pending = 0,
        Paid = 1,
        Failed = 2,
        Refunded = 3,
        Cancelled = 4,
        CREATED = 5,
        SUCCESS = 6,
        FAILED = 7,
        REFUNDED = 8
    }

    public enum TimelineStatus
    {
        Payment = 0,
        Assigned = 1,
        Status = 2,
    }
    public enum PaymentMode
    {
        Cash = 0,
        Card = 1,
        UPI = 2,
        BankTransfer = 3,
        Cheque = 4,
        OnlineGateway = 5
    }

    public enum TimelineStatusCode
    {
        [System.ComponentModel.Description("payment")]
        Payment,

        [System.ComponentModel.Description("Staff Assigned")]
        Assigned
    }





}