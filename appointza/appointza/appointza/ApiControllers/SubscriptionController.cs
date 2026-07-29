using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;
using appointza.Utils;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        readonly ILogger<SubscriptionController> logger;
        readonly SubscriptionPlanService subscriptionPlanService;
        readonly OrganisationSubscriptionService organisationSubscriptionService;
        readonly OrganisationBillingStatsService organisationBillingStatsService;
        readonly SubscriptionTopUpService subscriptionTopUpService;
        readonly CreditWalletService creditWalletService;
        readonly CreditWalletRechargeService creditWalletRechargeService;
        readonly RequestState requeststate;

        public SubscriptionController(
            ILogger<SubscriptionController> logger,
            SubscriptionPlanService subscriptionPlanService,
            OrganisationSubscriptionService organisationSubscriptionService,
            OrganisationBillingStatsService organisationBillingStatsService,
            SubscriptionTopUpService subscriptionTopUpService,
            CreditWalletService creditWalletService,
            CreditWalletRechargeService creditWalletRechargeService,
            RequestState requeststate)
        {
            this.logger = logger;
            this.subscriptionPlanService = subscriptionPlanService;
            this.organisationSubscriptionService = organisationSubscriptionService;
            this.organisationBillingStatsService = organisationBillingStatsService;
            this.subscriptionTopUpService = subscriptionTopUpService;
            this.creditWalletService = creditWalletService;
            this.creditWalletRechargeService = creditWalletRechargeService;
            this.requeststate = requeststate;
        }

        long ResolveOrgId(long candidate)
        {
            if (candidate > 0) return candidate;
            return requeststate.usercontext?.organisationid ?? 0;
        }

        [HttpPost("SelectPlans")]
        public async Task<ActionResult<ActionRes<List<SubscriptionPlan>>>> SelectPlans(
            ActionReq<SubscriptionPlanSelectReq>? req)
        {
            try
            {
                string? projectName = req?.item?.project_name;
                if (string.IsNullOrWhiteSpace(projectName))
                {
                    projectName = null;
                }

                var plans = await subscriptionPlanService.SelectAll(projectName);
                return Ok(new ActionRes<List<SubscriptionPlan>> { item = plans });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "SelectPlans failed");
                return StatusCode(500, new ActionRes<List<SubscriptionPlan>>
                {
                    item = new List<SubscriptionPlan>(),
                    error = ex.Message,
                });
            }
        }

        [HttpPost("GetStatus")]
        public async Task<ActionResult<ActionRes<OrganisationSubscriptionStatusRes>>> GetStatus(
            ActionReq<OrganisationSubscriptionSelectReq> req)
        {
            try
            {
                long orgId = req?.item?.organisation_id ?? 0;
                if (orgId <= 0)
                {
                    orgId = requeststate.usercontext?.organisationid ?? 0;
                }

                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationSubscriptionStatusRes>
                    {
                        error = "organisation_id is required",
                    });
                }

                var status = await organisationSubscriptionService.GetStatus(orgId);
                return Ok(new ActionRes<OrganisationSubscriptionStatusRes> { item = status });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetStatus failed");
                return StatusCode(500, new ActionRes<OrganisationSubscriptionStatusRes>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("ChangePlan")]
        public async Task<ActionResult<ActionRes<OrganisationSubscriptionStatusRes>>> ChangePlan(
            ActionReq<OrganisationSubscriptionChangePlanReq> req)
        {
            try
            {
                if (req?.item == null || string.IsNullOrWhiteSpace(req.item.plan_code))
                {
                    return BadRequest(new ActionRes<OrganisationSubscriptionStatusRes>
                    {
                        error = "plan_code is required",
                    });
                }

                long orgId = req.item.organisation_id;
                if (orgId <= 0)
                {
                    orgId = requeststate.usercontext?.organisationid ?? 0;
                }

                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationSubscriptionStatusRes>
                    {
                        error = "organisation_id is required",
                    });
                }

                var result = await organisationSubscriptionService.ChangePlan(orgId, req.item.plan_code);
                return Ok(new ActionRes<OrganisationSubscriptionStatusRes> { item = result });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "ChangePlan validation failed");
                return BadRequest(new ActionRes<OrganisationSubscriptionStatusRes>
                {
                    error = ex.Message,
                });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "ChangePlan failed");
                return BadRequest(new ActionRes<OrganisationSubscriptionStatusRes>
                {
                    error = ex.Message,
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ChangePlan failed");
                return StatusCode(500, new ActionRes<OrganisationSubscriptionStatusRes>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("GetOutstanding")]
        public async Task<ActionResult<ActionRes<PlatformTopUpDueRes>>> GetOutstanding(
            ActionReq<OrganisationSubscriptionSelectReq> req)
        {
            try
            {
                long orgId = ResolveOrgId(req?.item?.organisation_id ?? 0);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<PlatformTopUpDueRes> { error = "organisation_id is required" });
                }

                var due = await subscriptionTopUpService.GetOutstanding(orgId);
                return Ok(new ActionRes<PlatformTopUpDueRes> { item = due });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetOutstanding failed");
                return StatusCode(500, new ActionRes<PlatformTopUpDueRes> { error = ex.Message });
            }
        }

        [HttpPost("CreateTopUpOrder")]
        public async Task<ActionResult<ActionRes<PlatformTopUpOrderRes>>> CreateTopUpOrder(
            ActionReq<OrganisationSubscriptionSelectReq> req)
        {
            try
            {
                long orgId = ResolveOrgId(req?.item?.organisation_id ?? 0);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<PlatformTopUpOrderRes> { error = "organisation_id is required" });
                }

                var order = await subscriptionTopUpService.CreateOrder(orgId);
                return Ok(new ActionRes<PlatformTopUpOrderRes> { item = order });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "CreateTopUpOrder failed");
                return BadRequest(new ActionRes<PlatformTopUpOrderRes> { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "CreateTopUpOrder validation failed");
                return BadRequest(new ActionRes<PlatformTopUpOrderRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "CreateTopUpOrder failed");
                return StatusCode(500, new ActionRes<PlatformTopUpOrderRes> { error = ex.Message });
            }
        }

        [HttpPost("VerifyTopUp")]
        public async Task<ActionResult<ActionRes<PlatformTopUpDueRes>>> VerifyTopUp(
            ActionReq<PlatformTopUpVerifyReq> req)
        {
            try
            {
                if (req?.item == null)
                {
                    return BadRequest(new ActionRes<PlatformTopUpDueRes> { error = "Verification payload is required" });
                }

                req.item.organisation_id = ResolveOrgId(req.item.organisation_id);
                if (req.item.organisation_id <= 0)
                {
                    return BadRequest(new ActionRes<PlatformTopUpDueRes> { error = "organisation_id is required" });
                }

                var due = await subscriptionTopUpService.Verify(req.item);
                return Ok(new ActionRes<PlatformTopUpDueRes> { item = due });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "VerifyTopUp failed");
                return BadRequest(new ActionRes<PlatformTopUpDueRes> { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "VerifyTopUp validation failed");
                return BadRequest(new ActionRes<PlatformTopUpDueRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "VerifyTopUp failed");
                return StatusCode(500, new ActionRes<PlatformTopUpDueRes> { error = ex.Message });
            }
        }

        [HttpPost("GetMonthlyBookingStats")]
        public async Task<ActionResult<ActionRes<OrganisationMonthlyBookingStatsRes>>> GetMonthlyBookingStats(
            ActionReq<OrganisationMonthlyBookingStatsReq> req)
        {
            try
            {
                long orgId = req?.item?.organisation_id ?? 0;
                if (orgId <= 0)
                {
                    orgId = requeststate.usercontext?.organisationid ?? 0;
                }

                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationMonthlyBookingStatsRes>
                    {
                        error = "organisation_id is required",
                    });
                }

                var months = req?.item?.months ?? 12;
                var stats = await organisationBillingStatsService.GetMonthlyBookingStats(orgId, months);
                return Ok(new ActionRes<OrganisationMonthlyBookingStatsRes> { item = stats });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetMonthlyBookingStats failed");
                return StatusCode(500, new ActionRes<OrganisationMonthlyBookingStatsRes>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("GetWalletStatus")]
        public async Task<ActionResult<ActionRes<CreditWalletStatusRes>>> GetWalletStatus(
            ActionReq<OrganisationSubscriptionSelectReq> req)
        {
            try
            {
                long orgId = ResolveOrgId(req?.item?.organisation_id ?? 0);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "organisation_id is required" });
                }

                var status = await creditWalletService.GetStatus(orgId);
                return Ok(new ActionRes<CreditWalletStatusRes> { item = status });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetWalletStatus failed");
                return StatusCode(500, new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
        }

        [HttpPost("ClaimMonthlyFreeCredits")]
        public async Task<ActionResult<ActionRes<CreditWalletStatusRes>>> ClaimMonthlyFreeCredits(
            ActionReq<OrganisationSubscriptionSelectReq> req)
        {
            try
            {
                long orgId = ResolveOrgId(req?.item?.organisation_id ?? 0);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "organisation_id is required" });
                }

                var status = await creditWalletService.ClaimMonthlyFreeCredits(orgId);
                return Ok(new ActionRes<CreditWalletStatusRes> { item = status });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ClaimMonthlyFreeCredits failed");
                return StatusCode(500, new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
        }

        [HttpPost("SetBillingMode")]
        public async Task<ActionResult<ActionRes<CreditWalletStatusRes>>> SetBillingMode(
            ActionReq<CreditWalletBillingModeReq> req)
        {
            try
            {
                if (req?.item == null || string.IsNullOrWhiteSpace(req.item.mode))
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "mode is required" });
                }

                long orgId = ResolveOrgId(req.item.organisation_id);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "organisation_id is required" });
                }

                var status = await creditWalletService.SetBillingMode(orgId, req.item.mode);
                return Ok(new ActionRes<CreditWalletStatusRes> { item = status });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "SetBillingMode failed");
                return StatusCode(500, new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
        }

        [HttpPost("CreateWalletRechargeOrder")]
        public async Task<ActionResult<ActionRes<CreditWalletRechargeOrderRes>>> CreateWalletRechargeOrder(
            ActionReq<CreditWalletRechargeReq> req)
        {
            try
            {
                if (req?.item == null || string.IsNullOrWhiteSpace(req.item.pack_id))
                {
                    return BadRequest(new ActionRes<CreditWalletRechargeOrderRes> { error = "pack_id is required" });
                }

                long orgId = ResolveOrgId(req.item.organisation_id);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletRechargeOrderRes> { error = "organisation_id is required" });
                }

                var order = await creditWalletRechargeService.CreateOrder(orgId, req.item.pack_id);
                return Ok(new ActionRes<CreditWalletRechargeOrderRes> { item = order });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "CreateWalletRechargeOrder validation failed");
                return BadRequest(new ActionRes<CreditWalletRechargeOrderRes> { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "CreateWalletRechargeOrder failed");
                return BadRequest(new ActionRes<CreditWalletRechargeOrderRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "CreateWalletRechargeOrder failed");
                return StatusCode(500, new ActionRes<CreditWalletRechargeOrderRes> { error = ex.Message });
            }
        }

        [HttpPost("VerifyWalletRecharge")]
        public async Task<ActionResult<ActionRes<CreditWalletStatusRes>>> VerifyWalletRecharge(
            ActionReq<CreditWalletRechargeVerifyReq> req)
        {
            try
            {
                if (req?.item == null)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "Verification payload is required" });
                }

                req.item.organisation_id = ResolveOrgId(req.item.organisation_id);
                if (req.item.organisation_id <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "organisation_id is required" });
                }

                var status = await creditWalletRechargeService.Verify(req.item);
                return Ok(new ActionRes<CreditWalletStatusRes> { item = status });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "VerifyWalletRecharge validation failed");
                return BadRequest(new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "VerifyWalletRecharge failed");
                return BadRequest(new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "VerifyWalletRecharge failed");
                return StatusCode(500, new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
        }

        [HttpPost("RechargeWallet")]
        [Obsolete("Use CreateWalletRechargeOrder + VerifyWalletRecharge with Razorpay.")]
        public async Task<ActionResult<ActionRes<CreditWalletStatusRes>>> RechargeWallet(
            ActionReq<CreditWalletRechargeReq> req)
        {
            try
            {
                if (req?.item == null || string.IsNullOrWhiteSpace(req.item.pack_id))
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "pack_id is required" });
                }

                long orgId = ResolveOrgId(req.item.organisation_id);
                if (orgId <= 0)
                {
                    return BadRequest(new ActionRes<CreditWalletStatusRes> { error = "organisation_id is required" });
                }

                return BadRequest(new ActionRes<CreditWalletStatusRes>
                {
                    error = "Use CreateWalletRechargeOrder and VerifyWalletRecharge after Razorpay payment.",
                });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "RechargeWallet validation failed");
                return BadRequest(new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "RechargeWallet failed");
                return StatusCode(500, new ActionRes<CreditWalletStatusRes> { error = ex.Message });
            }
        }
    }
}
