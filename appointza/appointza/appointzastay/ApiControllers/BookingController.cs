using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
public class BookingController : ControllerBase
{
    private readonly GuestBookingService _booking;
    private readonly OrganisationService _org;
    private readonly StayPaymentService _payments;

    public BookingController(GuestBookingService booking, OrganisationService org, StayPaymentService payments)
    {
        _booking = booking;
        _org = org;
        _payments = payments;
    }

    [HttpGet("Index")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Index(
        string? roomId,
        string? packageId,
        string? checkIn,
        string? checkOut,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        var org = _org.Get();
        var resolvedCheckIn = checkIn ?? RoomDaySync.Today.AddDays(1).ToString("yyyy-MM-dd");
        var resolvedCheckOut = checkOut ?? RoomDaySync.Today.AddDays(2).ToString("yyyy-MM-dd");
        var rooms = _booking.GetBookableRooms(resolvedCheckIn, resolvedCheckOut, checkInTime, checkOutTime).ToList();
        var packages = org.Packages.Where(p => p.IsActive).OrderBy(p => p.SortOrder).ToList();
        var selectedPackage = packages.FirstOrDefault(p => p.Id == packageId);

        // Pre-select deep-linked roomId only when it is free for this date/time window.
        StayModels.Room? selectedRoom = null;
        if (!string.IsNullOrWhiteSpace(roomId))
            selectedRoom = rooms.FirstOrDefault(r => r.Id == roomId);

        return Ok(new ActionRes<object>
        {
            item = new
            {
                organisation = PublicWebsiteProjection.Organisation(org),
                rooms = PublicWebsiteProjection.Rooms(rooms),
                packages,
                selectedRoomId = selectedRoom?.Id,
                selectedPackageId = selectedPackage?.Id,
                checkIn = resolvedCheckIn,
                checkOut = resolvedCheckOut,
                checkInTime = checkInTime,
                checkOutTime = checkOutTime,
                requestedRoomId = roomId,
                requestedRoomAvailable = selectedRoom != null,
            },
        });
    }

    [HttpPost("Create")]
    [AllowAnonymous]
    public ActionResult<ActionRes<StayModels.GuestBookingResult>> Create(ActionReq<StayModels.GuestBookingRequest> req)
    {
        try
        {
            var result = _booking.Create(req.item);
            return Ok(new ActionRes<StayModels.GuestBookingResult> { item = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("CreatePaymentOrder")]
    [AllowAnonymous]
    public async Task<ActionResult<ActionRes<StayModels.StayCreatePaymentOrderRes>>> CreatePaymentOrder(
        ActionReq<StayModels.StayCreatePaymentOrderReq> req)
    {
        try
        {
            var result = await _payments.CreateBookingOrderAsync(req.item.BookingId);
            return Ok(new ActionRes<StayModels.StayCreatePaymentOrderRes> { item = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("VerifyPayment")]
    [AllowAnonymous]
    public async Task<ActionResult<ActionRes<StayModels.StayVerifyPaymentRes>>> VerifyPayment(
        ActionReq<StayModels.StayVerifyPaymentReq> req)
    {
        try
        {
            var result = await _payments.VerifyBookingPaymentAsync(req.item);
            if (!result.IsValid)
                return BadRequest(new { error = result.Message });
            return Ok(new ActionRes<StayModels.StayVerifyPaymentRes> { item = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("CancelUnpaid")]
    [AllowAnonymous]
    public ActionResult<ActionRes<bool>> CancelUnpaid(ActionReq<StayModels.StayCreatePaymentOrderReq> req)
    {
        try
        {
            var ok = _booking.CancelUnpaidOnlineBooking(req.item.BookingId);
            return Ok(new ActionRes<bool> { item = ok });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("Quote")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Quote(
        string checkIn,
        string checkOut,
        string? roomId = null,
        int persons = 2,
        int extraBeds = 0,
        string? packageIds = null,
        string? serviceIds = null,
        string? checkInTime = null,
        string? checkOutTime = null)
    {
        try
        {
            var packages = SplitIds(packageIds);
            var services = SplitIds(serviceIds);
            var quote = _booking.Quote(
                roomId, checkIn, checkOut, persons, extraBeds, packages, services, checkInTime, checkOutTime);
            return Ok(new ActionRes<object> { item = quote });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static string[]? SplitIds(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
