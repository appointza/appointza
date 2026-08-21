using appointza.Models;
using appointza.Models.Loyalty;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationLoyaltyController : ControllerBase
    {
        readonly ILogger<OrganisationLoyaltyController> logger;
        readonly OrganisationLoyaltyService loyaltyService;

        public OrganisationLoyaltyController(
            ILogger<OrganisationLoyaltyController> logger,
            OrganisationLoyaltyService loyaltyService)
        {
            this.logger = logger;
            this.loyaltyService = loyaltyService;
        }

        [HttpPost("GetDashboard")]
        public async Task<ActionResult<ActionRes<LoyaltyDashboard>>> GetDashboard(ActionReq<LoyaltyOrgReq>? req)
        {
            var organisationId = req?.item?.organisation_id ?? 0;
            if (organisationId <= 0)
                return BadRequest(new ActionRes<LoyaltyDashboard> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.GetDashboard(organisationId);
                return Ok(new ActionRes<LoyaltyDashboard> { item = item });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetDashboard failed");
                return BadRequest(new ActionRes<LoyaltyDashboard> { error = ex.Message });
            }
        }

        [HttpPost("GetSettings")]
        public async Task<ActionResult<ActionRes<OrganisationLoyaltySettings>>> GetSettings(ActionReq<LoyaltyOrgReq>? req)
        {
            var organisationId = req?.item?.organisation_id ?? 0;
            if (organisationId <= 0)
                return BadRequest(new ActionRes<OrganisationLoyaltySettings> { error = "organisation_id is required." });
            var item = await loyaltyService.GetSettings(organisationId);
            return Ok(new ActionRes<OrganisationLoyaltySettings> { item = item });
        }

        [HttpPost("SaveSettings")]
        public async Task<ActionResult<ActionRes<OrganisationLoyaltySettings>>> SaveSettings(ActionReq<LoyaltySettingsSaveReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<OrganisationLoyaltySettings> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.SaveSettings(req.item);
                return Ok(new ActionRes<OrganisationLoyaltySettings> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<OrganisationLoyaltySettings> { error = ex.Message });
            }
        }

        [HttpPost("SelectSchemes")]
        public async Task<ActionResult<ActionRes<List<LoyaltyScheme>>>> SelectSchemes(ActionReq<LoyaltySchemeSelectReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<List<LoyaltyScheme>> { error = "organisation_id is required." });
            var item = await loyaltyService.SelectSchemes(req.item);
            return Ok(new ActionRes<List<LoyaltyScheme>> { item = item });
        }

        [HttpPost("SaveScheme")]
        public async Task<ActionResult<ActionRes<LoyaltyScheme>>> SaveScheme(ActionReq<LoyaltySchemeSaveReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<LoyaltyScheme> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.SaveScheme(req.item);
                return Ok(new ActionRes<LoyaltyScheme> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<LoyaltyScheme> { error = ex.Message });
            }
        }

        [HttpPost("DeleteScheme")]
        public async Task<ActionResult<ActionRes<object>>> DeleteScheme(ActionReq<LoyaltySchemeDeleteReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<object> { error = "organisation_id is required." });
            await loyaltyService.DeleteScheme(req.item);
            return Ok(new ActionRes<object> { item = new { success = true } });
        }

        [HttpPost("SaveRule")]
        public async Task<ActionResult<ActionRes<LoyaltyRule>>> SaveRule(ActionReq<LoyaltyRuleSaveReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<LoyaltyRule> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.SaveRule(req.item);
                return Ok(new ActionRes<LoyaltyRule> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<LoyaltyRule> { error = ex.Message });
            }
        }

        [HttpPost("DeleteRule")]
        public async Task<ActionResult<ActionRes<object>>> DeleteRule(ActionReq<LoyaltyRuleDeleteReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<object> { error = "organisation_id is required." });
            await loyaltyService.DeleteRule(req.item);
            return Ok(new ActionRes<object> { item = new { success = true } });
        }

        [HttpPost("SelectTiers")]
        public async Task<ActionResult<ActionRes<List<LoyaltyTier>>>> SelectTiers(ActionReq<LoyaltyTierSelectReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<List<LoyaltyTier>> { error = "organisation_id is required." });
            var item = await loyaltyService.SelectTiers(req.item);
            return Ok(new ActionRes<List<LoyaltyTier>> { item = item });
        }

        [HttpPost("SaveTier")]
        public async Task<ActionResult<ActionRes<LoyaltyTier>>> SaveTier(ActionReq<LoyaltyTierSaveReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<LoyaltyTier> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.SaveTier(req.item);
                return Ok(new ActionRes<LoyaltyTier> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<LoyaltyTier> { error = ex.Message });
            }
        }

        [HttpPost("DeleteTier")]
        public async Task<ActionResult<ActionRes<object>>> DeleteTier(ActionReq<LoyaltyTierDeleteReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<object> { error = "organisation_id is required." });
            await loyaltyService.DeleteTier(req.item);
            return Ok(new ActionRes<object> { item = new { success = true } });
        }

        [HttpPost("SelectCustomerWallets")]
        public async Task<ActionResult<ActionRes<List<ClientLoyaltyWallet>>>> SelectCustomerWallets(ActionReq<LoyaltyCustomerSelectReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<List<ClientLoyaltyWallet>> { error = "organisation_id is required." });
            var item = await loyaltyService.SelectCustomerWallets(req.item);
            return Ok(new ActionRes<List<ClientLoyaltyWallet>> { item = item });
        }

        [HttpPost("SelectTransactions")]
        public async Task<ActionResult<ActionRes<List<LoyaltyPointTransaction>>>> SelectTransactions(ActionReq<LoyaltyTransactionSelectReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<List<LoyaltyPointTransaction>> { error = "organisation_id is required." });
            var item = await loyaltyService.SelectTransactions(req.item);
            return Ok(new ActionRes<List<LoyaltyPointTransaction>> { item = item });
        }

        [HttpPost("SelectRewardGrants")]
        public async Task<ActionResult<ActionRes<List<LoyaltyRewardGrant>>>> SelectRewardGrants(ActionReq<LoyaltyRewardGrantSelectReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<List<LoyaltyRewardGrant>> { error = "organisation_id is required." });
            var item = await loyaltyService.SelectRewardGrants(req.item);
            return Ok(new ActionRes<List<LoyaltyRewardGrant>> { item = item });
        }

        [HttpPost("EvaluateServiceCompletion")]
        public async Task<ActionResult<ActionRes<LoyaltyEvaluationResult>>> EvaluateServiceCompletion(ActionReq<LoyaltyEvaluateCompletionReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<LoyaltyEvaluationResult> { error = "organisation_id is required." });
            try
            {
                var item = await loyaltyService.EvaluateServiceCompletion(req.item);
                return Ok(new ActionRes<LoyaltyEvaluationResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<LoyaltyEvaluationResult> { error = ex.Message });
            }
        }

        [HttpPost("SeedSampleProgram")]
        public async Task<ActionResult<ActionRes<object>>> SeedSampleProgram(ActionReq<LoyaltyOrgReq>? req)
        {
            var organisationId = req?.item?.organisation_id ?? 0;
            if (organisationId <= 0)
                return BadRequest(new ActionRes<object> { error = "organisation_id is required." });
            try
            {
                await loyaltyService.SeedSampleProgram(organisationId);
                return Ok(new ActionRes<object> { item = new { success = true } });
            }
            catch (Exception ex)
            {
                return BadRequest(new ActionRes<object> { error = ex.Message });
            }
        }
    }
}
