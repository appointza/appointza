namespace appointza.Models
{
    public class CrmPlaceSearchReq
    {
        public long? organisation_id { get; set; }
        public string query { get; set; } = "";
        public double? lat { get; set; }
        public double? lng { get; set; }
        public int radius_meters { get; set; } = 15000;
        public bool require_phone { get; set; }
        public bool require_website { get; set; }
        public int limit { get; set; } = 20;
    }

    public class CrmDiscoveredPlace
    {
        public string place_id { get; set; } = "";
        public string name { get; set; } = "";
        public string address { get; set; } = "";
        public string phone { get; set; } = "";
        public string website { get; set; } = "";
        public string google_maps_url { get; set; } = "";
        public double lat { get; set; }
        public double lng { get; set; }
        public double? rating { get; set; }
        public bool already_saved { get; set; }
        public string saved_reason { get; set; } = "";
    }

    public class CrmPlaceSearchRes
    {
        public List<CrmDiscoveredPlace> places { get; set; } = new();
        public string status { get; set; } = "";
        public string next_page_token { get; set; } = "";
    }

    public class CrmSavePlaceAsLeadReq
    {
        public long? organisation_id { get; set; }
        public CrmDiscoveredPlace place { get; set; } = new();
    }
}
