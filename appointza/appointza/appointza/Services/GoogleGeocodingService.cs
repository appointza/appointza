using System.Text.Json;
using System.Text.Json.Serialization;

namespace appointza.Services
{
    public class GoogleGeocodingService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GoogleGeocodingService> _logger;
        private readonly string _apiKey;

        public GoogleGeocodingService(HttpClient httpClient, ILogger<GoogleGeocodingService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["GoogleMapsApiKey"] ?? "AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ";
        }

        public async Task<GeocodingResult> GeocodeAddressAsync(string address1, string address2, string pincode, string city = "", string state = "", string country = "India")
        {
            try
            {
                // Construct the full address
                var fullAddress = BuildFullAddress(address1, address2, pincode, city, state, country);
                
                // Encode the address for URL
                var encodedAddress = Uri.EscapeDataString(fullAddress);
                
                // Make the API call
                var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={encodedAddress}&key={_apiKey}";
                
                _logger.LogInformation($"Geocoding address: {fullAddress}");
                
                var response = await _httpClient.GetStringAsync(url);
                var geocodingResponse = JsonSerializer.Deserialize<GoogleGeocodingResponse>(response);
                
                if (geocodingResponse?.Status == "OK" && geocodingResponse.Results?.Count > 0)
                {
                    var result = geocodingResponse.Results[0];
                    var location = result.Geometry.Location;
                    
                    // Generate Google Maps directions link
                    var googleMapsLink = GenerateGoogleMapsLink(location.Lat, location.Lng, fullAddress);
                    
                    return new GeocodingResult
                    {
                        Success = true,
                        Latitude = location.Lat,
                        Longitude = location.Lng,
                        FormattedAddress = result.FormattedAddress,
                        GoogleMapsLink = googleMapsLink,
                        AddressComponents = result.AddressComponents
                    };
                }
                else
                {
                    _logger.LogWarning($"Geocoding failed for address: {fullAddress}. Status: {geocodingResponse?.Status}");
                    return new GeocodingResult
                    {
                        Success = false,
                        ErrorMessage = $"Geocoding failed: {geocodingResponse?.Status}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error geocoding address: {address1}, {address2}, {pincode}");
                return new GeocodingResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private string BuildFullAddress(string address1, string address2, string pincode, string city, string state, string country)
        {
            var addressParts = new List<string>();
            
            if (!string.IsNullOrWhiteSpace(address1))
                addressParts.Add(address1.Trim());
                
            if (!string.IsNullOrWhiteSpace(address2))
                addressParts.Add(address2.Trim());
                
            if (!string.IsNullOrWhiteSpace(city))
                addressParts.Add(city.Trim());
                
            if (!string.IsNullOrWhiteSpace(state))
                addressParts.Add(state.Trim());
                
            if (!string.IsNullOrWhiteSpace(pincode))
                addressParts.Add(pincode.Trim());
                
            if (!string.IsNullOrWhiteSpace(country))
                addressParts.Add(country.Trim());
            
            return string.Join(", ", addressParts);
        }

        private string GenerateGoogleMapsLink(double latitude, double longitude, string address)
        {
            // Generate a Google Maps link for directions
            var encodedAddress = Uri.EscapeDataString(address);
            return $"https://www.google.com/maps/dir/?api=1&destination={encodedAddress}&destination_place_id=&travelmode=driving";
        }

        public string GenerateGoogleMapsLink(double latitude, double longitude)
        {
            // Generate a simple Google Maps link to the location
            return $"https://www.google.com/maps?q={latitude},{longitude}";
        }
    }

    public class GeocodingResult
    {
        public bool Success { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FormattedAddress { get; set; } = "";
        public string GoogleMapsLink { get; set; } = "";
        public string ErrorMessage { get; set; } = "";
        public List<AddressComponent> AddressComponents { get; set; } = new List<AddressComponent>();
    }

    public class GoogleGeocodingResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("results")]
        public List<GeocodingResultItem> Results { get; set; } = new List<GeocodingResultItem>();
    }

    public class GeocodingResultItem
    {
        [JsonPropertyName("formatted_address")]
        public string FormattedAddress { get; set; } = "";
        
        [JsonPropertyName("geometry")]
        public Geometry Geometry { get; set; } = new Geometry();
        
        [JsonPropertyName("address_components")]
        public List<AddressComponent> AddressComponents { get; set; } = new List<AddressComponent>();
    }

    public class Geometry
    {
        [JsonPropertyName("location")]
        public Location Location { get; set; } = new Location();
    }

    public class Location
    {
        [JsonPropertyName("lat")]
        public double Lat { get; set; }
        
        [JsonPropertyName("lng")]
        public double Lng { get; set; }
    }

    public class AddressComponent
    {
        [JsonPropertyName("long_name")]
        public string LongName { get; set; } = "";
        
        [JsonPropertyName("short_name")]
        public string ShortName { get; set; } = "";
        
        [JsonPropertyName("types")]
        public List<string> Types { get; set; } = new List<string>();
    }
}
