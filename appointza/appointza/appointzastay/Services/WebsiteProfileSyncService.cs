using System.Text.Json;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Maps organisation profile fields (Profile page) onto Site Builder blocks.
/// Profile JSON lists are the source of truth; blocks receive hydrated props on save and read.
/// </summary>
public class WebsiteProfileSyncService
{
  private readonly AssetService _assets;

  public WebsiteProfileSyncService(AssetService assets) => _assets = assets;

  /// <summary>Ensure blocks exist, apply profile data, persist is caller's responsibility.</summary>
  public void SyncFromProfile(Organisation org)
  {
    EnsureWebsite(org);
    ApplyProfile(org, org.Website);
    org.Website.ProfileSync ??= new SitePageProfileSync();
    org.Website.ProfileSync.LastSyncedAt = DateTime.UtcNow;
    org.Website.ProfileSync.SyncFromOrganisation = true;
  }

  /// <summary>Returns a deep copy of the site page with profile data merged into block props.</summary>
  public SitePage HydratePage(Organisation org)
  {
    EnsureWebsite(org);
    var json = JsonSerializer.Serialize(org.Website, JsonOptions.Default);
    var page = JsonSerializer.Deserialize<SitePage>(json, JsonOptions.Default) ?? new SitePage();
    ApplyProfile(org, page);
    return page;
  }

  public void EnsureWebsite(Organisation org)
  {
    org.Website ??= new SitePage();
    org.Website.Settings ??= new SitePageSettings();
    org.Website.Blocks ??= [];
    org.Website.CustomHtml ??= "";

    // Prefer the crisp HTML default for public sites.
    // Keep any existing blocks for the optional blocks-mode editor.
    if (string.IsNullOrWhiteSpace(org.Website.CustomHtml))
    {
      org.Website.CustomHtml = StayDefaultHtmlTemplate.Html;
      org.Website.TemplateMode = "html";
      return;
    }

    if (org.Website.Blocks.Count > 0)
      return;

    if (string.Equals(org.Website.TemplateMode, "html", StringComparison.OrdinalIgnoreCase)
        || string.IsNullOrWhiteSpace(org.Website.TemplateMode))
    {
      org.Website.TemplateMode = "html";
      return;
    }

    org.Website = CreateDefaultSiteFromProfile(org);
  }

  private void ApplyProfile(Organisation org, SitePage page)
  {
    page.Settings ??= new SitePageSettings();
    page.Meta ??= new SitePageMeta();
    page.Meta.PropertyName = org.Name;
    page.Meta.Slug = org.Slug;
    page.Meta.Location = FormatLocation(org);
    page.Meta.Address = org.Address;
    page.Meta.City = org.City;
    page.Meta.State = org.State;
    page.Meta.Country = org.Country;
    page.Meta.Pincode = org.Pincode;
    page.Meta.Latitude = org.Latitude;
    page.Meta.Longitude = org.Longitude;
    page.Meta.WebsiteUrl = org.WebsiteUrl;
    page.Meta.Subdomain = org.Subdomain;
    page.Meta.SeoTitle = string.IsNullOrWhiteSpace(org.Seo.MetaTitle) ? org.Name : org.Seo.MetaTitle;
    page.Meta.SeoDescription = org.Seo.MetaDescription;
    page.Meta.SeoKeywords = org.Seo.Keywords;
    page.Meta.OgImageUrl = org.Seo.OgImageUrl;

    var logoUrl = ResolveLogoUrl(org);
    var fullAddress = FormatAddress(org);
    var whatsappUrl = FormatWhatsAppUrl(org.WhatsApp);

    SetProps(page, WebsiteSectionMap.Navigation, null, new()
    {
      ["logo"] = org.Name,
      ["logoImageUrl"] = logoUrl,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Basic,
    });

    SetProps(page, WebsiteSectionMap.Hero, null, new()
    {
      ["hotelName"] = org.Name,
      ["title"] = org.Name,
      ["tagline"] = org.Tagline,
      ["subtitle"] = org.Tagline,
      ["logoImageUrl"] = logoUrl,
      ["whatsappUrl"] = whatsappUrl,
      ["whatsappLabel"] = org.ContactInfo.WhatsAppLabel ?? "Chat on WhatsApp",
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Basic,
    });

    var heroImage = org.Images.FirstOrDefault(i => i.Category.Contains("hero", StringComparison.OrdinalIgnoreCase))?.Url
                    ?? org.Images.FirstOrDefault()?.Url;
    if (!string.IsNullOrWhiteSpace(heroImage))
      SetProp(page, WebsiteSectionMap.Hero, null, "heroImageUrl", heroImage);

    SetProps(page, WebsiteSectionMap.About, null, new()
    {
      ["title"] = string.IsNullOrWhiteSpace(org.Name) ? "About Our Property" : $"About {org.Name}",
      ["description"] = org.Description,
      ["locationHighlights"] = BuildLocationHighlights(org),
      ["amenitiesOverview"] = org.Amenities.Take(6).Select(a => a.Name).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Basic,
    });

    SetProps(page, WebsiteSectionMap.Highlights, ProfileSectionKeys.Highlights, new()
    {
      ["title"] = "Why Guests Love Us",
      ["columns"] = "3",
      ["features"] = org.Highlights.Select(h => Feature(h.Icon, h.Title, h.Description)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Highlights,
    });

    SetProps(page, WebsiteSectionMap.Rooms, null, new()
    {
      ["title"] = "Rooms & suites",
      ["useLiveRooms"] = true,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Rooms,
    });

    SetProps(page, WebsiteSectionMap.AllRooms, null, new()
    {
      ["title"] = "Our rooms",
      ["subtitle"] = "All rooms from your property, synced from Staff → Rooms.",
      ["useLiveRooms"] = true,
      ["showStatus"] = true,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Rooms,
    });

    SetProps(page, WebsiteSectionMap.Booking, null, new()
    {
      ["useLiveRooms"] = true,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Rooms,
    });

    SetProps(page, WebsiteSectionMap.Amenities, null, new()
    {
      ["title"] = "Amenities & Facilities",
      ["amenities"] = org.Amenities.Select(a => Amenity(a.Icon, a.Name, a.Description)).ToArray(),
      ["amenityGroups"] = org.Amenities
        .Where(a => !string.IsNullOrWhiteSpace(a.Group))
        .GroupBy(a => a.Group)
        .Select(g => new Dictionary<string, object?>
        {
          ["name"] = g.Key,
          ["items"] = g.Select(a => Amenity(a.Icon, a.Name, a.Description)).ToArray(),
        })
        .ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Amenities,
    });

    var galleryVideo = org.Images.FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.VideoUrl));
    var gallery360 = org.Images.FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.Tour360Url));
    SetProps(page, WebsiteSectionMap.Gallery, null, new()
    {
      ["title"] = "Photo Gallery",
      ["galleryItems"] = org.Images.Select(i => GalleryItem(i.Category, i.Label, i.Url)).ToArray(),
      ["videoTourUrl"] = galleryVideo?.VideoUrl ?? "",
      ["tour360Url"] = gallery360?.Tour360Url ?? "",
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Images,
    });

  var (airport, railway) = ExtractTravelDistances(
    org.TravelInfo.Concat(org.ContactInfo.TravelDistances).ToList());
    SetProps(page, WebsiteSectionMap.Nearby, null, new()
    {
      ["title"] = "Nearby Attractions",
      ["airportDistance"] = airport,
      ["railwayDistance"] = railway,
      ["attractions"] = org.NearbyPlaces.Select(p => Attraction(p.Name, FormatPlaceDistance(p), p.ImageUrl, p.MapUrl)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Nearby,
    });

    SetProps(page, WebsiteSectionMap.ThingsToDo, ProfileSectionKeys.Activities, new()
    {
      ["title"] = "Things To Do",
      ["subtitle"] = "Experiences around the property",
      ["services"] = org.Activities.Select(a => Service(a.Title, a.Description, a.Icon)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Activities,
    });

    SetProps(page, WebsiteSectionMap.ThingsToDo, ProfileSectionKeys.Food, new()
    {
      ["title"] = "Food & Dining",
      ["subtitle"] = "Meals and dining options",
      ["services"] = org.FoodMenu.Select(f => Service(
        string.IsNullOrWhiteSpace(f.Meal) ? f.Title : $"{f.Meal}: {f.Title}",
        f.Description)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Food,
    });

    var packageItems = org.Packages
      .Where(p => p.IsActive)
      .OrderBy(p => p.SortOrder)
      .Select(p => Package(p.Id, p.Name, p.Price, p.Description, p.Badge, p.ImageUrl, p.Includes))
      .ToList();

    var offerItems = org.Offers
      .Select(o => Package(
        $"offer:{o.Title}",
        o.Title,
        o.Price,
        string.IsNullOrWhiteSpace(o.ValidUntil) ? o.Description : $"{o.Description} (Valid until {o.ValidUntil})",
        "Offer",
        "",
        []))
      .ToList();

    SetProps(page, WebsiteSectionMap.Packages, null, new()
    {
      ["title"] = "Packages & Offers",
      ["packages"] = packageItems.ToArray(),
      ["offers"] = offerItems.ToArray(),
      ["useLivePackages"] = true,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Packages,
    });

    var avgRating = org.Reviews.Count > 0
      ? org.Reviews.Average(r => r.Rating)
      : 0;

    SetProps(page, WebsiteSectionMap.Reviews, null, new()
    {
      ["title"] = "Guest Reviews",
      ["averageRating"] = Math.Round(avgRating, 1),
      ["totalReviews"] = org.Reviews.Count,
      ["reviews"] = org.Reviews.Select(r => Review(r.Author, r.Rating, r.Quote, r.Date ?? "", r.Photos)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Reviews,
    });

    SetProps(page, WebsiteSectionMap.Weather, null, new()
    {
      ["title"] = string.IsNullOrWhiteSpace(org.Weather.Title) ? "Weather" : org.Weather.Title,
      ["hidden"] = !org.Weather.ShowOnSite,
      ["liveFromLocation"] = org.Weather.ShowOnSite,
      ["locationLabel"] = FormatLocation(org),
      ["latitude"] = org.Latitude,
      ["longitude"] = org.Longitude,
      ["city"] = org.City,
      ["stats"] = org.Weather.ShowOnSite ? Array.Empty<object>() : BuildWeatherStats(org.Weather),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Weather,
    });

    SetProps(page, WebsiteSectionMap.Highlights, ProfileSectionKeys.Travel, new()
    {
      ["title"] = "Travel Guide — How To Reach",
      ["columns"] = "3",
      ["features"] = BuildTravelFeatures(org).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Travel,
    });

    var houseRules = new List<string>(org.Rules.HouseRules);
    if (!string.IsNullOrWhiteSpace(org.Rules.PetPolicy))
      houseRules.Add($"Pets: {org.Rules.PetPolicy}");
    if (!string.IsNullOrWhiteSpace(org.Rules.IdProofRequired))
      houseRules.Add($"ID: {org.Rules.IdProofRequired}");
    if (!string.IsNullOrWhiteSpace(org.PaymentPolicy))
      houseRules.Add(org.PaymentPolicy);

    SetProps(page, WebsiteSectionMap.Policies, null, new()
    {
      ["title"] = "Rules & Policies",
      ["checkIn"] = org.CheckInTime,
      ["checkOut"] = org.CheckOutTime,
      ["cancellation"] = org.CancellationPolicy,
      ["refund"] = org.Rules.RefundPolicy ?? "",
      ["houseRules"] = houseRules.ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Policies,
    });

    SetProps(page, WebsiteSectionMap.Faq, null, new()
    {
      ["title"] = "Frequently Asked Questions",
      ["style"] = "accordion",
      ["items"] = org.Faq.Select(f => Faq(f.Question, f.Answer)).ToArray(),
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Faq,
    });

    var mapEmbedUrl = BuildMapEmbedUrl(org);
    SetProps(page, WebsiteSectionMap.Contact, null, new()
    {
      ["title"] = "Contact Us",
      ["address"] = fullAddress,
      ["city"] = org.City,
      ["state"] = org.State,
      ["country"] = org.Country,
      ["pincode"] = org.Pincode,
      ["latitude"] = org.Latitude,
      ["longitude"] = org.Longitude,
      ["phone"] = org.Phone,
      ["email"] = org.Email,
      ["whatsapp"] = org.WhatsApp,
      ["whatsappLabel"] = org.ContactInfo.WhatsAppLabel ?? "Chat on WhatsApp",
      ["mapEmbedUrl"] = mapEmbedUrl ?? "",
      ["directionsUrl"] = org.ContactInfo.DirectionsUrl ?? "",
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Contact,
    });

    SetProps(page, WebsiteSectionMap.Payment, null, new()
    {
      ["subtitle"] = string.IsNullOrWhiteSpace(org.PaymentPolicy)
        ? "Pay securely via Razorpay. Instant booking confirmation."
        : org.PaymentPolicy,
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Policies,
    });

    SetProps(page, WebsiteSectionMap.Footer, null, new()
    {
      ["logo"] = org.Name,
      ["logoImageUrl"] = logoUrl,
      ["tagline"] = org.Tagline,
      ["websiteUrl"] = org.WebsiteUrl,
      ["customDomainUrl"] = org.CustomDomainUrl,
      ["copyright"] = $"© {DateTime.UtcNow.Year} {org.Name}. All rights reserved.",
      ["useLiveProfile"] = true,
      ["profileSection"] = ProfileSectionKeys.Basic,
    });
  }

  private static SitePage CreateDefaultSiteFromProfile(Organisation org)
  {
    return new SitePage
    {
      Meta = new SitePageMeta
      {
        Template = "hotel-property",
        PropertyName = org.Name,
        Location = FormatLocation(org),
      },
      Settings = new SitePageSettings
      {
        BackgroundColor = "#faf8f5",
        TextColor = "#1a1a1a",
      },
      TemplateMode = "html",
      CustomHtml = StayDefaultHtmlTemplate.Html,
      Blocks = [],
      ProfileSync = new SitePageProfileSync { SyncFromOrganisation = true },
    };
  }

  private string? ResolveLogoUrl(Organisation org)
  {
    if (string.IsNullOrWhiteSpace(org.LogoAssetId))
      return null;
    return _assets.GetAsset(org.LogoAssetId)?.Url;
  }

  private static PageBlock? FindBlock(SitePage page, string type, string? profileSection)
  {
    var matches = page.Blocks.Where(b => b.Type == type).ToList();
    if (matches.Count == 0)
      return null;

    if (string.IsNullOrEmpty(profileSection))
      return matches[0];

    return matches.FirstOrDefault(b =>
      string.Equals(b.Props.GetValueOrDefault("profileSection")?.ToString(), profileSection, StringComparison.OrdinalIgnoreCase))
      ?? matches[0];
  }

  private static void SetProps(SitePage page, string type, string? profileSection, Dictionary<string, object?> props)
  {
    var block = FindBlock(page, type, profileSection);
    if (block == null)
      return;
    foreach (var (key, value) in props)
      block.Props[key] = value;
  }

  private static void SetProp(SitePage page, string type, string? profileSection, string key, object? value)
  {
    var block = FindBlock(page, type, profileSection);
    if (block != null)
      block.Props[key] = value;
  }

  private static IEnumerable<Dictionary<string, object?>> BuildTravelFeatures(Organisation org)
  {
    foreach (var route in org.TravelInfo)
    {
      var description = FormatRouteDistance(route);
      if (!string.IsNullOrWhiteSpace(route.Notes))
        description = string.IsNullOrWhiteSpace(description) ? route.Notes : $"{description} — {route.Notes}";
      yield return Feature(route.Icon ?? "🚗", route.From, description);
    }

    foreach (var route in org.ContactInfo.TravelDistances)
    {
      var description = FormatRouteDistance(route);
      if (!string.IsNullOrWhiteSpace(route.Notes))
        description = string.IsNullOrWhiteSpace(description) ? route.Notes : $"{description} — {route.Notes}";
      yield return Feature(route.Icon ?? "📍", route.From, description);
    }
  }

  private static string? BuildMapEmbedUrl(Organisation org)
  {
    if (!string.IsNullOrWhiteSpace(org.ContactInfo.MapEmbedUrl))
      return org.ContactInfo.MapEmbedUrl;

    if (org.Latitude.HasValue && org.Longitude.HasValue)
      return $"https://maps.google.com/maps?q={org.Latitude.Value},{org.Longitude.Value}&z=15&output=embed";

    return null;
  }

  private static string FormatAddress(Organisation org) =>
    string.Join(", ", new[] { org.Address, org.City, org.State, org.Pincode, org.Country }.Where(s => !string.IsNullOrWhiteSpace(s)));

  private static string FormatLocation(Organisation org)
  {
    var parts = new[] { org.City, org.State, org.Country }.Where(s => !string.IsNullOrWhiteSpace(s));
    var text = string.Join(", ", parts);
    return string.IsNullOrWhiteSpace(text) ? org.Country : text;
  }

  private static string FormatWhatsAppUrl(string whatsapp)
  {
    if (string.IsNullOrWhiteSpace(whatsapp)) return "";
    var digits = new string(whatsapp.Where(char.IsDigit).ToArray());
    return string.IsNullOrEmpty(digits) ? whatsapp : $"https://wa.me/{digits}";
  }

  private static string[] BuildLocationHighlights(Organisation org)
  {
    var items = new List<string>();
    if (!string.IsNullOrWhiteSpace(org.City)) items.Add(org.City);
    if (!string.IsNullOrWhiteSpace(org.State)) items.Add(org.State);
    foreach (var place in org.NearbyPlaces.Take(3))
      items.Add(place.Name);
    return items.ToArray();
  }

  private static (string airport, string railway) ExtractTravelDistances(List<PropertyTravelRoute> routes)
  {
    string airport = "";
    string railway = "";
    foreach (var route in routes)
    {
      var from = route.From ?? "";
      if (from.Contains("airport", StringComparison.OrdinalIgnoreCase))
        airport = FormatRouteDistance(route);
      else if (from.Contains("rail", StringComparison.OrdinalIgnoreCase) || from.Contains("station", StringComparison.OrdinalIgnoreCase))
        railway = FormatRouteDistance(route);
    }
    return (airport, railway);
  }

  private static object[] BuildWeatherStats(PropertyWeatherSettings weather) =>
  [
    Stat(weather.CurrentTemperature, "Current Temperature"),
    Stat(weather.Condition, "Today's Condition"),
    Stat(weather.Forecast, "Forecast"),
    Stat(weather.WeekRange, "This Week"),
  ];

  private static string FormatPlaceDistance(PropertyNearbyPlace place)
  {
    var parts = new List<string> { place.Distance };
    if (!string.IsNullOrWhiteSpace(place.TravelTime))
      parts.Add(place.TravelTime);
    return string.Join(" · ", parts.Where(s => !string.IsNullOrWhiteSpace(s)));
  }

  private static string FormatRouteDistance(PropertyTravelRoute route)
  {
    var parts = new[] { route.Distance, route.TravelTime }.Where(s => !string.IsNullOrWhiteSpace(s));
    return string.Join(" · ", parts);
  }

  private static Dictionary<string, object?> Feature(string? icon, string title, string description) =>
    new() { ["icon"] = icon ?? "✦", ["title"] = title, ["description"] = description };

  private static Dictionary<string, object?> Amenity(string? icon, string name, string description) =>
    new() { ["icon"] = icon ?? "✓", ["name"] = name, ["description"] = description };

  private static Dictionary<string, object?> GalleryItem(string category, string label, string url) =>
    new() { ["category"] = category, ["label"] = label, ["imageUrl"] = url };

  private static Dictionary<string, object?> Attraction(string name, string distance, string? imageUrl = null, string? mapUrl = null)
  {
    var item = new Dictionary<string, object?> { ["name"] = name, ["distance"] = distance };
    if (!string.IsNullOrWhiteSpace(imageUrl))
      item["imageUrl"] = imageUrl;
    if (!string.IsNullOrWhiteSpace(mapUrl))
      item["mapUrl"] = mapUrl;
    return item;
  }

  private static Dictionary<string, object?> Service(string title, string description, string? icon = null)
  {
    var item = new Dictionary<string, object?> { ["title"] = title, ["description"] = description };
    if (!string.IsNullOrWhiteSpace(icon))
      item["icon"] = icon;
    return item;
  }

  private static Dictionary<string, object?> Package(
    string id, string name, string price, string description, string? badge, string imageUrl, List<string> includes)
  {
    var item = new Dictionary<string, object?>
    {
      ["id"] = id,
      ["name"] = name,
      ["price"] = price,
      ["description"] = description,
      ["desc"] = description,
      ["badge"] = badge,
    };
    if (!string.IsNullOrWhiteSpace(imageUrl))
      item["imageUrl"] = imageUrl;
    if (includes.Count > 0)
      item["includes"] = includes.ToArray();
    return item;
  }

  private static Dictionary<string, object?> Review(
    string author, int rating, string quote, string date, List<string> photos)
  {
    var item = new Dictionary<string, object?>
    {
      ["author"] = author,
      ["rating"] = rating,
      ["quote"] = quote,
      ["date"] = date,
    };
    if (photos.Count > 0)
      item["photos"] = photos.ToArray();
    return item;
  }

  private static Dictionary<string, object?> Stat(string value, string label) =>
    new() { ["value"] = value, ["label"] = label };

  private static Dictionary<string, object?> Faq(string question, string answer) =>
    new() { ["question"] = question, ["answer"] = answer };
}

/// <summary>profileSection prop values linking blocks to Profile outlet sections.</summary>
public static class ProfileSectionKeys
{
  public const string Basic = "basic";
  public const string Location = "location";
  public const string Contact = "contact";
  public const string Policies = "policies";
  public const string Website = "website";
  public const string Seo = "seo";
  public const string Highlights = "highlights";
  public const string Amenities = "amenities";
  public const string Packages = "packages";
  public const string Images = "images";
  public const string Nearby = "nearby";
  public const string Activities = "activities";
  public const string Reviews = "reviews";
  public const string Food = "food";
  public const string Travel = "travel";
  public const string Faq = "faq";
  public const string Weather = "weather";
  public const string Rooms = "rooms";
}
