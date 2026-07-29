using System.Text.Json.Serialization;
using System.Text.Json;

namespace appointza.Models
{
    public class Website
    {
        public long id { get; set; }
        public long user_id { get; set; }
        public string name { get; set; }
        public string type { get; set; } // 'normal' or 'appointza'
        
        public WebsiteData data { get; set; } = new WebsiteData();
        
        [JsonIgnore]
        public string data_json
        {
            get { return JsonSerializer.Serialize(data); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    data = JsonSerializer.Deserialize<WebsiteData>(value) ?? new WebsiteData();
            }
        }
        
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public bool export_paid { get; set; } = false;
        public DateTime? export_payment_date { get; set; }
        public string? export_payment_order_id { get; set; }

        public class WebsiteData
        {
            public Dictionary<string, PageData> pages { get; set; } = new Dictionary<string, PageData>();
            public string currentPage { get; set; } = "home";
        }

        public class PageData
        {
            public string id { get; set; }
            public string name { get; set; }
            public List<BlockData> blocks { get; set; } = new List<BlockData>();
        }

        public class BlockData
        {
            public string id { get; set; }
            public string type { get; set; }
            public Dictionary<string, object> data { get; set; } = new Dictionary<string, object>();
        }
    }

    public class WebsiteSelectReq
    {
        public long id { get; set; }
        public long user_id { get; set; }
        public string type { get; set; }
    }

    public class WebsiteDeleteReq
    {
        public long id { get; set; }
        public long user_id { get; set; }
    }

    public class WebsiteExportPaymentSuccessReq
    {
        public long website_id { get; set; }
        public string order_id { get; set; }
    }

    public class WebsiteExportHtmlSaveReq
    {
        public long website_id { get; set; }
        public string html_content { get; set; }
        public string website_name { get; set; }
    }
}

