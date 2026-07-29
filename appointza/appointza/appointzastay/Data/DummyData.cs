using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;

namespace appointza.Data.AppointzaStay;

public static class DummyData
{
    private static readonly string[] DeluxeAmenities =
    [
        "bed-queen", "wardrobe", "mirror", "curtains", "attached-bathroom", "hot-water",
        "shower", "towels", "wifi", "smart-tv", "air-conditioning", "work-desk",
        "mini-fridge", "tea-coffee-maker", "electronic-door-lock"
    ];

    private static readonly string[] SuiteAmenities =
        DeluxeAmenities.Concat([
            "bed-king", "sofa", "balcony", "safe-locker", "bathtub", "hair-dryer",
            "room-service", "breakfast-included", "mini-bar", "bluetooth-speaker"
        ]).ToArray();

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.Today);
    private static string D(int offset) => Today.AddDays(offset).ToString("yyyy-MM-dd");
    private static int Nights(int from, int to) => to - from;

    public static Organisation CreateOrganisation()
    {
        var org = OotyOrganisationFactory.Build();
        org.Assets =
        [
            new OrganizationAsset
            {
                Id = "asset-logo",
                Title = "Ooty Room Stay Logo",
                Kind = AssetKind.url,
                Category = AssetCategory.logo,
                Url = AppBranding.LogoUrl
            }
        ];
        org.LogoAssetId = "asset-logo";
        org.CreatedAt = DateTime.UtcNow.AddMonths(-6);
        org.UpdatedAt = DateTime.UtcNow;
        return org;
    }

    public static List<User> CreateUsers()
    {
        User Make(string id, string name, string phone, string email, UserRole role, UserDepartment dept) =>
            new()
            {
                Id = id,
                OrganisationId = DummyIds.Organisation,
                Name = name,
                Phone = phone,
                Email = email,
                Password = "demo123",
                Role = role,
                Department = dept,
                Status = UserStatus.active,
                Permissions = UserService.ClonePermissions(UserCatalog.GetRole(role).DefaultPermissions),
                CreatedAt = DateTime.UtcNow.AddMonths(-3)
            };

        return
        [
            Make(SampleUserIds.Owner, "Aravind Kumar", "9876543210", "owner@appointzastay.com", UserRole.admin, UserDepartment.none),
            Make(SampleUserIds.Manager, "Priya Sharma", "9123456780", "manager@appointzastay.com", UserRole.manager, UserDepartment.front_office),
            Make(SampleUserIds.Receptionist, "Rajesh Nair", "9988776655", "frontdesk@appointzastay.com", UserRole.receptionist, UserDepartment.front_office),
            Make(SampleUserIds.Housekeeping, "Lakshmi Devi", "9012345678", "housekeeping@appointzastay.com", UserRole.housekeeping, UserDepartment.housekeeping),
            Make(SampleUserIds.Housekeeping2, "Anitha Rao", "9023456789", "anitha@appointzastay.com", UserRole.housekeeping, UserDepartment.housekeeping),
            Make(SampleUserIds.Accountant, "Suresh Menon", "8899776655", "finance@appointzastay.com", UserRole.accountant, UserDepartment.finance),
            Make(SampleUserIds.Customer, "Guest User", "9800000000", "guest@appointzastay.com", UserRole.customer, UserDepartment.none),
        ];
    }

    public static List<Customer> CreateCustomers() =>
    [
        new() { Id = DummyIds.CustomerPriya, OrganisationId = DummyIds.Organisation, Name = "Priya Sharma", Phone = "9876543210", Email = "priya@email.com" },
        new() { Id = DummyIds.CustomerRaj, OrganisationId = DummyIds.Organisation, Name = "Raj Kumar", Phone = "9123456780" },
        new() { Id = DummyIds.CustomerMeera, OrganisationId = DummyIds.Organisation, Name = "Meera Nair", Phone = "9988776655" },
        new() { Id = DummyIds.CustomerAravind, OrganisationId = DummyIds.Organisation, Name = "Aravind", Phone = "9876543220", Email = "aravind@email.com" },
        new() { Id = DummyIds.CustomerVikram, OrganisationId = DummyIds.Organisation, Name = "Vikram Singh", Phone = "9876501234", Email = "vikram@email.com" },
        new() { Id = DummyIds.CustomerAnanya, OrganisationId = DummyIds.Organisation, Name = "Ananya Patel", Phone = "9123409876", Email = "ananya@email.com" },
    ];

    public static List<Room> CreateRooms() =>
    [
        MakeRoom(DummyIds.Room101, "101", "Standard Room", RoomType.@double, 1, RoomStatus.available, 2500,
            ["bed-queen", "attached-bathroom", "hot-water", "wifi", "smart-tv", "air-conditioning"]),
        MakeRoom(DummyIds.Room102, "102", "Deluxe Room", RoomType.@double, 1, RoomStatus.occupied, 3500, DeluxeAmenities),
        MakeRoom(DummyIds.Room103, "103", "Twin Room", RoomType.twin, 1, RoomStatus.checkout_pending, 2800,
            ["bed-single", "attached-bathroom", "hot-water", "wifi", "fan"]),
        MakeRoom(DummyIds.Room104, "104", "Family Room", RoomType.family, 1, RoomStatus.available, 4500,
            ["bed-king", "bed-single", "sofa", "attached-bathroom", "hot-water", "wifi", "smart-tv", "air-conditioning", "mini-fridge"]),
        MakeRoom(DummyIds.Room201, "201", "Standard Room", RoomType.single, 2, RoomStatus.available, 2200,
            ["bed-single", "attached-bathroom", "hot-water", "wifi", "fan"]),
        MakeRoom(DummyIds.Room202, "202", "Suite", RoomType.suite, 2, RoomStatus.maintenance, 8000, SuiteAmenities),
        MakeRoom(DummyIds.Room203, "203", "Deluxe Room", RoomType.@double, 2, RoomStatus.checkout_pending, 3500, DeluxeAmenities),
        MakeRoom(DummyIds.Room204, "204", "Deluxe Room", RoomType.@double, 2, RoomStatus.checkout_pending, 2500, DeluxeAmenities),
    ];

    public static List<BookingDetail> CreateBookingDetails() =>
    [
        new()
        {
            Id = "bk-1021", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerPriya, RoomId = DummyIds.Room102,
            BookingCode = "BK-1021", CheckIn = D(-2), CheckOut = D(1), Nights = Nights(-2, 1),
            Total = 10500, Paid = 10500, Balance = 0, Status = BookingDetailStatus.active
        },
        new()
        {
            Id = "bk-1035", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerRaj, RoomId = DummyIds.Room103,
            BookingCode = "BK-1035", CheckIn = D(-4), CheckOut = D(-1), Nights = Nights(-4, -1),
            Total = 8400, Paid = 4800, Balance = 3600, Status = BookingDetailStatus.active
        },
        new()
        {
            Id = "bk-2031", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerMeera, RoomId = DummyIds.Room203,
            BookingCode = "BK-2031", CheckIn = D(-3), CheckOut = D(0), Nights = Nights(-3, 0),
            Total = 10500, Paid = 10500, Balance = 0, Status = BookingDetailStatus.active
        },
        new()
        {
            Id = "bk-2048", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerAravind, RoomId = DummyIds.Room204,
            BookingCode = "BK-2048", CheckIn = D(-2), CheckOut = D(-1), Nights = Nights(-2, -1),
            Total = 5000, Paid = 3000, Balance = 2000, Status = BookingDetailStatus.active
        },
        new()
        {
            Id = "bk-0988", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerVikram, RoomId = DummyIds.Room101,
            BookingCode = "BK-0988", CheckIn = D(-20), CheckOut = D(-17), Nights = 3,
            Total = 10500, Paid = 10500, Balance = 0, Status = BookingDetailStatus.completed,
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        },
        new()
        {
            Id = "bk-0876", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerVikram, RoomId = DummyIds.Room201,
            BookingCode = "BK-0876", CheckIn = D(-60), CheckOut = D(-58), Nights = 2,
            Total = 4400, Paid = 4400, Balance = 0, Status = BookingDetailStatus.completed,
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        },
        new()
        {
            Id = "bk-0755", OrganisationId = DummyIds.Organisation, CustomerId = DummyIds.CustomerAnanya, RoomId = DummyIds.Room202,
            BookingCode = "BK-0755", CheckIn = D(-90), CheckOut = D(-87), Nights = 3,
            Total = 24000, Paid = 24000, Balance = 0, Status = BookingDetailStatus.completed,
            CreatedAt = DateTime.UtcNow.AddDays(-90)
        },
    ];

    public static AppDataSnapshot CreateSnapshot()
    {
        var orgId = DummyIds.Organisation;
        var customers = CreateCustomers();
        foreach (var c in customers)
            if (string.IsNullOrWhiteSpace(c.OrganisationId))
                c.OrganisationId = orgId;

        var bookings = CreateBookingDetails();
        foreach (var b in bookings)
            if (string.IsNullOrWhiteSpace(b.OrganisationId))
                b.OrganisationId = orgId;

        var rooms = CreateRooms();
        foreach (var r in rooms)
            if (string.IsNullOrWhiteSpace(r.OrganisationId))
                r.OrganisationId = orgId;

        var logs = CreateLogs();
        foreach (var log in logs)
            if (string.IsNullOrWhiteSpace(log.OrganisationId))
                log.OrganisationId = orgId;

        return new AppDataSnapshot
        {
            Organisations = [CreateOrganisation()],
            Users = CreateUsers(),
            Customers = customers,
            Rooms = rooms,
            BookingDetails = bookings,
            Logs = logs,
            BillingAccounts = [CreditCatalog.CreateDefaultAccount(orgId)],
        };
    }

    public static List<LogEntry> CreateLogs() =>
    [
        Log("log-1", SampleUserIds.Receptionist, "check_in", "booking", "bk-1021", "Priya Sharma checked in to room 102"),
        Log("log-2", SampleUserIds.Receptionist, "check_in", "booking", "bk-1035", "Raj Kumar checked in to room 103"),
        Log("log-3", SampleUserIds.Housekeeping, "assign", "room", DummyIds.Room104, "Lakshmi Devi assigned to room 104"),
        Log("log-4", SampleUserIds.Manager, "maintenance", "room", DummyIds.Room202, "Suite 202 marked for maintenance"),
        Log("log-5", SampleUserIds.Receptionist, "checkout", "booking", "bk-2031", "Meera Nair checkout pending for room 203"),
        Log("log-6", SampleUserIds.Owner, "update", "organisation", DummyIds.Organisation, "Organisation profile updated"),
        Log("log-7", SampleUserIds.Receptionist, "create", "customer", DummyIds.CustomerAravind, "New customer Aravind registered"),
        Log("log-8", SampleUserIds.Accountant, "payment", "booking", "bk-2048", "Partial payment ₹3,000 received for BK-2048"),
    ];

    private static LogEntry Log(string id, string userId, string action, string entityType, string entityId, string message) =>
        new()
        {
            Id = id,
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Message = message,
            CreatedAt = DateTime.UtcNow.AddHours(-Random.Shared.Next(1, 72))
        };

    private static Room MakeRoom(string id, string number, string name, RoomType type, int floor,
        RoomStatus status, decimal price, string[] amenities) => new()
    {
        Id = id,
        OrganisationId = DummyIds.Organisation,
        RoomNumber = number,
        RoomName = name,
        RoomType = type,
        FloorNumber = floor,
        Status = status,
        Amenities = amenities.ToList(),
        Pricing = new RoomPricing { PricePerNight = price },
        CreatedAt = DateTime.UtcNow.AddMonths(-2)
    };
}
