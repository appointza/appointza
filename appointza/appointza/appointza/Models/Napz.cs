namespace appointza.Models
{
    public class NapzPackageDef
    {
        public string package_id { get; set; } = "";
        public string name { get; set; } = "";
        public int amount_paise { get; set; }
        public int? days { get; set; }
        public int? months { get; set; }
        public bool lifetime { get; set; }
        public int saved_place_limit { get; set; }
    }

    public class NapzEntitlement
    {
        public const string FreeTrialProductId = "napz_free_trial_10_days";

        public long userid { get; set; }
        public long organisationid { get; set; }
        public string tier { get; set; } = "free";
        public string? product_id { get; set; }
        public DateTime? expires_at { get; set; }
        public bool is_lifetime { get; set; }
        public int saved_place_limit { get; set; } = 3;
        public bool free_trial_used { get; set; }
        public bool is_premium =>
            is_lifetime
            || string.Equals(tier, "lifetime", StringComparison.OrdinalIgnoreCase)
            || (string.Equals(tier, "premium", StringComparison.OrdinalIgnoreCase)
                && expires_at.HasValue
                && expires_at.Value > DateTime.UtcNow);
    }

    public class NapzEnsureUserRes
    {
        public long userid { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; } = ProductOrganisationMarkers.NapzName;
        public string product { get; set; } = ProductCodes.Napz;
        public NapzEntitlement entitlement { get; set; } = new();
    }

    public class NapzCreateOrderReq
    {
        public string package_id { get; set; } = "";
    }

    public class NapzCreateOrderRes
    {
        public string orderId { get; set; } = "";
        public string key { get; set; } = "";
        public int amountPaise { get; set; }
        public string currency { get; set; } = "INR";
        public string receipt { get; set; } = "";
        public string package_id { get; set; } = "";
    }

    public class NapzVerifyPaymentReq
    {
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_payment_id { get; set; } = "";
        public string razorpay_signature { get; set; } = "";
    }

    public static class NapzCatalog
    {
        public static readonly IReadOnlyDictionary<string, NapzPackageDef> Packages =
            new Dictionary<string, NapzPackageDef>(StringComparer.OrdinalIgnoreCase)
            {
                ["napz_daily"] = new NapzPackageDef
                {
                    package_id = "napz_daily",
                    name = "1 Day Premium",
                    amount_paise = 900,
                    days = 1,
                    saved_place_limit = 10,
                },
                ["napz_10_days"] = new NapzPackageDef
                {
                    package_id = "napz_10_days",
                    name = "10-Day Premium",
                    amount_paise = 2900,
                    days = 10,
                    saved_place_limit = 10,
                },
                ["napz_monthly"] = new NapzPackageDef
                {
                    package_id = "napz_monthly",
                    name = "1 Month Premium",
                    amount_paise = 4900,
                    months = 1,
                    saved_place_limit = 50,
                },
                ["napz_six_months"] = new NapzPackageDef
                {
                    package_id = "napz_six_months",
                    name = "6-Month Premium",
                    amount_paise = 19900,
                    months = 6,
                    saved_place_limit = 50,
                },
                ["napz_yearly"] = new NapzPackageDef
                {
                    package_id = "napz_yearly",
                    name = "1 Year Premium",
                    amount_paise = 39900,
                    months = 12,
                    saved_place_limit = 200,
                },
                ["napz_lifetime"] = new NapzPackageDef
                {
                    package_id = "napz_lifetime",
                    name = "Lifetime Premium",
                    amount_paise = 399900,
                    lifetime = true,
                    saved_place_limit = 500,
                },
            };

        public static bool TryGet(string packageId, out NapzPackageDef def)
        {
            return Packages.TryGetValue(packageId?.Trim() ?? "", out def!);
        }
    }

    public class NapzProfile
    {
        public long userid { get; set; }
        public string? firebase_uid { get; set; }
        public string name { get; set; } = "";
        public string email { get; set; } = "";
        public string mobile { get; set; } = "";
        public string pincode { get; set; } = "";
        public string? photo_url { get; set; }
        public string? place_name { get; set; }
        public double? destination_lat { get; set; }
        public double? destination_lng { get; set; }
        public int? alert_radius { get; set; }
    }

    public class NapzSavedPlace
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public double lat { get; set; }
        public double lng { get; set; }
        public int radius { get; set; } = 1000;
        public string createdAt { get; set; } = "";
    }

    public class NapzActiveDestinationReq
    {
        public string placeName { get; set; } = "";
        public double lat { get; set; }
        public double lng { get; set; }
        public int alertRadius { get; set; } = 1000;
    }

    public class NapzPlaceSearchReq
    {
        public string query { get; set; } = "";
        public double? lat { get; set; }
        public double? lng { get; set; }
    }

    public class NapzPlaceSearchHit
    {
        public string display_name { get; set; } = "";
        public string lat { get; set; } = "";
        public string lon { get; set; } = "";
        public string type { get; set; } = "google_place";
        public double importance { get; set; }
    }

    public class NapzReverseGeocodeReq
    {
        public double lat { get; set; }
        public double lng { get; set; }
    }

    public class NapzReverseGeocodeRes
    {
        public string display_name { get; set; } = "";
    }

    public class NapzLatLngAddress
    {
        public double lat { get; set; }
        public double lng { get; set; }
        public string? address { get; set; }
    }

    public class NapzJourneyEstimateReq
    {
        public NapzLatLngAddress origin { get; set; } = new();
        public NapzLatLngAddress destination { get; set; } = new();
    }

    public class NapzNarrateReq
    {
        public string lang { get; set; } = "en";
        public List<NapzNarrateStop> stops { get; set; } = new();
    }

    public class NapzNarrateStop
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string kind { get; set; } = "";
        public string tip { get; set; } = "";
    }

    public class NapzNarrateRes
    {
        public Dictionary<string, string>? descriptions { get; set; }
        public string reason { get; set; } = "ok";
    }

    public class NapzTripSaveReq
    {
        public string trip_id { get; set; } = "";
        public string? share_code { get; set; }
        public string plan_json { get; set; } = "{}";
    }

    public class NapzTripRow
    {
        public string trip_id { get; set; } = "";
        public string? share_code { get; set; }
        public string plan_json { get; set; } = "{}";
        public string created_at { get; set; } = "";
    }

    /// <summary>Full Firebase → Appointza payload (client reads Firestore, server writes Postgres).</summary>
    public class NapzFirebaseImportBundle
    {
        public string? firebase_uid { get; set; }
        public NapzProfile? profile { get; set; }
        public List<NapzSavedPlace> places { get; set; } = new();
        public List<NapzTripSaveReq> trips { get; set; } = new();
        public List<NapzSharedTripImport> shared_trips { get; set; } = new();
        public NapzFirebaseEntitlementImport? entitlement { get; set; }
    }

    public class NapzSharedTripImport
    {
        public string share_code { get; set; } = "";
        public string plan_json { get; set; } = "{}";
    }

    public class NapzFirebaseEntitlementImport
    {
        public string tier { get; set; } = "free";
        public string? product_id { get; set; }
        public DateTime? expires_at { get; set; }
        public bool is_lifetime { get; set; }
        public int saved_place_limit { get; set; } = 3;
        public bool free_trial_used { get; set; }
        public bool premium { get; set; }
    }

    public class NapzFirebaseImportRes
    {
        public long userid { get; set; }
        public int places { get; set; }
        public int trips { get; set; }
        public int shared_trips { get; set; }
        public bool profile { get; set; }
        public bool entitlement { get; set; }
        public string message { get; set; } = "ok";
    }
}
