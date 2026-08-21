using System.Text.Json;
using System.Text.Json.Serialization;

namespace appointza.Models.Hospitality
{
    public static class OrganisationTypeCodes
    {
        public const string Service = "service";
        public const string Hospitality = "hospitality";
        public const string Both = "both";
    }

    public class OrganisationHospitalityProfile
    {
        public long organisation_id { get; set; }
        public string organisation_type { get; set; } = OrganisationTypeCodes.Service;
        public string property_type { get; set; } = "hotel";
        public string booking_type { get; set; } = "overnight";
        public int minimum_hours { get; set; } = 2;
        public string checkin_time { get; set; } = "14:00";
        public string checkout_time { get; set; } = "11:00";
        public string overnight_time_mode { get; set; } = "fixed";
        public string cancellation_policy { get; set; } = "";
        public string payment_policy { get; set; } = "";
        public List<HospitalityPackage> packages { get; set; } = [];
        public List<HospitalityFoodItem> food_menu { get; set; } = [];
        public List<HospitalityNearbyPlace> nearby_places { get; set; } = [];
        public List<HospitalityGuestService> guest_services { get; set; } = [];
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }

        [JsonIgnore]
        public string packages_json
        {
            get => JsonSerializer.Serialize(packages ?? []);
            set => packages = DeserializeJsonList<HospitalityPackage>(value);
        }

        [JsonIgnore]
        public string food_menu_json
        {
            get => JsonSerializer.Serialize(food_menu ?? []);
            set => food_menu = DeserializeJsonList<HospitalityFoodItem>(value);
        }

        [JsonIgnore]
        public string nearby_places_json
        {
            get => JsonSerializer.Serialize(nearby_places ?? []);
            set => nearby_places = DeserializeJsonList<HospitalityNearbyPlace>(value);
        }

        [JsonIgnore]
        public string guest_services_json
        {
            get => JsonSerializer.Serialize(guest_services ?? []);
            set => guest_services = DeserializeJsonList<HospitalityGuestService>(value);
        }

        static List<T> DeserializeJsonList<T>(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) || value == "null")
                return [];
            try
            {
                return JsonSerializer.Deserialize<List<T>>(value) ?? [];
            }
            catch
            {
                return [];
            }
        }
    }

    public class HospitalityProfileSelectReq
    {
        public long organisation_id { get; set; }
    }

    public class HospitalityProfileSettingsReq
    {
        public long organisation_id { get; set; }
        public string organisation_type { get; set; } = OrganisationTypeCodes.Service;
        public string property_type { get; set; } = "hotel";
        public string booking_type { get; set; } = "overnight";
        public int minimum_hours { get; set; } = 2;
        public string checkin_time { get; set; } = "14:00";
        public string checkout_time { get; set; } = "11:00";
        public string overnight_time_mode { get; set; } = "fixed";
        public string cancellation_policy { get; set; } = "";
        public string payment_policy { get; set; } = "";
    }

    public class HospitalityContentSaveReq
    {
        public long organisation_id { get; set; }
        public List<HospitalityPackage>? packages { get; set; }
        public List<HospitalityFoodItem>? food_menu { get; set; }
        public List<HospitalityNearbyPlace>? nearby_places { get; set; }
        public List<HospitalityGuestService>? guest_services { get; set; }
    }

    public class HospitalityPackage
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string price { get; set; } = "";
        public string description { get; set; } = "";
        public string? badge { get; set; }
        public string kind { get; set; } = "stay";
        public bool is_active { get; set; } = true;
        public int sort_order { get; set; }
        public string image_url { get; set; } = "";
        public List<string> includes { get; set; } = [];
        public List<string> add_ons { get; set; } = [];
        public string valid_from { get; set; } = "";
        public string valid_to { get; set; } = "";
        public int minimum_nights { get; set; } = 1;
        public int max_guests { get; set; } = 2;
        public int included_guests { get; set; }
        public decimal extra_guest_charge { get; set; }
        public string room_type { get; set; } = "";
    }

    public class HospitalityFoodItem
    {
        public string meal { get; set; } = "";
        public string title { get; set; } = "";
        public string description { get; set; } = "";
        public List<string> cuisines { get; set; } = [];
    }

    public class HospitalityNearbyPlace
    {
        public string name { get; set; } = "";
        public string distance { get; set; } = "";
        public string? travel_time { get; set; }
        public string? icon { get; set; }
        public string? image_url { get; set; }
        public string? map_url { get; set; }
    }

    public class HospitalityGuestService
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string price { get; set; } = "";
        public string description { get; set; } = "";
        public string category { get; set; } = "other";
        public string icon { get; set; } = "";
        public bool is_active { get; set; } = true;
        public int sort_order { get; set; }
    }

    public class OrganisationRoom
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public string room_number { get; set; } = "";
        public string room_name { get; set; } = "";
        public string room_type { get; set; } = "double";
        public int floor_number { get; set; } = 1;
        public string building_wing { get; set; } = "";
        public string status { get; set; } = "available";
        public RoomCapacityData capacity { get; set; } = new();
        public RoomPricingData pricing { get; set; } = new();
        public List<string> amenities { get; set; } = [];
        public string main_photo { get; set; } = "";
        public List<string> gallery_photos { get; set; } = [];
        public RoomBookingRulesData booking_rules { get; set; } = new();
        public RoomGuestData? guest { get; set; }
        public RoomBookingData? booking { get; set; }
        public RoomPaymentData? payment { get; set; }
        public RoomCleaningAssignmentData? cleaning_assignment { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }

        [JsonIgnore] public string capacity_json { get => JsonSerializer.Serialize(capacity ?? new()); set => capacity = DeserializeObject(value, new RoomCapacityData()); }
        [JsonIgnore] public string pricing_json { get => JsonSerializer.Serialize(pricing ?? new()); set => pricing = DeserializeObject(value, new RoomPricingData()); }
        [JsonIgnore] public string amenities_json { get => JsonSerializer.Serialize(amenities ?? []); set => amenities = DeserializeStringList(value); }
        [JsonIgnore] public string gallery_photos_json { get => JsonSerializer.Serialize(gallery_photos ?? []); set => gallery_photos = DeserializeStringList(value); }
        [JsonIgnore] public string booking_rules_json { get => JsonSerializer.Serialize(booking_rules ?? new()); set => booking_rules = DeserializeObject(value, new RoomBookingRulesData()); }
        [JsonIgnore] public string guest_json { get => guest == null ? "null" : JsonSerializer.Serialize(guest); set => guest = string.IsNullOrWhiteSpace(value) || value == "null" ? null : DeserializeObject(value, new RoomGuestData()); }
        [JsonIgnore] public string booking_json { get => booking == null ? "null" : JsonSerializer.Serialize(booking); set => booking = string.IsNullOrWhiteSpace(value) || value == "null" ? null : DeserializeObject(value, new RoomBookingData()); }
        [JsonIgnore] public string payment_json { get => payment == null ? "null" : JsonSerializer.Serialize(payment); set => payment = string.IsNullOrWhiteSpace(value) || value == "null" ? null : DeserializeObject(value, new RoomPaymentData()); }
        [JsonIgnore] public string cleaning_assignment_json { get => cleaning_assignment == null ? "null" : JsonSerializer.Serialize(cleaning_assignment); set => cleaning_assignment = string.IsNullOrWhiteSpace(value) || value == "null" ? null : DeserializeObject(value, new RoomCleaningAssignmentData()); }

        static T DeserializeObject<T>(string? value, T fallback) where T : new()
        {
            if (string.IsNullOrWhiteSpace(value) || value == "null") return fallback;
            try { return JsonSerializer.Deserialize<T>(value) ?? fallback; }
            catch { return fallback; }
        }

        static List<string> DeserializeStringList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) || value == "null") return [];
            try { return JsonSerializer.Deserialize<List<string>>(value) ?? []; }
            catch { return []; }
        }
    }

    public class RoomCapacityData
    {
        public int adults_allowed { get; set; } = 2;
        public int children_allowed { get; set; } = 1;
        public int total_guests { get; set; } = 3;
        public int extra_beds_allowed { get; set; }
    }

    public class RoomPricingData
    {
        public decimal price_per_night { get; set; }
        public decimal price_per_hour { get; set; }
        public decimal weekend_price { get; set; }
        public decimal extra_guest_charge { get; set; }
        public decimal tax_percentage { get; set; } = 12;
    }

    public class RoomBookingRulesData
    {
        public string room_code { get; set; } = "";
        public string video_url { get; set; } = "";
        public string check_in_time { get; set; } = "14:00";
        public string check_out_time { get; set; } = "11:00";
        public string cancellation_policy { get; set; } = "Free cancellation up to 24 hours before check-in.";
        public int minimum_stay { get; set; } = 1;
        public int maximum_stay { get; set; } = 30;
        public int minimum_hours { get; set; }
        public int maximum_hours { get; set; } = 12;
    }

    public class RoomGuestData
    {
        public string name { get; set; } = "";
        public string phone { get; set; } = "";
        public string? email { get; set; }
    }

    public class RoomBookingData
    {
        public string booking_id { get; set; } = "";
        public string check_in { get; set; } = "";
        public string check_out { get; set; } = "";
        public int nights { get; set; }
    }

    public class RoomPaymentData
    {
        public decimal total { get; set; }
        public decimal paid { get; set; }
        public decimal balance { get; set; }
    }

    public class RoomCleaningAssignmentData
    {
        public long staff_id { get; set; }
        public string staff_name { get; set; } = "";
        public DateTime assigned_at { get; set; }
    }

    public class OrganisationRoomSelectReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
    }

    public class OrganisationRoomDeleteReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class OrganisationRoomStatusReq
    {
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public long? room_id { get; set; }
        public string? date { get; set; }
    }

    public class OrganisationRoomStatusUpdateReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string status { get; set; } = "available";
        public string source { get; set; } = "api";
        public string notes { get; set; } = "";
    }

    public class OrganisationRoomIdReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class OrganisationRoomStatusEvent
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public long organisation_room_id { get; set; }
        public string booking_id { get; set; } = "";
        public string from_status { get; set; } = "";
        public string to_status { get; set; } = "";
        public string event_type { get; set; } = "";
        public long? changed_by_user_id { get; set; }
        public string changed_by_name { get; set; } = "";
        public string source { get; set; } = "api";
        public string notes { get; set; } = "";
        public DateTime occurred_at { get; set; }
        public DateTime created_at { get; set; }
    }

    public class OrganisationRoomStatusEventSelectReq
    {
        public long organisation_id { get; set; }
        public long organisation_room_id { get; set; }
        public string booking_id { get; set; } = "";
        public int limit { get; set; } = 50;
    }

    public class OrganisationRoomStatusBoardRes
    {
        public long organisation_id { get; set; }
        public string today { get; set; } = "";
        public string as_of { get; set; } = "";
        public long? selected_id { get; set; }
        public OrganisationRoom? selected_room { get; set; }
        public Dictionary<string, int> counts { get; set; } = new();
        /// <summary>Ready-to-render status chips (server-computed for as_of date).</summary>
        public List<OrganisationRoomStatusSummaryItem> status_summary { get; set; } = [];
        public List<OrganisationRoomStatusFloorGroup> floors { get; set; } = [];
        public List<OrganisationRoom> rooms { get; set; } = [];
    }

    public class OrganisationRoomStatusSummaryItem
    {
        public string value { get; set; } = "";
        public string label { get; set; } = "";
        public int count { get; set; }
    }

    public class OrganisationRoomStatusFloorGroup
    {
        public int floor_number { get; set; }
        public string label { get; set; } = "";
        public List<OrganisationRoom> rooms { get; set; } = [];
    }
}
