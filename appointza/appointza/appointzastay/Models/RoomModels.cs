namespace appointza.Models.AppointzaStay;

public enum RoomType { single, @double, twin, deluxe, suite, family, dormitory }

public enum RoomStatus
{
    available, reserved, occupied, checkout_pending, cleaning, maintenance, blocked, hold
}

public class RoomCapacity
{
    public int AdultsAllowed { get; set; } = 2;
    public int ChildrenAllowed { get; set; } = 1;
    public int TotalGuests { get; set; } = 3;
    /// <summary>Number of roll-away / mattress beds allowed beyond standard beds. 0 = not allowed.</summary>
    public int ExtraBedsAllowed { get; set; }

    public bool ExtraBedAllowed
    {
        get => ExtraBedsAllowed > 0;
        set => ExtraBedsAllowed = value ? (ExtraBedsAllowed > 0 ? ExtraBedsAllowed : 1) : 0;
    }
}

public class RoomPricing
{
    public decimal PricePerNight { get; set; }
    /// <summary>Used when the property booking type is hourly (party hall, etc.).</summary>
    public decimal PricePerHour { get; set; }
    public decimal WeekendPrice { get; set; }
    public decimal HolidayPrice { get; set; }
    public decimal SeasonalPrice { get; set; }
    public decimal ExtraGuestCharge { get; set; }
    public decimal ExtraBedCharge { get; set; }
    public decimal EarlyCheckInCharge { get; set; }
    public decimal LateCheckOutCharge { get; set; }
    public decimal TaxPercentage { get; set; } = 12;
    public decimal Discount { get; set; }
}

public class RoomBookingRules
{
    public string CheckInTime { get; set; } = "14:00";
    public string CheckOutTime { get; set; } = "11:00";
    public string CancellationPolicy { get; set; } = "Free cancellation up to 24 hours before check-in.";
    public int MinimumStay { get; set; } = 1;
    public int MaximumStay { get; set; } = 30;
    /// <summary>Minimum hours for hourly bookings (0 = use property default).</summary>
    public int MinimumHours { get; set; }
    public int MaximumHours { get; set; } = 12;
}

public class RoomGuest
{
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string? IdProof { get; set; }
}

public class RoomBooking
{
    public string BookingId { get; set; } = "";
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public string CheckInTime { get; set; } = "";
    public string CheckOutTime { get; set; } = "";
    public int Nights { get; set; }
}

public class RoomPayment
{
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
}

public class CleaningAssignment
{
    public string UserId { get; set; } = "";
    public string UserName { get; set; } = "";
    public DateTime AssignedAt { get; set; }
}

public class Room
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OrganisationId { get; set; } = "";
    public string RoomNumber { get; set; } = "";
    public string RoomName { get; set; } = "";
    public RoomType RoomType { get; set; } = RoomType.@double;
    public int FloorNumber { get; set; } = 1;
    public string BuildingWing { get; set; } = "";
    public RoomCapacity Capacity { get; set; } = new();
    public RoomPricing Pricing { get; set; } = new();
    public List<string> Amenities { get; set; } = ["wifi", "attached-bathroom", "hot-water"];
    public string MainPhoto { get; set; } = "";
    public List<string> GalleryPhotos { get; set; } = [];
    public string RoomVideo { get; set; } = "";
    public RoomStatus Status { get; set; } = RoomStatus.available;
    public RoomGuest? Guest { get; set; }
    public RoomBooking? Booking { get; set; }
    public RoomPayment? Payment { get; set; }
    public CleaningAssignment? CleaningAssignment { get; set; }
    public RoomBookingRules BookingRules { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class RoomCatalog
{
    public static readonly (RoomType Value, string Label)[] Types =
    [
        (RoomType.single, "Single"),
        (RoomType.@double, "Double"),
        (RoomType.twin, "Twin"),
        (RoomType.deluxe, "Deluxe"),
        (RoomType.suite, "Suite"),
        (RoomType.family, "Family Room"),
        (RoomType.dormitory, "Dormitory"),
    ];

    public static readonly (RoomStatus Value, string Label, string Emoji, string Meaning, string BadgeClass, string CardBorder, string CardBg)[] Statuses =
    [
        (RoomStatus.available, "Available", "🟢", "Room is ready for booking", "bg-emerald-100 text-emerald-800", "border-emerald-200", "bg-emerald-50/60"),
        (RoomStatus.reserved, "Reserved", "🔵", "Booking confirmed but guest not checked in", "bg-blue-100 text-blue-800", "border-blue-200", "bg-blue-50/60"),
        (RoomStatus.occupied, "Occupied", "🟠", "Guest currently staying", "bg-orange-100 text-orange-800", "border-orange-200", "bg-orange-50/60"),
        (RoomStatus.checkout_pending, "Check-out Pending", "🟣", "Guest left, cleaning required", "bg-purple-100 text-purple-800", "border-purple-200", "bg-purple-50/60"),
        (RoomStatus.cleaning, "Cleaning", "🧹", "Housekeeping cleaning the room", "bg-teal-100 text-teal-800", "border-teal-200", "bg-teal-50/60"),
        (RoomStatus.maintenance, "Maintenance", "🔴", "Room unavailable due to repair", "bg-red-100 text-red-800", "border-red-200", "bg-red-50/40"),
        (RoomStatus.blocked, "Out of Service", "⚫", "Temporarily unavailable", "bg-gray-200 text-gray-800", "border-gray-300", "bg-gray-100/60"),
        (RoomStatus.hold, "Hold", "🟡", "Temporarily reserved", "bg-yellow-100 text-yellow-800", "border-yellow-200", "bg-yellow-50/60"),
    ];

    public static string GetTypeLabel(RoomType type) =>
        Types.FirstOrDefault(t => t.Value == type).Label ?? type.ToString();

    public static (string Label, string Emoji, string Meaning, string BadgeClass, string CardBorder, string CardBg) GetStatus(RoomStatus status)
    {
        var s = Statuses.FirstOrDefault(x => x.Value == status);
        return s == default ? ("Unknown", "❓", "", "bg-gray-100", "border-gray-200", "bg-gray-50") : (s.Label, s.Emoji, s.Meaning, s.BadgeClass, s.CardBorder, s.CardBg);
    }

    public static bool NeedsCleaningAssignment(RoomStatus status) =>
        status is RoomStatus.checkout_pending or RoomStatus.cleaning;
}
