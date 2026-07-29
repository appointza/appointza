namespace appointza.Models.AppointzaStay;

public class StaffBookingItem
{
    public string Id { get; set; } = "";
    public string BookingCode { get; set; } = "";
    public string CustomerId { get; set; } = "";
    public string GuestName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string RoomId { get; set; } = "";
    public string RoomNumber { get; set; } = "";
    public string RoomName { get; set; } = "";
    public int FloorNumber { get; set; }
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public string CheckInTime { get; set; } = "";
    public string CheckOutTime { get; set; } = "";
    public int Nights { get; set; }
    public int Persons { get; set; }
    public int ExtraBeds { get; set; }
    public string Status { get; set; } = "active";
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    public List<BookingPackageLine> Packages { get; set; } = [];
    public List<BookingGuestServiceLine> GuestServices { get; set; } = [];
    public string CreatedAt { get; set; } = "";
}

public class StaffRoomRow
{
    public string Id { get; set; } = "";
    public string RoomNumber { get; set; } = "";
    public string RoomName { get; set; } = "";
    public int FloorNumber { get; set; }
    public string Status { get; set; } = "";
}

public class StaffBookingCalendarPayload
{
    public string Today { get; set; } = "";
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthStart { get; set; } = "";
    public string MonthEnd { get; set; } = "";
    public List<StaffRoomRow> Rooms { get; set; } = [];
    public List<StaffBookingItem> Bookings { get; set; } = [];
    public List<StaffBookingItem> TodayArrivals { get; set; } = [];
    public List<StaffBookingItem> TodayDepartures { get; set; } = [];
    public List<StaffBookingItem> TodayInHouse { get; set; } = [];
    public List<StaffBookingItem> TodayNewBookings { get; set; } = [];
}
