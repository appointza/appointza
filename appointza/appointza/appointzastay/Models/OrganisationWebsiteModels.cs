namespace appointza.Models.AppointzaStay;

/// <summary>
/// Typed website sections stored inside <see cref="Organisation.Website"/> (SitePage.Blocks).
/// Each section maps to a Site Builder block type. Edit content at /SiteBuilder — saved to organisation.json.
/// Rooms are loaded live from the rooms table/service, not duplicated here.
/// </summary>
public static class WebsiteSectionMap
{
    public const string Navigation = "navigation";
    public const string Hero = "hotel-hero-banner";
    public const string Highlights = "feature-grid";
    public const string About = "hotel-about";
    public const string Rooms = "hotel-room-types";
    public const string AllRooms = "hotel-all-rooms";
    public const string Booking = "hotel-booking";
    public const string Amenities = "hotel-amenities";
    public const string Gallery = "hotel-gallery";
    public const string Nearby = "hotel-attractions";
    public const string ThingsToDo = "services";
    public const string Dining = "services-dining";
    public const string Packages = "hotel-packages";
    public const string Reviews = "hotel-reviews";
    public const string Weather = "stats";
    public const string TravelGuide = "feature-grid-travel";
    public const string Policies = "hotel-policies";
    public const string Faq = "faq";
    public const string Contact = "hotel-contact";
    public const string Payment = "hotel-payment";
    public const string Footer = "footer";
}

public class SitePageMeta
{
    public string Template { get; set; } = "ooty-room-stay";
    public string PropertyName { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Location { get; set; } = "Ooty, Tamil Nadu";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string Country { get; set; } = "";
    public string Pincode { get; set; } = "";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string WebsiteUrl { get; set; } = "";
    public string Subdomain { get; set; } = "";
    public string Locale { get; set; } = "en-IN";
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public List<string> SeoKeywords { get; set; } = [];
    public string? OgImageUrl { get; set; }
}

public class SitePageProfileSync
{
    public bool SyncFromOrganisation { get; set; } = true;
    public DateTime? LastSyncedAt { get; set; }
}

public class WebsiteHeroSection
{
    public string HotelName { get; set; } = "";
    public string Tagline { get; set; } = "";
    public string Description { get; set; } = "";
    public string HeroImageUrl { get; set; } = "";
    public string CtaLabel { get; set; } = "Book Now";
    public string WhatsAppUrl { get; set; } = "";
}

public class WebsiteHighlightItem
{
    public string Icon { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
}

public class WebsiteAboutSection
{
    public string Title { get; set; } = "About Our Property";
    public string Description { get; set; } = "";
    public List<string> LocationHighlights { get; set; } = [];
    public List<string> AmenitiesOverview { get; set; } = [];
}

public class WebsiteContactSection
{
    public string Phone { get; set; } = "";
    public string WhatsApp { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public string MapEmbedUrl { get; set; } = "";
}
