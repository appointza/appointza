namespace appointza.Models.AppointzaStay;

// ── JSON column types for organisations table ─────────────────────────────

public class PropertyHighlight
{
    public string Icon { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
}

public class PropertyAmenityItem
{
    public string Icon { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Group { get; set; } = "";
}

public class PropertyImage
{
  public string? AssetId { get; set; }
  public string Category { get; set; } = "";
  public string Label { get; set; } = "";
  public string Url { get; set; } = "";
  public string? VideoUrl { get; set; }
  public string? Tour360Url { get; set; }
}

public class PropertyNearbyPlace
{
    public string Name { get; set; } = "";
    public string Distance { get; set; } = "";
    public string? TravelTime { get; set; }
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    /// <summary>Organisation asset library id (preferred over raw ImageUrl).</summary>
    public string? ImageAssetId { get; set; }
    public string? MapUrl { get; set; }
}

public class PropertyActivity
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? Icon { get; set; }
}

public class PropertyPackage
{
    public string Id { get; set; } = "";
    public string OrganisationId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Price { get; set; } = "";
    public string Description { get; set; } = "";
    public string? Badge { get; set; }
    /// <summary>stay = includes room; addon = optional extra; standard treated as stay.</summary>
    public string Kind { get; set; } = "stay";
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public string ImageUrl { get; set; } = "";
    /// <summary>Cover image asset library id.</summary>
    public string? ImageAssetId { get; set; }
    public List<string> ImageUrls { get; set; } = [];
    /// <summary>Additional gallery asset library ids.</summary>
    public List<string> ImageAssetIds { get; set; } = [];
    public List<string> Includes { get; set; } = [];
    public List<string> AddOns { get; set; } = [];
    /// <summary>ISO date yyyy-MM-dd (inclusive).</summary>
    public string ValidFrom { get; set; } = "";
    /// <summary>ISO date yyyy-MM-dd (inclusive).</summary>
    public string ValidTo { get; set; } = "";
    public int MinimumNights { get; set; } = 1;
    /// <summary>Hard cap on party / stay size.</summary>
    public int MaxGuests { get; set; } = 2;
    /// <summary>Guests included in the base package price (e.g. 5 for birthday hall).</summary>
    public int IncludedGuests { get; set; } = 0;
    /// <summary>Flat charge per person above IncludedGuests (e.g. ₹300 for each extra guest).</summary>
    public decimal ExtraGuestCharge { get; set; }
    public string RoomType { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Optional add-ons guests can request (birthday cake, balloons, flowers, etc.).</summary>
public class PropertyGuestService
{
    public string Id { get; set; } = "";
    public string OrganisationId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Price { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "other";
    public string Icon { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PropertyOffer
{
    public string Title { get; set; } = "";
    public string Price { get; set; } = "";
    public string Description { get; set; } = "";
    public string? ValidUntil { get; set; }
}

public class PropertyReview
{
    public string Author { get; set; } = "";
    public int Rating { get; set; } = 5;
    public string Quote { get; set; } = "";
    public string? Date { get; set; }
    public List<string> Photos { get; set; } = [];
}

public class PropertyFoodItem
{
    public string Meal { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> Cuisines { get; set; } = [];
}

public class PropertyTravelRoute
{
    public string From { get; set; } = "";
    public string Distance { get; set; } = "";
    public string TravelTime { get; set; } = "";
    public string? Notes { get; set; }
    public string? Icon { get; set; }
}

public class PropertyFaqItem
{
    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
}

public class PropertyWeatherSettings
{
    /// <summary>
    /// When true, the public site shows live weather for the property location (lat/lng or city).
    /// Manual temperature/forecast fields are not required.
    /// </summary>
    public bool ShowOnSite { get; set; }

    /// <summary>True once the owner chose show or hide (completes the onboarding weather step).</summary>
    public bool Configured { get; set; }

    public string Title { get; set; } = "Weather";

    // Legacy manual fields — kept for older data; no longer edited in onboarding.
    public string CurrentTemperature { get; set; } = "";
    public string Condition { get; set; } = "";
    public string Forecast { get; set; } = "";
    public string WeekRange { get; set; } = "";
}

public class PropertyContactInfo
{
    public string? MapEmbedUrl { get; set; }
    public string? DirectionsUrl { get; set; }
    public string? WhatsAppLabel { get; set; }
    public List<PropertyTravelRoute> TravelDistances { get; set; } = [];
}

public class PropertySeo
{
    public string MetaTitle { get; set; } = "";
    public string MetaDescription { get; set; } = "";
    public List<string> Keywords { get; set; } = [];
    public string? OgImageUrl { get; set; }
    public string? OgImageAssetId { get; set; }
}

public class OrganisationMessagingSettings
{
    public bool SmsEnabled { get; set; }
    public string SmsProvider { get; set; } = "";
    public string SmsApiKey { get; set; } = "";
    public string SmsSenderId { get; set; } = "";
    public bool WhatsAppEnabled { get; set; } = true;
    public string WhatsAppApiKey { get; set; } = "";
    public string WhatsAppPhoneNumberId { get; set; } = "";
    public string WhatsAppBusinessNumber { get; set; } = "";
    public string BookingConfirmationTemplate { get; set; } =
        "Hi {guest_name}, your booking {booking_code} at {property_name} is confirmed. Check-in: {check_in}.";
    public string CheckInReminderTemplate { get; set; } =
        "Reminder: Your check-in at {property_name} is tomorrow. We look forward to welcoming you!";
    public string PaymentReceiptTemplate { get; set; } =
        "Payment of {amount} received for booking {booking_code}. Balance: {balance}. Thank you!";
}

/// <summary>
/// Per-organisation Razorpay credentials. Guest payments settle in this merchant account
/// (same model as main Appointza payment_gateway_credentials).
/// </summary>
public class OrganisationPaymentGatewaySettings
{
    public string GatewayName { get; set; } = "razorpay";
    /// <summary>Razorpay Key ID (rzp_…)</summary>
    public string ApiKey { get; set; } = "";
    /// <summary>Razorpay Key Secret</summary>
    public string ApiSecret { get; set; } = "";
    public string UpiId { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
    /// <summary>test | production</summary>
    public string Environment { get; set; } = "test";
    public bool IsActive { get; set; }
    /// <summary>When true, public booking opens Razorpay checkout after creating the reservation.</summary>
    public bool CollectAtBooking { get; set; } = true;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(ApiSecret);

    public bool IsOnlineReady => IsActive && IsConfigured;
}

public class PropertyRules
{
    public List<string> HouseRules { get; set; } = [];
    public string? PetPolicy { get; set; }
    public string? IdProofRequired { get; set; }
    public string? RefundPolicy { get; set; }
}

/// <summary>Bookable time slot template (hourly window or overnight check-in/out).</summary>
public class PropertySlot
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    /// <summary>hourly | overnight</summary>
    public string Kind { get; set; } = "hourly";
    /// <summary>HH:mm — hourly start or overnight check-in.</summary>
    public string StartTime { get; set; } = "10:00";
    /// <summary>HH:mm — hourly end or overnight check-out.</summary>
    public string EndTime { get; set; } = "14:00";
    /// <summary>0=Sun … 6=Sat. Empty = every day.</summary>
    public List<int> DaysOfWeek { get; set; } = [];
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public string Note { get; set; } = "";
}

/// <summary>Closed / leave / holiday period when the property does not accept bookings.</summary>
public class PropertyClosure
{
    public string Id { get; set; } = "";
    /// <summary>leave | holiday | closed | maintenance | other</summary>
    public string Reason { get; set; } = "leave";
    /// <summary>ISO yyyy-MM-dd inclusive.</summary>
    public string FromDate { get; set; } = "";
    /// <summary>ISO yyyy-MM-dd inclusive. Empty = same as FromDate.</summary>
    public string ToDate { get; set; } = "";
    public string Note { get; set; } = "";
}
