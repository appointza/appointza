namespace appointza.Models.AppointzaStay;

public class PlatformOrganisationRow
{
    public string id { get; set; } = "";
    public string name { get; set; } = "";
    public string slug { get; set; } = "";
    public string email { get; set; } = "";
    public string phone { get; set; } = "";
    public string address { get; set; } = "";
    public string ownerName { get; set; } = "";
    public string ownerPhone { get; set; } = "";
    public string ownerEmail { get; set; } = "";
    public int walletCreditBalance { get; set; }
    public int bookingCredits { get; set; }
    public int userCount { get; set; }
    public int customerCount { get; set; }
    public bool isVerified { get; set; }
    public DateTime? verifiedAt { get; set; }
    public DateTime createdAt { get; set; }
}

public class PlatformOrganisationListRes
{
    public List<PlatformOrganisationRow> organisations { get; set; } = [];
    public int total { get; set; }
}

public class PlatformVerificationReq
{
    public string organisationId { get; set; } = "";
    public bool verified { get; set; }
}

public class PlatformBookingRow
{
    public string id { get; set; } = "";
    public string bookingCode { get; set; } = "";
    public string organisationId { get; set; } = "";
    public string organisationName { get; set; } = "";
    public string organisationSlug { get; set; } = "";
    public string guestName { get; set; } = "";
    public string guestPhone { get; set; } = "";
    public string guestEmail { get; set; } = "";
    public string roomNumber { get; set; } = "";
    public string roomName { get; set; } = "";
    public string checkIn { get; set; } = "";
    public string checkOut { get; set; } = "";
    public string status { get; set; } = "";
    public decimal total { get; set; }
    public decimal paid { get; set; }
    public decimal balance { get; set; }
    public bool bookedToday { get; set; }
    public bool arrivalToday { get; set; }
    public string createdAt { get; set; } = "";
}

public class PlatformTodayBookingsRes
{
    public string date { get; set; } = "";
    public List<PlatformBookingRow> bookings { get; set; } = [];
    public int total { get; set; }
}
