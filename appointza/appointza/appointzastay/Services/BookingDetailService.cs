using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class BookingDetailService
{
    private readonly AppDataStore _data;
    private readonly LogService _logs;

    public BookingDetailService(AppDataStore data, LogService logs)
    {
        _data = data;
        _logs = logs;
    }

    public IReadOnlyList<BookingDetail> GetAll() =>
        _data.BookingDetails.OrderByDescending(b => b.CheckIn).ToList();

    public BookingDetail? GetById(string id) =>
        _data.BookingDetails.FirstOrDefault(b => b.Id == id);

    public BookingDetail? GetActiveForRoom(string roomId) =>
        _data.BookingDetails
            .Where(b => b.RoomId == roomId && b.Status == BookingDetailStatus.active)
            .OrderByDescending(b => b.CheckIn)
            .FirstOrDefault();

    public IReadOnlyList<BookingDetail> GetByCustomer(string customerId) =>
        _data.BookingDetails.Where(b => b.CustomerId == customerId).OrderByDescending(b => b.CheckIn).ToList();

    public void Save(BookingDetail booking)
    {
        booking.UpdatedAt = DateTime.UtcNow;
        var idx = _data.BookingDetails.FindIndex(b => b.Id == booking.Id);
        if (idx >= 0) _data.BookingDetails[idx] = booking;
        else
        {
            booking.CreatedAt = DateTime.UtcNow;
            _data.BookingDetails.Add(booking);
        }
        _data.SaveBookingDetails();
    }

    public void CompleteForRoom(string roomId, string? userId = null)
    {
        var booking = GetActiveForRoom(roomId);
        if (booking == null) return;
        booking.Status = BookingDetailStatus.completed;
        booking.UpdatedAt = DateTime.UtcNow;
        _data.SaveBookingDetails();
        _logs.Add("checkout", "booking", booking.Id, $"Booking {booking.BookingCode} completed", userId);
    }

    public void UpdatePayment(string roomId, decimal totalDelta, decimal paidDelta)
    {
        var booking = GetActiveForRoom(roomId);
        if (booking == null) return;
        booking.Total += totalDelta;
        booking.Paid += paidDelta;
        booking.Balance = booking.Total - booking.Paid;
        Save(booking);
    }

    public void ExtendStay(string roomId, int extraNights, decimal extraCost)
    {
        var booking = GetActiveForRoom(roomId);
        if (booking == null) return;
        if (DateTime.TryParse(booking.CheckOut, out var checkOut))
            booking.CheckOut = checkOut.AddDays(extraNights).ToString("yyyy-MM-dd");
        booking.Nights += extraNights;
        booking.Total += extraCost;
        booking.Balance += extraCost;
        Save(booking);
    }
}
