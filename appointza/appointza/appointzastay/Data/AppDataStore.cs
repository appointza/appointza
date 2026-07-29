using appointza.Models.AppointzaStay;
using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Data.AppointzaStay;

/// <summary>Central application data store — all screens read/write through PostgreSQL.</summary>
public class AppDataStore
{
    private readonly PostgresPersistenceStore _postgres;

    public List<User> Users { get; private set; } = [];
    public List<Organisation> Organisations { get; private set; } = [];
    public Organisation Organisation => Organisations.FirstOrDefault() ?? new Organisation();
    public List<Customer> Customers { get; private set; } = [];
    public List<BookingDetail> BookingDetails { get; private set; } = [];
    public List<LogEntry> Logs { get; private set; } = [];
    public List<Room> Rooms { get; private set; } = [];
    public List<OrganisationBilling> BillingAccounts { get; private set; } = [];

    public bool UsesPostgreSql => true;

    public AppDataStore(IOptions<ApplicationEnvironment> applicationEnvironment)
    {
        var connectionString = applicationEnvironment.Value.appointzastay_postgresqlconnection;
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "PostgreSQL is required. Set ApplicationSettings:appointzastay_postgresqlconnection in appsettings.json.");
        }

        _postgres = new PostgresPersistenceStore(connectionString);
        LoadFromPostgres();
        EnsureDemoData();
    }

    /// <summary>Seeds demo data on empty DB and keeps the demo owner login working locally.</summary>
    private void EnsureDemoData()
    {
        if (!_postgres.HasAnyData())
        {
            _postgres.SeedInitialData(DummyData.CreateSnapshot());
            LoadFromPostgres();
            return;
        }

        EnsureDemoAdmin();
    }

    private void EnsureDemoAdmin()
    {
        const string demoEmail = "owner@appointzastay.com";
        const string demoPassword = "demo123";

        var existing = Users.FirstOrDefault(u =>
            string.Equals(u.Email, demoEmail, StringComparison.OrdinalIgnoreCase));

        if (existing == null)
        {
            var org = Organisations.FirstOrDefault();
            if (org == null)
            {
                org = DummyData.CreateOrganisation();
                Organisations.Add(org);
                _postgres.SaveOrganisation(org);
            }

            var owner = DummyData.CreateUsers().First(u =>
                string.Equals(u.Email, demoEmail, StringComparison.OrdinalIgnoreCase));
            owner.OrganisationId = org.Id;
            org.OwnerId = owner.Id;
            org.UpdatedAt = DateTime.UtcNow;
            Users.Add(owner);
            _postgres.SaveUsers(Users);
            _postgres.SaveOrganisation(org);

            if (!BillingAccounts.Any(b => b.OrganisationId == org.Id))
            {
                BillingAccounts.Add(CreditCatalog.CreateDefaultAccount(org.Id));
                _postgres.SaveBilling(BillingAccounts);
            }

            return;
        }

        var changed = false;
        if (existing.Password != demoPassword)
        {
            existing.Password = demoPassword;
            changed = true;
        }

        if (existing.Status != UserStatus.active)
        {
            existing.Status = UserStatus.active;
            changed = true;
        }

        if (existing.Role != UserRole.admin)
        {
            existing.Role = UserRole.admin;
            changed = true;
        }

        if (!changed)
            return;

        existing.UpdatedAt = DateTime.UtcNow;
        _postgres.SaveUsers(Users);
    }

    public DataStoreStats GetStats() => new(
        Organisations.Count,
        Users.Count,
        Rooms.Count,
        Customers.Count,
        BookingDetails.Count,
        BillingAccounts.Count,
        Logs.Count);

    private void LoadFromPostgres()
    {
        var snapshot = _postgres.Load();
        Users = snapshot.Users;
        Organisations = snapshot.Organisations;
        Customers = snapshot.Customers;
        BookingDetails = snapshot.BookingDetails;
        Logs = snapshot.Logs;
        Rooms = snapshot.Rooms;
        BillingAccounts = snapshot.BillingAccounts;
    }

    public void SaveUsers() => _postgres.SaveUsers(Users);

    public Organisation GetOrganisation(string id)
    {
        if (string.IsNullOrEmpty(id))
            return Organisation;

        return Organisations.FirstOrDefault(o => o.Id == id) ?? Organisation;
    }

    public Organisation RequireOrganisation(string id)
    {
        if (string.IsNullOrEmpty(id))
            throw new InvalidOperationException("No organisation is selected for this session.");

        var org = Organisations.FirstOrDefault(o => o.Id == id);
        if (org != null)
            return org;

        throw new InvalidOperationException(
            $"Organisation '{id}' was not found. Sign out and sign in again.");
    }

    public void UpsertOrganisation(Organisation org)
    {
        org.UpdatedAt = DateTime.UtcNow;
        // Defensive: prevent duplicate org rows in-memory (can overwrite JSONB fields like packages on bulk save).
        Organisations.RemoveAll(o => o.Id == org.Id);
        Organisations.Add(org);

        _postgres.SaveOrganisation(org);
    }

    public void RegisterOrganisationWithOwner(Organisation org, User owner)
    {
        owner.OrganisationId = org.Id;
        org.OwnerId = owner.Id;
        owner.UpdatedAt = DateTime.UtcNow;
        org.UpdatedAt = DateTime.UtcNow;
        if (owner.CreatedAt == default)
            owner.CreatedAt = DateTime.UtcNow;
        if (org.CreatedAt == default)
            org.CreatedAt = DateTime.UtcNow;

        _postgres.RegisterOrganisationWithOwner(org, owner);

        Users.RemoveAll(u => u.Id == owner.Id);
        Users.Add(owner);
        Organisations.RemoveAll(o => o.Id == org.Id);
        Organisations.Add(org);
    }

    public void SaveOrganisations() => _postgres.SaveOrganisations(Organisations);

    public void SaveOrganisation(Organisation? org = null) => UpsertOrganisation(org ?? Organisation);

    public void SaveCustomers() => _postgres.SaveCustomers(Customers);

    public void SaveBookingDetails() => _postgres.SaveBookings(BookingDetails);

    public void SaveLogs() => _postgres.SaveLogs(Logs);

    public void SaveLog(LogEntry entry) => _postgres.SaveLog(entry);

    public void SaveRooms() => _postgres.SaveRooms(Rooms);

    public void SaveBilling() => _postgres.SaveBilling(BillingAccounts);
}

public record DataStoreStats(
    int Organisations,
    int Users,
    int Rooms,
    int Customers,
    int Bookings,
    int BillingAccounts,
    int Logs);
