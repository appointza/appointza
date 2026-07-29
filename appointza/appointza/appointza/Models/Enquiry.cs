namespace appointza.Models
{
    public class Enquiry
    {
        public long id { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string message { get; set; }
        public long organisation_id { get; set; }
        public long created_by { get; set; }
        public string notes { get; set; }
        public string status { get; set; } = "new";
        public string source { get; set; }
        public bool is_active { get; set; } = true;
        public string ip_address { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class EnquirySelectReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string status { get; set; }
        public string source { get; set; }
        public bool? is_active { get; set; }
    }

    public class EnquiryDeleteReq
    {
        public long id { get; set; }
    }
}

