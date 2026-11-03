using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using appointza.Utils;

namespace appointza.Controllers
{
    /// <summary>
    /// Napz product APIs — billing, cloud data, and Google proxies.
    /// Authenticated with Appointza JWT. Firebase Auth remains client-side only.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authenticate]
    public class NapzController : ControllerBase
    {
        readonly ILogger<NapzController> logger;
        readonly NapzService napzService;
        readonly NapzCloudService cloudService;
        readonly NapzGoogleProxyService googleProxy;
        readonly RequestState requeststate;

        public NapzController(
            ILogger<NapzController> logger,
            NapzService napzService,
            NapzCloudService cloudService,
            NapzGoogleProxyService googleProxy,
            RequestState requeststate)
        {
            this.logger = logger;
            this.napzService = napzService;
            this.cloudService = cloudService;
            this.googleProxy = googleProxy;
            this.requeststate = requeststate;
        }

        long RequireUserId()
        {
            var userid = requeststate.usercontext?.userid ?? 0;
            if (userid <= 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unauthorized");
            }
            return userid;
        }

        [HttpPost("EnsureUser")]
        public async Task<ActionResult<ActionRes<NapzEnsureUserRes>>> EnsureUser()
        {
            try
            {
                var userid = RequireUserId();
                var item = await napzService.EnsureUser(userid);
                await cloudService.EnsureCloudSchema();
                return Ok(new ActionRes<NapzEnsureUserRes> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message, code = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz EnsureUser failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("GetEntitlement")]
        public async Task<ActionResult<ActionRes<NapzEntitlement>>> GetEntitlement()
        {
            try
            {
                var item = await napzService.GetEntitlement(RequireUserId());
                return Ok(new ActionRes<NapzEntitlement> { item = item });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz GetEntitlement failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("ClaimFreeTrial")]
        public async Task<ActionResult<ActionRes<NapzEntitlement>>> ClaimFreeTrial()
        {
            try
            {
                var item = await napzService.ClaimFreeTrial(RequireUserId());
                return Ok(new ActionRes<NapzEntitlement> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message, code = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz ClaimFreeTrial failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("CreateOrder")]
        public async Task<ActionResult<ActionRes<NapzCreateOrderRes>>> CreateOrder(ActionReq<NapzCreateOrderReq> req)
        {
            try
            {
                var item = await napzService.CreateOrder(RequireUserId(), req?.item?.package_id ?? "");
                return Ok(new ActionRes<NapzCreateOrderRes> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message, code = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("VerifyPayment")]
        public async Task<ActionResult<ActionRes<NapzEntitlement>>> VerifyPayment(ActionReq<NapzVerifyPaymentReq> req)
        {
            try
            {
                var item = await napzService.VerifyPayment(RequireUserId(), req?.item ?? new NapzVerifyPaymentReq());
                return Ok(new ActionRes<NapzEntitlement> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message, code = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("ListPackages")]
        public ActionResult<ActionRes<List<NapzPackageDef>>> ListPackages()
        {
            return Ok(new ActionRes<List<NapzPackageDef>> { item = NapzCatalog.Packages.Values.ToList() });
        }

        [HttpPost("UpsertProfile")]
        public async Task<ActionResult<ActionRes<NapzProfile>>> UpsertProfile(ActionReq<NapzProfile> req)
        {
            try
            {
                var item = await cloudService.UpsertProfile(RequireUserId(), req?.item ?? new NapzProfile());
                return Ok(new ActionRes<NapzProfile> { item = item });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz UpsertProfile failed");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("GetProfile")]
        public async Task<ActionResult<ActionRes<NapzProfile>>> GetProfile()
        {
            try
            {
                var item = await cloudService.GetProfile(RequireUserId()) ?? new NapzProfile { userid = RequireUserId() };
                return Ok(new ActionRes<NapzProfile> { item = item });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("SetActiveDestination")]
        public async Task<ActionResult> SetActiveDestination(ActionReq<NapzActiveDestinationReq> req)
        {
            try
            {
                await cloudService.SetActiveDestination(RequireUserId(), req?.item ?? new NapzActiveDestinationReq());
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ListSavedPlaces")]
        public async Task<ActionResult<ActionRes<List<NapzSavedPlace>>>> ListSavedPlaces()
        {
            try
            {
                var item = await cloudService.ListSavedPlaces(RequireUserId());
                return Ok(new ActionRes<List<NapzSavedPlace>> { item = item });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("UpsertSavedPlace")]
        public async Task<ActionResult> UpsertSavedPlace(ActionReq<NapzSavedPlace> req)
        {
            try
            {
                await cloudService.UpsertSavedPlace(RequireUserId(), req?.item ?? new NapzSavedPlace());
                return Ok(new { success = true });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("DeleteSavedPlace")]
        public async Task<ActionResult> DeleteSavedPlace(ActionReq<NapzSavedPlace> req)
        {
            try
            {
                await cloudService.DeleteSavedPlace(RequireUserId(), req?.item?.id ?? "");
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("SaveTrip")]
        public async Task<ActionResult> SaveTrip(ActionReq<NapzTripSaveReq> req)
        {
            try
            {
                await cloudService.SaveTrip(RequireUserId(), req?.item ?? new NapzTripSaveReq());
                return Ok(new { success = true });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ListTrips")]
        public async Task<ActionResult<ActionRes<List<NapzTripRow>>>> ListTrips()
        {
            try
            {
                var item = await cloudService.ListTrips(RequireUserId());
                return Ok(new ActionRes<List<NapzTripRow>> { item = item });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("DeleteTrip")]
        public async Task<ActionResult> DeleteTrip(ActionReq<NapzTripSaveReq> req)
        {
            try
            {
                await cloudService.DeleteTrip(RequireUserId(), req?.item?.trip_id ?? "");
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("PublishTrip")]
        public async Task<ActionResult<ActionRes<NapzTripRow>>> PublishTrip(ActionReq<NapzTripSaveReq> req)
        {
            try
            {
                var item = await cloudService.PublishTrip(RequireUserId(), req?.item ?? new NapzTripSaveReq());
                return Ok(new ActionRes<NapzTripRow> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("GetSharedTrip")]
        [AllowAnonymous]
        public async Task<ActionResult<ActionRes<NapzTripRow>>> GetSharedTrip(ActionReq<NapzTripSaveReq> req)
        {
            try
            {
                var code = req?.item?.share_code ?? "";
                var item = await cloudService.GetSharedTrip(code);
                if (item == null) return NotFound(new { message = "Share code not found" });
                return Ok(new ActionRes<NapzTripRow> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("DeleteAccount")]
        public async Task<ActionResult> DeleteAccount()
        {
            try
            {
                await cloudService.DeleteAccountData(RequireUserId());
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz DeleteAccount failed");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Import Firestore data the client already fetched (profile, places, trips, entitlement)
        /// into Appointza Postgres for the signed-in Napz user.
        /// </summary>
        [HttpPost("ImportFirebaseBundle")]
        public async Task<ActionResult<ActionRes<NapzFirebaseImportRes>>> ImportFirebaseBundle(
            ActionReq<NapzFirebaseImportBundle> req)
        {
            try
            {
                var userid = RequireUserId();
                var item = await cloudService.ImportFirebaseBundle(userid, req?.item ?? new NapzFirebaseImportBundle());
                return Ok(new ActionRes<NapzFirebaseImportRes> { item = item });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Napz ImportFirebaseBundle failed");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("SearchPlaces")]
        public async Task<ActionResult<ActionRes<List<NapzPlaceSearchHit>>>> SearchPlaces(ActionReq<NapzPlaceSearchReq> req)
        {
            try
            {
                RequireUserId();
                var item = await googleProxy.SearchPlaces(req?.item ?? new NapzPlaceSearchReq());
                return Ok(new ActionRes<List<NapzPlaceSearchHit>> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ReverseGeocode")]
        public async Task<ActionResult<ActionRes<NapzReverseGeocodeRes>>> ReverseGeocode(ActionReq<NapzReverseGeocodeReq> req)
        {
            try
            {
                RequireUserId();
                var item = await googleProxy.ReverseGeocode(req?.item ?? new NapzReverseGeocodeReq());
                return Ok(new ActionRes<NapzReverseGeocodeRes> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("EstimateJourney")]
        public async Task<ActionResult> EstimateJourney(ActionReq<NapzJourneyEstimateReq> req)
        {
            try
            {
                RequireUserId();
                var item = await googleProxy.EstimateJourney(req?.item ?? new NapzJourneyEstimateReq());
                return Ok(new ActionRes<object> { item = item });
            }
            catch (AppException ex)
            {
                return StatusCode(StatusFromAppException(ex), new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ComputeRoute")]
        public async Task<ActionResult> ComputeRoute(ActionReq<NapzJourneyEstimateReq> req, [FromQuery] string mode = "DRIVE")
        {
            try
            {
                RequireUserId();
                var item = await googleProxy.ComputeDriveRoute(req?.item ?? new NapzJourneyEstimateReq(), mode);
                return Ok(new ActionRes<object> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("NarrateTrip")]
        public async Task<ActionResult<ActionRes<NapzNarrateRes>>> NarrateTrip(ActionReq<NapzNarrateReq> req)
        {
            try
            {
                RequireUserId();
                var item = await googleProxy.NarrateTrip(req?.item ?? new NapzNarrateReq());
                return Ok(new ActionRes<NapzNarrateRes> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Ride partners (Ola/Uber/BlaBla) stay unconfigured until secrets are set on Appointza.</summary>
        [HttpPost("RideCatalog")]
        public ActionResult RideCatalog([FromQuery] string provider = "")
        {
            RequireUserId();
            return Ok(new
            {
                item = new
                {
                    configured = false,
                    connected = false,
                    loggedIn = false,
                    products = Array.Empty<object>(),
                    rides = Array.Empty<object>(),
                    offers = Array.Empty<object>(),
                    message = $"Ride provider '{provider}' is not configured on Appointza yet.",
                },
            });
        }

        static int StatusFromAppException(AppException ex)
        {
            return ex.code switch
            {
                AppException.ErrorCodes.UsersNotFound => StatusCodes.Status404NotFound,
                AppException.ErrorCodes.BadRequest => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status400BadRequest,
            };
        }
    }
}
