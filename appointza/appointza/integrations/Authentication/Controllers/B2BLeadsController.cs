using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.integrations.Authentication.Controllers
{
    /// <summary>
    /// Server-to-server API for partner apps to import Appointza leads and customers.
    /// </summary>
    [ApiController]
    [Route("api/b2b/leads")]
    public class B2BLeadsController : ControllerBase
    {
        private readonly B2BLeadsImportService _leadsImportService;
        private readonly ILogger<B2BLeadsController> _logger;

        public B2BLeadsController(
            B2BLeadsImportService leadsImportService,
            ILogger<B2BLeadsController> logger)
        {
            _leadsImportService = leadsImportService;
            _logger = logger;
        }

        /// <summary>
        /// Resolve organisation id from an Appointza user email.
        /// </summary>
        [HttpPost("resolve-organisation")]
        public async Task<ActionResult<OrganisationResolveRes>> ResolveOrganisation([FromBody] LeadsImportReq req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.email))
                {
                    return BadRequest(new { message = "email is required" });
                }

                var organisation = await _leadsImportService.ResolveOrganisationByEmail(req.email);
                return Ok(organisation);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "B2B resolve organisation failed for {Email}", req?.email);
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Import form leads (enquiries) and appointment customers for an organisation.
        /// </summary>
        [HttpPost("import")]
        public async Task<ActionResult<LeadsImportRes>> Import([FromBody] LeadsImportReq req)
        {
            try
            {
                var result = await _leadsImportService.ImportLeads(req);
                _logger.LogInformation(
                    "B2B leads import by {Company}: org={OrgId}, leads={LeadCount}, customers={CustomerCount}",
                    HttpContext.Items["CallingCompany"],
                    result.organisation.organisation_id,
                    result.leads.Count,
                    result.customers.Count);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "B2B leads import failed");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
