namespace appointza.Models.AppointzaStay;

public enum BookingDetailStatus { active, completed, cancelled }

public class BookingDetail
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OrganisationId { get; set; } = "";
    public string CustomerId { get; set; } = "";
    public string RoomId { get; set; } = "";
    public string BookingCode { get; set; } = "";
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    /// <summary>Local time HH:mm (e.g. 14:00)</summary>
    public string CheckInTime { get; set; } = "";
    /// <summary>Local time HH:mm (e.g. 11:00)</summary>
    public string CheckOutTime { get; set; } = "";
    /// <summary>overnight | hourly — mirrors property setting at booking time.</summary>
    public string BookingType { get; set; } = "overnight";
    /// <summary>Nights (overnight) or hours (hourly).</summary>
    public int Duration { get; set; }
    /// <summary>Legacy overnight field; kept in sync with <see cref="Duration"/> when overnight.</summary>
    public int Nights { get; set; }
    /// <summary>Hours for hourly bookings; 0 when overnight.</summary>
    public int Hours { get; set; }
    public int Persons { get; set; } = 2;
    public int ExtraBeds { get; set; }
    public List<BookingPackageLine> Packages { get; set; } = [];
    public List<BookingGuestServiceLine> GuestServices { get; set; } = [];
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    /// <summary>Razorpay payment id (pay_…) when paid online.</summary>
    public string PaymentReference { get; set; } = "";
    /// <summary>Razorpay order id (order_…) for the online payment.</summary>
    public string RazorpayOrderId { get; set; } = "";
    public BookingDetailStatus Status { get; set; } = BookingDetailStatus.active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
