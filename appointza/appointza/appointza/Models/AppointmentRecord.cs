using System.Text.Json.Serialization;
using System.Text.Json;

namespace appointza.Models
{
    public class AppointmentRecord
    {
        public long id { get; set; }
        public long userid { get; set; }
        public long organisationid { get; set; }
        public DateTime appointmentdate { get; set; }
        public int status { get; set; }
        public bool ishasreschedule { get; set; }
        
        public List<long> imageids { get; set; } = new List<long>();
        
        [JsonIgnore]
        public string imageids_json
        {
            get { return JsonSerializer.Serialize(imageids ?? new List<long>()); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                {
                    try
                    {
                        imageids = JsonSerializer.Deserialize<List<long>>(value) ?? new List<long>();
                    }
                    catch
                    {
                        imageids = new List<long>();
                    }
                }
                else
                {
                    imageids = new List<long>();
                }
            }
        }
        
        public RecordData record { get; set; } = new RecordData();
        
        [JsonIgnore]
        public string record_json
        {
            get { return JsonSerializer.Serialize(record ?? new RecordData()); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    record = JsonSerializer.Deserialize<RecordData>(value) ?? new RecordData();
                else
                    record = new RecordData();
            }
        }
        
        public FileIdsData fileids { get; set; } = new FileIdsData();
        
        [JsonIgnore]
        public string fileids_json
        {
            get { return JsonSerializer.Serialize(fileids ?? new FileIdsData()); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    fileids = JsonSerializer.Deserialize<FileIdsData>(value) ?? new FileIdsData();
                else
                    fileids = new FileIdsData();
            }
        }
        
        public DateTime createdon { get; set; }
        public DateTime modifiedon { get; set; }
        public long modifiedby { get; set; }
        
        public class RecordData
        {
            public string report { get; set; } = "";
            public string notes { get; set; } = "";
            public Dictionary<string, object> additionalData { get; set; } = new Dictionary<string, object>();
        }
        
        public class FileIdsData
        {
            public List<FileIdItem> files { get; set; } = new List<FileIdItem>();
        }
        
        public class FileIdItem
        {
            public long id { get; set; }
            public string filename { get; set; } = "";
            public string filepath { get; set; } = "";
            public string filetype { get; set; } = "";
            public long filesize { get; set; }
            public DateTime? uploadedon { get; set; }
            public string uploadedby { get; set; } = "";
        }
    }
    
    public class AppointmentRecordSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long userid { get; set; }
        public DateTime? appointmentdate { get; set; }
        public int? status { get; set; }
        public bool? ishasreschedule { get; set; }
    }
    
    public class AppointmentRecordDeleteReq
    {
        public long id { get; set; }
    }
}

