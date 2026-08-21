namespace appointza.Models.Hospitality
{
    public class GuestHospitalityBookingIndexReq
    {
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public string? room_id { get; set; }
        public string? package_id { get; set; }
        public string? check_in { get; set; }
        public string? check_out { get; set; }
        public string? check_in_time { get; set; }
        public string? check_out_time { get; set; }
    }

    public class GuestHospitalityBookingQuoteReq
    {
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public string check_in { get; set; } = "";
        public string check_out { get; set; } = "";
        public string? room_id { get; set; }
        public int persons { get; set; } = 2;
        public int extra_beds { get; set; }
        public List<string>? package_ids { get; set; }
        public List<string>? guest_service_ids { get; set; }
        public string? check_in_time { get; set; }
        public string? check_out_time { get; set; }
    }

    public class GuestHospitalityBookingCreateReq
    {
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public string room_id { get; set; } = "";
        public string guest_name { get; set; } = "";
        public string phone { get; set; } = "";
        public string? email { get; set; }
        public string check_in { get; set; } = "";
        public string check_out { get; set; } = "";
        public string check_in_time { get; set; } = "";
        public string check_out_time { get; set; } = "";
        public int persons { get; set; } = 2;
        public int extra_beds { get; set; }
        public List<string> package_ids { get; set; } = [];
        public List<string> guest_service_ids { get; set; } = [];
    }

    public class HospitalityBookingPackageLine
    {
        public string package_id { get; set; } = "";
        public string name { get; set; } = "";
        public string price_label { get; set; } = "";
        public string kind { get; set; } = "standard";
        public bool includes_room { get; set; } = true;
        public decimal unit_price { get; set; }
        public decimal total { get; set; }
    }

    public class HospitalityBookingServiceLine
    {
        public string service_id { get; set; } = "";
        public string name { get; set; } = "";
        public string price_label { get; set; } = "";
        public decimal unit_price { get; set; }
        public int quantity { get; set; } = 1;
        public decimal total { get; set; }
    }

    public class HospitalityBookingQuote
    {
        public string booking_type { get; set; } = "overnight";
        public int nights { get; set; }
        public int hours { get; set; }
        public int duration { get; set; }
        public string duration_label { get; set; } = "";
        public decimal room_total { get; set; }
        public decimal extra_bed_total { get; set; }
        public decimal extra_guest_total { get; set; }
        public decimal packages_total { get; set; }
        public List<HospitalityBookingPackageLine> packages { get; set; } = [];
        public decimal services_total { get; set; }
        public List<HospitalityBookingServiceLine> services { get; set; } = [];
        public decimal subtotal { get; set; }
        public decimal tax { get; set; }
        public decimal discount { get; set; }
        public decimal total { get; set; }
        public int max_extra_beds { get; set; }
        public int max_persons { get; set; }
        public int extra_beds { get; set; }
        public int persons { get; set; }
        public decimal extra_bed_charge_per_night { get; set; }
        public decimal price_per_hour { get; set; }
        public int minimum_hours { get; set; }
    }

    public class GuestHospitalityBookingResult
    {
        public string booking_code { get; set; } = "";
        public string booking_id { get; set; } = "";
        public string room_number { get; set; } = "";
        public string room_name { get; set; } = "";
        public HospitalityBookingQuote quote { get; set; } = new();
        public string guest_name { get; set; } = "";
        public string check_in { get; set; } = "";
        public string check_out { get; set; } = "";
        public string check_in_time { get; set; } = "";
        public string check_out_time { get; set; } = "";
        public int persons { get; set; }
        public int extra_beds { get; set; }
    }

    public class PublicBookableRoom
    {
        public string id { get; set; } = "";
        public string room_number { get; set; } = "";
        public string room_name { get; set; } = "";
        public string room_type { get; set; } = "";
        public int floor_number { get; set; }
        public RoomCapacityData capacity { get; set; } = new();
        public RoomPricingData pricing { get; set; } = new();
        public List<string> amenities { get; set; } = [];
        public string main_photo { get; set; } = "";
        public List<string> gallery_photos { get; set; } = [];
        /// <summary>True when the Index check-in/out window does not overlap an existing stay.</summary>
        public bool available_for_dates { get; set; } = true;
    }
}
