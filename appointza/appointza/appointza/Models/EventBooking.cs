namespace appointza.Models
{
    public class EventBooking
    {
        public long id { get; set; }
        public long event_id { get; set; }
        public long user_id { get; set; }
        public int number_of_people { get; set; } = 1;
        public decimal? total_amount { get; set; }
        public string payment_status { get; set; } = "pending"; // 'pending', 'paid', 'failed', 'refunded'
        public string payment_reference { get; set; } = "";
        public string check_in_status { get; set; } = "not_checked_in"; // 'not_checked_in', 'checked_in', 'cancelled'
        public string confirmation_status { get; set; } = "pending"; // 'pending', 'approved', 'rejected'
        public string notes { get; set; } = ""; // Stores names when number_of_people > 1
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public bool isactive { get; set; } = true;
        public string user_name { get; set; } = ""; // User's name from users table
        public string user_mobile { get; set; } = ""; // User's mobile number from users table
    }
    
    public class EventBookingSelectReq
    {
        public long id { get; set; }
        public long event_id { get; set; }
        public long user_id { get; set; }
        public string payment_status { get; set; } = "";
        public string check_in_status { get; set; } = "";
        public string confirmation_status { get; set; } = "";
    }
    
    public class EventBookingDeleteReq
    {
        public long id { get; set; }
    }
}

