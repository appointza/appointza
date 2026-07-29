using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Keeps room status in sync with booking dates for the current day.
/// </summary>
public static class RoomDaySync
{
    public static DateOnly Today => DateOnly.FromDateTime(DateTime.Today);

    public static bool ApplyDailyUpdates(IEnumerable<Room> rooms, DateOnly? asOf = null)
    {
        var today = asOf ?? Today;
        var changed = false;

        foreach (var room in rooms)
        {
            if (ApplyToRoom(room, today))
                changed = true;
        }

        return changed;
    }

    public static bool ApplyToRoom(Room room, DateOnly today)
    {
        if (room.Booking == null || room.Guest == null)
            return false;

        if (room.Status is RoomStatus.cleaning or RoomStatus.maintenance
            or RoomStatus.blocked or RoomStatus.hold or RoomStatus.available)
            return false;

        if (!TryParseDate(room.Booking.CheckIn, out var checkIn) ||
            !TryParseDate(room.Booking.CheckOut, out var checkOut))
            return false;

        var target = ResolveStatus(today, checkIn, checkOut, room.Status);
        if (target == room.Status) return false;

        room.Status = target;
        room.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    public static RoomStatus ResolveStatus(DateOnly today, DateOnly checkIn, DateOnly checkOut, RoomStatus current)
    {
        if (today < checkIn)
            return RoomStatus.reserved;

        if (today >= checkOut)
            return RoomStatus.checkout_pending;

        return RoomStatus.occupied;
    }

    public static string StayHint(Room room, DateOnly? asOf = null)
    {
        var today = asOf ?? Today;
        if (room.Booking == null) return "";

        if (!TryParseDate(room.Booking.CheckIn, out var checkIn) ||
            !TryParseDate(room.Booking.CheckOut, out var checkOut))
            return "";

        if (today == checkIn) return "Arriving today";
        if (today == checkOut) return "Checkout today";
        if (today > checkOut) return "Overdue checkout";
        if (today < checkIn) return $"Arrives {FormatShort(checkIn)}";
        if (today == checkOut.AddDays(-1)) return "Checkout tomorrow";
        return $"Out {FormatShort(checkOut)}";
    }

    public static string FormatShort(DateOnly date) =>
        date.ToString("dd MMM");

    public static string FormatDisplay(string iso)
    {
        if (string.IsNullOrEmpty(iso)) return "—";
        return DateOnly.TryParse(iso, out var d)
            ? d.ToString("dd MMM yyyy")
            : iso;
    }

    public static bool TryParseDate(string iso, out DateOnly date) =>
        DateOnly.TryParse(iso, out date);
}
