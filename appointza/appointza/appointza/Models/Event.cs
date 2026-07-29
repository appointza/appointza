using System.Text.Json.Serialization;
using System.Text.Json;
using appointza.Utils;

namespace appointza.Models
{
    public class Event
    {
        public long id { get; set; }
        public int organisation_id { get; set; }
        public int organisation_location_id { get; set; }
        public string event_name { get; set; }
        public string event_type { get; set; } // 'single', 'range', 'daily'
        [JsonConverter(typeof(DateOnlyNullableJsonConverter))]
        public DateTime? event_date { get; set; }
        [JsonConverter(typeof(DateOnlyNullableJsonConverter))]
        public DateTime? from_date { get; set; }
        [JsonConverter(typeof(DateOnlyNullableJsonConverter))]
        public DateTime? to_date { get; set; }

        /// <summary>Event start time (HH:mm). Blocks overlapping appointment slots.</summary>
        public string start_time { get; set; } = "";

        /// <summary>Event end time (HH:mm). Blocks overlapping appointment slots.</summary>
        public string end_time { get; set; } = "";
        
        public TimingConfigData timing_config { get; set; } = new TimingConfigData();
        [JsonIgnore]
        public string timing_config_json
        {
            get { return timing_config != null ? JsonSerializer.Serialize(timing_config) : "null"; }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    timing_config = JsonSerializer.Deserialize<TimingConfigData>(value);
                else
                    timing_config = new TimingConfigData();
            }
        }
        
        public string payment_type { get; set; } // 'clientpay', 'userpay'
        public decimal entry_amount { get; set; }
        public int slot_limit { get; set; }
        public long remainingslot { get; set; }
        public string dress_code { get; set; }
        public string location { get; set; }
        public string description { get; set; }
        
        public ImagesData images { get; set; } = new ImagesData();
        [JsonIgnore]
        public string images_json
        {
            get { return images != null ? JsonSerializer.Serialize(images) : "null"; }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    images = JsonSerializer.Deserialize<ImagesData>(value);
                else
                    images = new ImagesData();
            }
        }
        
        public bool is_public { get; set; }
        public string status { get; set; } // 'active', 'completed', 'cancelled'
        public decimal? rating { get; set; }
        public int created_by { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public string notes { get; set; }
        public bool isactive { get; set; } = true;
        
        public class TimingConfigData
        {
            public Dictionary<string, List<string>>? Days { get; set; }
            public string? StartTime { get; set; }
            public string? EndTime { get; set; }
        }
        
        public class ImagesData
        {
            public List<long> ImageIds { get; set; } = new List<long>();
        }
    }
    
    public class EventSelectReq
    {
        public long id { get; set; }
        public int organisation_id { get; set; }
        public int organisation_location_id { get; set; }
        public string status { get; set; }
        public bool is_public { get; set; } = true;
        public bool include_past { get; set; } = false;
    }
    
    public class EventDeleteReq
    {
        public long id { get; set; }
    }
}

