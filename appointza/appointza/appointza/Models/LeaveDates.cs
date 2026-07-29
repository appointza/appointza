using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class LeaveDates
    {
        public long id { get; set; }
public long organizationlocationid { get; set; }
        public TimeSpan start_time { get; set; }
        public TimeSpan end_time { get; set; }
public bool isfullday { get; set; }
public DateTime leaveon { get; set; }
public int organizationid { get; set; }
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
public long parentid { get; set; }
public bool isfactory { get; set; }
public string notes { get; set; }
        
                public class AttributesData
                {

                }  
                
    }
    public class LeaveDatesSelectReq
    {
        public long id { get; set; }

        public long organizationid {  get; set; }
        public long organizationlocationid {  get; set; }

        public DateTime leaveon {  get; set; }
    }
    public class LeaveDatesDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }

    public class Leavereq
    {
        public long leaveid { get; set; }
        public long organisationlocationid { get; set; }
        public long organisationid { get; set; }
        public DateTime appointmentdate { get; set; }

        public TimeSpan start_time {  get; set; }
        public TimeSpan end_time {  get; set; }

        public Boolean isforce {  get; set; }

        public Boolean isfullday {  get; set; }

    }
}