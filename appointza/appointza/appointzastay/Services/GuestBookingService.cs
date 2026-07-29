using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class GuestBookingService
{
    private readonly AppDataStore _data;
    private readonly RoomService _rooms;
    private readonly CustomerService _customers;
    private readonly BookingDetailService _bookings;
    private readonly LogService _logs;
    private readonly OrganisationResolver _org;
    private readonly CreditService _credits;

    public GuestBookingService(
        AppDataStore data,
        RoomService rooms,
        CustomerService customers,
        BookingDetailService bookings,
        LogService logs,
        OrganisationResolver org,
        CreditService credits)
    {
        _data = data;
        _rooms = rooms;
        _customers = customers;
        _bookings = bookings;
        _logs = logs;
        _org = org;
        _credits = credits;
    }

    public IReadOnlyList<Room> GetBookableRooms(
        string? checkIn = null,
        string? checkOut = null,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        var org = _org.Current;
        var resolvedCheckInTime = BookingTimeHelper.Resolve(checkInTime, org.CheckInTime);
        var resolvedCheckOutTime = BookingTimeHelper.Resolve(checkOutTime, org.CheckOutTime);
        var hasWindow = RoomBookingConflict.TryParseWindow(
            checkIn ?? "",
            checkOut ?? "",
            resolvedCheckInTime,
            resolvedCheckOutTime,
            out var windowStart,
            out var windowEnd);

        // Guest booking availability is always date+time based.
        if (!hasWindow)
            return [];

        var orgBookings = _data.BookingDetails
            .Where(b => string.Equals(b.OrganisationId, org.Id, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return _rooms.GetAll()
            .Where(RoomBookingConflict.IsRoomStructurallyBookable)
            .Where(r => !RoomBookingConflict.HasRoomConflict(orgBookings, r.Id, windowStart, windowEnd))
            .OrderBy(r => r.FloorNumber)
            .ThenBy(r => r.RoomNumber)
            .ToList();
    }

    /// <summary>Find a room by id only if it is free for the requested date/time window.</summary>
    public Room? FindBookableRoomById(
        string? roomId,
        string? checkIn = null,
        string? checkOut = null,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        if (string.IsNullOrWhiteSpace(roomId))
            return null;
        return GetBookableRooms(checkIn, checkOut, checkInTime, checkOutTime)
            .FirstOrDefault(r => string.Equals(r.Id, roomId, StringComparison.OrdinalIgnoreCase));
    }

    public BookingQuote Quote(
        string? roomId,
        string checkIn,
        string checkOut,
        int persons,
        int extraBeds,
        IReadOnlyList<string>? packageIds = null,
        IReadOnlyList<string>? guestServiceIds = null,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        var org = ResolveOrganisation(roomId);
        NormalizeWindow(org, ref checkIn, ref checkOut, ref checkInTime, ref checkOutTime,
            out var inDate, out var outDate, out var resolvedCheckInTime, out var resolvedCheckOutTime);

        PropertyScheduleRules.EnsureBookable(org, inDate, outDate, resolvedCheckInTime, resolvedCheckOutTime);

        var room = TryGetBookableRoom(roomId, checkIn, checkOut, resolvedCheckInTime, resolvedCheckOutTime);
        return BookingCalculator.Compute(
            inDate,
            outDate,
            persons,
            extraBeds,
            room,
            PackagesForOrg(org),
            packageIds,
            GuestServicesForOrg(org),
            guestServiceIds,
            resolvedCheckInTime,
            resolvedCheckOutTime,
            org.BookingType,
            org.MinimumHours);
    }

    public GuestBookingResult Create(GuestBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GuestName))
            throw new ArgumentException("Guest name is required.");
        if (string.IsNullOrWhiteSpace(request.Phone))
            throw new ArgumentException("Phone number is required.");

        var org = ResolveOrganisation(request.RoomId);
        var checkIn = request.CheckIn;
        var checkOut = request.CheckOut;
        var checkInTime = request.CheckInTime;
        var checkOutTime = request.CheckOutTime;
        NormalizeWindow(org, ref checkIn, ref checkOut, ref checkInTime, ref checkOutTime,
            out var inDate, out var outDate, out var resolvedCheckInTime, out var resolvedCheckOutTime);

        PropertyScheduleRules.EnsureBookable(org, inDate, outDate, resolvedCheckInTime, resolvedCheckOutTime);

        var room = TryGetBookableRoom(
            request.RoomId,
            checkIn,
            checkOut,
            resolvedCheckInTime,
            resolvedCheckOutTime);
        var quote = BookingCalculator.Compute(
            inDate,
            outDate,
            request.Persons,
            request.ExtraBeds,
            room,
            PackagesForOrg(org),
            request.PackageIds,
            GuestServicesForOrg(org),
            request.GuestServiceIds,
            resolvedCheckInTime,
            resolvedCheckOutTime,
            org.BookingType,
            org.MinimumHours);

        var phoneKey = CustomerHelpers.NormalizePhone(request.Phone);
        if (phoneKey.Length < 10)
            throw new ArgumentException("Enter a valid phone number.");

        var customer = _customers.GetByPhone(request.Phone) ?? new Customer
        {
            Id = Guid.NewGuid().ToString(),
            OrganisationId = org.Id,
        };
        customer.Name = request.GuestName.Trim();
        customer.Phone = request.Phone.Trim();
        customer.Email = string.IsNullOrWhiteSpace(request.Email) ? customer.Email : request.Email.Trim();
        _customers.SaveCustomer(customer);

        var bookingCode = GenerateBookingCode();
        var booking = new BookingDetail
        {
            Id = Guid.NewGuid().ToString(),
            OrganisationId = org.Id,
            CustomerId = customer.Id,
            RoomId = room?.Id ?? "",
            BookingCode = bookingCode,
            CheckIn = inDate.ToString("yyyy-MM-dd"),
            CheckOut = outDate.ToString("yyyy-MM-dd"),
            CheckInTime = resolvedCheckInTime,
            CheckOutTime = resolvedCheckOutTime,
            BookingType = quote.BookingType,
            Duration = quote.Duration,
            Nights = quote.Nights,
            Hours = quote.Hours,
            Persons = request.Persons,
            ExtraBeds = request.ExtraBeds,
            Packages = quote.Packages,
            GuestServices = quote.Services,
            Total = quote.Total,
            Paid = 0,
            Balance = quote.Total,
            Status = BookingDetailStatus.active,
        };
        _bookings.Save(booking);

        var onlinePayment = org.PaymentGateway.IsOnlineReady
            && org.PaymentGateway.CollectAtBooking
            && quote.Total > 0;

        // When online payment is required, consume credits only after Razorpay verify succeeds.
        if (!onlinePayment)
            _credits.ConsumeForBooking(bookingCode);

        var summary = room != null
            ? $"Online booking {bookingCode} for room {room.RoomNumber} ({quote.DurationLabel})"
            : $"Online booking {bookingCode} (packages / add-ons · {quote.DurationLabel})";
        _logs.Add("booking", "booking", booking.Id, summary);

        return new GuestBookingResult
        {
            BookingCode = bookingCode,
            BookingId = booking.Id,
            RoomNumber = room?.RoomNumber ?? "",
            RoomName = room?.RoomName ?? "",
            Quote = quote,
            GuestName = customer.Name,
            CheckIn = booking.CheckIn,
            CheckOut = booking.CheckOut,
            CheckInTime = booking.CheckInTime,
            CheckOutTime = booking.CheckOutTime,
            Persons = request.Persons,
            ExtraBeds = request.ExtraBeds,
            OnlinePaymentRequired = onlinePayment,
        };
    }

    /// <summary>
    /// Cancel a reservation that was created for online payment but never paid
    /// (guest closed Razorpay or payment failed).
    /// </summary>
    public bool CancelUnpaidOnlineBooking(string bookingId)
    {
        if (string.IsNullOrWhiteSpace(bookingId))
            return false;

        var booking = _bookings.GetById(bookingId);
        if (booking == null)
            return false;
        if (booking.Status == BookingDetailStatus.cancelled)
            return true;
        if (booking.Paid > 0 || booking.Balance <= 0)
            return false;

        var org = _data.GetOrganisation(booking.OrganisationId);
        if (org == null || !org.PaymentGateway.IsOnlineReady || !org.PaymentGateway.CollectAtBooking)
            return false;

        booking.Status = BookingDetailStatus.cancelled;
        booking.UpdatedAt = DateTime.UtcNow;
        _bookings.Save(booking);
        _logs.Add(
            "booking",
            "booking",
            booking.Id,
            $"Cancelled unpaid online booking {booking.BookingCode} (payment not completed)");
        return true;
    }

    private static void NormalizeWindow(
        Organisation org,
        ref string checkIn,
        ref string checkOut,
        ref string? checkInTime,
        ref string? checkOutTime,
        out DateOnly inDate,
        out DateOnly outDate,
        out string resolvedCheckInTime,
        out string resolvedCheckOutTime)
    {
        if (org.BookingType == PropertyBookingType.hourly)
        {
            if (string.IsNullOrWhiteSpace(checkOut))
                checkOut = checkIn;
            resolvedCheckInTime = BookingTimeHelper.Resolve(checkInTime, "14:00");
            resolvedCheckOutTime = BookingTimeHelper.Resolve(checkOutTime, "17:00");
        }
        else
        {
            var fixedTimes = !string.Equals(org.OvernightTimeMode, "dynamic", StringComparison.OrdinalIgnoreCase);
            if (fixedTimes)
            {
                resolvedCheckInTime = BookingTimeHelper.Resolve(null, org.CheckInTime);
                resolvedCheckOutTime = BookingTimeHelper.Resolve(null, org.CheckOutTime);
            }
            else
            {
                resolvedCheckInTime = BookingTimeHelper.Resolve(checkInTime, org.CheckInTime);
                resolvedCheckOutTime = BookingTimeHelper.Resolve(checkOutTime, org.CheckOutTime);
            }
        }

        if (!BookingCalculator.TryParseDate(checkIn, out inDate) ||
            !BookingCalculator.TryParseDate(checkOut, out outDate))
        {
            throw new ArgumentException(
                org.BookingType == PropertyBookingType.hourly
                    ? "Enter a valid booking date."
                    : "Enter valid check-in and check-out dates.");
        }

        checkIn = inDate.ToString("yyyy-MM-dd");
        checkOut = outDate.ToString("yyyy-MM-dd");
    }

    private Organisation ResolveOrganisation(string? roomId)
    {
        if (!string.IsNullOrWhiteSpace(roomId))
        {
            var room = _rooms.GetById(roomId);
            if (room != null)
            {
                var org = _data.GetOrganisation(room.OrganisationId);
                if (org != null)
                    return org;
            }
        }

        return _org.Current;
    }

    private Room? TryGetBookableRoom(
        string? roomId,
        string? checkIn = null,
        string? checkOut = null,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        if (string.IsNullOrWhiteSpace(roomId))
            return null;

        var room = _rooms.GetById(roomId)
            ?? throw new ArgumentException("Room not found.");
        if (!RoomBookingConflict.IsRoomStructurallyBookable(room))
            throw new ArgumentException(
                $"Room {room.RoomNumber} cannot be booked (status: {RoomCatalog.GetStatus(room.Status).Label}).");

        if (!string.IsNullOrWhiteSpace(checkIn) &&
            !string.IsNullOrWhiteSpace(checkOut) &&
            RoomBookingConflict.TryParseWindow(checkIn, checkOut, checkInTime, checkOutTime, out var start, out var end))
        {
            var orgBookings = _data.BookingDetails.Where(b =>
                string.Equals(b.OrganisationId, room.OrganisationId, StringComparison.OrdinalIgnoreCase));
            if (RoomBookingConflict.HasRoomConflict(orgBookings, room.Id, start, end))
            {
                throw new ArgumentException(
                    $"Room {room.RoomNumber} is already booked for part of the selected date and time.");
            }
        }

        return room;
    }

    private static List<PropertyPackage> PackagesForOrg(Organisation org)
    {
        org.Packages ??= [];
        return org.Packages.Where(p => p.IsActive).ToList();
    }

    private static List<PropertyGuestService> GuestServicesForOrg(Organisation org)
    {
        org.GuestServices ??= [];
        foreach (var service in org.GuestServices.Where(s => string.IsNullOrWhiteSpace(s.Id)))
            service.Id = Guid.NewGuid().ToString();
        return org.GuestServices.Where(s => s.IsActive).ToList();
    }

    private string GenerateBookingCode()
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var code = $"BK-{Random.Shared.Next(1000, 9999)}";
            if (_data.BookingDetails.All(b => b.BookingCode != code))
                return code;
        }

        return $"BK-{Guid.NewGuid().ToString()[..8].ToUpperInvariant()}";
    }
}
