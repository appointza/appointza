using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class UserSession
    {
        public long id { get; set; }
        public string code { get; set; }
        public long userid { get; set; }
        public DateTime starttime { get; set; }
        public DateTime endtime { get; set; }
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }

        public AttributesData attributes { get; set; } = new AttributesData();
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
    public class UserSessionSelectReq
    {
        public long id { get; set; }
        public long userid { get; set; }
        public string code { get; set; }
    }
    public class UserSessionDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}