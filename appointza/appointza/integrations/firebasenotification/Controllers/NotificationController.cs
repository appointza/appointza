using Microsoft.AspNetCore.Mvc;
using appointza.FirebaseNotification.Services;

namespace appointza.FirebaseNotification.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly FirebaseAdminNotificationService _firebaseAdminNotificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(FirebaseAdminNotificationService firebaseAdminNotificationService, ILogger<NotificationController> logger)
        {
            _firebaseAdminNotificationService = firebaseAdminNotificationService;
            _logger = logger;
        }

        [HttpPost("send-test")]
        public async Task<IActionResult> SendTestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PushToken))
                    return BadRequest(new { success = false, message = "Push token is required" });

                var data = new Dictionary<string, string>
                {
                    { "type", "test_notification" },
                    { "timestamp", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") },
                    { "test_id", Guid.NewGuid().ToString() }
                };

                var result = await _firebaseAdminNotificationService.SendNotificationAsync(
                    request.PushToken,
                    request.Title ?? "Test Notification 🧪",
                    request.Body ?? "This is a test notification from Appointza!",
                    data
                );

                if (result.Success)
                {
                    _logger.LogInformation($"Test notification sent successfully to token: {request.PushToken}");
                    return Ok(new { success = true, message = "Notification sent successfully" });
                }

                _logger.LogWarning($"Failed to send test notification to token: {request.PushToken}. Error: {result.ErrorMessage}");
                return BadRequest(new { success = false, message = result.ErrorMessage ?? "Failed to send notification" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("send-appointment-success")]
        public async Task<IActionResult> SendAppointmentSuccessTest([FromBody] AppointmentTestRequest request)
        {
            try
            {
                var result = await _firebaseAdminNotificationService.SendAppointmentSuccessNotificationAsync(
                    request.UserId,
                    request.AppointmentDetails ?? "Test appointment on " + DateTime.Now.AddDays(1).ToString("dd MMM yyyy") + " at 2:00 PM"
                );

                if (result.Success)
                    return Ok(new { success = true, message = "Appointment success notification sent" });

                _logger.LogWarning($"Failed to send appointment success notification for user {request.UserId}. Error: {result.ErrorMessage}");
                return BadRequest(new { success = false, message = result.ErrorMessage ?? "Failed to send appointment success notification" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending appointment success test notification");
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("send-payment-success")]
        public async Task<IActionResult> SendPaymentSuccessTest([FromBody] PaymentTestRequest request)
        {
            try
            {
                var result = await _firebaseAdminNotificationService.SendPaymentSuccessNotificationAsync(
                    request.UserId,
                    request.PaymentDetails ?? "Test payment for appointment #123",
                    request.Amount
                );

                if (result.Success)
                    return Ok(new { success = true, message = "Payment success notification sent" });

                _logger.LogWarning($"Failed to send payment success notification for user {request.UserId}. Error: {result.ErrorMessage}");
                return BadRequest(new { success = false, message = result.ErrorMessage ?? "Failed to send payment success notification" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending payment success test notification");
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class TestNotificationRequest
    {
        public string PushToken { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Body { get; set; }
    }

    public class AppointmentTestRequest
    {
        public long UserId { get; set; }
        public string? AppointmentDetails { get; set; }
    }

    public class PaymentTestRequest
    {
        public long UserId { get; set; }
        public string? PaymentDetails { get; set; }
        public decimal Amount { get; set; }
    }
}


