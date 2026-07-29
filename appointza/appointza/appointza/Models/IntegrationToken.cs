namespace appointza.Models
{
    public class IntegrationToken
    {
        public long id { get; set; }
        public string token { get; set; } = "";
        public long userid { get; set; }
        public long organisation_id { get; set; }
        public long location_id { get; set; }
        public long created_by { get; set; }
        public bool is_active { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime? last_used_at { get; set; }
    }

    public class IntegrationContextRes
    {
        public long organisation_id { get; set; }
        public string organisation_name { get; set; } = "";
        public long userid { get; set; }
        public string user_name { get; set; } = "";
        public string user_email { get; set; } = "";
        public long location_id { get; set; }
        public string location_name { get; set; } = "";
    }

    public class IntegrationDataRes
    {
        public IntegrationContextRes context { get; set; } = new IntegrationContextRes();
        public List<Enquiry> leads { get; set; } = new List<Enquiry>();
        public List<ClientInfoRes> customers { get; set; } = new List<ClientInfoRes>();
    }

    public class IntegrationTokenUrlsRes
    {
        public string token { get; set; } = "";
        public string context_url { get; set; } = "";
        public string data_url { get; set; } = "";
        public string export_url { get; set; } = "";
        public IntegrationContextRes context { get; set; } = new IntegrationContextRes();
    }
}
