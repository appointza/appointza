using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class UsersController : ControllerBase
{
    private readonly UserService _users;

    public UsersController(UserService users) => _users = users;

    [HttpGet("Select")]
    public ActionResult<ActionRes<List<StayModels.User>>> Select(string? id, bool create = false)
    {
        StayModels.User? selected = create ? _users.CreateEmpty()
            : string.IsNullOrEmpty(id) ? null : _users.GetById(id);

        return Ok(new ActionRes<object>
        {
            item = new
            {
                users = _users.GetAll(),
                selected,
                create,
            },
        });
    }

    [HttpPost("Save")]
    public ActionResult<ActionRes<StayModels.User>> Save(ActionReq<StayModels.UserSaveReq> req)
    {
        var model = req.item.user;
        ApplyPermissions(model, req.item.permissions);

        var isNew = string.IsNullOrEmpty(model.Id);
        if (string.IsNullOrWhiteSpace(model.Name) || string.IsNullOrWhiteSpace(model.Phone))
            throw new Utils.AppException(Utils.AppException.ErrorCodes.BadRequest, "Name and phone are required.");
        if (isNew && string.IsNullOrWhiteSpace(model.Password))
            throw new Utils.AppException(Utils.AppException.ErrorCodes.BadRequest, "Password is required for new users.");

        if (isNew)
            model.Id = Guid.NewGuid().ToString();

        var existing = _users.GetById(model.Id);
        if (existing != null && string.IsNullOrWhiteSpace(model.Password))
            model.Password = existing.Password;

        _users.Save(model);
        return Ok(new ActionRes<StayModels.User> { item = model });
    }

    [HttpPost("Delete")]
    public ActionResult<ActionRes<bool>> Delete(ActionReq<StayModels.RoomIdReq> req)
    {
        _users.Delete(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpGet("RoleDefaults")]
    public ActionResult<ActionRes<object>> RoleDefaults(StayModels.UserRole role)
    {
        var def = StayModels.UserCatalog.GetRole(role);
        return Ok(new ActionRes<object>
        {
            item = new
            {
                department = def.DefaultDepartment.ToString(),
                permissions = StayModels.UserCatalog.PermissionLabels
                    .Where(p => StayModels.UserCatalog.GetPermission(def.DefaultPermissions, p.Key))
                    .Select(p => p.Key),
            },
        });
    }

    private static void ApplyPermissions(StayModels.User model, string[]? permissions)
    {
        var perms = new StayModels.UserPermissions();
        foreach (var key in StayModels.UserCatalog.PermissionLabels.Select(p => p.Key))
            StayModels.UserCatalog.SetPermission(perms, key, permissions?.Contains(key) == true);
        model.Permissions = perms;
    }
}
