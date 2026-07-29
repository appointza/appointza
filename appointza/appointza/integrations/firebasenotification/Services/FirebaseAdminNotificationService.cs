using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using appointza.Authentication.Services;
using appointza.Models;
using appointza.Utils;

namespace appointza.FirebaseNotification.Services
{
    public class FirebaseAdminNotificationService
    {
        private readonly ILogger<FirebaseAdminNotificationService> _logger;
        private readonly UsersService _usersService;

        public FirebaseAdminNotificationService(ILogger<FirebaseAdminNotificationService> logger, UsersService usersService)
        {
            _logger = logger;
            _usersService = usersService;
            // Don't initialize Firebase here - do it lazily when first needed
        }

        private void InitializeFirebase()
        {
            try
            {
                // Try multiple possible locations and filenames for the service account JSON file
                var searchDirectories = new[]
                {
                    Directory.GetCurrentDirectory(),
                    Path.Combine(Directory.GetCurrentDirectory(), ".."),
                    Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads")
                };

                // Try multiple possible filenames
                var possibleFileNames = new[]
                {
                    "appointza-a0d00-firebase-adminsdk-fbsvc-a47b9588ba.json",
                    "appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json",
                    "appointza-a0d00-firebase-adminsdk-*.json"
                };

                string serviceAccountPath = null;

                foreach (var directory in searchDirectories)
                {
                    foreach (var fileName in possibleFileNames)
                    {
                        if (fileName.Contains("*"))
                        {
                            var files = Directory.GetFiles(directory, fileName);
                            if (files.Length > 0)
                            {
                                serviceAccountPath = files[0];
                                break;
                            }
                        }
                        else
                        {
                            var path = Path.Combine(directory, fileName);
                            if (File.Exists(path))
                            {
                                serviceAccountPath = path;
                                break;
                            }
                        }
                    }

                    if (serviceAccountPath != null)
                        break;
                }

                if (serviceAccountPath == null)
                {
                    _logger.LogError("Service account file not found. Searched in:");
                    foreach (var directory in searchDirectories)
                        _logger.LogError($"  - {directory}");

                    throw new FileNotFoundException("Service account file not found. Please copy the Firebase service account JSON file (appointza-a0d00-firebase-adminsdk-*.json) to the project directory.");
                }

                _logger.LogInformation($"Found service account file at: {serviceAccountPath}");

#pragma warning disable CS0618
                var credential = GoogleCredential.FromFile(serviceAccountPath);
#pragma warning restore CS0618
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = credential,
                    ProjectId = "appointza-a0d00"
                });

                _logger.LogInformation("Firebase Admin SDK initialized successfully with service account file");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Firebase Admin SDK");
                throw;
            }
        }

        public async Task<(bool Success, string ErrorMessage)> SendNotificationAsync(string pushToken, string title, string body, Dictionary<string, string> data = null)
        {
            try
            {
                if (string.IsNullOrEmpty(pushToken))
                {
                    _logger.LogWarning("Push token is empty");
                    return (false, "Push token is empty");
                }

                if (FirebaseApp.DefaultInstance == null)
                {
                    try
                    {
                        InitializeFirebase();
                    }
                    catch (Exception initEx)
                    {
                        _logger.LogError(initEx, "Failed to initialize Firebase Admin SDK");
                        return (false, $"Failed to initialize Firebase: {initEx.Message}");
                    }
                }

                var message = new Message()
                {
                    Token = pushToken,
                    Notification = new Notification()
                    {
                        Title = title,
                        Body = body
                    },
                    Data = data ?? new Dictionary<string, string>()
                };

                var response = await FirebaseMessaging.DefaultInstance.SendAsync(message);
                _logger.LogInformation($"Notification sent successfully. Message ID: {response}");
                return (true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification to token: {pushToken}");
                return (false, ex.Message);
            }
        }

        public async Task<(bool Success, string ErrorMessage)> SendAppointmentSuccessNotificationAsync(long userId, string appointmentDetails)
        {
            try
            {
                var users = await _usersService.Select(new UsersSelectReq { id = userId });
                if (users == null || users.Count == 0)
                    return (false, $"User not found: {userId}");

                var user = users.First();
                var pushToken = user.androidpushnotification ?? user.iospushnotification ?? user.webpushnotification;
                if (string.IsNullOrEmpty(pushToken))
                    return (false, "User has no push token");

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
                return (false, ex.Message);
            }
        }

        public async Task<(bool Success, string ErrorMessage)> SendPaymentSuccessNotificationAsync(long userId, string paymentDetails, decimal amount)
        {
            try
            {
                var users = await _usersService.Select(new UsersSelectReq { id = userId });
                if (users == null || users.Count == 0)
                    return (false, $"User not found: {userId}");

                var user = users.First();
                var pushToken = user.androidpushnotification ?? user.iospushnotification ?? user.webpushnotification;
                if (string.IsNullOrEmpty(pushToken))
                    return (false, "User has no push token");

                return await SendNotificationAsync(
                    pushToken,
                    "Payment Successful 💳",
                    $"{paymentDetails}\nAmount: ₹{amount}",
                    new Dictionary<string, string>
                    {
                        { "type", "payment_success" },
                        { "user_id", userId.ToString() },
                        { "amount", amount.ToString() }
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending payment success notification for user: {userId}");
                return (false, ex.Message);
            }
        }
    }
}


