using appointza.Filters.AppointzaStay;
using appointza.Models;
using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
[RequireSuperAdmin]
public class PlatformAdminController : ControllerBase
{
    private readonly PlatformAdminService _platform;

    public PlatformAdminController(PlatformAdminService platform) => _platform = platform;

    [HttpGet("Organisations")]
    public ActionResult<ActionRes<PlatformOrganisationListRes>> Organisations()
    {
        return Ok(new ActionRes<PlatformOrganisationListRes> { item = _platform.ListOrganisations() });
    }

    [HttpPost("SetVerification")]
    public ActionResult<ActionRes<PlatformOrganisationRow>> SetVerification(ActionReq<PlatformVerificationReq> req)
    {
        try
        {
            var admin = RequireStaffAttribute.GetCurrentUser(HttpContext)
                ?? throw new InvalidOperationException("Admin session not found.");

            if (string.IsNullOrWhiteSpace(req.item.organisationId))
                return BadRequest(new { error = "Organisation id is required." });

            var row = _platform.SetVerification(req.item.organisationId, req.item.verified, admin.Id);
            return Ok(new ActionRes<PlatformOrganisationRow> { item = row });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("TodayBookings")]
    public ActionResult<ActionRes<PlatformTodayBookingsRes>> TodayBookings(string? date = null)
    {
        return Ok(new ActionRes<PlatformTodayBookingsRes> { item = _platform.ListTodayBookings(date) });
    }
}
