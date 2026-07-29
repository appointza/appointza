using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public static class RoomHydrator
{
    public static void Apply(IEnumerable<Room> rooms, IReadOnlyList<Customer> customers, IReadOnlyList<BookingDetail> bookings)
    {
        foreach (var room in rooms)
        {
            EnsureDefaults(room);
            room.Guest = null;
            room.Booking = null;
            room.Payment = null;

            var active = bookings
                .Where(b => b.RoomId == room.Id && b.Status == BookingDetailStatus.active)
                .OrderByDescending(b => b.CheckIn)
                .FirstOrDefault();

            if (active == null) continue;

            var customer = customers.FirstOrDefault(c => c.Id == active.CustomerId);
            if (customer != null)
            {
                room.Guest = new RoomGuest
                {
                    Name = customer.Name,
                    Phone = customer.Phone,
                    Email = customer.Email
                };
            }

            room.Booking = new RoomBooking
            {
                BookingId = active.BookingCode,
                CheckIn = active.CheckIn,
                CheckOut = active.CheckOut,
                CheckInTime = active.CheckInTime,
                CheckOutTime = active.CheckOutTime,
                Nights = active.Nights
            };

            room.Payment = new RoomPayment
            {
                Total = active.Total,
                Paid = active.Paid,
                Balance = active.Balance
            };
        }
    }

    public static void StripForPersist(Room room)
    {
        EnsureDefaults(room);
        room.Guest = null;
        room.Booking = null;
        room.Payment = null;
    }

    public static void EnsureDefaults(Room room)
    {
        room.Capacity ??= new RoomCapacity();
        room.Pricing ??= new RoomPricing();
        room.BookingRules ??= new RoomBookingRules();
        room.Amenities ??= [];
        room.GalleryPhotos ??= [];
    }
}
