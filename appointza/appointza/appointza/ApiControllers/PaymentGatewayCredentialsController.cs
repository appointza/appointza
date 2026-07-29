using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentGatewayCredentialsController : ControllerBase
    {
        private readonly PaymentGatewayCredentialsService _service;

        public PaymentGatewayCredentialsController(PaymentGatewayCredentialsService service)
        {
            _service = service;
        }

        /// <summary>
        /// Get payment gateway credentials (with masked sensitive fields for security)
        /// </summary>
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<PaymentGatewayCredentialsSafe>>>> Select(ActionReq<PaymentGatewayCredentialsSelectReq> req)
        {
            ActionRes<List<PaymentGatewayCredentialsSafe>> result = new ActionRes<List<PaymentGatewayCredentialsSafe>>();
            var credentials = await _service.Select(req.item);
            
            // Convert to safe DTO with masked sensitive fields
            var safeCredentials = credentials.Select(c => new PaymentGatewayCredentialsSafe
            {
                id = c.id,
                gateway_id = c.gateway_id,
                organization_id = c.organization_id,
                gateway_name = c.gateway_name,
                api_key = MaskSensitiveValue(c.api_key), // Mask API key
                api_secret = MaskSensitiveValue(c.api_secret), // Mask API secret
                upi_id = c.upi_id,
                webhook_secret = string.IsNullOrEmpty(c.webhook_secret) ? null : MaskSensitiveValue(c.webhook_secret), // Mask webhook secret
                environment = c.environment,
                is_active = c.is_active,
                created_at = c.created_at,
                updated_at = c.updated_at
            }).ToList();
            
            result.item = safeCredentials;
            return Ok(result);
        }

        /// <summary>
        /// Mask sensitive value - show only last 4 characters
        /// </summary>
        private string MaskSensitiveValue(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;
            
            if (value.Length <= 4)
                return "****"; // If too short, mask completely
            
            // Show only last 4 characters, mask the rest
            return "****" + value.Substring(value.Length - 4);
        }

        /// <summary>
        /// Create new payment gateway credentials
        /// </summary>
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<PaymentGatewayCredentials>>> Insert(ActionReq<PaymentGatewayCredentialsInsertReq> req)
        {
            ActionRes<PaymentGatewayCredentials> result = new ActionRes<PaymentGatewayCredentials>();
            try
            {
                result.item = await _service.Insert(req.item);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Update payment gateway credentials
        /// </summary>
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<PaymentGatewayCredentials>>> Update(ActionReq<PaymentGatewayCredentialsUpdateReq> req)
        {
            ActionRes<PaymentGatewayCredentials> result = new ActionRes<PaymentGatewayCredentials>();
            try
            {
                result.item = await _service.Update(req.item);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Enable or disable a saved gateway (e.g. Razorpay) without editing API keys.
        /// </summary>
        [HttpPost("SetIsActive")]
        public async Task<ActionResult<ActionRes<PaymentGatewayCredentials>>> SetIsActive(ActionReq<PaymentGatewayCredentialsSetActiveReq> req)
        {
            ActionRes<PaymentGatewayCredentials> result = new ActionRes<PaymentGatewayCredentials>();
            try
            {
                result.item = await _service.SetIsActive(req.item);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete payment gateway credentials
        /// </summary>
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<long> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            try
            {
                result.item = await _service.Delete(req.item);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}

