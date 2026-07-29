using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class PackagesController : ControllerBase
{
    private readonly PackageService _packages;

    public PackagesController(PackageService packages) => _packages = packages;

    [HttpGet("Select")]
    public ActionResult<ActionRes<List<StayModels.PropertyPackage>>> Select(string? id, bool create = false)
    {
        return Ok(new ActionRes<object>
        {
            item = new
            {
                packages = _packages.GetAll(),
                emptyPackage = create ? _packages.CreateEmpty() : null,
                selectedId = id,
            },
        });
    }

    [HttpPost("Save")]
    public ActionResult<ActionRes<StayModels.PropertyPackage>> Save(ActionReq<StayModels.PropertyPackage> req)
    {
        var model = req.item;
        if (string.IsNullOrWhiteSpace(model.Name))
            throw new Utils.AppException(Utils.AppException.ErrorCodes.BadRequest, "Package name is required.");
        if (string.IsNullOrWhiteSpace(model.Price))
            throw new Utils.AppException(Utils.AppException.ErrorCodes.BadRequest, "Price is required.");

        _packages.Save(model);
        return Ok(new ActionRes<StayModels.PropertyPackage> { item = model });
    }

    [HttpPost("Delete")]
    public ActionResult<ActionRes<bool>> Delete(ActionReq<StayModels.RoomIdReq> req)
    {
        _packages.Delete(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }
}
