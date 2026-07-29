using System.Text.Json;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Projects room board status for a chosen date from active bookings
/// (without mutating persisted room status for other dates).
/// </summary>
public static class RoomAvailabilityProjector
{
    public static Room ProjectForDate(
        Room source,
        DateOnly asOf,
        IReadOnlyList<BookingDetail> bookings,
        IReadOnlyList<Customer> customers)
    {
        var room = Clone(source);
        RoomHydrator.EnsureDefaults(room);
        room.Guest = null;
        room.Booking = null;
        room.Payment = null;

        // Inventory locks always win, regardless of date.
        if (room.Status is RoomStatus.maintenance or RoomStatus.blocked or RoomStatus.hold)
            return room;

        // Housekeeping in progress only applies on the live (today) board.
        if (asOf == RoomDaySync.Today && room.Status == RoomStatus.cleaning)
            return room;

        var covering = FindRelevantBooking(room.Id, asOf, bookings);
        if (covering == null)
        {
            if (asOf == RoomDaySync.Today && room.Status == RoomStatus.checkout_pending)
                return room;

            room.Status = RoomStatus.available;
            if (asOf != RoomDaySync.Today)
                room.CleaningAssignment = null;
            return room;
        }

        ApplyBooking(room, covering, customers);

        if (!RoomDaySync.TryParseDate(covering.CheckIn, out var checkIn) ||
            !RoomDaySync.TryParseDate(covering.CheckOut, out var checkOut))
        {
            room.Status = RoomStatus.reserved;
            return room;
        }

        room.Status = RoomDaySync.ResolveStatus(asOf, checkIn, checkOut, room.Status);
        if (asOf != RoomDaySync.Today && room.Status == RoomStatus.available)
            room.CleaningAssignment = null;
        return room;
    }

    /// <summary>
    /// Picks the booking that should drive the board for <paramref name="asOf"/>.
    /// Stay/checkout days always win. Upcoming reservations only affect the live (today) board.
    /// </summary>
    public static BookingDetail? FindRelevantBooking(
        string roomId,
        DateOnly asOf,
        IEnumerable<BookingDetail> bookings)
    {
        if (string.IsNullOrWhiteSpace(roomId))
            return null;

        var active = bookings
            .Where(b =>
                string.Equals(b.RoomId, roomId, StringComparison.OrdinalIgnoreCase) &&
                b.Status != BookingDetailStatus.cancelled)
            .Select(b =>
            {
                RoomDaySync.TryParseDate(b.CheckIn, out var checkIn);
                RoomDaySync.TryParseDate(b.CheckOut, out var checkOut);
                return (Booking: b, CheckIn: checkIn, CheckOut: checkOut, Parsed: checkIn != default && checkOut != default);
            })
            .Where(x => x.Parsed)
            .ToList();

        if (active.Count == 0)
            return null;

        // In-house or checkout day for this date — this is date-based availability.
        var onStay = active
            .Where(x => asOf >= x.CheckIn && asOf <= x.CheckOut)
            .OrderBy(x => x.CheckIn)
            .ThenBy(x => x.Booking.CheckInTime)
            .Select(x => x.Booking)
            .FirstOrDefault();
        if (onStay != null)
            return onStay;

        // Live board only: show upcoming reserved / overdue checkout from active bookings.
        if (asOf != RoomDaySync.Today)
            return null;

        var upcoming = active
            .Where(x => asOf < x.CheckIn)
            .OrderBy(x => x.CheckIn)
            .ThenBy(x => x.Booking.CheckInTime)
            .Select(x => x.Booking)
            .FirstOrDefault();
        if (upcoming != null)
            return upcoming;

        return active
            .Where(x => asOf > x.CheckOut)
            .OrderByDescending(x => x.CheckOut)
            .Select(x => x.Booking)
            .FirstOrDefault();
    }

    private static void ApplyBooking(Room room, BookingDetail booking, IReadOnlyList<Customer> customers)
    {
        var customer = customers.FirstOrDefault(c => c.Id == booking.CustomerId);
        if (customer != null)
        {
            room.Guest = new RoomGuest
            {
                Name = customer.Name,
                Phone = customer.Phone,
                Email = customer.Email,
            };
        }

        room.Booking = new RoomBooking
        {
            BookingId = booking.BookingCode,
            CheckIn = booking.CheckIn,
            CheckOut = booking.CheckOut,
            CheckInTime = booking.CheckInTime,
            CheckOutTime = booking.CheckOutTime,
            Nights = booking.Nights,
        };

        room.Payment = new RoomPayment
        {
            Total = booking.Total,
            Paid = booking.Paid,
            Balance = booking.Balance,
        };
    }

    private static Room Clone(Room source) =>
        JsonSerializer.Deserialize<Room>(
            JsonSerializer.Serialize(source, JsonOptions.Default),
            JsonOptions.Default) ?? new Room();
}
