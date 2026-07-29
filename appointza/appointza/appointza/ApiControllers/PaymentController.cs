using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;

namespace appointza.ApiControllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService paymentService;
        private readonly ILogger<PaymentController> logger;

        public PaymentController(PaymentService paymentService, ILogger<PaymentController> logger)
        {
            this.paymentService = paymentService;
            this.logger = logger;
        }

        [HttpPost("CreateOrder")]
        public async Task<ActionResult<CreatePaymentOrderRes>> CreateOrder([FromBody] CreatePaymentOrderReq req)
        {
            try
            {
                if (req == null)
                {
                    logger.LogWarning("CreateOrder: Request is null");
                    return BadRequest(new 
                    { 
                        error = "Invalid request",
                        message = "Request body is null"
                    });
                }

                // Validate required fields
                if (req.organizationid <= 0)
                {
                    return BadRequest(new 
                    { 
                        error = "Validation error",
                        message = "Organization ID is required and must be greater than 0"
                    });
                }

                if (req.amount <= 0)
                {
                    return BadRequest(new 
                    { 
                        error = "Validation error",
                        message = "Amount must be greater than 0"
                    });
                }

                if (req.userid <= 0)
                {
                    return BadRequest(new 
                    { 
                        error = "Validation error",
                        message = "User ID is required"
                    });
                }

                logger.LogInformation("CreateOrder: Creating order for organization {OrgId}, location {LocId}, amount {Amount}, user {UserId}", 
                    req.organizationid, req.organisationlocationid, req.amount, req.userid);

                var result = await paymentService.CreatePaymentOrder(req);
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating payment order: {Message}\nStackTrace: {StackTrace}", ex.Message, ex.StackTrace);
                
                // Return error details in response for debugging
                return BadRequest(new 
                { 
                    error = "Failed to create payment order",
                    message = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        [HttpPost("VerifyPayment")]
        public async Task<ActionResult<VerifyPaymentRes>> VerifyPayment([FromBody] VerifyPaymentReq req)
        {
            try
            {
                if (req == null)
                {
                    return BadRequest(new VerifyPaymentRes 
                    { 
                        isvalid = false, 
                        message = "Invalid request" 
                    });
                }

                var result = await paymentService.VerifyPayment(req);
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error verifying payment");
                return BadRequest(new VerifyPaymentRes 
                { 
                    isvalid = false, 
                    message = $"Error: {ex.Message}" 
                });
            }
        }
    }
}

