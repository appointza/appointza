using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class ReferenceValue
    {
        public long id { get; set; }
public string identifier { get; set; }
public string displaytext { get; set; }
public string description { get; set; }
public string langcode { get; set; }
public int organizationid { get; set; }
public int referencetypeid { get; set; }
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
                    /// <summary>Lower numbers appear first when listing reference values.</summary>
                    public int? DisplayOrder { get; set; }
                }  
                
    }
    public class ReferenceValueSelectReq
    {
        public long id { get; set; }
        public long parentid { get; set; }
        public long referencetypeid { get; set; }
        public long organisationid { get; set; }
        public string identifier { get; set; }
    }
    public class ReferenceValueDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}