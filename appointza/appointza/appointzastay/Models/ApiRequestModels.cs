namespace appointza.Models.AppointzaStay;

public class RoomIdReq
{
    public string id { get; set; } = "";
}

public class RoomStatusUpdateReq : RoomIdReq
{
    public RoomStatus status { get; set; }
}

public class RoomCleaningAssignReq : RoomIdReq
{
    public string staffId { get; set; } = "";
    public bool moveToCleaning { get; set; }
}

public class RoomSaveReq
{
    public Room room { get; set; } = new();
    public string[]? selectedAmenities { get; set; }
    public string[]? galleryPhotos { get; set; }
}

public class UserSaveReq
{
    public User user { get; set; } = new();
    public string[]? permissions { get; set; }
}

public class DashboardStatsDto
{
    public int rooms { get; set; }
    public int users { get; set; }
    public int customers { get; set; }
    public int packages { get; set; }
}

public class OrganisationBasicSaveReq
{
    public string name { get; set; } = "";
    public string? tagline { get; set; }
    public string? description { get; set; }
    public string? slug { get; set; }
    public string? propertyType { get; set; }
    public string? bookingType { get; set; }
    public int? minimumHours { get; set; }
}

public class OrganisationLocationSaveReq
{
    public string? address { get; set; }
    public string? city { get; set; }
    public string? state { get; set; }
    public string? country { get; set; }
    public string? pincode { get; set; }
    public decimal? latitude { get; set; }
    public decimal? longitude { get; set; }
}

public class OrganisationContactSaveReq
{
    public string? phone { get; set; }
    public string? whatsapp { get; set; }
    public string? email { get; set; }
    public string? mapEmbedUrl { get; set; }
    public string? directionsUrl { get; set; }
    public string? whatsappLabel { get; set; }
}

public class OrganisationPoliciesSaveReq
{
    public string? checkInTime { get; set; }
    public string? checkOutTime { get; set; }
    /// <summary>fixed | dynamic — overnight guest time behaviour</summary>
    public string? overnightTimeMode { get; set; }
    public string? cancellationPolicy { get; set; }
    public string? paymentPolicy { get; set; }
    public string? petPolicy { get; set; }
    public string? idProofRequired { get; set; }
    public string? refundPolicy { get; set; }
    public string? houseRules { get; set; }
}

public class OrganisationWebsiteSaveReq
{
    public string? subdomain { get; set; }
    public string? websiteUrl { get; set; }
    public string? logoAssetId { get; set; }
}

public class OrganisationWeatherSaveReq
{
    public bool showOnSite { get; set; }
}

public class OrganisationSeoSaveReq
{
    public string? metaTitle { get; set; }
    public string? metaDescription { get; set; }
    public string? keywords { get; set; }
    public string? ogImageUrl { get; set; }
    public string? ogImageAssetId { get; set; }
}

public class AssetUrlSaveReq
{
    public string title { get; set; } = "";
    public AssetCategory category { get; set; }
    public string url { get; set; } = "";
    public string? notes { get; set; }
}

public class BillingModeReq
{
    public string mode { get; set; } = "subscription";
}

public class MarkOnboardingStepReq
{
    public string stepId { get; set; } = "";
    public bool skipped { get; set; }
}
