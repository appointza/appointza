using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    /// <summary>Server-side Google Places / Geocode / Routes / Gemini for Napz (keys stay off the device).</summary>
    public class NapzGoogleProxyService
    {
        readonly IHttpClientFactory httpClientFactory;
        readonly IConfiguration configuration;
        readonly ILogger<NapzGoogleProxyService> logger;

        static readonly string RoutesFieldMask = string.Join(",", new[]
        {
            "routes.duration", "routes.staticDuration", "routes.distanceMeters", "routes.description",
            "routes.warnings", "routes.routeLabels", "routes.polyline.encodedPolyline", "routes.viewport",
            "routes.localizedValues", "routes.travelAdvisory", "routes.travelAdvisory.transitFare",
            "routes.legs.distanceMeters", "routes.legs.duration", "routes.legs.staticDuration",
            "routes.legs.startLocation", "routes.legs.endLocation", "routes.legs.polyline.encodedPolyline",
            "routes.legs.localizedValues", "routes.legs.travelAdvisory", "routes.legs.stepsOverview",
            "routes.legs.steps.distanceMeters", "routes.legs.steps.staticDuration",
            "routes.legs.steps.polyline.encodedPolyline", "routes.legs.steps.startLocation",
            "routes.legs.steps.endLocation", "routes.legs.steps.navigationInstruction",
            "routes.legs.steps.travelMode", "routes.legs.steps.transitDetails",
            "routes.legs.steps.transitDetails.stopDetails", "routes.legs.steps.transitDetails.localizedValues",
            "routes.legs.steps.transitDetails.headsign", "routes.legs.steps.transitDetails.stopCount",
            "routes.legs.steps.transitDetails.transitLine",
        });

        public NapzGoogleProxyService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<NapzGoogleProxyService> logger)
        {
            this.httpClientFactory = httpClientFactory;
            this.configuration = configuration;
            this.logger = logger;
        }

        string MapsKey()
        {
            return (
                configuration["Napz:GoogleMapsApiKey"]
                ?? configuration["GoogleMapsApiKey"]
                ?? configuration["ApplicationSettings:GoogleMapsApiKey"]
                ?? ""
            ).Trim();
        }

        string RoutesKey()
        {
            var key = (
                configuration["Napz:GoogleRoutesApiKey"]
                ?? configuration["GOOGLE_ROUTES_API_KEY"]
                ?? MapsKey()
            ).Trim();
            return key;
        }

        string GeminiKey()
        {
            return (configuration["Napz:GeminiApiKey"] ?? configuration["GEMINI_API_KEY"] ?? "").Trim();
        }

        public async Task<List<NapzPlaceSearchHit>> SearchPlaces(NapzPlaceSearchReq req)
        {
            var key = MapsKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Google Maps API key is not configured on the server.");
            }

            var query = (req.query ?? "").Trim();
            if (query.Length < 2)
            {
                return new List<NapzPlaceSearchHit>();
            }

            var url =
                $"https://maps.googleapis.com/maps/api/place/textsearch/json?query={Uri.EscapeDataString(query)}&key={Uri.EscapeDataString(key)}";
            if (req.lat.HasValue && req.lng.HasValue
                && double.IsFinite(req.lat.Value) && double.IsFinite(req.lng.Value))
            {
                url += $"&location={req.lat.Value},{req.lng.Value}&radius=50000";
            }

            using var client = httpClientFactory.CreateClient();
            using var response = await client.GetAsync(url);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            var root = doc.RootElement;
            var status = root.TryGetProperty("status", out var st) ? st.GetString() : null;
            if (status != "OK" && status != "ZERO_RESULTS")
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, status ?? "GOOGLE_PLACES_FAILED");
            }

            var hits = new List<NapzPlaceSearchHit>();
            if (!root.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
            {
                return hits;
            }

            var index = 0;
            foreach (var item in results.EnumerateArray())
            {
                var lat = item.GetProperty("geometry").GetProperty("location").GetProperty("lat").GetDouble();
                var lng = item.GetProperty("geometry").GetProperty("location").GetProperty("lng").GetDouble();
                var name = item.TryGetProperty("name", out var n) ? n.GetString() : null;
                var address = item.TryGetProperty("formatted_address", out var a) ? a.GetString() : null;
                var display = string.Join(", ", new[] { name, address }.Where(s => !string.IsNullOrWhiteSpace(s)));
                hits.Add(new NapzPlaceSearchHit
                {
                    display_name = string.IsNullOrWhiteSpace(display) ? query : display!,
                    lat = lat.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    lon = lng.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    type = "google_place",
                    importance = 1 - index * 0.05,
                });
                index++;
            }
            return hits;
        }

        public async Task<NapzReverseGeocodeRes> ReverseGeocode(NapzReverseGeocodeReq req)
        {
            var key = MapsKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                return new NapzReverseGeocodeRes
                {
                    display_name = $"{req.lat:0.0000}, {req.lng:0.0000}",
                };
            }

            var url =
                $"https://maps.googleapis.com/maps/api/geocode/json?latlng={req.lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{req.lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}&key={Uri.EscapeDataString(key)}";
            using var client = httpClientFactory.CreateClient();
            using var response = await client.GetAsync(url);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            var root = doc.RootElement;
            string? formatted = null;
            if (root.TryGetProperty("results", out var results)
                && results.ValueKind == JsonValueKind.Array
                && results.GetArrayLength() > 0)
            {
                formatted = results[0].TryGetProperty("formatted_address", out var fa) ? fa.GetString() : null;
            }
            return new NapzReverseGeocodeRes
            {
                display_name = string.IsNullOrWhiteSpace(formatted)
                    ? $"{req.lat:0.0000}, {req.lng:0.0000}"
                    : formatted!,
            };
        }

        public async Task<object> EstimateJourney(NapzJourneyEstimateReq req)
        {
            var key = RoutesKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                return new { configured = false };
            }

            if (!IsCoord(req.origin) || !IsCoord(req.destination))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "origin and destination lat/lng are required.");
            }

            var origin = new { latitude = req.origin.lat, longitude = req.origin.lng };
            var destination = new { latitude = req.destination.lat, longitude = req.destination.lng };

            var transit = await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, "TRANSIT", new Dictionary<string, object?>
            {
                ["computeAlternativeRoutes"] = true,
                ["departureTime"] = DateTime.UtcNow.ToString("o"),
                ["transitPreferences"] = new Dictionary<string, object?>
                {
                    ["routingPreference"] = "LESS_WALKING",
                    ["allowedTravelModes"] = new[] { "BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL" },
                },
            });
            var drive = await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, "DRIVE", new Dictionary<string, object?>
            {
                ["routingPreference"] = "TRAFFIC_AWARE",
                ["extraComputations"] = new[] { "TOLLS", "HTML_FORMATTED_NAVIGATION_INSTRUCTIONS" },
                ["computeAlternativeRoutes"] = true,
            });
            var twoWheeler = await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, "TWO_WHEELER", null);
            var walk = await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, "WALK", new Dictionary<string, object?>
            {
                ["extraComputations"] = new[] { "HTML_FORMATTED_NAVIGATION_INSTRUCTIONS" },
            });
            var bicycle = await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, "BICYCLE", new Dictionary<string, object?>
            {
                ["extraComputations"] = new[] { "HTML_FORMATTED_NAVIGATION_INSTRUCTIONS" },
            });

            object directionsTransit;
            try
            {
                var qs = new StringBuilder()
                    .Append("origin=").Append(Uri.EscapeDataString($"{req.origin.lat},{req.origin.lng}"))
                    .Append("&destination=").Append(Uri.EscapeDataString($"{req.destination.lat},{req.destination.lng}"))
                    .Append("&mode=transit&alternatives=true&region=in&language=en")
                    .Append("&departure_time=").Append(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                    .Append("&key=").Append(Uri.EscapeDataString(key));
                using var client = httpClientFactory.CreateClient();
                using var response = await client.GetAsync($"https://maps.googleapis.com/maps/api/directions/json?{qs}");
                var json = await response.Content.ReadAsStringAsync();
                directionsTransit = JsonSerializer.Deserialize<object>(string.IsNullOrWhiteSpace(json) ? "{}" : json) ?? new { };
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Directions transit fallback failed");
                directionsTransit = new { status = "UNKNOWN_ERROR", routes = Array.Empty<object>() };
            }

            return new
            {
                configured = true,
                transit,
                drive,
                twoWheeler,
                walk,
                bicycle,
                directionsTransit,
            };
        }

        public async Task<object> ComputeDriveRoute(NapzJourneyEstimateReq req, string travelMode)
        {
            var key = RoutesKey();
            if (string.IsNullOrWhiteSpace(key) || !IsCoord(req.origin) || !IsCoord(req.destination))
            {
                return new { routes = Array.Empty<object>() };
            }
            var mode = string.Equals(travelMode, "TWO_WHEELER", StringComparison.OrdinalIgnoreCase)
                ? "TWO_WHEELER"
                : "DRIVE";
            var origin = new { latitude = req.origin.lat, longitude = req.origin.lng };
            var destination = new { latitude = req.destination.lat, longitude = req.destination.lng };
            return await ComputeRoutes(key, origin, destination, req.origin.address, req.destination.address, mode, new Dictionary<string, object?>
            {
                ["routingPreference"] = "TRAFFIC_AWARE",
            });
        }

        public async Task<NapzNarrateRes> NarrateTrip(NapzNarrateReq req)
        {
            var key = GeminiKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                return new NapzNarrateRes { descriptions = null, reason = "no_key" };
            }

            var stops = (req.stops ?? new List<NapzNarrateStop>()).Take(60).ToList();
            if (stops.Count == 0)
            {
                return new NapzNarrateRes { descriptions = null, reason = "empty" };
            }

            var lang = string.Equals(req.lang, "ta", StringComparison.OrdinalIgnoreCase) ? "Tamil" : "English";
            var prompt = string.Join("\n", new[]
            {
                $"Write one short sentence in {lang} for each stop.",
                "Use only the town names and place names already in each stop name.",
                "Never invent a town, restaurant, hotel, or attraction.",
                "Return a JSON object whose keys are the stop ids and whose values are the sentences.",
                "Keep each sentence under 180 characters.",
                JsonSerializer.Serialize(stops.Select(s => new { s.id, s.name, s.kind, s.tip })),
            });

            using var client = httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
            request.Headers.TryAddWithoutValidation("x-goog-api-key", key);
            request.Content = new StringContent(JsonSerializer.Serialize(new
            {
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = prompt } } },
                },
                generationConfig = new { temperature = 0.4, responseMimeType = "application/json" },
            }), Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return new NapzNarrateRes { descriptions = null, reason = "upstream" };
            }

            var json = await response.Content.ReadAsStringAsync();
            try
            {
                using var doc = JsonDocument.Parse(json);
                var text = "";
                if (doc.RootElement.TryGetProperty("candidates", out var candidates)
                    && candidates.GetArrayLength() > 0
                    && candidates[0].TryGetProperty("content", out var content)
                    && content.TryGetProperty("parts", out var parts))
                {
                    foreach (var part in parts.EnumerateArray())
                    {
                        if (part.TryGetProperty("text", out var t)) text += t.GetString();
                    }
                }
                var trimmed = text.Trim();
                if (trimmed.StartsWith("```"))
                {
                    trimmed = trimmed.Replace("```json", "", StringComparison.OrdinalIgnoreCase).Replace("```", "").Trim();
                }
                var map = JsonSerializer.Deserialize<Dictionary<string, string>>(trimmed) ?? new();
                var cleaned = map
                    .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                    .ToDictionary(kv => kv.Key, kv => kv.Value.Trim().Length > 180 ? kv.Value.Trim()[..180] : kv.Value.Trim());
                return cleaned.Count == 0
                    ? new NapzNarrateRes { descriptions = null, reason = "parse" }
                    : new NapzNarrateRes { descriptions = cleaned, reason = "ok" };
            }
            catch
            {
                return new NapzNarrateRes { descriptions = null, reason = "parse" };
            }
        }

        static bool IsCoord(NapzLatLngAddress? value)
        {
            return value != null
                && double.IsFinite(value.lat) && double.IsFinite(value.lng)
                && value.lat is >= -90 and <= 90
                && value.lng is >= -180 and <= 180;
        }

        async Task<object> ComputeRoutes(
            string key,
            object origin,
            object destination,
            string? originAddress,
            string? destinationAddress,
            string travelMode,
            Dictionary<string, object?>? extra)
        {
            async Task<object> Post(object originWp, object destinationWp)
            {
                var body = new Dictionary<string, object?>
                {
                    ["origin"] = originWp,
                    ["destination"] = destinationWp,
                    ["travelMode"] = travelMode,
                    ["languageCode"] = "en-IN",
                    ["regionCode"] = "IN",
                    ["units"] = "METRIC",
                };
                if (extra != null)
                {
                    foreach (var kv in extra) body[kv.Key] = kv.Value;
                }

                using var client = httpClientFactory.CreateClient();
                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    "https://routes.googleapis.com/directions/v2:computeRoutes");
                request.Headers.TryAddWithoutValidation("X-Goog-Api-Key", key);
                request.Headers.TryAddWithoutValidation("X-Goog-FieldMask", RoutesFieldMask);
                request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
                request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                using var response = await client.SendAsync(request);
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<object>(string.IsNullOrWhiteSpace(json) ? "{}" : json) ?? new { };
            }

            object Waypoint(object coord, string? address)
            {
                var trimmed = address?.Trim();
                if (!string.IsNullOrWhiteSpace(trimmed) && !string.Equals(trimmed, "current location", StringComparison.OrdinalIgnoreCase))
                {
                    return new { address = trimmed };
                }
                return new { location = new { latLng = coord } };
            }

            var data = await Post(Waypoint(origin, originAddress), Waypoint(destination, destinationAddress));
            // Fallback to pure lat/lng if address waypoint failed.
            if (data is JsonElement el
                && (el.TryGetProperty("error", out _)
                    || !el.TryGetProperty("routes", out var routes)
                    || routes.GetArrayLength() == 0))
            {
                data = await Post(
                    new { location = new { latLng = origin } },
                    new { location = new { latLng = destination } });
            }
            return data;
        }
    }
}
