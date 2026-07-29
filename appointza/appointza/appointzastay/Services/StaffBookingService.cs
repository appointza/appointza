using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class StaffBookingService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _org;
    private readonly RoomService _rooms;

    public StaffBookingService(AppDataStore data, OrganisationResolver org, RoomService rooms)
    {
        _data = data;
        _org = org;
        _rooms = rooms;
    }

    public StaffBookingCalendarPayload GetCalendar(int? year, int? month)
    {
        var today = RoomDaySync.Today;
        var focusMonth = month is >= 1 and <= 12 ? month.Value : today.Month;
        var focusYear = year ?? today.Year;
        var monthStart = new DateOnly(focusYear, focusMonth, 1);
        var monthEnd = monthStart.AddMonths(1);

        var orgId = _org.OrganisationId;
        var allItems = _data.BookingDetails
            .Where(b => b.OrganisationId == orgId && b.Status != BookingDetailStatus.cancelled)
            .Select(ToStaffItem)
            .OrderBy(b => b.CheckIn)
            .ThenBy(b => b.RoomNumber)
            .ToList();

        var monthBookings = allItems.Where(b => OverlapsMonth(b, monthStart, monthEnd)).ToList();
        var active = allItems.Where(b => b.Status == "active").ToList();

        return new StaffBookingCalendarPayload
        {
            Today = today.ToString("yyyy-MM-dd"),
            Year = focusYear,
            Month = focusMonth,
            MonthStart = monthStart.ToString("yyyy-MM-dd"),
            MonthEnd = monthEnd.ToString("yyyy-MM-dd"),
            Rooms = _rooms.GetAll()
                .Select(r => new StaffRoomRow
                {
                    Id = r.Id,
                    RoomNumber = r.RoomNumber,
                    RoomName = r.RoomName,
                    FloorNumber = r.FloorNumber,
                    Status = r.Status.ToString(),
                })
                .ToList(),
            Bookings = monthBookings,
            TodayArrivals = active.Where(b => b.CheckIn == today.ToString("yyyy-MM-dd")).ToList(),
            TodayDepartures = active.Where(b => b.CheckOut == today.ToString("yyyy-MM-dd")).ToList(),
            TodayInHouse = active.Where(b => OccupiesNight(b, today)).ToList(),
            TodayNewBookings = allItems
                .Where(b => IsCreatedOn(b, today))
                .OrderByDescending(b => b.CreatedAt)
                .ToList(),
        };
    }

    public StaffBookingItem? GetById(string id)
    {
        var orgId = _org.OrganisationId;
        var detail = _data.BookingDetails.FirstOrDefault(b => b.Id == id && b.OrganisationId == orgId);
        return detail == null ? null : ToStaffItem(detail);
    }

    private StaffBookingItem? ToStaffItem(BookingDetail detail)
    {
        var customer = _data.Customers.FirstOrDefault(c => c.Id == detail.CustomerId);
        var room = string.IsNullOrWhiteSpace(detail.RoomId)
            ? null
            : _data.Rooms.FirstOrDefault(r => r.Id == detail.RoomId);

        return new StaffBookingItem
        {
            Id = detail.Id,
            BookingCode = detail.BookingCode,
            CustomerId = detail.CustomerId,
            GuestName = customer?.Name ?? "Guest",
            Phone = customer?.Phone ?? "",
            Email = customer?.Email,
            RoomId = detail.RoomId,
            RoomNumber = room?.RoomNumber ?? "",
            RoomName = room?.RoomName ?? "",
            FloorNumber = room?.FloorNumber ?? 0,
            CheckIn = detail.CheckIn,
            CheckOut = detail.CheckOut,
            CheckInTime = string.IsNullOrWhiteSpace(detail.CheckInTime) ? "14:00" : detail.CheckInTime,
            CheckOutTime = string.IsNullOrWhiteSpace(detail.CheckOutTime) ? "11:00" : detail.CheckOutTime,
            Nights = detail.Nights,
            Persons = detail.Persons,
            ExtraBeds = detail.ExtraBeds,
            Status = detail.Status.ToString(),
            Total = detail.Total,
            Paid = detail.Paid,
            Balance = detail.Balance,
            Packages = detail.Packages ?? [],
            GuestServices = detail.GuestServices ?? [],
            CreatedAt = detail.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
        };
    }

    private static bool OverlapsMonth(StaffBookingItem booking, DateOnly monthStart, DateOnly monthEnd)
    {
        if (!DateOnly.TryParse(booking.CheckIn, out var checkIn) ||
            !DateOnly.TryParse(booking.CheckOut, out var checkOut))
            return false;
        return checkIn < monthEnd && checkOut > monthStart;
    }

    private static bool OccupiesNight(StaffBookingItem booking, DateOnly day)
    {
        if (!DateOnly.TryParse(booking.CheckIn, out var checkIn) ||
            !DateOnly.TryParse(booking.CheckOut, out var checkOut))
            return false;
        if (checkIn == checkOut)
            return day == checkIn;
        return day >= checkIn && day < checkOut;
    }

    private static bool IsCreatedOn(StaffBookingItem booking, DateOnly day)
    {
        if (!DateTime.TryParse(booking.CreatedAt, out var created))
            return false;
        var createdDay = DateOnly.FromDateTime(created.ToLocalTime());
        return createdDay == day;
    }
}
