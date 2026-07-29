namespace appointza.Models.AppointzaStay;

public class CustomerBooking
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CustomerKey { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string RoomId { get; set; } = "";
    public string RoomNumber { get; set; } = "";
    public string RoomName { get; set; } = "";
    public RoomType RoomType { get; set; }
    public int FloorNumber { get; set; }
    public string BookingId { get; set; } = "";
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public int Nights { get; set; }
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    /// <summary>active = current stay/reservation, completed = checked out</summary>
    public string BookingStatus { get; set; } = "active";
    public RoomStatus RoomStatus { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

public class CustomerSummary
{
    public string Key { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string? UserAccountId { get; set; }
    public bool HasUserAccount { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal OutstandingBalance { get; set; }
    public List<CustomerBooking> Bookings { get; set; } = [];
    public CustomerBooking? CurrentStay => Bookings.FirstOrDefault(b => b.BookingStatus == "active" &&
        b.RoomStatus is RoomStatus.occupied or RoomStatus.reserved);
}

public static class CustomerHelpers
{
    public static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());

    public static string FormatDate(string iso)
    {
        if (string.IsNullOrEmpty(iso)) return "—";
        return DateTime.TryParse(iso, out var d)
            ? d.ToString("dd MMM yyyy")
            : iso;
    }

    public static string BookingStatusLabel(CustomerBooking b) => b.BookingStatus switch
    {
        "active" when b.RoomStatus == RoomStatus.occupied => "Checked In",
        "active" when b.RoomStatus == RoomStatus.reserved => "Reserved",
        "active" when b.RoomStatus == RoomStatus.checkout_pending => "Check-out Pending",
        "completed" => "Completed",
        _ => "Active"
    };

    public static string BookingStatusBadge(CustomerBooking b) => b.BookingStatus switch
    {
        "completed" => "bg-gray-100 text-gray-700",
        _ when b.RoomStatus == RoomStatus.occupied => "bg-orange-100 text-orange-800",
        _ when b.RoomStatus == RoomStatus.reserved => "bg-blue-100 text-blue-800",
        _ when b.RoomStatus == RoomStatus.checkout_pending => "bg-purple-100 text-purple-800",
        _ => "bg-emerald-100 text-emerald-800"
    };
}
