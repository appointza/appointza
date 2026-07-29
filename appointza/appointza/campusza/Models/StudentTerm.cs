using System.Text.Json.Serialization;
using System.Text.Json;
using appointza.Models;

namespace appointza.Models.Campusza
{
    public class StudentTerm
    {
        public long id { get; set; }
        public long studentid { get; set; }
        public string studentname { get; set; }
        public string studentgrade { get; set; }
        public long termid { get; set; }
        public string termname { get; set; }
        public string academicyear { get; set; }
        public string status { get; set; } // active, completed, withdrawn
        public long assignedby { get; set; }
        public string assignedbyname { get; set; }
        public DateTime assigneddate { get; set; }
        
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public string notes { get; set; }

        public string fee_json { get; set; }
        public string certificates_json { get; set; }

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
        
        public class AttributesData
        {
        }
    }

    public class StudentTermSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public long studentid { get; set; }
        public long termid { get; set; }
        public string academicyear { get; set; }
        public string status { get; set; }
    }

    public class StudentTermDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
