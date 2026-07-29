namespace appointza.Models.AppointzaStay;

public enum UserRole
{
    admin, super_admin, owner, manager, receptionist, reservation_staff,
    housekeeping, maintenance, accountant, chef, security, staff, customer
}

public enum UserDepartment { front_office, housekeeping, maintenance, finance, none }

public enum UserStatus { active, inactive }

public class UserPermissions
{
    public bool ViewRooms { get; set; }
    public bool CreateBooking { get; set; }
    public bool CheckIn { get; set; }
    public bool Checkout { get; set; }
    public bool Payment { get; set; }
    public bool Reports { get; set; }
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OrganisationId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.receptionist;
    public UserDepartment Department { get; set; } = UserDepartment.front_office;
    public UserStatus Status { get; set; } = UserStatus.active;
    public UserPermissions Permissions { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class RoleDefinition
{
    public UserRole Id { get; set; }
    public string Label { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Mvp { get; set; }
    public UserDepartment DefaultDepartment { get; set; }
    public UserPermissions DefaultPermissions { get; set; } = new();
}

public static class UserCatalog
{
    public static readonly (UserDepartment Value, string Label)[] Departments =
    [
        (UserDepartment.front_office, "Front Office"),
        (UserDepartment.housekeeping, "Housekeeping"),
        (UserDepartment.maintenance, "Maintenance"),
        (UserDepartment.finance, "Finance"),
    ];

    public static readonly (string Key, string Label)[] PermissionLabels =
    [
        ("ViewRooms", "View Rooms"),
        ("CreateBooking", "Create Booking"),
        ("CheckIn", "Check-in"),
        ("Checkout", "Checkout"),
        ("Payment", "Payment"),
        ("Reports", "Reports"),
    ];

    private static UserPermissions All() => new()
    {
        ViewRooms = true, CreateBooking = true, CheckIn = true,
        Checkout = true, Payment = true, Reports = true
    };

    private static UserPermissions None() => new();

    public static readonly RoleDefinition[] Roles =
    [
        new() { Id = UserRole.admin, Label = "Admin", Description = "Platform administrator — all organisations", Mvp = false, DefaultDepartment = UserDepartment.none, DefaultPermissions = All() },
        new() { Id = UserRole.super_admin, Label = "Super Admin", Description = "Full system access", Mvp = false, DefaultDepartment = UserDepartment.none, DefaultPermissions = All() },
        new() { Id = UserRole.owner, Label = "Hotel Owner", Description = "Manage hotel, rooms, bookings, staff, reports", Mvp = true, DefaultDepartment = UserDepartment.none, DefaultPermissions = All() },
        new() { Id = UserRole.manager, Label = "Manager", Description = "Daily operations, bookings, check-in/check-out", Mvp = true, DefaultDepartment = UserDepartment.front_office, DefaultPermissions = All() },
        new() { Id = UserRole.receptionist, Label = "Receptionist / Front Desk", Description = "Guest handling, reservations, room allocation", Mvp = true, DefaultDepartment = UserDepartment.front_office, DefaultPermissions = new() { ViewRooms = true, CreateBooking = true, CheckIn = true, Checkout = true } },
        new() { Id = UserRole.reservation_staff, Label = "Reservation Staff", Description = "Create/update bookings, availability", Mvp = false, DefaultDepartment = UserDepartment.front_office, DefaultPermissions = new() { ViewRooms = true, CreateBooking = true } },
        new() { Id = UserRole.housekeeping, Label = "Housekeeping Staff", Description = "Room cleaning status, maintenance requests", Mvp = true, DefaultDepartment = UserDepartment.housekeeping, DefaultPermissions = new() { ViewRooms = true } },
        new() { Id = UserRole.maintenance, Label = "Maintenance Staff", Description = "Repair issues, room maintenance", Mvp = false, DefaultDepartment = UserDepartment.maintenance, DefaultPermissions = new() { ViewRooms = true } },
        new() { Id = UserRole.accountant, Label = "Accountant / Finance", Description = "Payments, invoices, expenses, reports", Mvp = true, DefaultDepartment = UserDepartment.finance, DefaultPermissions = new() { ViewRooms = true, Payment = true, Reports = true } },
        new() { Id = UserRole.chef, Label = "Chef / Restaurant Staff", Description = "Food orders", Mvp = false, DefaultDepartment = UserDepartment.none, DefaultPermissions = None() },
        new() { Id = UserRole.security, Label = "Security", Description = "Guest entry, visitor management", Mvp = false, DefaultDepartment = UserDepartment.none, DefaultPermissions = new() { ViewRooms = true } },
        new() { Id = UserRole.staff, Label = "Staff", Description = "Limited access based on permission", Mvp = false, DefaultDepartment = UserDepartment.none, DefaultPermissions = new() { ViewRooms = true } },
        new() { Id = UserRole.customer, Label = "Guest / Customer", Description = "View rooms, bookings, payments, profile", Mvp = true, DefaultDepartment = UserDepartment.none, DefaultPermissions = new() { ViewRooms = true, CreateBooking = true, Payment = true } },
    ];

    public static IEnumerable<RoleDefinition> MvpRoles => Roles.Where(r => r.Mvp);

    public static RoleDefinition GetRole(UserRole role) =>
        Roles.FirstOrDefault(r => r.Id == role) ?? Roles[0];

    public static string GetRoleLabel(UserRole role) => GetRole(role).Label;

    public static int CountActivePermissions(UserPermissions p) =>
        PermissionLabels.Count(x => GetPermission(p, x.Key));

    public static bool GetPermission(UserPermissions p, string key) => key switch
    {
        "ViewRooms" => p.ViewRooms,
        "CreateBooking" => p.CreateBooking,
        "CheckIn" => p.CheckIn,
        "Checkout" => p.Checkout,
        "Payment" => p.Payment,
        "Reports" => p.Reports,
        _ => false
    };

    public static void SetPermission(UserPermissions p, string key, bool value)
    {
        switch (key)
        {
            case "ViewRooms": p.ViewRooms = value; break;
            case "CreateBooking": p.CreateBooking = value; break;
            case "CheckIn": p.CheckIn = value; break;
            case "Checkout": p.Checkout = value; break;
            case "Payment": p.Payment = value; break;
            case "Reports": p.Reports = value; break;
        }
    }

    public static string DepartmentLabel(UserDepartment d) =>
        d == UserDepartment.none ? "—" : Departments.FirstOrDefault(x => x.Value == d).Label ?? "—";
}

public static class SampleUserIds
{
    public const string SuperAdmin = "user-super-admin";
    public const string Owner = "user-owner";
    public const string Manager = "user-manager";
    public const string Receptionist = "user-receptionist";
    public const string Housekeeping = "user-housekeeping";
    public const string Housekeeping2 = "user-housekeeping-2";
    public const string Accountant = "user-accountant";
    public const string Customer = "user-customer";
}
