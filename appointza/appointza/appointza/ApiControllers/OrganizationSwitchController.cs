using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.integrations.Authentication.Services;
using appointza.Services;
using appointza.Utils;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationSwitchController : ControllerBase
    {
        private readonly ILogger<OrganizationSwitchController> _logger;
        private readonly IB2BClientService _b2bClient;
        private readonly RequestState _requestState;
        private readonly AppointmentRecordService _appointmentRecordService;

        public OrganizationSwitchController(
            ILogger<OrganizationSwitchController> logger,
            IB2BClientService b2bClient,
            RequestState requestState,
            AppointmentRecordService appointmentRecordService)
        {
            _logger = logger;
            _b2bClient = b2bClient;
            _requestState = requestState;
            _appointmentRecordService = appointmentRecordService;
        }

        /// <summary>
        /// Get available organizations for a user by phone number
        /// </summary>
        [HttpPost("available-organizations")]
        public async Task<ActionResult<ActionRes<List<OrganizationInfo>>>> GetAvailableOrganizations([FromBody] GetOrganizationsRequest request)
        {
            var result = new ActionRes<List<OrganizationInfo>>();
            result.item = new List<OrganizationInfo>();

            try
            {
                // Always include Appointza (current organization)
                result.item.Add(new OrganizationInfo
                {
                    OrganizationId = "appointza",
                    OrganizationName = "Appointza",
                    OrganizationDomain = "appointza.com",
                    IsCurrent = true
                });

                // Check Momantza
                try
                {
                    var momantzaResponse = await _b2bClient.CallApiAsync<CheckUserResponse>(
                        "momantza",
                        "api/b2b/user/check",
                        null,
                        HttpMethod.Post,
                        new { mobileNumber = request.MobileNumber }
                    );

                    if (momantzaResponse != null && momantzaResponse.Exists)
                    {
                        result.item.Add(new OrganizationInfo
                        {
                            OrganizationId = "momantza",
                            OrganizationName = "Momantza",
                            OrganizationDomain = "momantza.com",
                            IsCurrent = false,
                            HasAppointments = momantzaResponse.HasAppointments,
                            IsAdmin = momantzaResponse.IsAdmin
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to check Momantza for user {MobileNumber}", request.MobileNumber);
                }

                // Check Campusza
                try
                {
                    var campuszaResponse = await _b2bClient.CallApiAsync<CheckUserResponse>(
                        "campusza",
                        "api/b2b/user/check",
                        null,
                        HttpMethod.Post,
                        new { mobileNumber = request.MobileNumber }
                    );

                    if (campuszaResponse != null && campuszaResponse.Exists)
                    {
                        result.item.Add(new OrganizationInfo
                        {
                            OrganizationId = "campusza",
                            OrganizationName = "Campusza",
                            OrganizationDomain = "campusza.com",
                            IsCurrent = false,
                            HasAppointments = campuszaResponse.HasAppointments,
                            IsAdmin = campuszaResponse.IsAdmin
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to check Campusza for user {MobileNumber}", request.MobileNumber);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available organizations");
                return StatusCode(500, result);
            }
        }

        /// <summary>
        /// Get appointments from a specific organization
        /// </summary>
        [HttpPost("appointments")]
        public async Task<ActionResult<ActionRes<List<AppointmentRecord>>>> GetAppointments([FromBody] GetAppointmentsRequest request)
        {
            var result = new ActionRes<List<AppointmentRecord>>();
            result.item = new List<AppointmentRecord>();

            try
            {
                // Get user context
                var userContext = _requestState.usercontext;
                if (userContext == null || userContext.userid <= 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var mobileNumber = request.MobileNumber ?? userContext.usermobile;

                if (string.IsNullOrEmpty(mobileNumber))
                {
                    return BadRequest(new { message = "Mobile number is required" });
                }

                // If requesting Appointza appointments, get from local database
                if (request.OrganizationId == "appointza" || string.IsNullOrEmpty(request.OrganizationId))
                {
                    var searchReq = new AppointmentRecordSelectReq
                    {
                        organisationid = userContext.organisationid,
                        userid = userContext.userid
                    };
                    result.item = await _appointmentRecordService.Select(searchReq);
                    return Ok(result);
                }

                // Get appointments from other organizations via B2B
                string endpoint = request.IsAdmin 
                    ? "api/b2b/user/appointments/all" 
                    : "api/b2b/user/appointments/by-mobile";

                object b2bRequest;
                if (request.IsAdmin)
                {
                    b2bRequest = new { OrganizationId = userContext.organisationid.ToString() };
                }
                else
                {
                    b2bRequest = new { MobileNumber = mobileNumber };
                }

                var appointments = await _b2bClient.CallApiAsync<List<AppointmentRecord>>(
                    request.OrganizationId,
                    endpoint,
                    null,
                    HttpMethod.Post,
                    b2bRequest
                );

                if (appointments != null)
                {
                    result.item = appointments;
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments from {OrganizationId}", request.OrganizationId);
                return StatusCode(500, result);
            }
        }
    }

    public class GetOrganizationsRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class GetAppointmentsRequest
    {
        public string OrganizationId { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public bool IsAdmin { get; set; } = false;
    }

    public class OrganizationInfo
    {
        public string OrganizationId { get; set; } = string.Empty;
        public string OrganizationName { get; set; } = string.Empty;
        public string OrganizationDomain { get; set; } = string.Empty;
        public bool IsCurrent { get; set; }
        public bool HasAppointments { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class CheckUserResponse
    {
        public bool Exists { get; set; }
        public bool HasAppointments { get; set; }
        public bool IsAdmin { get; set; }
    }
}
