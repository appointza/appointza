namespace appointza.Models.AppointzaStay;

public enum PropertyType
{
    resort,
    hotel,
    villa,
    homestay,
    party_hall,
}

/// <summary>
/// How this property accepts bookings. Drives UI + pricing; storage stays unified
/// (check-in/out date-time on the booking row).
/// </summary>
public enum PropertyBookingType
{
    overnight,
    hourly,
}

public static class PropertyCatalog
{
    public static readonly (PropertyType Value, string Label)[] Types =
    [
        (PropertyType.resort, "Resort"),
        (PropertyType.hotel, "Hotel"),
        (PropertyType.villa, "Villa"),
        (PropertyType.homestay, "Homestay"),
        (PropertyType.party_hall, "Party Hall"),
    ];

    public static readonly (PropertyBookingType Value, string Label, string Hint)[] BookingTypes =
    [
        (PropertyBookingType.overnight, "Overnight", "Check-in / check-out dates · priced per night"),
        (PropertyBookingType.hourly, "Hourly", "Booking date + start/end time · priced per hour"),
    ];

    public static string TypeLabel(PropertyType type) =>
        Types.FirstOrDefault(t => t.Value == type).Label ?? type.ToString();

    public static string BookingTypeLabel(PropertyBookingType type) =>
        BookingTypes.FirstOrDefault(t => t.Value == type).Label ?? type.ToString();

    public static PropertyBookingType DefaultBookingType(PropertyType propertyType) =>
        propertyType == PropertyType.party_hall
            ? PropertyBookingType.hourly
            : PropertyBookingType.overnight;

    public static bool TryParsePropertyType(string? value, out PropertyType type)
    {
        type = PropertyType.hotel;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().Replace('-', '_').Replace(' ', '_');
        return Enum.TryParse(normalized, ignoreCase: true, out type);
    }

    public static bool TryParseBookingType(string? value, out PropertyBookingType type)
    {
        type = PropertyBookingType.overnight;
        if (string.IsNullOrWhiteSpace(value)) return false;
        return Enum.TryParse(value.Trim(), ignoreCase: true, out type);
    }
}
