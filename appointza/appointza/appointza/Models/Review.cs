namespace appointza.Models
{
    public class Review
    {
        public long id { get; set; }
        public long user_id { get; set; }
        public long? organisation_service_id { get; set; }
        public long? event_id { get; set; }
        public decimal rating { get; set; }
        public string comment { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public bool isactive { get; set; } = true;
    }
    
    public class ReviewSelectReq
    {
        public long id { get; set; }
        public long user_id { get; set; }
        public long? organisation_service_id { get; set; }
        public long? event_id { get; set; }
    }
    
    public class ReviewDeleteReq
    {
        public long id { get; set; }
    }
}

