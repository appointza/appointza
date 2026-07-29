using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class Timeline
    {
        public long id { get; set; }
public long organisationlocationid { get; set; }
public long organisationid { get; set; }
public long appoinmentid { get; set; }
public long tasktypeid { get; set; }
public string taskcode { get; set; }
public string tasktype { get; set; }
public string description { get; set; }
public long customerid { get; set; }
public long staffid { get; set; }
public string staffname { get; set; }
public string appoinmenstatustype { get; set; }
public long appoinmentstatusid { get; set; }
public string apoinmentstatuscode { get; set; }
public long descriptionimageid { get; set; }
public long paymentid { get; set; }
public long paymentmodetypeid { get; set; }
public string paymentmodetype { get; set; }
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
public string notes { get; set; }
        
                public class AttributesData
                {

                }  
                
    }
    public class TimelineSelectReq
    {
        public long id { get; set; }
        public long appointmentid {  get; set; }
    }
    public class TimelineDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}