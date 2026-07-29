using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IntegrationController : ControllerBase
    {
        private readonly IntegrationTokenService _integrationTokenService;
        private readonly ApplicationEnvironment _appSettings;
        private readonly ILogger<IntegrationController> _logger;

        public IntegrationController(
            IntegrationTokenService integrationTokenService,
            IOptions<ApplicationEnvironment> appSettings,
            ILogger<IntegrationController> logger)
        {
            _integrationTokenService = integrationTokenService;
            _appSettings = appSettings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Create (or return existing) integration token and copyable URLs.
        /// </summary>
        [Authenticate]
        [HttpPost("GenerateToken")]
        public async Task<ActionResult<ActionRes<IntegrationTokenUrlsRes>>> GenerateToken([FromQuery] bool regenerate = false)
        {
            ActionRes<IntegrationTokenUrlsRes> result = new ActionRes<IntegrationTokenUrlsRes>();
            try
            {
                var user = HttpContext.Items["usercontext"] as UsersContext;
                if (user == null)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                var baseUrl = ResolveApiBaseUrl();
                result.item = await _integrationTokenService.GenerateTokenForUser(user, baseUrl, regenerate);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GenerateToken failed");
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get organisation_id and userid from integration token.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("Context")]
        public async Task<ActionResult<IntegrationContextRes>> Context([FromQuery] string token)
        {
            try
            {
                var context = await _integrationTokenService.GetContextByToken(token);
                return Ok(context);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all leads and customers for the token's organisation.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("Data")]
        public async Task<ActionResult<IntegrationDataRes>> Data([FromQuery] string token)
        {
            try
            {
                var data = await _integrationTokenService.GetDataByToken(token);
                return Ok(new
                {
                    context = data.context,
                    leads = data.leads,
                    customers = data.customers,
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Same as Data — one URL for context + leads + customers.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("Export")]
        public async Task<ActionResult<IntegrationDataRes>> Export([FromQuery] string token)
        {
            try
            {
                var data = await _integrationTokenService.GetDataByToken(token);
                return Ok(data);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private string ResolveApiBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(_appSettings.baseUrl))
            {
                return _appSettings.baseUrl.TrimEnd('/');
            }

            var request = HttpContext.Request;
            return $"{request.Scheme}://{request.Host}".TrimEnd('/');
        }
    }
}
