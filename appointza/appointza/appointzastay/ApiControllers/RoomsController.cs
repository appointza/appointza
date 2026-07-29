using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class RoomsController : ControllerBase
{
    private readonly RoomService _rooms;
    private readonly UserService _users;
    private readonly CustomerService _customers;
    private readonly AssetService _assets;
    private readonly OrganisationResolver _orgResolver;

    public RoomsController(
        RoomService rooms,
        UserService users,
        CustomerService customers,
        AssetService assets,
        OrganisationResolver orgResolver)
    {
        _rooms = rooms;
        _users = users;
        _customers = customers;
        _assets = assets;
        _orgResolver = orgResolver;
    }

    [HttpGet("Status")]
    public ActionResult<ActionRes<object>> Status(string? id, string? date = null)
    {
        var orgId = _orgResolver.OrganisationId;
        if (string.IsNullOrEmpty(orgId))
            return NotFound(new { error = "Organisation not found. Sign in with an AppointzaStay staff account." });

        DateOnly? asOf = null;
        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed))
            asOf = parsed;

        var (counts, floors, viewDate) = _rooms.GetStatusBoard(asOf);
        return Ok(new ActionRes<object>
        {
            item = new
            {
                organisationId = orgId,
                today = RoomDaySync.Today.ToString("yyyy-MM-dd"),
                asOf = viewDate.ToString("yyyy-MM-dd"),
                selectedId = id,
                counts,
                floors,
                cleaningStaff = _users.GetCleaningStaff().ToList(),
            },
        });
    }

    [HttpPost("UpdateStatus")]
    public ActionResult<ActionRes<bool>> UpdateStatus([FromBody] ActionReq<StayModels.RoomStatusUpdateReq> req)
    {
        if (req?.item == null || string.IsNullOrWhiteSpace(req.item.id))
            return BadRequest(new { error = "Room id is required." });

        _rooms.UpdateStatus(req.item.id, req.item.status);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("Checkout")]
    public ActionResult<ActionRes<bool>> Checkout(ActionReq<StayModels.RoomIdReq> req)
    {
        _rooms.Checkout(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("MarkClean")]
    public ActionResult<ActionRes<bool>> MarkClean(ActionReq<StayModels.RoomIdReq> req)
    {
        var room = _rooms.GetById(req.item.id);
        if (room != null) _customers.ArchiveBooking(room);
        _rooms.MarkClean(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("AssignCleaning")]
    public ActionResult<ActionRes<bool>> AssignCleaning(ActionReq<StayModels.RoomCleaningAssignReq> req)
    {
        var staff = _users.GetById(req.item.staffId);
        if (staff != null)
            _rooms.AssignCleaning(req.item.id, staff.Id, staff.Name, req.item.moveToCleaning);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("ClearCleaning")]
    public ActionResult<ActionRes<bool>> ClearCleaning(ActionReq<StayModels.RoomIdReq> req)
    {
        _rooms.ClearCleaningAssignment(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("ExtendStay")]
    public ActionResult<ActionRes<bool>> ExtendStay(ActionReq<StayModels.RoomIdReq> req)
    {
        _rooms.ExtendStay(req.item.id, 1);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("AddCharges")]
    public ActionResult<ActionRes<bool>> AddCharges(ActionReq<StayModels.RoomIdReq> req)
    {
        _rooms.AddCharges(req.item.id, 500);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpGet("Select")]
    public ActionResult<ActionRes<List<StayModels.Room>>> Select(string? id, bool create = false)
    {
        StayModels.Room? selected = null;
        if (create)
            selected = new StayModels.Room();
        else if (!string.IsNullOrEmpty(id))
            selected = _rooms.GetById(id);

        return Ok(new ActionRes<object>
        {
            item = new
            {
                rooms = _rooms.GetAll(),
                selected,
                pickableImages = _assets.GetPickableImages(),
                create,
            },
        });
    }

    [HttpPost("Save")]
    public ActionResult<ActionRes<StayModels.Room>> Save(ActionReq<StayModels.RoomSaveReq> req)
    {
        var model = req.item.room;
        var existing = string.IsNullOrEmpty(model.Id) ? null : _rooms.GetById(model.Id);

        model.Capacity ??= existing?.Capacity ?? new StayModels.RoomCapacity();
        model.Pricing ??= existing?.Pricing ?? new StayModels.RoomPricing();
        model.BookingRules ??= existing?.BookingRules ?? new StayModels.RoomBookingRules();
        RoomHydrator.EnsureDefaults(model);

        model.Amenities = req.item.selectedAmenities?.ToList() ?? [];
        model.GalleryPhotos = req.item.galleryPhotos?.ToList() ?? [];

        if (string.IsNullOrWhiteSpace(model.RoomNumber))
            throw new Utils.AppException(Utils.AppException.ErrorCodes.BadRequest, "Room number is required.");

        if (existing != null)
        {
            model.Guest = existing.Guest;
            model.Booking = existing.Booking;
            model.Payment = existing.Payment;
            model.CleaningAssignment = existing.CleaningAssignment;
            model.CreatedAt = existing.CreatedAt;
            model.OrganisationId = existing.OrganisationId;
        }
        else
        {
            if (string.IsNullOrEmpty(model.Id))
                model.Id = Guid.NewGuid().ToString();
            model.CreatedAt = DateTime.UtcNow;
        }

        _rooms.Save(model);
        return Ok(new ActionRes<StayModels.Room> { item = model });
    }

    [HttpPost("Delete")]
    public ActionResult<ActionRes<bool>> Delete(ActionReq<StayModels.RoomIdReq> req)
    {
        _rooms.Delete(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }
}
