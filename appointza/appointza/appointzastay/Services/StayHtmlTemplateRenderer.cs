using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Renders the allowlisted AppointzaStay HTML-template variables.
/// Output must always be displayed in a sandboxed iframe, never injected into the host DOM.
/// </summary>
public static class StayHtmlTemplateRenderer
{
    public const int MaxTemplateLength = 500_000;
    public const int MaxRenderedLength = 2_000_000;
    private const int MaxLoopItems = 200;

    public static string Render(string? template, Organisation organisation, IReadOnlyList<Room> rooms)
    {
        var html = SanitizeTemplate((template ?? "").Length > MaxTemplateLength
            ? (template ?? "")[..MaxTemplateLength]
            : template ?? "");

        var hasBookableRooms = rooms.Any(room => room.Status == RoomStatus.available);

        html = ApplyLoop(html, "rooms", rooms, (item, room) =>
        {
            var available = room.Status == RoomStatus.available;
            var status = RoomCatalog.GetStatus(room.Status);
            var fragment = ApplyConditional(item, "if_room_available", available);
            fragment = ApplyConditional(fragment, "if_room_unavailable", !available);
            return ReplaceMany(fragment, new Dictionary<string, string>
            {
                ["room.id"] = room.Id,
                ["room.number"] = room.RoomNumber,
                ["room.name"] = room.RoomName,
                ["room.type"] = RoomCatalog.GetTypeLabel(room.RoomType),
                ["room.price"] = room.Pricing.PricePerNight.ToString("0.##"),
                ["room.weekend_price"] = room.Pricing.WeekendPrice.ToString("0.##"),
                ["room.capacity"] = room.Capacity.TotalGuests.ToString(),
                ["room.main_photo"] = room.MainPhoto,
                ["room.video_url"] = room.RoomVideo,
                ["room.status"] = room.Status.ToString(),
                ["room.status_label"] = status.Label,
                ["room.available"] = available ? "true" : "false",
                ["room.book_cta"] = available ? "Book this room" : "Not available",
                // Only emit a bookable URL when the room is available.
                ["ROOM_BOOK_URL"] = available
                    ? $"book?roomId={Uri.EscapeDataString(room.Id)}"
                    : "",
            });
        });

        html = ApplyLoop(html, "gallery", organisation.Images, (item, image) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["image.url"] = image.Url,
            ["image.label"] = image.Label,
            ["image.category"] = image.Category,
            ["image.video_url"] = image.VideoUrl ?? "",
            ["image.tour360_url"] = image.Tour360Url ?? "",
        }));

        html = ApplyLoop(html, "amenities", organisation.Amenities, (item, amenity) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["amenity.icon"] = amenity.Icon,
            ["amenity.name"] = amenity.Name,
            ["amenity.description"] = amenity.Description,
            ["amenity.group"] = amenity.Group,
        }));

        html = ApplyLoop(html, "reviews", organisation.Reviews, (item, review) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["review.author"] = review.Author,
            ["review.rating"] = review.Rating.ToString(),
            ["review.quote"] = review.Quote,
            ["review.date"] = review.Date ?? "",
        }));

        html = ApplyLoop(
            html,
            "packages",
            organisation.Packages.Where(package => package.IsActive).OrderBy(package => package.SortOrder).ToList(),
            (item, package) => ReplaceMany(item, new Dictionary<string, string>
            {
                ["package.id"] = package.Id,
                ["package.name"] = package.Name,
                ["package.price"] = package.Price,
                ["package.description"] = package.Description,
                ["package.badge"] = package.Badge ?? "",
                ["package.image_url"] = package.ImageUrl,
                ["package.images"] = string.Join(",", package.ImageUrls ?? []),
                ["package.valid_from"] = package.ValidFrom ?? "",
                ["package.valid_to"] = package.ValidTo ?? "",
                ["package.minimum_nights"] = package.MinimumNights.ToString(),
                ["package.max_guests"] = package.MaxGuests.ToString(),
                ["package.included_guests"] = package.IncludedGuests.ToString(),
                ["package.extra_guest_charge"] = package.ExtraGuestCharge.ToString("0.##"),
                ["package.room_type"] = package.RoomType ?? "",
                ["package.includes"] = string.Join(", ", package.Includes ?? []),
                ["package.addons"] = string.Join(", ", package.AddOns ?? []),
                ["package.kind"] = package.Kind ?? "stay",
                ["PACKAGE_BOOK_URL"] = $"book?packageId={Uri.EscapeDataString(package.Id)}",
            }));

        html = ApplyLoop(html, "nearby_places", organisation.NearbyPlaces, (item, place) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["place.name"] = place.Name,
            ["place.distance"] = place.Distance,
            ["place.travel_time"] = place.TravelTime ?? "",
            ["place.icon"] = place.Icon ?? "",
            ["place.image_url"] = place.ImageUrl ?? "",
            ["place.map_url"] = place.MapUrl ?? "",
        }));

        html = ApplyLoop(html, "activities", organisation.Activities, (item, activity) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["activity.title"] = activity.Title,
            ["activity.description"] = activity.Description,
            ["activity.icon"] = activity.Icon ?? "",
        }));

        html = ApplyLoop(html, "faq", organisation.Faq, (item, faq) => ReplaceMany(item, new Dictionary<string, string>
        {
            ["faq.question"] = faq.Question,
            ["faq.answer"] = faq.Answer,
        }));

        html = ApplyConditional(html, "if_has_bookable_rooms", hasBookableRooms);
        html = ApplyConditional(html, "if_no_bookable_rooms", !hasBookableRooms);

        html = ReplaceMany(html, new Dictionary<string, string>
        {
            ["organisation.id"] = organisation.Id,
            ["organisation.name"] = organisation.Name,
            ["organisation.tagline"] = organisation.Tagline,
            ["organisation.description"] = organisation.Description,
            ["organisation.address"] = organisation.Address,
            ["organisation.city"] = organisation.City,
            ["organisation.state"] = organisation.State,
            ["organisation.country"] = organisation.Country,
            ["organisation.pincode"] = organisation.Pincode,
            ["organisation.phone"] = organisation.Phone,
            ["organisation.whatsapp"] = organisation.WhatsApp,
            ["organisation.email"] = organisation.Email,
            ["organisation.check_in_time"] = organisation.CheckInTime,
            ["organisation.check_out_time"] = organisation.CheckOutTime,
            ["organisation.cancellation_policy"] = organisation.CancellationPolicy,
            ["organisation.payment_policy"] = organisation.PaymentPolicy,
            ["organisation.website_url"] = organisation.WebsiteUrl,
            ["organisation.subdomain"] = organisation.Subdomain,
            ["organisation.logo_url"] =
                organisation.Assets.FirstOrDefault(asset => asset.Id == organisation.LogoAssetId)?.Url ?? "",
            // General Book now only when at least one room is available.
            ["BOOK_URL"] = hasBookableRooms ? "book" : "",
            ["currentyear"] = DateTime.UtcNow.Year.ToString(),
        });

        // Unknown variables and unmatched blocks never leak into the published page.
        html = Regex.Replace(html, @"\{\{#[^}]+\}\}|\{\{\/[^}]+\}\}|\{\{[^}]+\}\}", "");
        if (html.Length > MaxRenderedLength)
            html = html[..MaxRenderedLength];
        return InjectAvailabilityStyles(InjectTopNavigationTarget(html));
    }

    public static string SanitizeTemplate(string html)
    {
        var output = html ?? "";
        output = Regex.Replace(
            output,
            @"<\s*(script|object|embed|base)\b[^>]*>[\s\S]*?<\s*/\s*\1\s*>",
            "",
            RegexOptions.IgnoreCase);
        output = Regex.Replace(
            output,
            @"<\s*(script|object|embed|base)\b[^>]*/?\s*>",
            "",
            RegexOptions.IgnoreCase);
        output = Regex.Replace(
            output,
            @"\s+on[a-z]+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)",
            "",
            RegexOptions.IgnoreCase);
        output = Regex.Replace(
            output,
            @"(href|src)\s*=\s*(['""])\s*javascript:[\s\S]*?\2",
            "$1=$2#$2",
            RegexOptions.IgnoreCase);
        return output;
    }

    private static string ApplyLoop<T>(
        string template,
        string name,
        IReadOnlyList<T> items,
        Func<string, T, string> render)
    {
        var pattern = $@"\{{\{{#{Regex.Escape(name)}\}}\}}([\s\S]*?)\{{\{{/{Regex.Escape(name)}\}}\}}";
        return Regex.Replace(
            template,
            pattern,
            match => items.Count == 0
                ? ""
                : string.Concat(items.Take(MaxLoopItems).Select(item => render(match.Groups[1].Value, item))),
            RegexOptions.IgnoreCase);
    }

    private static string ApplyConditional(string template, string name, bool include)
    {
        var pattern = $@"\{{\{{#{Regex.Escape(name)}\}}\}}([\s\S]*?)\{{\{{/{Regex.Escape(name)}\}}\}}";
        return Regex.Replace(
            template,
            pattern,
            match => include ? match.Groups[1].Value : "",
            RegexOptions.IgnoreCase);
    }

    private static string ReplaceMany(string template, IReadOnlyDictionary<string, string> values)
    {
        var output = template;
        foreach (var (key, value) in values)
        {
            var encoded = HtmlEncoder.Default.Encode(value ?? "");
            output = Regex.Replace(
                output,
                $@"\{{\{{\s*{Regex.Escape(key)}\s*\}}\}}",
                _ => encoded,
                RegexOptions.IgnoreCase);
        }
        return output;
    }

    private static string InjectTopNavigationTarget(string html)
    {
        const string baseElement = """<base target="_top">""";
        var head = Regex.Match(html, @"<head\b[^>]*>", RegexOptions.IgnoreCase);
        return head.Success
            ? html.Insert(head.Index + head.Length, baseElement)
            : baseElement + html;
    }

    /// <summary>
    /// Hide Book now links when availability emptied the href (existing templates
    /// may not wrap CTAs in {{#if_room_available}}).
    /// </summary>
    private static string InjectAvailabilityStyles(string html)
    {
        const string style =
            """<style data-appointza-availability>a[href=""]{display:none!important}</style>""";
        var head = Regex.Match(html, @"</head\s*>", RegexOptions.IgnoreCase);
        if (head.Success)
            return html.Insert(head.Index, style);
        return style + html;
    }
}
