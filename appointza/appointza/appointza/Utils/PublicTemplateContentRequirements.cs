namespace appointza.Utils;

/// <summary>
/// Detects which optional datasets a public template HTML actually references.
/// When template HTML is unknown, callers should load conservatively (return true).
/// </summary>
internal static class PublicTemplateContentRequirements
{
    public static bool RequiresEvents(string? templateHtml)
    {
        if (string.IsNullOrEmpty(templateHtml))
            return true;

        return ContainsAny(
            templateHtml,
            "{{#hasevents}}",
            "{{#events}}",
            "{{event_name}}",
            "{{event_date}}",
            "{{from_date}}",
            "{{to_date}}",
            "{{entry_amount}}",
            "{{remainingslot}}",
            "{{event_image",
            "{{EVENT_IMAGE_URL}}",
            "/user/events/");
    }

    public static bool RequiresHospitality(string? templateHtml)
    {
        if (string.IsNullOrEmpty(templateHtml))
            return true;

        return ContainsAny(
            templateHtml,
            "{{#hasrooms}}",
            "{{#rooms}}",
            "{{room.",
            "{{#haspackages}}",
            "{{#packages}}",
            "{{package.",
            "{{#hasfoodmenu}}",
            "{{#food_menu}}",
            "{{food.",
            "{{#hasnearby}}",
            "{{#nearby_places}}",
            "{{nearby",
            "{{#haspolicies}}",
            "{{hospitality.",
            "{{organisation.cancellation_policy}}",
            "{{organisation.payment_policy}}",
            "{{organisation.check_in_time}}",
            "{{organisation.check_out_time}}",
            "{{#guest_services}}",
            "{{guest_services",
            "/book?roomId=",
            "/book?packageId=");
    }

    public static bool RequiresFacilities(string? templateHtml)
    {
        if (string.IsNullOrEmpty(templateHtml))
            return true;

        return ContainsAny(
            templateHtml,
            "{{#facilities}}",
            "{{#hasfacilities}}",
            "{{facility_displaytext}}");
    }

    static bool ContainsAny(string haystack, params string[] needles)
    {
        foreach (var needle in needles)
        {
            if (haystack.Contains(needle, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
