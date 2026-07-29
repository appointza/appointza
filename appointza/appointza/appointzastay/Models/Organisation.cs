namespace appointza.Models.AppointzaStay;

/// <summary>
/// Property / organisation — single source for website content, policies, and Site Builder layout.
/// Structured columns map to PostgreSQL; <see cref="Website"/> holds editable block layout from /SiteBuilder.
/// </summary>
public class Organisation
{
    public string Id { get; set; } = DummyIds.Organisation;
    public string OwnerId { get; set; } = SampleUserIds.Owner;
    public string Name { get; set; } = AppBranding.Name;
    /// <summary>Resort / Hotel / Villa / Homestay / Party Hall</summary>
    public PropertyType PropertyType { get; set; } = PropertyType.hotel;
    /// <summary>Overnight (nights) or Hourly (same-day slots). Property decides — not dual booking models.</summary>
    public PropertyBookingType BookingType { get; set; } = PropertyBookingType.overnight;
    /// <summary>Minimum bookable hours when <see cref="BookingType"/> is hourly (e.g. 2).</summary>
    public int MinimumHours { get; set; } = 2;
    /// <summary>URL slug, e.g. ooty-room-stay</summary>
    public string Slug { get; set; } = "";
    public string Tagline { get; set; } = AppBranding.Tagline;
    public string Description { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string Country { get; set; } = "India";
    public string Pincode { get; set; } = "";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string Phone { get; set; } = "";
    public string WhatsApp { get; set; } = "";
    public string Email { get; set; } = "";
    public string CheckInTime { get; set; } = "14:00";
    public string CheckOutTime { get; set; } = "11:00";
    /// <summary>
    /// Overnight only: fixed = guests must use property check-in/out times;
    /// dynamic = guests may change times on the booking form.
    /// </summary>
    public string OvernightTimeMode { get; set; } = "fixed";
    public string CancellationPolicy { get; set; } = "";
    public string PaymentPolicy { get; set; } = "";
    public PropertyRules Rules { get; set; } = new();
    public List<PropertyHighlight> Highlights { get; set; } = [];
    public List<PropertyAmenityItem> Amenities { get; set; } = [];
    public List<PropertyImage> Images { get; set; } = [];
    public List<PropertyNearbyPlace> NearbyPlaces { get; set; } = [];
    public List<PropertyActivity> Activities { get; set; } = [];
    public List<PropertyPackage> Packages { get; set; } = [];
    public List<PropertyGuestService> GuestServices { get; set; } = [];
    public List<PropertyOffer> Offers { get; set; } = [];
    public List<PropertyReview> Reviews { get; set; } = [];
    public List<PropertyFoodItem> FoodMenu { get; set; } = [];
    public List<PropertyTravelRoute> TravelInfo { get; set; } = [];
    public List<PropertyFaqItem> Faq { get; set; } = [];
    /// <summary>Defined bookable slots (hourly windows or overnight templates).</summary>
    public List<PropertySlot> Slots { get; set; } = [];
    /// <summary>Leave / holiday / closed dates when booking is blocked.</summary>
    public List<PropertyClosure> Closures { get; set; } = [];
    public PropertyWeatherSettings Weather { get; set; } = new();
    public PropertyContactInfo ContactInfo { get; set; } = new();
    public PropertySeo Seo { get; set; } = new();
    public OrganisationMessagingSettings Messaging { get; set; } = new();
    public OrganisationPaymentGatewaySettings PaymentGateway { get; set; } = new();
    public OrganisationOnboardingState Onboarding { get; set; } = new();
    public string WebsiteUrl { get; set; } = "";
    public string Subdomain { get; set; } = "";
    public string ReferralCode { get; set; } = "";
    public string? ReferredByOrganisationId { get; set; }
    /// <summary>Platform admin has verified this property.</summary>
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedByUserId { get; set; }
    public string? LogoAssetId { get; set; }
    public List<OrganizationAsset> Assets { get; set; } = [];
    /// <summary>Site builder page (blocks + settings). Edited at /SiteBuilder.</summary>
    public SitePage Website { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string CustomDomain =>
        string.IsNullOrWhiteSpace(Subdomain) ? "" : $"{Subdomain}.{AppBranding.CustomDomainSuffix}";

    public string CustomDomainUrl =>
        string.IsNullOrWhiteSpace(CustomDomain) ? "" : $"https://{CustomDomain}";
}
