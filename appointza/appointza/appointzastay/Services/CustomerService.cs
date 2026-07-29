using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class CustomerService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _orgResolver;

    public CustomerService(AppDataStore data, OrganisationResolver orgResolver)
    {
        _data = data;
        _orgResolver = orgResolver;
    }

    public IReadOnlyList<Customer> GetAll() =>
        _data.Customers
            .Where(c => c.OrganisationId == _orgResolver.OrganisationId)
            .OrderBy(c => c.Name)
            .ToList();

    public Customer? GetById(string id) => _data.Customers.FirstOrDefault(c => c.Id == id);

    public Customer? GetByPhone(string phone)
    {
        var key = CustomerHelpers.NormalizePhone(phone);
        return _data.Customers.FirstOrDefault(c => CustomerHelpers.NormalizePhone(c.Phone) == key);
    }

    public IReadOnlyList<CustomerSummary> GetAllCustomers(string? search = null)
    {
        var summaries = _data.Customers
            .Where(c => c.OrganisationId == _orgResolver.OrganisationId)
            .Select(BuildSummary)
            .ToList();

        if (string.IsNullOrWhiteSpace(search)) return summaries;

        var q = search.Trim().ToLowerInvariant();
        return summaries.Where(c =>
            c.Name.ToLowerInvariant().Contains(q) ||
            c.Phone.Contains(q) ||
            (c.Email?.ToLowerInvariant().Contains(q) ?? false) ||
            c.Bookings.Any(b => b.BookingId.ToLowerInvariant().Contains(q) || b.RoomNumber.Contains(q))
        ).ToList();
    }

    public CustomerSummary? GetCustomer(string key)
    {
        var normalized = CustomerHelpers.NormalizePhone(key);
        var customer = _data.Customers.FirstOrDefault(c =>
            c.Id == key ||
            CustomerHelpers.NormalizePhone(c.Phone) == normalized);

        return customer == null ? null : BuildSummary(customer);
    }

    public IReadOnlyList<CustomerBooking> GetAllBookings() =>
        _data.BookingDetails
            .Select(b => ToCustomerBooking(b))
            .Where(b => b != null)
            .Cast<CustomerBooking>()
            .OrderByDescending(b => b.CheckIn)
            .ToList();

    public void ArchiveBooking(Room room)
    {
        var changed = false;
        foreach (var b in _data.BookingDetails.Where(b => b.RoomId == room.Id && b.Status == BookingDetailStatus.active))
        {
            b.Status = BookingDetailStatus.completed;
            b.UpdatedAt = DateTime.UtcNow;
            changed = true;
        }
        if (changed) _data.SaveBookingDetails();
    }

    public void SaveCustomer(Customer customer)
    {
        customer.UpdatedAt = DateTime.UtcNow;
        customer.OrganisationId = _orgResolver.OrganisationId;

        var idx = _data.Customers.FindIndex(c => c.Id == customer.Id);
        if (idx >= 0) _data.Customers[idx] = customer;
        else
        {
            customer.CreatedAt = DateTime.UtcNow;
            _data.Customers.Add(customer);
        }
        _data.SaveCustomers();
    }

    private CustomerSummary BuildSummary(Customer customer)
    {
        var bookings = _data.BookingDetails
            .Where(b => b.CustomerId == customer.Id)
            .Select(ToCustomerBooking)
            .Where(b => b != null)
            .Cast<CustomerBooking>()
            .OrderByDescending(b => b.CheckIn)
            .ToList();

        var user = _data.Users.FirstOrDefault(u =>
            u.Role == UserRole.customer &&
            (CustomerHelpers.NormalizePhone(u.Phone) == CustomerHelpers.NormalizePhone(customer.Phone) ||
             string.Equals(u.Email, customer.Email, StringComparison.OrdinalIgnoreCase)));

        return new CustomerSummary
        {
            Key = CustomerHelpers.NormalizePhone(customer.Phone),
            Name = customer.Name,
            Phone = customer.Phone,
            Email = customer.Email ?? user?.Email,
            UserAccountId = customer.UserAccountId ?? user?.Id,
            HasUserAccount = customer.UserAccountId != null || user != null,
            TotalBookings = bookings.Count,
            ActiveBookings = bookings.Count(b => b.BookingStatus == "active"),
            TotalSpent = bookings.Sum(b => b.Paid),
            OutstandingBalance = bookings.Where(b => b.BookingStatus == "active").Sum(b => b.Balance),
            Bookings = bookings
        };
    }

    private CustomerBooking? ToCustomerBooking(BookingDetail detail)
    {
        var customer = _data.Customers.FirstOrDefault(c => c.Id == detail.CustomerId);
        var room = _data.Rooms.FirstOrDefault(r => r.Id == detail.RoomId);
        if (customer == null || room == null) return null;

        var isActive = detail.Status == BookingDetailStatus.active;
        return new CustomerBooking
        {
            Id = detail.Id,
            CustomerKey = CustomerHelpers.NormalizePhone(customer.Phone),
            CustomerName = customer.Name,
            Phone = customer.Phone,
            Email = customer.Email,
            RoomId = room.Id,
            RoomNumber = room.RoomNumber,
            RoomName = room.RoomName,
            RoomType = room.RoomType,
            FloorNumber = room.FloorNumber,
            BookingId = detail.BookingCode,
            CheckIn = detail.CheckIn,
            CheckOut = detail.CheckOut,
            Nights = detail.Nights,
            Total = detail.Total,
            Paid = detail.Paid,
            Balance = detail.Balance,
            BookingStatus = isActive ? "active" : "completed",
            RoomStatus = room.Status,
            RecordedAt = detail.UpdatedAt
        };
    }
}
