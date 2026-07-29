using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class OrganizationServices
    {
        public long id { get; set; }
public long prize { get; set; }
public long timetaken { get; set; }

                                    public ServicesidsData servicesids { get; set; }
                                    [JsonIgnore]
                                    public string servicesids_json
                                    {
                                        get { return JsonSerializer.Serialize(servicesids); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                servicesids = JsonSerializer.Deserialize<ServicesidsData>(value);
                                        }
                                    }
                                
public bool Iscombo { get; set; }
public long offerprize { get; set; }
public string Servicename { get; set; }
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
        
                public class ServicesidsData
                {

                }  
                

                public class AttributesData
                {

                }  
                
    }
    public class OrganizationServicesSelectReq
    {
        public long id { get; set; }
    }
    public class OrganizationServicesDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}