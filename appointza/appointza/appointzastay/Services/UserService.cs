using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class UserService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _orgResolver;
    private readonly LogService _logs;

    public UserService(AppDataStore data, OrganisationResolver orgResolver, LogService logs)
    {
        _data = data;
        _orgResolver = orgResolver;
        _logs = logs;
    }

    public IReadOnlyList<User> GetAll() =>
        _data.Users
            .Where(u => u.OrganisationId == _orgResolver.OrganisationId)
            .OrderBy(u => u.Name)
            .ToList();

    public User? GetById(string id)
    {
        var orgId = _orgResolver.OrganisationId;
        if (string.IsNullOrEmpty(orgId))
            return null;
        return _data.Users.FirstOrDefault(u => u.Id == id && u.OrganisationId == orgId);
    }

    public IEnumerable<User> GetCleaningStaff() =>
        _data.Users.Where(u => u.OrganisationId == _orgResolver.OrganisationId &&
            u.Status == UserStatus.active &&
            (u.Role == UserRole.housekeeping || u.Department == UserDepartment.housekeeping));

    public void Save(User user)
    {
        var isNew = string.IsNullOrEmpty(user.Id) || _data.Users.All(u => u.Id != user.Id);
        user.UpdatedAt = DateTime.UtcNow;
        user.OrganisationId = _orgResolver.OrganisationId;

        var idx = _data.Users.FindIndex(u => u.Id == user.Id);
        if (idx >= 0) _data.Users[idx] = user;
        else
        {
            if (string.IsNullOrEmpty(user.Id)) user.Id = Guid.NewGuid().ToString();
            user.CreatedAt = DateTime.UtcNow;
            _data.Users.Add(user);
        }
        _data.SaveUsers();
        _logs.Add(isNew ? "create" : "update", "user", user.Id, $"{user.Name} {(isNew ? "created" : "updated")}");
    }

    public void Delete(string id)
    {
        var user = GetById(id);
        if (user == null) return;
        var orgId = _orgResolver.OrganisationId;
        _data.Users.RemoveAll(u => u.Id == id && u.OrganisationId == orgId);
        _data.SaveUsers();
        _logs.Add("delete", "user", id, $"{user.Name} removed");
    }

    public User CreateEmpty()
    {
        var role = UserRole.receptionist;
        var def = UserCatalog.GetRole(role);
        return new User
        {
            OrganisationId = _orgResolver.OrganisationId,
            Role = role,
            Department = def.DefaultDepartment,
            Permissions = ClonePermissions(def.DefaultPermissions)
        };
    }

    public static UserPermissions ClonePermissions(UserPermissions src) => new()
    {
        ViewRooms = src.ViewRooms,
        CreateBooking = src.CreateBooking,
        CheckIn = src.CheckIn,
        Checkout = src.Checkout,
        Payment = src.Payment,
        Reports = src.Reports
    };
}
