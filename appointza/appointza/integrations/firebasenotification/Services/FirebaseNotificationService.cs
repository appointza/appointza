using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using appointza.Authentication.Services;
using appointza.Models;
using appointza.Utils;

namespace appointza.FirebaseNotification.Services
{
    public class FirebaseNotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _serverKey;
        private readonly ILogger<FirebaseNotificationService> _logger;
        private readonly UsersService _usersService;

        public FirebaseNotificationService(HttpClient httpClient, IConfiguration configuration, ILogger<FirebaseNotificationService> logger, UsersService usersService)
        {
            _httpClient = httpClient;
            _logger = logger;
            _usersService = usersService;
            _serverKey = configuration["ApplicationSettings:firebase:server_key"];
        }

        public async Task<bool> SendNotificationAsync(string pushToken, string title, string body, Dictionary<string, string> data = null)
        {
            try
            {
                _logger.LogInformation($"Attempting to send notification to token: {pushToken}");
                _logger.LogInformation($"Server key length: {_serverKey?.Length ?? 0}");
                _logger.LogInformation($"Server key starts with: {_serverKey?.Substring(0, Math.Min(10, _serverKey?.Length ?? 0))}...");

                if (string.IsNullOrEmpty(pushToken) || string.IsNullOrEmpty(_serverKey))
                {
                    _logger.LogWarning("Push token or server key is empty");
                    return false;
                }

                // Validate server key format - should be FCM Legacy Server Key (starts with AAAA...)
                if (!_serverKey.StartsWith("AAAA"))
                {
                    _logger.LogError("❌ INVALID SERVER KEY FORMAT!");
                    _logger.LogError("Expected: FCM Legacy Server Key (starts with AAAA...)");
                    _logger.LogError($"Current: {_serverKey?.Substring(0, Math.Min(20, _serverKey?.Length ?? 0))}...");
                    _logger.LogError("This looks like a Web API Key, not a Server Key!");
                    _logger.LogError("Please get the correct FCM Legacy Server Key from Firebase Console:");
                    _logger.LogError("1. Go to Firebase Console > Project Settings > Cloud Messaging");
                    _logger.LogError("2. Look for 'Cloud Messaging API (Legacy)' section");
                    _logger.LogError("3. Copy the key that starts with 'AAAA...'");
                    return false;
                }

                var notification = new
                {
                    to = pushToken,
                    notification = new
                    {
                        title = title,
                        body = body,
                        sound = "default"
                    },
                    data = data ?? new Dictionary<string, string>()
                };

                var json = JsonSerializer.Serialize(notification);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("key", "=" + _serverKey);
                _httpClient.DefaultRequestHeaders.Accept.Clear();
                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                _logger.LogInformation("Sending request to FCM endpoint: https://fcm.googleapis.com/fcm/send");
                _logger.LogInformation($"Request payload: {json}");

                var response = await _httpClient.PostAsync("https://fcm.googleapis.com/fcm/send", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"FCM Response Status: {response.StatusCode}");
                _logger.LogInformation($"FCM Response Content: {responseContent}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Notification sent successfully to token: {pushToken}");
                    return true;
                }
                else
                {
                    _logger.LogError($"Failed to send notification. Status: {response.StatusCode}, Response: {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification to token: {pushToken}");
                return false;
            }
        }

        public async Task<bool> SendAppointmentSuccessNotificationAsync(long userId, string appointmentDetails)
        {
            try
            {
                var users = await _usersService.Select(new UsersSelectReq { id = userId });

                if (users == null || users.Count == 0)
                {
                    _logger.LogWarning($"User not found: {userId}");
                    return false;
                }

                var user = users.First();
                var pushToken = user.androidpushnotification ?? user.iospushnotification ?? user.webpushnotification;

                if (string.IsNullOrEmpty(pushToken))
                {
                    _logger.LogWarning($"No push token found for user: {userId}");
                    return false;
                }

                return await SendNotificationAsync(
                    pushToken,
                    "Appointment Confirmed ✅",
                    appointmentDetails,
                    new Dictionary<string, string>
                    {
                        { "type", "appointment_success" },
                        { "user_id", userId.ToString() }
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending appointment success notification for user: {userId}");
                return false;
            }
        }
    }
}


