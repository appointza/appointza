using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authenticate]
    public class OrganisationCrmController : ControllerBase
    {
        private readonly OrganisationCrmCatalogueService _service;
        private readonly CrmLeadDiscoveryService _discoveryService;
        private readonly OrganisationSalesProfileService _salesProfileService;

        public OrganisationCrmController(
            OrganisationCrmCatalogueService service,
            CrmLeadDiscoveryService discoveryService,
            OrganisationSalesProfileService salesProfileService)
        {
            _service = service;
            _discoveryService = discoveryService;
            _salesProfileService = salesProfileService;
        }

        /// <summary>
        /// Read-only CRM catalogue: organisation, locations, services, events, rooms.
        /// </summary>
        [HttpPost("GetCatalogueOverview")]
        public async Task<ActionResult<ActionRes<OrganisationCrmCatalogueOverview>>> GetCatalogueOverview(
            ActionReq<OrganisationCrmCatalogueSelectReq> req)
        {
            var result = new ActionRes<OrganisationCrmCatalogueOverview>();
            try
            {
                result.item = await _service.GetOverview(req.item ?? new OrganisationCrmCatalogueSelectReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Google Places text search for CRM lead discovery (enriched with phone/website).
        /// </summary>
        [HttpPost("SearchPlaces")]
        public async Task<ActionResult<ActionRes<CrmPlaceSearchRes>>> SearchPlaces(
            ActionReq<CrmPlaceSearchReq> req)
        {
            var result = new ActionRes<CrmPlaceSearchRes>();
            try
            {
                result.item = await _discoveryService.SearchPlaces(req.item ?? new CrmPlaceSearchReq());
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Save a discovered Google place as a CRM lead. Rejects duplicates for the same company.
        /// </summary>
        [HttpPost("SavePlaceAsLead")]
        public async Task<ActionResult<ActionRes<Enquiry>>> SavePlaceAsLead(
            ActionReq<CrmSavePlaceAsLeadReq> req)
        {
            var result = new ActionRes<Enquiry>();
            try
            {
                result.item = await _discoveryService.SavePlaceAsLead(req.item ?? new CrmSavePlaceAsLeadReq());
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Stored sales profile for this organisation. Does not include live prices.
        /// </summary>
        [HttpPost("GetSalesProfile")]
        public async Task<ActionResult<ActionRes<OrganisationSalesProfileView>>> GetSalesProfile(
            ActionReq<OrganisationSalesProfileSelectReq> req)
        {
            return await Run(() => _salesProfileService.Get(req?.item ?? new OrganisationSalesProfileSelectReq()));
        }

        /// <summary>
        /// Generate a new draft from the live catalogue. A failed refresh keeps the last approved profile.
        /// </summary>
        [HttpPost("GenerateSalesProfile")]
        public async Task<ActionResult<ActionRes<OrganisationSalesProfileView>>> GenerateSalesProfile(
            ActionReq<OrganisationSalesProfileSelectReq> req)
        {
            return await Run(() => _salesProfileService.Generate(req?.item ?? new OrganisationSalesProfileSelectReq()));
        }

        /// <summary>
        /// Save corrections to the draft. An approved profile stays in use until the new draft is approved.
        /// </summary>
        [HttpPost("SaveSalesProfile")]
        public async Task<ActionResult<ActionRes<OrganisationSalesProfileView>>> SaveSalesProfile(
            ActionReq<OrganisationSalesProfileSaveReq> req)
        {
            return await Run(() => _salesProfileService.Save(req?.item ?? new OrganisationSalesProfileSaveReq()));
        }

        /// <summary>
        /// Approve the pending draft so later leads reuse it.
        /// </summary>
        [HttpPost("ApproveSalesProfile")]
        public async Task<ActionResult<ActionRes<OrganisationSalesProfileView>>> ApproveSalesProfile(
            ActionReq<OrganisationSalesProfileSelectReq> req)
        {
            return await Run(() => _salesProfileService.Approve(req?.item ?? new OrganisationSalesProfileSelectReq()));
        }

        /// <summary>
        /// Fit percentage for each lead against the approved sales profile. Does not regenerate the profile.
        /// </summary>
        [HttpPost("ListLeadFit")]
        public async Task<ActionResult<ActionRes<OrganisationLeadFitList>>> ListLeadFit(
            ActionReq<OrganisationSalesProfileSelectReq> req)
        {
            return await Run(() => _salesProfileService.ListLeadFit(req?.item ?? new OrganisationSalesProfileSelectReq()));
        }

        /// <summary>
        /// Research one lead with the approved profile and the live catalogue. Does not regenerate the organisation profile.
        /// </summary>
        [HttpPost("PrepareLeadSalesAction")]
        public async Task<ActionResult<ActionRes<OrganisationLeadSalesAction>>> PrepareLeadSalesAction(
            ActionReq<OrganisationLeadSalesActionReq> req)
        {
            return await Run(() => _salesProfileService.PrepareLeadAction(req?.item ?? new OrganisationLeadSalesActionReq()));
        }

        async Task<ActionResult<ActionRes<T>>> Run<T>(Func<Task<T>> action)
        {
            var result = new ActionRes<T>();
            try
            {
                result.item = await action();
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
