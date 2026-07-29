using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Time-aware overlap checks so same-day hourly bookings only block their window.
/// </summary>
public static class RoomBookingConflict
{
    public static bool TryParseWindow(
        string checkIn,
        string checkOut,
        string? checkInTime,
        string? checkOutTime,
        out DateTime start,
        out DateTime end)
    {
        start = default;
        end = default;
        if (!DateOnly.TryParse(checkIn, out var inDate) || !DateOnly.TryParse(checkOut, out var outDate))
            return false;

        var inTime = BookingTimeHelper.ParseTimeOrDefault(checkInTime, "14:00");
        var outTime = BookingTimeHelper.ParseTimeOrDefault(checkOutTime, "11:00");
        start = inDate.ToDateTime(inTime);
        end = outDate.ToDateTime(outTime);
        return end > start;
    }

    public static bool Overlaps(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd) =>
        aStart < bEnd && bStart < aEnd;

    public static bool BookingOverlaps(
        BookingDetail existing,
        DateTime reqStart,
        DateTime reqEnd,
        string? excludeBookingId = null)
    {
        if (excludeBookingId != null && existing.Id == excludeBookingId)
            return false;
        if (existing.Status == BookingDetailStatus.cancelled)
            return false;
        if (string.IsNullOrWhiteSpace(existing.RoomId))
            return false;
        if (!TryParseWindow(existing.CheckIn, existing.CheckOut, existing.CheckInTime, existing.CheckOutTime, out var start, out var end))
            return false;

        return Overlaps(reqStart, reqEnd, start, end);
    }

    public static bool HasRoomConflict(
        IEnumerable<BookingDetail> bookings,
        string roomId,
        DateTime reqStart,
        DateTime reqEnd,
        string? excludeBookingId = null)
    {
        if (string.IsNullOrWhiteSpace(roomId))
            return false;

        return bookings.Any(b =>
            string.Equals(b.RoomId, roomId, StringComparison.OrdinalIgnoreCase) &&
            BookingOverlaps(b, reqStart, reqEnd, excludeBookingId));
    }

    /// <summary>
    /// Permanently unbookable statuses (out of inventory). Occupied / reserved / etc.
    /// can still be offered for other date/time windows when bookings do not overlap.
    /// </summary>
    public static bool IsRoomStructurallyBookable(Room room) =>
        room.Status is not (RoomStatus.maintenance or RoomStatus.blocked or RoomStatus.hold);
}
