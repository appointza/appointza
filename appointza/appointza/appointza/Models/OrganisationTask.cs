using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class OrganisationTask
    {
        public long id { get; set; }
public string name { get; set; }
public long organizationid { get; set; }
public long appoinmentid { get; set; }
public string description { get; set; }
public long userid { get; set; }

                                    public DescriptionimageData descriptionimage { get; set; }
                                    [JsonIgnore]
                                    public string descriptionimage_json
                                    {
                                        get { return JsonSerializer.Serialize(descriptionimage); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                descriptionimage = JsonSerializer.Deserialize<DescriptionimageData>(value);
                                        }
                                    }
                                
public string code { get; set; }
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
        public long organisationlocationid { get; set; }
        public long paymentamount { get; set; }
        public string paymenttype { get; set; }
        public bool ispaid { get; set; }

        public class DescriptionimageData
                {

                }  
                

                public class AttributesData
                {

                }  
                
    }
    public class OrganisationTaskSelectReq
    {
        public long id { get; set; }
    }
    public class OrganisationTaskDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}