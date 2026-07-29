using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>Validates bookings against property slots and closed/leave dates.</summary>
public static class PropertyScheduleRules
{
    public static void EnsureBookable(
        Organisation org,
        DateOnly checkIn,
        DateOnly checkOut,
        string checkInTime,
        string checkOutTime)
    {
        var closure = FindOverlappingClosure(org.Closures, checkIn, checkOut, org.BookingType);
        if (closure != null)
        {
            var label = ReasonLabel(closure.Reason);
            var range = string.IsNullOrWhiteSpace(closure.ToDate) || closure.ToDate == closure.FromDate
                ? closure.FromDate
                : $"{closure.FromDate} → {closure.ToDate}";
            var note = string.IsNullOrWhiteSpace(closure.Note) ? "" : $" ({closure.Note.Trim()})";
            throw new ArgumentException($"Property is {label.ToLowerInvariant()} on {range}{note}. Please choose other dates.");
        }

        var activeSlots = org.Slots
            .Where(s => s.IsActive)
            .Where(s => SlotMatchesBookingType(s, org.BookingType))
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToList();

        // No slots configured → free-form times (legacy behaviour).
        if (activeSlots.Count == 0)
            return;

        var daySlots = activeSlots.Where(s => AppliesOnDay(s, checkIn)).ToList();
        if (daySlots.Count == 0)
            throw new ArgumentException("No bookable slots on the selected date. Pick another day or contact the property.");

        var inTime = NormalizeTime(checkInTime);
        var outTime = NormalizeTime(checkOutTime);
        var match = daySlots.FirstOrDefault(s =>
            NormalizeTime(s.StartTime) == inTime && NormalizeTime(s.EndTime) == outTime);

        if (match == null)
        {
            var options = string.Join(", ", daySlots.Select(s => $"{s.Name} ({NormalizeTime(s.StartTime)}–{NormalizeTime(s.EndTime)})"));
            throw new ArgumentException($"Please choose one of the available slots: {options}.");
        }
    }

    public static PropertyClosure? FindOverlappingClosure(
        IEnumerable<PropertyClosure>? closures,
        DateOnly checkIn,
        DateOnly checkOut,
        PropertyBookingType bookingType)
    {
        if (closures == null)
            return null;

        // Overnight: closed if any night of the stay overlaps. Hourly: closed if the booking day is closed.
        var stayEndExclusive = bookingType == PropertyBookingType.hourly
            ? checkIn.AddDays(1)
            : (checkOut <= checkIn ? checkIn.AddDays(1) : checkOut);

        foreach (var c in closures)
        {
            if (!TryParseDate(c.FromDate, out var from))
                continue;
            var to = TryParseDate(c.ToDate, out var parsedTo) ? parsedTo : from;
            if (to < from)
                (from, to) = (to, from);

            // Inclusive closure end → exclusive for overlap test
            var closeEndExclusive = to.AddDays(1);
            if (checkIn < closeEndExclusive && stayEndExclusive > from)
                return c;
        }

        return null;
    }

    private static bool SlotMatchesBookingType(PropertySlot slot, PropertyBookingType bookingType)
    {
        var kind = (slot.Kind ?? "").Trim().ToLowerInvariant();
        if (bookingType == PropertyBookingType.hourly)
            return kind is "" or "hourly";
        return kind is "" or "overnight";
    }

    private static bool AppliesOnDay(PropertySlot slot, DateOnly date)
    {
        if (slot.DaysOfWeek == null || slot.DaysOfWeek.Count == 0)
            return true;
        var dow = (int)date.DayOfWeek; // 0=Sunday
        return slot.DaysOfWeek.Contains(dow);
    }

    private static string NormalizeTime(string? value)
    {
        value = (value ?? "").Trim();
        if (TimeOnly.TryParse(value, out var t))
            return t.ToString("HH:mm");
        return value.Length >= 5 ? value[..5] : value;
    }

    private static bool TryParseDate(string? value, out DateOnly date) =>
        DateOnly.TryParse(value, out date);

    private static string ReasonLabel(string? reason) => (reason ?? "").Trim().ToLowerInvariant() switch
    {
        "leave" => "On leave",
        "holiday" => "Closed for holiday",
        "maintenance" => "Closed for maintenance",
        "closed" => "Closed",
        _ => "Unavailable",
    };
}
