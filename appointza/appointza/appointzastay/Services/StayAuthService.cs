using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>AppointzaStay product auth (login/register against stay PostgreSQL).</summary>
public class StayAuthService
{
    private readonly AppDataStore _data;
    private readonly UserService _users;
    private readonly LogService _logs;

    public StayAuthService(AppDataStore data, UserService users, LogService logs)
    {
        _data = data;
        _users = users;
        _logs = logs;
    }

    public User? ValidateLogin(string login, string password)
    {
        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(password))
            return null;

        var key = login.Trim();
        var phoneKey = NormalizePhone(key);

        return _data.Users.FirstOrDefault(u =>
            u.Status == UserStatus.active &&
            u.Password == password &&
            (string.Equals(u.Email, key, StringComparison.OrdinalIgnoreCase) ||
             NormalizePhone(u.Phone) == phoneKey));
    }

    public (bool Success, string? Error, User? User) Register(AppointzaStaySignupReq model)
    {
        if (model.accountType == SignupAccountType.Organisation)
            return RegisterOrganisation(model);

        return RegisterGuest(model);
    }

    public (bool Success, string? Error, User? User) RegisterOrganisation(AppointzaStaySignupReq model)
    {
        var email = model.email.Trim();
        var phone = NormalizePhone(model.phone);
        var ownerName = model.name.Trim();

        if (_data.Users.Any(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)))
            return (false, "An account with this email already exists.", null);

        if (_data.Users.Any(u => NormalizePhone(u.Phone) == phone))
            return (false, "An account with this phone number already exists.", null);

        var orgId = $"org-{Guid.NewGuid():N}"[..16];
        var propertyName = $"{ownerName}'s Property";
        var baseSlug = OrganizationDomain.SlugFromName(propertyName);
        var slug = baseSlug;
        var suffix = 1;
        while (_data.Organisations.Any(o => string.Equals(o.Slug, slug, StringComparison.OrdinalIgnoreCase)))
            slug = $"{baseSlug}-{suffix++}";

        var roleDef = UserCatalog.GetRole(UserRole.owner);
        var owner = new User
        {
            OrganisationId = orgId,
            Name = ownerName,
            Phone = model.phone.Trim(),
            Email = email,
            Password = model.password,
            Role = UserRole.owner,
            Department = roleDef.DefaultDepartment,
            Permissions = UserService.ClonePermissions(roleDef.DefaultPermissions),
            Status = UserStatus.active,
        };

        var org = new Organisation
        {
            Id = orgId,
            OwnerId = owner.Id,
            Name = propertyName,
            Slug = slug,
            Tagline = "Complete your property profile to go live",
            Phone = model.phone.Trim(),
            Email = email,
            Country = "India",
            Assets = [],
            Onboarding = new OrganisationOnboardingState(),
            Website = new SitePage
            {
                TemplateMode = "html",
                CustomHtml = StayDefaultHtmlTemplate.Html,
                Settings = new SitePageSettings
                {
                    BackgroundColor = "#faf8f5",
                    TextColor = "#1a1a1a",
                },
                Blocks = [],
            },
        };

        _data.RegisterOrganisationWithOwner(org, owner);
        _logs.Add("create", "organisation", org.Id, $"{org.Name} registered by {owner.Name}",
            userId: owner.Id, organisationId: org.Id);
        _logs.Add("create", "auth", owner.Id, $"{owner.Name} signed up as organisation owner",
            userId: owner.Id, organisationId: org.Id);
        return (true, null, owner);
    }

    public (bool Success, string? Error, User? User) RegisterGuest(AppointzaStaySignupReq model)
    {
        var email = model.email.Trim();
        var phone = NormalizePhone(model.phone);

        if (_data.Users.Any(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)))
            return (false, "An account with this email already exists.", null);

        if (_data.Users.Any(u => NormalizePhone(u.Phone) == phone))
            return (false, "An account with this phone number already exists.", null);

        var customer = _data.Customers.FirstOrDefault(c => NormalizePhone(c.Phone) == phone);
        var organisationId = customer?.OrganisationId ?? _data.Organisations.FirstOrDefault()?.Id;
        if (string.IsNullOrEmpty(organisationId))
            return (false, "Guest registration is not available until a property is registered.", null);

        var roleDef = UserCatalog.GetRole(UserRole.customer);
        var user = new User
        {
            OrganisationId = organisationId,
            Name = model.name.Trim(),
            Phone = model.phone.Trim(),
            Email = email,
            Password = model.password,
            Role = UserRole.customer,
            Department = roleDef.DefaultDepartment,
            Permissions = UserService.ClonePermissions(roleDef.DefaultPermissions),
            Status = UserStatus.active,
        };

        _users.Save(user);

        if (customer != null && string.IsNullOrEmpty(customer.UserAccountId))
        {
            customer.UserAccountId = user.Id;
            customer.Email ??= user.Email;
            _data.SaveCustomers();
        }

        _logs.Add("create", "auth", user.Id, $"{user.Name} signed up as guest",
            userId: user.Id, organisationId: organisationId);
        return (true, null, user);
    }

    public static bool IsStaff(User user) => user.Role != UserRole.customer;

    public static bool IsPlatformAdmin(User user) =>
        user.Role is UserRole.admin or UserRole.super_admin;

    private static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());
}
