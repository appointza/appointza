using appointza.Models;
using appointza.Services;
using appointza.Utils;
using System.Linq;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using static System.Net.WebRequestMethods;
using Microsoft.Extensions.Configuration;

namespace appointza.Razorpay
{
    public class RazorpayService
    {
        ApplicationSettingsService applicationsettingsservice;
        CustomCryptography customcryptography;
        IConfiguration configuration;
        bool isinitialized = false;
        string appkey;
        string appsecret;
        string baseurl;
        string orderendpoint = "orders";

        // Public method to get the Razorpay key (for frontend use)
        public async Task<string> GetRazorpayKey()
        {
            if (!this.isinitialized)
            {
                await this.Initialize();
            }
            return appkey;
        }

        // Public method to get the Razorpay secret (for signature verification)
        public async Task<string> GetRazorpaySecret()
        {
            if (!this.isinitialized)
            {
                await this.Initialize();
            }
            return appsecret;
        }

        // Fetch payment details from Razorpay
        public async Task<JsonElement> FetchPayment(string paymentId)
        {
            var client = await GetHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, $"payments/{paymentId}");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return JsonSerializer.Deserialize<JsonElement>(responseContentText);
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, $"Failed to fetch payment details: {responseContentText}");
            }
        }

        public RazorpayService(ApplicationSettingsService applicationsettingsservice, CustomCryptography customcryptography, IConfiguration configuration)
        {
            this.applicationsettingsservice = applicationsettingsservice;
            this.customcryptography = customcryptography;
            this.configuration = configuration;
        }
        public async Task Initialize()
        {
            var settings = (await this.applicationsettingsservice.Select(new Models.ApplicationSettingsSelectReq { })).First();
            baseurl = settings.settings.paymentsettings.razorpayconfig.produrl;
            appkey = settings.settings.paymentsettings.razorpayconfig.appkey;
            appsecret = settings.settings.paymentsettings.razorpayconfig.appsecret;
            
            // Validate and set default if empty
            if (string.IsNullOrEmpty(baseurl))
            {
                // Default Razorpay API URL
                baseurl = "https://api.razorpay.com/v1/";
            }
            else if (!baseurl.EndsWith("/"))
            {
                baseurl = baseurl + "/";
            }
            
            // Validate credentials are loaded from appsettings.json
            if (string.IsNullOrEmpty(appkey))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay App Key (key_id) is not configured in appsettings.json. " +
                    "Please add it under ApplicationSettings.razorpay.key_id");
            }
            
            if (string.IsNullOrEmpty(appsecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay App Secret (key_secret) is not configured in appsettings.json. " +
                    "Please add it under ApplicationSettings.razorpay.key_secret");
            }
            
            isinitialized = true;
        }
        public async Task<HttpClient> GetHttpClient()
        {
            if(!this.isinitialized)
            {
                await this.Initialize();
            }
            
            // Safety check - should not happen if Initialize() worked correctly
            if (string.IsNullOrEmpty(baseurl))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Razorpay base URL is not configured. Please configure it in Application Settings.");
            }

            // Validate credentials before creating client
            if (string.IsNullOrEmpty(appkey) || string.IsNullOrEmpty(appsecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Razorpay credentials (appkey or appsecret) are missing. Please check appsettings.json under ApplicationSettings.razorpay");
            }
            
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseurl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Create Basic Auth token: base64(key_id:key_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var credentials = $"{appkey}:{appsecret}";
            var credentialsBytes = Encoding.ASCII.GetBytes(credentials);
            var token = Convert.ToBase64String(credentialsBytes);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            
            return client;
        }
        public async Task<RazorpayOrder> CreateOrder(RazorpayOrderReq req)
        {
            var result = new RazorpayOrder();
            var client = await GetHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, orderendpoint);
            request.Content = new StringContent(JsonSerializer.Serialize(req),
                                 Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);
                
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }

        /// <summary>
        /// Create an order on the Appointza platform Razorpay account
        /// (ApplicationSettings:razorpay:key_id / key_secret in appsettings.json).
        /// </summary>
        public async Task<RazorpayOrder> CreatePlatformOrder(RazorpayOrderReq req)
        {
            var client = GetHttpClientFromAppSettings();
            var request = new HttpRequestMessage(HttpMethod.Post, orderendpoint);
            request.Content = new StringContent(
                JsonSerializer.Serialize(req), Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return JsonSerializer.Deserialize<RazorpayOrder>(responseContentText)
                    ?? throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, "Empty Razorpay order response.");
            }

            throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
        }

        public string GetPlatformKeyId()
        {
            var keyId = configuration["ApplicationSettings:razorpay:key_id"];
            if (string.IsNullOrWhiteSpace(keyId))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Razorpay key_id is not configured in appsettings.json (ApplicationSettings:razorpay:key_id).");
            }
            return keyId;
        }

        public string GetPlatformKeySecret()
        {
            var keySecret = configuration["ApplicationSettings:razorpay:key_secret"];
            if (string.IsNullOrWhiteSpace(keySecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Razorpay key_secret is not configured in appsettings.json (ApplicationSettings:razorpay:key_secret).");
            }
            return keySecret;
        }

        /// <summary>Verify Razorpay checkout signature for platform (appointza) payments.</summary>
        public bool VerifyPlatformPaymentSignature(
            string razorpayOrderId,
            string razorpayPaymentId,
            string razorpaySignature)
        {
            if (string.IsNullOrWhiteSpace(razorpayOrderId)
                || string.IsNullOrWhiteSpace(razorpayPaymentId)
                || string.IsNullOrWhiteSpace(razorpaySignature))
            {
                return false;
            }

            string payload = $"{razorpayOrderId}|{razorpayPaymentId}";
            string secret = GetPlatformKeySecret();
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secret));
            byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            string generated = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            return string.Equals(generated, razorpaySignature.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        public HttpClient GetPlatformHttpClient() => GetHttpClientFromAppSettings();
        public async Task<RazorpayOrder> FetchOrder(string orderid)
        {
            var result = new RazorpayOrder();
            var client = await GetHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, $"{orderendpoint}/{orderid}");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);

            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }

        private HttpClient GetHttpClientFromAppSettings()
        {
            // Get credentials directly from appsettings.json
            var keyId = configuration["ApplicationSettings:razorpay:key_id"];
            var keySecret = configuration["ApplicationSettings:razorpay:key_secret"];
            
            if (string.IsNullOrEmpty(keyId) || string.IsNullOrEmpty(keySecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay credentials are missing in appsettings.json. Please configure ApplicationSettings:razorpay:key_id and ApplicationSettings:razorpay:key_secret");
            }
            
            var baseUrl = "https://api.razorpay.com/v1/";
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Create Basic Auth token: base64(key_id:key_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var credentials = $"{keyId}:{keySecret}";
            var credentialsBytes = Encoding.ASCII.GetBytes(credentials);
            var token = Convert.ToBase64String(credentialsBytes);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            
            return client;
        }

        public async Task<RazorpayContactRes> CreateContact(RazorpayContactReq req)
        {
            var result = new RazorpayContactRes();
            var client = GetHttpClientFromAppSettings();
            var request = new HttpRequestMessage(HttpMethod.Post, "contacts");
            
            var options = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
            request.Content = new StringContent(JsonSerializer.Serialize(req, options), Encoding.UTF8, "application/json");
            
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result = JsonSerializer.Deserialize<RazorpayContactRes>(responseContentText);
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }
    }
}
