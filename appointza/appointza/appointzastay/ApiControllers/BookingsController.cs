using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class BookingsController : ControllerBase
{
    private readonly StaffBookingService _bookings;

    public BookingsController(StaffBookingService bookings) => _bookings = bookings;

    [HttpGet("Calendar")]
    public ActionResult<ActionRes<StayModels.StaffBookingCalendarPayload>> Calendar(int? year, int? month)
    {
        return Ok(new ActionRes<StayModels.StaffBookingCalendarPayload>
        {
            item = _bookings.GetCalendar(year, month),
        });
    }

    [HttpGet("Detail")]
    public ActionResult<ActionRes<StayModels.StaffBookingItem>> Detail(string id)
    {
        var item = _bookings.GetById(id);
        if (item == null)
            return NotFound(new { error = "Booking not found." });
        return Ok(new ActionRes<StayModels.StaffBookingItem> { item = item });
    }
}
