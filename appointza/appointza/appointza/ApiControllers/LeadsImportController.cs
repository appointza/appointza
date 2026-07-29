using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeadsImportController : ControllerBase
    {
        private readonly B2BLeadsImportService _leadsImportService;
        private readonly ILogger<LeadsImportController> _logger;

        public LeadsImportController(
            B2BLeadsImportService leadsImportService,
            ILogger<LeadsImportController> logger)
        {
            _leadsImportService = leadsImportService;
            _logger = logger;
        }

        /// <summary>
        /// Import Appointza leads and customers for the signed-in user's organisation or by owner email.
        /// </summary>
        [Authenticate]
        [HttpPost("ImportFromAppointza")]
        public async Task<ActionResult<ActionRes<LeadsImportRes>>> ImportFromAppointza(ActionReq<LeadsImportReq> req)
        {
            ActionRes<LeadsImportRes> result = new ActionRes<LeadsImportRes>();
            try
            {
                if (req?.item == null)
                {
                    return BadRequest(new { message = "Invalid request" });
                }

                var user = HttpContext.Items["usercontext"] as UsersContext;
                if (user == null)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                var importReq = req.item;
                if (importReq.organisation_id <= 0 && string.IsNullOrWhiteSpace(importReq.email))
                {
                    if (user.organisationid > 0)
                    {
                        importReq.organisation_id = user.organisationid;
                    }
                    else if (!string.IsNullOrWhiteSpace(user.useremail))
                    {
                        importReq.email = user.useremail;
                    }
                    else
                    {
                        return BadRequest(new { message = "Provide email or sign in with an organisation account." });
                    }
                }

                if (!string.IsNullOrWhiteSpace(importReq.email)
                    && !string.Equals(importReq.email.Trim(), user.useremail?.Trim(), StringComparison.OrdinalIgnoreCase)
                    && importReq.organisation_id != user.organisationid)
                {
                    var resolved = await _leadsImportService.ResolveOrganisationByEmail(importReq.email.Trim());
                    if (resolved.organisation_id != user.organisationid)
                    {
                        return Forbid();
                    }
                }

                result.item = await _leadsImportService.ImportLeads(importReq);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ImportFromAppointza failed");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
