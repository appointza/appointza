namespace appointza.Models.AppointzaStay;

public record ProfileSection(string Id, string Title, string Group, string Partial, bool Wide = false)
{
    public static readonly ProfileSection[] All =
    [
        new("basic", "Basic information", "General", "Partials/_Basic"),
        new("location", "Location", "General", "Partials/_Location"),
        new("contact", "Contact", "General", "Partials/_Contact"),
        new("policies", "Check-in & policies", "General", "Partials/_Policies"),
        new("schedule", "Slots & closures", "General", "Partials/_Schedule", Wide: true),
        new("website", "Website & domain", "Website", "Partials/_Website"),
        new("uploads", "Images & assets", "Website", "Partials/_Uploads", Wide: true),
        new("seo", "SEO", "Website", "Partials/_Seo"),
        new("messaging", "SMS & WhatsApp", "Settings", "Partials/_Messaging", Wide: true),
        new("payments", "Payments (Razorpay)", "Settings", "Partials/_Payments", Wide: true),
        new("weather", "Weather", "Settings", "Partials/_Weather"),
        new("highlights", "Highlights", "Content", "Partials/_Highlights", Wide: true),
        new("amenities", "Amenities", "Content", "Partials/_Amenities", Wide: true),
        new("packages", "Packages", "Content", "Partials/_Packages", Wide: true),
        new("guest-services", "Guest services", "Content", "Partials/_GuestServices", Wide: true),
        new("offers", "Offers", "Content", "Partials/_Offers", Wide: true),
        new("images", "Property images", "Content", "Partials/_Images", Wide: true),
        new("nearby", "Nearby places", "Content", "Partials/_Nearby"),
        new("activities", "Activities", "Content", "Partials/_Activities"),
        new("reviews", "Reviews", "Content", "Partials/_Reviews", Wide: true),
        new("food", "Food menu", "Content", "Partials/_Food", Wide: true),
        new("travel", "Travel information", "Content", "Partials/_Travel"),
        new("faq", "FAQ", "Content", "Partials/_Faq", Wide: true),
    ];
}

public static class ProfileSectionCatalog
{
    public static ProfileSection[] All => ProfileSection.All;

    public static bool IsValid(string? id) =>
        !string.IsNullOrWhiteSpace(id) && All.Any(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));

    public static string Normalize(string? id) =>
        IsValid(id) ? All.First(s => s.Id.Equals(id!, StringComparison.OrdinalIgnoreCase)).Id : "basic";

    public static ProfileSection Get(string id) =>
        All.First(s => s.Id.Equals(Normalize(id), StringComparison.OrdinalIgnoreCase));

    public static int CountFor(Organisation org, string id) => id switch
    {
        "highlights" => org.Highlights.Count,
        "amenities" => org.Amenities.Count,
        "packages" => org.Packages.Count,
        "guest-services" => org.GuestServices.Count,
        "offers" => org.Offers.Count,
        "images" => org.Images.Count,
        "uploads" => org.Assets.Count(a =>
            AssetCatalog.IsImageAsset(a) && a.Category != AssetCategory.logo && a.Id != org.LogoAssetId),
        "nearby" => org.NearbyPlaces.Count,
        "activities" => org.Activities.Count,
        "reviews" => org.Reviews.Count,
        "food" => org.FoodMenu.Count,
        "travel" => org.TravelInfo.Count + org.ContactInfo.TravelDistances.Count,
        "faq" => org.Faq.Count,
        "schedule" => org.Slots.Count + org.Closures.Count,
        _ => 0,
    };
}
