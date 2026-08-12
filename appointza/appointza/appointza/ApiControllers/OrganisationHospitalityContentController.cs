using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationHospitalityContentController : ControllerBase
    {
        readonly ILogger<OrganisationHospitalityContentController> logger;
        readonly OrganisationHospitalityContentService hospitalityContentService;

        public OrganisationHospitalityContentController(
            ILogger<OrganisationHospitalityContentController> logger,
            OrganisationHospitalityContentService hospitalityContentService)
        {
            this.logger = logger;
            this.hospitalityContentService = hospitalityContentService;
        }

        [HttpPost("GetProfile")]
        public async Task<ActionResult<ActionRes<OrganisationHospitalityProfile>>> GetProfile(
            ActionReq<HospitalityProfileSelectReq>? req)
        {
            var organisationId = req?.item?.organisation_id ?? 0;
            if (organisationId <= 0)
                return BadRequest(new ActionRes<OrganisationHospitalityProfile> { error = "organisation_id is required." });

            try
            {
                var profile = await hospitalityContentService.GetProfile(organisationId);
                return Ok(new ActionRes<OrganisationHospitalityProfile> { item = profile });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetProfile failed for org {OrganisationId}", organisationId);
                return StatusCode(500, new ActionRes<OrganisationHospitalityProfile> { error = ex.Message });
            }
        }

        [HttpPost("SaveSettings")]
        public async Task<ActionResult<ActionRes<OrganisationHospitalityProfile>>> SaveSettings(
            ActionReq<HospitalityProfileSettingsReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<OrganisationHospitalityProfile> { error = "organisation_id is required." });

            try
            {
                var profile = await hospitalityContentService.SaveSettings(req.item);
                return Ok(new ActionRes<OrganisationHospitalityProfile> { item = profile });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "SaveSettings failed for org {OrganisationId}", req.item.organisation_id);
                return BadRequest(new ActionRes<OrganisationHospitalityProfile> { error = ex.Message });
            }
        }

        [HttpPost("SaveContent")]
        public async Task<ActionResult<ActionRes<OrganisationHospitalityProfile>>> SaveContent(
            ActionReq<HospitalityContentSaveReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<OrganisationHospitalityProfile> { error = "organisation_id is required." });

            try
            {
                var profile = await hospitalityContentService.SaveContent(req.item);
                return Ok(new ActionRes<OrganisationHospitalityProfile> { item = profile });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "SaveContent failed for org {OrganisationId}", req.item.organisation_id);
                return BadRequest(new ActionRes<OrganisationHospitalityProfile> { error = ex.Message });
            }
        }
    }
}
