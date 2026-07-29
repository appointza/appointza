using Microsoft.AspNetCore.Mvc;
using appointza.FirebaseNotification.Services;

namespace appointza.FirebaseNotification.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FirebaseAdminNotificationController : ControllerBase
    {
        private readonly FirebaseAdminNotificationService _firebaseAdminService;
        private readonly ILogger<FirebaseAdminNotificationController> _logger;

        public FirebaseAdminNotificationController(FirebaseAdminNotificationService firebaseAdminService, ILogger<FirebaseAdminNotificationController> logger)
        {
            _firebaseAdminService = firebaseAdminService;
            _logger = logger;
        }

        [HttpPost("send-test")]
        public async Task<IActionResult> SendTestNotification([FromBody] FirebaseAdminTestNotificationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PushToken))
                    return BadRequest(new { success = false, message = "Push token is required" });

                var data = new Dictionary<string, string>
                {
                    { "type", "test_notification_admin" },
                    { "timestamp", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") },
                    { "test_id", Guid.NewGuid().ToString() }
                };

                var result = await _firebaseAdminService.SendNotificationAsync(
                    request.PushToken,
                    request.Title ?? "Firebase Admin Test Notification 🚀",
                    request.Body ?? "This is a test notification using Firebase Admin SDK!",
                    data
                );

                if (result.Success)
                {
                    _logger.LogInformation($"Firebase Admin test notification sent successfully to token: {request.PushToken}");
                    return Ok(new { success = true, message = "Firebase Admin notification sent successfully" });
                }

                _logger.LogWarning($"Failed to send Firebase Admin test notification to token: {request.PushToken}. Error: {result.ErrorMessage}");
                return BadRequest(new { success = false, message = result.ErrorMessage ?? "Failed to send Firebase Admin notification" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending Firebase Admin test notification");
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("send-appointment-success")]
        public async Task<IActionResult> SendAppointmentSuccessTest([FromBody] FirebaseAdminAppointmentTestRequest request)
        {
            try
            {
                var result = await _firebaseAdminService.SendAppointmentSuccessNotificationAsync(
                    request.UserId,
                    request.AppointmentDetails ?? "Test appointment on " + DateTime.Now.AddDays(1).ToString("dd MMM yyyy") + " at 2:00 PM"
                );

                if (result.Success)
                    return Ok(new { success = true, message = "Firebase Admin appointment success notification sent" });

                _logger.LogWarning($"Failed to send Firebase Admin appointment success notification for user {request.UserId}. Error: {result.ErrorMessage}");
                return BadRequest(new { success = false, message = result.ErrorMessage ?? "Failed to send Firebase Admin appointment success notification" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending Firebase Admin appointment success test notification");
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class FirebaseAdminTestNotificationRequest
    {
        public string PushToken { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Body { get; set; }
    }

    public class FirebaseAdminAppointmentTestRequest
    {
        public long UserId { get; set; }
        public string? AppointmentDetails { get; set; }
    }
}


