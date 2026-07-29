using Microsoft.AspNetCore.Mvc;
using appointza.Services;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GeocodingController : ControllerBase
    {
        private readonly GoogleGeocodingService _geocodingService;
        private readonly ILogger<GeocodingController> _logger;

        public GeocodingController(GoogleGeocodingService geocodingService, ILogger<GeocodingController> logger)
        {
            _geocodingService = geocodingService;
            _logger = logger;
        }

        [HttpPost("geocode")]
        public async Task<IActionResult> GeocodeAddress([FromBody] GeocodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Address1) && string.IsNullOrWhiteSpace(request.Pincode))
                {
                    return BadRequest(new { error = "Address1 or Pincode is required" });
                }

                var result = await _geocodingService.GeocodeAddressAsync(
                    request.Address1 ?? "",
                    request.Address2 ?? "",
                    request.Pincode ?? "",
                    request.City ?? "",
                    request.State ?? "",
                    request.Country ?? "India"
                );

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        latitude = result.Latitude,
                        longitude = result.Longitude,
                        formattedAddress = result.FormattedAddress,
                        googleMapsLink = result.GoogleMapsLink,
                        addressComponents = result.AddressComponents
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = result.ErrorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in geocoding API");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("test")]
        public async Task<IActionResult> TestGeocoding()
        {
            try
            {
                // Test with a sample address
                var result = await _geocodingService.GeocodeAddressAsync(
                    "123 Main Street",
                    "Apt 4B",
                    "10001",
                    "New York",
                    "NY",
                    "USA"
                );

                return Ok(new
                {
                    success = result.Success,
                    latitude = result.Latitude,
                    longitude = result.Longitude,
                    formattedAddress = result.FormattedAddress,
                    googleMapsLink = result.GoogleMapsLink,
                    error = result.ErrorMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in test geocoding API");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class GeocodeRequest
    {
        public string? Address1 { get; set; }
        public string? Address2 { get; set; }
        public string? Pincode { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
    }
}
