namespace appointza.Models.AppointzaStay;

public class GuestBookingRequest
{
    public string RoomId { get; set; } = "";
    public string GuestName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public string CheckInTime { get; set; } = "";
    public string CheckOutTime { get; set; } = "";
    public int Persons { get; set; } = 2;
    public int ExtraBeds { get; set; }
    public List<string> PackageIds { get; set; } = [];
    public List<string> GuestServiceIds { get; set; } = [];
}

public class BookingPackageLine
{
    public string PackageId { get; set; } = "";
    public string Name { get; set; } = "";
    public string PriceLabel { get; set; } = "";
    public string Kind { get; set; } = "standard";
    public bool IncludesRoom { get; set; } = true;
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}

public class BookingGuestServiceLine
{
    public string ServiceId { get; set; } = "";
    public string Name { get; set; } = "";
    public string PriceLabel { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal Total { get; set; }
}

public class BookingQuote
{
    public string BookingType { get; set; } = "overnight";
    public int Nights { get; set; }
    public int Hours { get; set; }
    public int Duration { get; set; }
    public string DurationLabel { get; set; } = "";
    public decimal RoomTotal { get; set; }
    public decimal ExtraBedTotal { get; set; }
    public decimal ExtraGuestTotal { get; set; }
    public decimal PackagesTotal { get; set; }
    public List<BookingPackageLine> Packages { get; set; } = [];
    public decimal ServicesTotal { get; set; }
    public List<BookingGuestServiceLine> Services { get; set; } = [];
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public int MaxExtraBeds { get; set; }
    public int MaxPersons { get; set; }
    public int ExtraBeds { get; set; }
    public int Persons { get; set; }
    public decimal ExtraBedChargePerNight { get; set; }
    public decimal PricePerHour { get; set; }
    public int MinimumHours { get; set; }
}

public class GuestBookingResult
{
    public string BookingCode { get; set; } = "";
    public string BookingId { get; set; } = "";
    public string RoomNumber { get; set; } = "";
    public string RoomName { get; set; } = "";
    public BookingQuote Quote { get; set; } = new();
    public string GuestName { get; set; } = "";
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public string CheckInTime { get; set; } = "";
    public string CheckOutTime { get; set; } = "";
    public int Persons { get; set; }
    public int ExtraBeds { get; set; }
    /// <summary>True when the property has active Razorpay credentials and expects online payment.</summary>
    public bool OnlinePaymentRequired { get; set; }
}

public class StayCreatePaymentOrderReq
{
    public string BookingId { get; set; } = "";
}

public class StayCreatePaymentOrderRes
{
    public string OrderId { get; set; } = "";
    public string Key { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Receipt { get; set; } = "";
    public string BookingCode { get; set; } = "";
    public string PropertyName { get; set; } = "";
    public string GuestName { get; set; } = "";
    public string GuestEmail { get; set; } = "";
    public string GuestPhone { get; set; } = "";
}

public class StayVerifyPaymentReq
{
    public string BookingId { get; set; } = "";
    public string RazorpayOrderId { get; set; } = "";
    public string RazorpayPaymentId { get; set; } = "";
    public string RazorpaySignature { get; set; } = "";
}

public class StayVerifyPaymentRes
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = "";
    public string BookingCode { get; set; } = "";
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
}
