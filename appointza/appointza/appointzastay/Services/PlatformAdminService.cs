using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class PlatformAdminService
{
    private readonly AppDataStore _data;

    public PlatformAdminService(AppDataStore data) => _data = data;

    public PlatformOrganisationListRes ListOrganisations()
    {
        var userCounts = _data.Users
            .GroupBy(u => u.OrganisationId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
        var customerCounts = _data.Customers
            .GroupBy(c => c.OrganisationId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        var rows = _data.Organisations
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => ToRow(o, userCounts, customerCounts))
            .ToList();

        return new PlatformOrganisationListRes
        {
            organisations = rows,
            total = rows.Count,
        };
    }

    public PlatformOrganisationRow SetVerification(string organisationId, bool verified, string adminUserId)
    {
        var org = _data.RequireOrganisation(organisationId);
        org.IsVerified = verified;
        org.VerifiedAt = verified ? DateTime.UtcNow : null;
        org.VerifiedByUserId = verified ? adminUserId : null;
        _data.UpsertOrganisation(org);
        return ToRow(org);
    }

    private PlatformOrganisationRow ToRow(
        Organisation org,
        IReadOnlyDictionary<string, int>? userCounts = null,
        IReadOnlyDictionary<string, int>? customerCounts = null)
    {
        userCounts ??= _data.Users
            .GroupBy(u => u.OrganisationId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
        customerCounts ??= _data.Customers
            .GroupBy(c => c.OrganisationId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        var billing = _data.BillingAccounts.FirstOrDefault(b => b.OrganisationId == org.Id);
        var owner = _data.Users.FirstOrDefault(u => u.Id == org.OwnerId);

        return new PlatformOrganisationRow
        {
            id = org.Id,
            name = org.Name,
            slug = org.Slug,
            email = org.Email,
            phone = org.Phone,
            address = FormatAddress(org),
            ownerName = owner?.Name ?? "",
            ownerEmail = owner?.Email ?? "",
            ownerPhone = owner?.Phone ?? "",
            walletCreditBalance = billing?.WalletCreditBalance ?? 0,
            bookingCredits = billing?.BookingCredits ?? 0,
            userCount = userCounts.GetValueOrDefault(org.Id),
            customerCount = customerCounts.GetValueOrDefault(org.Id),
            isVerified = org.IsVerified,
            verifiedAt = org.VerifiedAt,
            createdAt = org.CreatedAt,
        };
    }

    public PlatformTodayBookingsRes ListTodayBookings(string? date = null)
    {
        var today = ParseDateOrToday(date);
        var orgById = _data.Organisations.ToDictionary(o => o.Id, StringComparer.OrdinalIgnoreCase);
        var customerById = _data.Customers.ToDictionary(c => c.Id, StringComparer.OrdinalIgnoreCase);
        var roomById = _data.Rooms.ToDictionary(r => r.Id, StringComparer.OrdinalIgnoreCase);

        var rows = _data.BookingDetails
            .Where(b => b.Status != BookingDetailStatus.cancelled)
            .Select(b => ToBookingRow(b, today, orgById, customerById, roomById))
            .Where(r => r.bookedToday || r.arrivalToday)
            .OrderByDescending(r => r.createdAt)
            .ToList();

        return new PlatformTodayBookingsRes
        {
            date = today.ToString("yyyy-MM-dd"),
            bookings = rows,
            total = rows.Count,
        };
    }

    private static DateOnly ParseDateOrToday(string? date)
    {
        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed))
            return parsed;
        return RoomDaySync.Today;
    }

    private static PlatformBookingRow ToBookingRow(
        BookingDetail detail,
        DateOnly today,
        IReadOnlyDictionary<string, Organisation> orgById,
        IReadOnlyDictionary<string, Customer> customerById,
        IReadOnlyDictionary<string, Room> roomById)
    {
        orgById.TryGetValue(detail.OrganisationId, out var org);
        customerById.TryGetValue(detail.CustomerId, out var customer);
        roomById.TryGetValue(detail.RoomId, out var room);

        var createdLocal = detail.CreatedAt.ToLocalTime();
        var bookedToday = DateOnly.FromDateTime(createdLocal) == today;
        var arrivalToday = DateOnly.TryParse(detail.CheckIn, out var checkIn) && checkIn == today;

        return new PlatformBookingRow
        {
            id = detail.Id,
            bookingCode = detail.BookingCode,
            organisationId = detail.OrganisationId,
            organisationName = org?.Name ?? "",
            organisationSlug = org?.Slug ?? "",
            guestName = customer?.Name ?? "Guest",
            guestPhone = customer?.Phone ?? "",
            guestEmail = customer?.Email ?? "",
            roomNumber = room?.RoomNumber ?? "",
            roomName = room?.RoomName ?? "",
            checkIn = detail.CheckIn,
            checkOut = detail.CheckOut,
            status = detail.Status.ToString(),
            total = detail.Total,
            paid = detail.Paid,
            balance = detail.Balance,
            bookedToday = bookedToday,
            arrivalToday = arrivalToday,
            createdAt = createdLocal.ToString("yyyy-MM-ddTHH:mm:ss"),
        };
    }

    private static string FormatAddress(Organisation org)
    {
        var parts = new[]
        {
            org.Address?.Trim(),
            org.City?.Trim(),
            org.State?.Trim(),
            org.Pincode?.Trim(),
            org.Country?.Trim(),
        }.Where(p => !string.IsNullOrWhiteSpace(p));

        return string.Join(", ", parts);
    }
}
