using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class ReferenceType
    {
        public long id { get; set; }
public string identifier { get; set; }
public string displaytext { get; set; }
public string langcode { get; set; }
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
    public class ReferenceTypeSelectReq
    {
        public long id { get; set; }
        public string identifier { get; set; }
        public long referencetypeid { get; set; }
    }
    public class ReferenceTypeDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}