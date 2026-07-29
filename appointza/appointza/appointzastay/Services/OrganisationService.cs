using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class OrganisationService
{
    private readonly OrganisationResolver _org;
    private readonly WebsiteProfileSyncService _websiteSync;
    private readonly AssetService _assets;

    public OrganisationService(
        OrganisationResolver org,
        WebsiteProfileSyncService websiteSync,
        AssetService assets)
    {
        _org = org;
        _websiteSync = websiteSync;
        _assets = assets;
    }

    public Organisation Get()
    {
        var org = _org.Current;
        if (SyncPropertyImagesFromAssets(org))
            _org.Save(org);
        return org;
    }

    public void UpdateProfile(string name, string tagline, string websiteUrl, string? logoAssetId, string? subdomain = null)
    {
        var org = _org.Current;
        org.Name = string.IsNullOrWhiteSpace(name) ? AppBranding.Name : name.Trim();
        org.Tagline = (tagline ?? "").Trim();
        org.WebsiteUrl = (websiteUrl ?? "").Trim();
        org.LogoAssetId = string.IsNullOrWhiteSpace(logoAssetId) ? null : logoAssetId;
        if (subdomain != null)
        {
            org.Subdomain = OrganizationDomain.NormalizeSubdomain(subdomain);
            org.WebsiteUrl = OrganizationDomain.BuildPublicWebsiteUrl(
                org.Subdomain, _org.RequestHost(), _org.RequestScheme());
        }
        Persist(org);
    }

    public void SaveMessaging(OrganisationMessagingSettings messaging)
    {
        var org = _org.Current;
        var settings = org.Messaging;
        settings.SmsEnabled = messaging.SmsEnabled;
        settings.SmsProvider = messaging.SmsProvider ?? "";
        settings.SmsSenderId = messaging.SmsSenderId ?? "";
        if (!string.IsNullOrEmpty(messaging.SmsApiKey))
            settings.SmsApiKey = messaging.SmsApiKey;
        settings.WhatsAppEnabled = messaging.WhatsAppEnabled;
        settings.WhatsAppBusinessNumber = messaging.WhatsAppBusinessNumber ?? "";
        settings.WhatsAppPhoneNumberId = messaging.WhatsAppPhoneNumberId ?? "";
        if (!string.IsNullOrEmpty(messaging.WhatsAppApiKey))
            settings.WhatsAppApiKey = messaging.WhatsAppApiKey;
        if (!string.IsNullOrEmpty(messaging.BookingConfirmationTemplate))
            settings.BookingConfirmationTemplate = messaging.BookingConfirmationTemplate;
        if (!string.IsNullOrEmpty(messaging.CheckInReminderTemplate))
            settings.CheckInReminderTemplate = messaging.CheckInReminderTemplate;
        if (!string.IsNullOrEmpty(messaging.PaymentReceiptTemplate))
            settings.PaymentReceiptTemplate = messaging.PaymentReceiptTemplate;
        Persist(org);
    }

    public void SavePaymentGateway(OrganisationPaymentGatewaySettings payment)
    {
        var org = _org.Current;
        var settings = org.PaymentGateway;
        settings.GatewayName = string.IsNullOrWhiteSpace(payment.GatewayName) ? "razorpay" : payment.GatewayName.Trim();
        settings.Environment = string.IsNullOrWhiteSpace(payment.Environment) ? "test" : payment.Environment.Trim().ToLowerInvariant();
        settings.IsActive = payment.IsActive;
        settings.CollectAtBooking = payment.CollectAtBooking;
        settings.UpiId = (payment.UpiId ?? "").Trim();
        if (!string.IsNullOrWhiteSpace(payment.ApiKey) && !LooksMasked(payment.ApiKey))
            settings.ApiKey = payment.ApiKey.Trim();
        if (!string.IsNullOrWhiteSpace(payment.ApiSecret) && !LooksMasked(payment.ApiSecret))
            settings.ApiSecret = payment.ApiSecret.Trim();
        if (!string.IsNullOrWhiteSpace(payment.WebhookSecret) && !LooksMasked(payment.WebhookSecret))
            settings.WebhookSecret = payment.WebhookSecret.Trim();
        Persist(org);
    }

    public OrganisationPaymentGatewaySettings GetPaymentGatewayForStaff()
    {
        var src = _org.Current.PaymentGateway;
        return new OrganisationPaymentGatewaySettings
        {
            GatewayName = src.GatewayName,
            ApiKey = MaskSecret(src.ApiKey),
            ApiSecret = string.IsNullOrEmpty(src.ApiSecret) ? "" : "••••••••",
            UpiId = src.UpiId,
            WebhookSecret = string.IsNullOrEmpty(src.WebhookSecret) ? "" : "••••••••",
            Environment = src.Environment,
            IsActive = src.IsActive,
            CollectAtBooking = src.CollectAtBooking,
        };
    }

    private static bool LooksMasked(string value) =>
        value.Contains('•', StringComparison.Ordinal) || value.Contains('*', StringComparison.Ordinal);

    private static string MaskSecret(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        if (value.Length <= 8) return "••••••••";
        return $"{value[..4]}••••{value[^4..]}";
    }

    public void SaveBasic(
        string name,
        string? tagline,
        string? description,
        string? slug,
        string? propertyType = null,
        string? bookingType = null,
        int? minimumHours = null)
    {
        var org = _org.Current;
        org.Name = string.IsNullOrWhiteSpace(name) ? AppBranding.Name : name.Trim();
        org.Tagline = (tagline ?? "").Trim();
        org.Description = (description ?? "").Trim();

        if (!string.IsNullOrWhiteSpace(slug))
        {
            var normalized = OrganizationDomain.SlugFromName(slug);
            if (_org.SlugTaken(normalized, org.Id))
                throw new ArgumentException("That URL slug is already in use. Choose another.");
            org.Slug = normalized;
        }

        if (PropertyCatalog.TryParsePropertyType(propertyType, out var parsedType))
        {
            org.PropertyType = parsedType;
            // Party hall defaults to hourly unless explicitly set below.
            if (string.IsNullOrWhiteSpace(bookingType) && parsedType == PropertyType.party_hall)
                org.BookingType = PropertyBookingType.hourly;
        }

        if (PropertyCatalog.TryParseBookingType(bookingType, out var parsedBooking))
            org.BookingType = parsedBooking;

        if (minimumHours.HasValue && minimumHours.Value > 0)
            org.MinimumHours = minimumHours.Value;
        else if (org.MinimumHours < 1)
            org.MinimumHours = 2;

        Persist(org);
    }

    public void SaveLocation(
        string? address, string? city, string? state, string? country, string? pincode,
        decimal? latitude, decimal? longitude)
    {
        var org = _org.Current;
        org.Address = (address ?? "").Trim();
        org.City = (city ?? "").Trim();
        org.State = (state ?? "").Trim();
        org.Country = string.IsNullOrWhiteSpace(country) ? "India" : country.Trim();
        org.Pincode = (pincode ?? "").Trim();
        org.Latitude = latitude;
        org.Longitude = longitude;
        Persist(org);
    }

    public void SaveContact(
        string? phone, string? whatsapp, string? email,
        string? mapEmbedUrl, string? directionsUrl, string? whatsappLabel)
    {
        var org = _org.Current;
        org.Phone = (phone ?? "").Trim();
        org.WhatsApp = (whatsapp ?? "").Trim();
        org.Email = (email ?? "").Trim();
        org.ContactInfo.MapEmbedUrl = NullIfEmpty(mapEmbedUrl);
        org.ContactInfo.DirectionsUrl = NullIfEmpty(directionsUrl);
        org.ContactInfo.WhatsAppLabel = NullIfEmpty(whatsappLabel);
        Persist(org);
    }

    public void SavePolicies(
        string? checkInTime, string? checkOutTime,
        string? cancellationPolicy, string? paymentPolicy,
        string? petPolicy, string? idProofRequired, string? refundPolicy,
        string? houseRules,
        string? overnightTimeMode = null)
    {
        var org = _org.Current;
        org.CheckInTime = string.IsNullOrWhiteSpace(checkInTime) ? "14:00" : checkInTime.Trim();
        org.CheckOutTime = string.IsNullOrWhiteSpace(checkOutTime) ? "11:00" : checkOutTime.Trim();
        org.OvernightTimeMode = string.Equals(overnightTimeMode, "dynamic", StringComparison.OrdinalIgnoreCase)
            ? "dynamic"
            : "fixed";
        org.CancellationPolicy = (cancellationPolicy ?? "").Trim();
        org.PaymentPolicy = (paymentPolicy ?? "").Trim();
        org.Rules.PetPolicy = NullIfEmpty(petPolicy);
        org.Rules.IdProofRequired = NullIfEmpty(idProofRequired);
        org.Rules.RefundPolicy = NullIfEmpty(refundPolicy);
        org.Rules.HouseRules = SplitLines(houseRules);
        Persist(org);
    }

    public void SaveWebsite(string? subdomain, string? websiteUrl, string? logoAssetId)
    {
        var org = _org.Current;

        if (!string.IsNullOrWhiteSpace(subdomain))
        {
            var normalized = OrganizationDomain.NormalizeSubdomain(subdomain);
            if (_org.SubdomainTaken(normalized, org.Id))
                throw new ArgumentException("That subdomain is already taken. Choose another.");
            org.Subdomain = normalized;
            org.WebsiteUrl = OrganizationDomain.BuildPublicWebsiteUrl(
                org.Subdomain, _org.RequestHost(), _org.RequestScheme());
        }
        else
        {
            org.Subdomain = "";
        }

        if (!string.IsNullOrWhiteSpace(websiteUrl))
            org.WebsiteUrl = websiteUrl.Trim();

        org.LogoAssetId = string.IsNullOrWhiteSpace(logoAssetId) ? null : logoAssetId.Trim();
        Persist(org);
    }

    public void SaveSeo(string? metaTitle, string? metaDescription, string? keywords, string? ogImageUrl, string? ogImageAssetId = null)
    {
        var org = _org.Current;
        org.Seo.MetaTitle = (metaTitle ?? "").Trim();
        org.Seo.MetaDescription = (metaDescription ?? "").Trim();
        org.Seo.Keywords = SplitLines(keywords);
        org.Seo.OgImageAssetId = NullIfEmpty(ogImageAssetId);
        org.Seo.OgImageUrl = ResolveAssetUrl(org, org.Seo.OgImageAssetId) ?? NullIfEmpty(ogImageUrl);
        Persist(org);
    }

    public void SaveWeatherShowOnSite(bool showOnSite)
    {
        var org = _org.Current;
        org.Weather ??= new PropertyWeatherSettings();
        org.Weather.ShowOnSite = showOnSite;
        org.Weather.Configured = true;
        org.Weather.Title = string.IsNullOrWhiteSpace(org.Weather.Title) ? "Weather" : org.Weather.Title;
        // Live weather comes from location — do not keep manual snapshot fields.
        org.Weather.CurrentTemperature = "";
        org.Weather.Condition = "";
        org.Weather.Forecast = "";
        org.Weather.WeekRange = "";
        Persist(org);
    }

    public void SaveWeather(PropertyWeatherSettings model)
    {
        var org = _org.Current;
        model.Configured = true;
        org.Weather = model;
        Persist(org);
    }

    public void SaveHighlights(List<PropertyHighlight>? highlights)
    {
        var org = _org.Current;
        org.Highlights = CleanList(highlights, h => !string.IsNullOrWhiteSpace(h.Title));
        Persist(org);
    }

    public void SaveAmenities(List<PropertyAmenityItem>? amenities)
    {
        var org = _org.Current;
        org.Amenities = CleanList(amenities, a => !string.IsNullOrWhiteSpace(a.Name));
        Persist(org);
    }

    public void SavePackages(List<PropertyPackage>? packages)
    {
        var org = _org.Current;
        var incoming = CleanList(packages, p => !string.IsNullOrWhiteSpace(p.Name));
        var now = DateTime.UtcNow;

        foreach (var package in incoming)
        {
            package.OrganisationId = org.Id;
            package.UpdatedAt = now;
            package.Name = package.Name.Trim();
            package.Price = (package.Price ?? "").Trim();
            package.Description = (package.Description ?? "").Trim();
            package.RoomType = (package.RoomType ?? "").Trim();
            package.ImageUrl = (package.ImageUrl ?? "").Trim();
            package.ImageAssetId = string.IsNullOrWhiteSpace(package.ImageAssetId) ? null : package.ImageAssetId.Trim();
            package.ImageAssetIds = CleanStringList(package.ImageAssetIds);
            package.ImageUrls = CleanStringList(package.ImageUrls);
            if (!string.IsNullOrWhiteSpace(package.ImageAssetId))
            {
                var coverUrl = ResolveAssetUrl(org, package.ImageAssetId);
                if (!string.IsNullOrWhiteSpace(coverUrl))
                    package.ImageUrl = coverUrl;
            }
            if (package.ImageAssetIds.Count > 0)
            {
                var resolved = package.ImageAssetIds
                    .Select(id => ResolveAssetUrl(org, id))
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .Cast<string>()
                    .ToList();
                if (resolved.Count > 0)
                    package.ImageUrls = resolved;
            }
            package.ValidFrom = NormalizeDate(package.ValidFrom);
            package.ValidTo = NormalizeDate(package.ValidTo);
            package.Kind = NormalizePackageKind(package.Kind);
            package.MinimumNights = Math.Max(1, package.MinimumNights);
            package.MaxGuests = Math.Max(1, package.MaxGuests);
            package.IncludedGuests = Math.Max(0, package.IncludedGuests);
            if (package.IncludedGuests <= 0)
                package.IncludedGuests = package.MaxGuests;
            if (package.IncludedGuests > package.MaxGuests)
                package.IncludedGuests = package.MaxGuests;
            package.ExtraGuestCharge = Math.Max(0, package.ExtraGuestCharge);
            package.Includes = CleanStringList(package.Includes);
            package.AddOns = CleanStringList(package.AddOns);
            if (string.IsNullOrWhiteSpace(package.ImageUrl) && package.ImageUrls.Count > 0)
                package.ImageUrl = package.ImageUrls[0];
            if (string.IsNullOrWhiteSpace(package.ImageAssetId) && package.ImageAssetIds.Count > 0)
                package.ImageAssetId = package.ImageAssetIds[0];

            if (string.IsNullOrEmpty(package.Id))
            {
                package.Id = Guid.NewGuid().ToString();
                package.CreatedAt = now;
            }
            else
            {
                var existing = org.Packages.FirstOrDefault(p => p.Id == package.Id);
                package.CreatedAt = existing != null ? existing.CreatedAt : now;
            }
        }

        org.Packages = incoming;
        Persist(org);
    }

    private static string NormalizePackageKind(string? kind)
    {
        var value = (kind ?? "").Trim().ToLowerInvariant();
        return value switch
        {
            "addon" => "addon",
            "standard" => "stay",
            "stay" => "stay",
            _ => string.IsNullOrEmpty(value) ? "stay" : value,
        };
    }

    private static string NormalizeDate(string? value)
    {
        var raw = (value ?? "").Trim();
        if (string.IsNullOrEmpty(raw)) return "";
        if (DateOnly.TryParse(raw, out var date))
            return date.ToString("yyyy-MM-dd");
        return raw;
    }

    private static List<string> CleanStringList(IEnumerable<string>? values) =>
        (values ?? [])
            .SelectMany(v => (v ?? "").Split(new[] { ',', '\n', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(v => v.Trim())
            .Where(v => v.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public void SaveGuestServices(List<PropertyGuestService>? guestServices)
    {
        var org = _org.Current;
        var incoming = CleanList(guestServices, s => !string.IsNullOrWhiteSpace(s.Name));
        var now = DateTime.UtcNow;

        foreach (var service in incoming)
        {
            service.OrganisationId = org.Id;
            service.UpdatedAt = now;
            if (string.IsNullOrEmpty(service.Id))
            {
                service.Id = Guid.NewGuid().ToString();
                service.CreatedAt = now;
            }
            else
            {
                var existing = org.GuestServices.FirstOrDefault(s => s.Id == service.Id);
                service.CreatedAt = existing != null ? existing.CreatedAt : now;
            }
        }

        org.GuestServices = incoming;
        Persist(org);
    }

    public void SaveOffers(List<PropertyOffer>? offers)
    {
        var org = _org.Current;
        org.Offers = CleanList(offers, o => !string.IsNullOrWhiteSpace(o.Title));
        Persist(org);
    }

    public void SaveImages(List<PropertyImage>? images)
    {
        var org = _org.Current;
        org.Assets ??= [];
        org.Images = CleanList(images, i =>
            !string.IsNullOrWhiteSpace(i.Url) ||
            !string.IsNullOrWhiteSpace(i.Label) ||
            !string.IsNullOrWhiteSpace(i.AssetId));

        foreach (var image in org.Images.Where(i => !string.IsNullOrWhiteSpace(i.AssetId)))
        {
            var asset = org.Assets.FirstOrDefault(a => a.Id == image.AssetId);
            if (asset == null)
                continue;

            if (!string.IsNullOrWhiteSpace(image.Label))
                asset.Title = image.Label.Trim();
            if (!string.IsNullOrWhiteSpace(image.Category))
                asset.Notes = image.Category.Trim();
        }

        SyncPropertyImagesFromAssets(org);
        Persist(org);
    }

    public void SaveNearby(List<PropertyNearbyPlace>? nearby)
    {
        var org = _org.Current;
        var cleaned = CleanList(nearby, n => !string.IsNullOrWhiteSpace(n.Name));
        foreach (var place in cleaned)
        {
            place.ImageAssetId = string.IsNullOrWhiteSpace(place.ImageAssetId) ? null : place.ImageAssetId.Trim();
            if (!string.IsNullOrWhiteSpace(place.ImageAssetId))
            {
                var url = ResolveAssetUrl(org, place.ImageAssetId);
                if (!string.IsNullOrWhiteSpace(url))
                    place.ImageUrl = url;
            }
            else
            {
                place.ImageUrl = string.IsNullOrWhiteSpace(place.ImageUrl) ? null : place.ImageUrl.Trim();
            }
        }
        org.NearbyPlaces = cleaned;
        Persist(org);
    }

    public void SaveSlots(List<PropertySlot>? slots)
    {
        var org = _org.Current;
        var incoming = CleanList(slots, s => !string.IsNullOrWhiteSpace(s.Name));
        var order = 0;
        foreach (var slot in incoming)
        {
            if (string.IsNullOrWhiteSpace(slot.Id))
                slot.Id = Guid.NewGuid().ToString();
            slot.Name = slot.Name.Trim();
            slot.Kind = NormalizeSlotKind(slot.Kind, org.BookingType);
            slot.StartTime = NormalizeClock(slot.StartTime, slot.Kind == "overnight" ? org.CheckInTime : "10:00");
            slot.EndTime = NormalizeClock(slot.EndTime, slot.Kind == "overnight" ? org.CheckOutTime : "14:00");
            slot.DaysOfWeek = (slot.DaysOfWeek ?? [])
                .Where(d => d is >= 0 and <= 6)
                .Distinct()
                .OrderBy(d => d)
                .ToList();
            slot.Note = (slot.Note ?? "").Trim();
            slot.SortOrder = order++;
        }
        org.Slots = incoming;
        Persist(org);
    }

    public void SaveClosures(List<PropertyClosure>? closures)
    {
        var org = _org.Current;
        var incoming = CleanList(closures, c => !string.IsNullOrWhiteSpace(c.FromDate));
        foreach (var closure in incoming)
        {
            if (string.IsNullOrWhiteSpace(closure.Id))
                closure.Id = Guid.NewGuid().ToString();
            closure.Reason = NormalizeClosureReason(closure.Reason);
            closure.FromDate = NormalizeDate(closure.FromDate);
            closure.ToDate = NormalizeDate(closure.ToDate);
            if (string.IsNullOrWhiteSpace(closure.ToDate))
                closure.ToDate = closure.FromDate;
            if (DateOnly.TryParse(closure.FromDate, out var from) &&
                DateOnly.TryParse(closure.ToDate, out var to) &&
                to < from)
            {
                (closure.FromDate, closure.ToDate) = (closure.ToDate, closure.FromDate);
            }
            closure.Note = (closure.Note ?? "").Trim();
        }
        org.Closures = incoming
            .OrderBy(c => c.FromDate)
            .ThenBy(c => c.ToDate)
            .ToList();
        Persist(org);
    }

    private static string NormalizeSlotKind(string? kind, PropertyBookingType bookingType)
    {
        var k = (kind ?? "").Trim().ToLowerInvariant();
        if (k is "hourly" or "overnight")
            return k;
        return bookingType == PropertyBookingType.hourly ? "hourly" : "overnight";
    }

    private static string NormalizeClosureReason(string? reason)
    {
        var r = (reason ?? "").Trim().ToLowerInvariant();
        return r switch
        {
            "leave" or "holiday" or "closed" or "maintenance" or "other" => r,
            _ => "leave",
        };
    }

    private static string NormalizeClock(string? value, string fallback)
    {
        value = (value ?? "").Trim();
        if (TimeOnly.TryParse(value, out var t))
            return t.ToString("HH:mm");
        if (TimeOnly.TryParse(fallback, out var fb))
            return fb.ToString("HH:mm");
        return "10:00";
    }

    private static string? ResolveAssetUrl(Organisation org, string? assetId)
    {
        if (string.IsNullOrWhiteSpace(assetId))
            return null;
        org.Assets ??= [];
        var asset = org.Assets.FirstOrDefault(a => a.Id == assetId.Trim());
        return string.IsNullOrWhiteSpace(asset?.Url) ? null : asset!.Url.Trim();
    }

    public void SaveActivities(List<PropertyActivity>? activities)
    {
        var org = _org.Current;
        org.Activities = CleanList(activities, a => !string.IsNullOrWhiteSpace(a.Title));
        Persist(org);
    }

    public void SaveReviews(List<PropertyReview>? reviews)
    {
        var org = _org.Current;
        org.Reviews = CleanList(reviews, r => !string.IsNullOrWhiteSpace(r.Author) || !string.IsNullOrWhiteSpace(r.Quote));
        Persist(org);
    }

    public void SaveFoodMenu(List<PropertyFoodItem>? foodMenu)
    {
        var org = _org.Current;
        org.FoodMenu = CleanList(foodMenu, f => !string.IsNullOrWhiteSpace(f.Title));
        Persist(org);
    }

    public void SaveTravel(List<PropertyTravelRoute>? travelInfo)
    {
        var org = _org.Current;
        org.TravelInfo = CleanList(travelInfo, t => !string.IsNullOrWhiteSpace(t.From));
        org.ContactInfo.TravelDistances = [];
        Persist(org);
    }

    public void SaveFaq(List<PropertyFaqItem>? faq)
    {
        var org = _org.Current;
        org.Faq = CleanList(faq, f => !string.IsNullOrWhiteSpace(f.Question));
        Persist(org);
    }

    public void SyncImageLibrary()
    {
        var org = _org.Current;
        SyncPropertyImagesFromAssets(org);
        Persist(org);
    }

    public void RemoveImageAsset(string assetId)
    {
        if (string.IsNullOrWhiteSpace(assetId))
            return;

        _assets.DeleteAsset(assetId);
        var org = _org.Current;
        SyncPropertyImagesFromAssets(org);
        Persist(org);
    }

    public void RemoveImageEntryAt(int index)
    {
        var org = _org.Current;
        if (index < 0 || index >= org.Images.Count)
            return;
        org.Images.RemoveAt(index);
        Persist(org);
    }

    public void ClearLogo()
    {
        var org = _org.Current;
        org.LogoAssetId = null;
        Persist(org);
    }

    private void Persist(Organisation org)
    {
        Touch(org);
        SyncPropertyImagesFromAssets(org);
        _websiteSync.SyncFromProfile(org);
        _org.Save(org);
    }

    /// <summary>Keep property images and the asset library in sync (assets are source of truth).</summary>
    private static bool SyncPropertyImagesFromAssets(Organisation org)
    {
        org.Assets ??= [];
        org.Images ??= [];
        var changed = false;

        org.Images.RemoveAll(i =>
        {
            if (!string.IsNullOrWhiteSpace(i.Url) || !string.IsNullOrWhiteSpace(i.AssetId))
                return false;
            changed = true;
            return true;
        });

        foreach (var image in org.Images.Where(i => string.IsNullOrWhiteSpace(i.AssetId) && !string.IsNullOrWhiteSpace(i.Url)).ToList())
        {
            var asset = org.Assets.FirstOrDefault(a =>
                string.Equals(a.Url, image.Url, StringComparison.OrdinalIgnoreCase));
            if (asset == null)
            {
                asset = new OrganizationAsset
                {
                    Title = string.IsNullOrWhiteSpace(image.Label) ? "Gallery image" : image.Label.Trim(),
                    Kind = AssetKind.url,
                    Category = AssetCategory.gallery,
                    Url = image.Url.Trim(),
                    Notes = string.IsNullOrWhiteSpace(image.Category) ? "Gallery" : image.Category.Trim(),
                };
                org.Assets.Add(asset);
                changed = true;
            }

            if (image.AssetId != asset.Id)
            {
                image.AssetId = asset.Id;
                changed = true;
            }
        }

        var imageAssets = org.Assets
            .Where(a => AssetCatalog.IsImageAsset(a) && a.Category != AssetCategory.logo)
            .ToList();

        foreach (var asset in imageAssets)
        {
            var image = org.Images.FirstOrDefault(i => i.AssetId == asset.Id)
                ?? org.Images.FirstOrDefault(i =>
                    !string.IsNullOrWhiteSpace(i.Url) &&
                    string.Equals(i.Url, asset.Url, StringComparison.OrdinalIgnoreCase));

            var category = string.IsNullOrWhiteSpace(asset.Notes)
                ? AssetCatalog.CategoryLabel(asset.Category)
                : asset.Notes;

            if (image == null)
            {
                org.Images.Add(new PropertyImage
                {
                    AssetId = asset.Id,
                    Url = asset.Url,
                    Label = asset.Title,
                    Category = category,
                });
                changed = true;
                continue;
            }

            if (image.AssetId != asset.Id) { image.AssetId = asset.Id; changed = true; }
            if (image.Url != asset.Url) { image.Url = asset.Url; changed = true; }
            if (string.IsNullOrWhiteSpace(image.Label) && !string.IsNullOrWhiteSpace(asset.Title))
            {
                image.Label = asset.Title;
                changed = true;
            }
            if (string.IsNullOrWhiteSpace(image.Category))
            {
                image.Category = category;
                changed = true;
            }
        }

        var removed = org.Images.RemoveAll(i =>
            !string.IsNullOrWhiteSpace(i.AssetId) &&
            org.Assets.All(a => a.Id != i.AssetId));
        if (removed > 0)
            changed = true;

        return changed;
    }

    private static void Touch(Organisation org) => org.UpdatedAt = DateTime.UtcNow;

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static List<string> SplitLines(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    private static List<T> CleanList<T>(List<T>? items, Func<T, bool> keep) =>
        (items ?? []).Where(keep).ToList();
}
