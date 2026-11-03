using System.Globalization;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Configuration;

namespace appointza.Services
{
    /// <summary>
    /// Google Places text search + details for CRM lead discovery.
    /// Marks duplicates against existing org enquiries (place_id / business name / maps link).
    /// </summary>
    public class CrmLeadDiscoveryService
    {
        private readonly IDbProvider _dbProvider;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly EnquiryService _enquiryService;
        private readonly RequestState _requestState;
        private readonly ILogger<CrmLeadDiscoveryService> _logger;

        public CrmLeadDiscoveryService(
            IDbProvider dbProvider,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            EnquiryService enquiryService,
            RequestState requestState,
            ILogger<CrmLeadDiscoveryService> logger)
        {
            _dbProvider = dbProvider;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _enquiryService = enquiryService;
            _requestState = requestState;
            _logger = logger;
        }

        public async Task<CrmPlaceSearchRes> SearchPlaces(CrmPlaceSearchReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            var query = (req.query ?? "").Trim();
            if (query.Length < 2)
            {
                throw new Exception("Enter a search like “salon in Velachery”.");
            }

            var key = MapsKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new Exception("Google Maps API key is not configured on the server.");
            }

            var limit = Math.Clamp(req.limit <= 0 ? 20 : req.limit, 1, 40);
            var url =
                "https://maps.googleapis.com/maps/api/place/textsearch/json" +
                $"?query={Uri.EscapeDataString(query)}" +
                $"&key={Uri.EscapeDataString(key)}";

            if (req.lat.HasValue && req.lng.HasValue
                && double.IsFinite(req.lat.Value) && double.IsFinite(req.lng.Value))
            {
                var radius = Math.Clamp(req.radius_meters <= 0 ? 15000 : req.radius_meters, 1000, 50000);
                url +=
                    $"&location={req.lat.Value.ToString(CultureInfo.InvariantCulture)},{req.lng.Value.ToString(CultureInfo.InvariantCulture)}" +
                    $"&radius={radius}";
            }

            using var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync(url);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            var root = doc.RootElement;
            var status = root.TryGetProperty("status", out var st) ? st.GetString() ?? "" : "";
            if (status != "OK" && status != "ZERO_RESULTS")
            {
                var err = root.TryGetProperty("error_message", out var em) ? em.GetString() : null;
                throw new Exception(string.IsNullOrWhiteSpace(err) ? $"Google Places failed: {status}" : err!);
            }

            var draft = new List<(string placeId, string name, string address, double lat, double lng, double? rating)>();
            if (root.TryGetProperty("results", out var results) && results.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in results.EnumerateArray())
                {
                    if (draft.Count >= limit) break;
                    var placeId = item.TryGetProperty("place_id", out var pid) ? pid.GetString() ?? "" : "";
                    if (string.IsNullOrWhiteSpace(placeId)) continue;
                    double lat = 0, lng = 0;
                    if (item.TryGetProperty("geometry", out var geo) &&
                        geo.TryGetProperty("location", out var loc))
                    {
                        lat = loc.TryGetProperty("lat", out var la) ? la.GetDouble() : 0;
                        lng = loc.TryGetProperty("lng", out var ln) ? ln.GetDouble() : 0;
                    }
                    double? rating = null;
                    if (item.TryGetProperty("rating", out var rt) && rt.ValueKind == JsonValueKind.Number)
                    {
                        rating = rt.GetDouble();
                    }
                    draft.Add((
                        placeId,
                        item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                        item.TryGetProperty("formatted_address", out var a) ? a.GetString() ?? "" : "",
                        lat,
                        lng,
                        rating
                    ));
                }
            }

            var places = new List<CrmDiscoveredPlace>();
            using var gate = new SemaphoreSlim(5);
            var tasks = draft.Select(async row =>
            {
                await gate.WaitAsync();
                try
                {
                    return await EnrichPlaceAsync(client, key, row);
                }
                finally
                {
                    gate.Release();
                }
            });
            var enriched = await Task.WhenAll(tasks);
            places.AddRange(enriched.Where(p => p != null)!);

            if (req.require_phone)
            {
                places = places.Where(p => !string.IsNullOrWhiteSpace(p.phone)).ToList();
            }
            if (req.require_website)
            {
                places = places.Where(p => !string.IsNullOrWhiteSpace(p.website)).ToList();
            }

            await MarkAlreadySavedAsync(orgId, places);

            return new CrmPlaceSearchRes
            {
                places = places,
                status = status,
                next_page_token = root.TryGetProperty("next_page_token", out var npt)
                    ? npt.GetString() ?? ""
                    : "",
            };
        }

        public async Task<Enquiry> SavePlaceAsLead(CrmSavePlaceAsLeadReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            var place = req.place ?? new CrmDiscoveredPlace();
            if (string.IsNullOrWhiteSpace(place.name) && string.IsNullOrWhiteSpace(place.place_id))
            {
                throw new Exception("Place details are required.");
            }

            var duplicate = await FindDuplicateAsync(orgId, place);
            if (duplicate != null)
            {
                throw new Exception(
                    $"Already saved as lead “{duplicate.name}” (#{duplicate.id}). Duplicate companies are not allowed.");
            }

            var placeTag = string.IsNullOrWhiteSpace(place.place_id) ? "" : $"gplace:{place.place_id.Trim()}";
            var enquiry = new Enquiry
            {
                id = 0,
                organisation_id = orgId,
                name = string.IsNullOrWhiteSpace(place.name) ? "Business contact" : place.name.Trim(),
                business_name = (place.name ?? "").Trim(),
                mobile = NormalizePhone(place.phone),
                email = "",
                website = (place.website ?? "").Trim(),
                google_maps_link = string.IsNullOrWhiteSpace(place.google_maps_url)
                    ? BuildMapsUrl(place)
                    : place.google_maps_url.Trim(),
                address = (place.address ?? "").Trim(),
                source = "Google Places",
                lead_type = "Business",
                status = "new",
                tags = placeTag,
                message = $"Discovered via CRM map search. Place ID: {place.place_id}",
                is_active = true,
                notes = "",
                created_by = _requestState.usercontext?.id ?? 0,
            };

            // Split address loosely for city/area when possible.
            ApplyAddressParts(enquiry, place.address);

            return await _enquiryService.Insert(enquiry);
        }

        private async Task<CrmDiscoveredPlace> EnrichPlaceAsync(
            HttpClient client,
            string key,
            (string placeId, string name, string address, double lat, double lng, double? rating) row)
        {
            var place = new CrmDiscoveredPlace
            {
                place_id = row.placeId,
                name = row.name,
                address = row.address,
                lat = row.lat,
                lng = row.lng,
                rating = row.rating,
                google_maps_url = $"https://www.google.com/maps/place/?q=place_id:{Uri.EscapeDataString(row.placeId)}",
            };

            try
            {
                var detailUrl =
                    "https://maps.googleapis.com/maps/api/place/details/json" +
                    $"?place_id={Uri.EscapeDataString(row.placeId)}" +
                    "&fields=place_id,name,formatted_address,geometry,formatted_phone_number,international_phone_number,website,url,rating" +
                    $"&key={Uri.EscapeDataString(key)}";
                using var response = await client.GetAsync(detailUrl);
                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
                var root = doc.RootElement;
                var status = root.TryGetProperty("status", out var st) ? st.GetString() : null;
                if (status != "OK" || !root.TryGetProperty("result", out var result))
                {
                    return place;
                }

                if (result.TryGetProperty("name", out var n))
                    place.name = n.GetString() ?? place.name;
                if (result.TryGetProperty("formatted_address", out var a))
                    place.address = a.GetString() ?? place.address;
                if (result.TryGetProperty("international_phone_number", out var ip) &&
                    !string.IsNullOrWhiteSpace(ip.GetString()))
                {
                    place.phone = ip.GetString()!.Trim();
                }
                else if (result.TryGetProperty("formatted_phone_number", out var fp))
                {
                    place.phone = fp.GetString()?.Trim() ?? "";
                }
                if (result.TryGetProperty("website", out var w))
                    place.website = w.GetString()?.Trim() ?? "";
                if (result.TryGetProperty("url", out var u) && !string.IsNullOrWhiteSpace(u.GetString()))
                    place.google_maps_url = u.GetString()!.Trim();
                if (result.TryGetProperty("rating", out var rt) && rt.ValueKind == JsonValueKind.Number)
                    place.rating = rt.GetDouble();
                if (result.TryGetProperty("geometry", out var geo) &&
                    geo.TryGetProperty("location", out var loc))
                {
                    if (loc.TryGetProperty("lat", out var la)) place.lat = la.GetDouble();
                    if (loc.TryGetProperty("lng", out var ln)) place.lng = ln.GetDouble();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Place details failed for {PlaceId}", row.placeId);
            }

            return place;
        }

        private async Task MarkAlreadySavedAsync(long orgId, List<CrmDiscoveredPlace> places)
        {
            if (orgId <= 0 || places.Count == 0) return;

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            foreach (var place in places)
            {
                var dup = await FindDuplicateAsync(db, orgId, place);
                if (dup != null)
                {
                    place.already_saved = true;
                    place.saved_reason = $"Already lead #{dup.id}";
                }
            }
        }

        private async Task<Enquiry?> FindDuplicateAsync(long orgId, CrmDiscoveredPlace place)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await FindDuplicateAsync(db, orgId, place);
        }

        private async Task<Enquiry?> FindDuplicateAsync(IDb db, long orgId, CrmDiscoveredPlace place)
        {
            var placeId = (place.place_id ?? "").Trim();
            var name = (place.name ?? "").Trim().ToLowerInvariant();
            var maps = string.IsNullOrWhiteSpace(place.google_maps_url)
                ? BuildMapsUrl(place)
                : place.google_maps_url.Trim();
            var phoneDigits = DigitsOnly(place.phone);

            var sql = @"
                SELECT id, name, business_name, mobile, google_maps_link, tags
                FROM enquiries
                WHERE organisation_id = @organisation_id
                  AND COALESCE(is_active, TRUE) = TRUE
                  AND (
                        (@place_tag <> '' AND COALESCE(tags, '') ILIKE '%' || @place_tag || '%')
                     OR (@maps <> '' AND COALESCE(google_maps_link, '') = @maps)
                     OR (
                          @name <> ''
                          AND lower(btrim(COALESCE(business_name, ''))) = @name
                        )
                     OR (
                          @phone_digits <> ''
                          AND length(@phone_digits) >= 8
                          AND regexp_replace(COALESCE(mobile, ''), '[^0-9]', '', 'g') LIKE '%' || @phone_digits
                        )
                  )
                ORDER BY id DESC
                LIMIT 1;";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "place_tag", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(placeId) ? "" : $"gplace:{placeId}";
            db.AddParameter(command, "maps", DbTypes.Types.String).Value = maps ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = name;
            db.AddParameter(command, "phone_digits", DbTypes.Types.String).Value =
                phoneDigits.Length >= 10 ? phoneDigits[^10..] : phoneDigits;

            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;

            return new Enquiry
            {
                id = Convert.ToInt64(reader["id"]),
                name = reader["name"]?.ToString() ?? "",
                business_name = reader["business_name"]?.ToString() ?? "",
                mobile = reader["mobile"]?.ToString() ?? "",
                google_maps_link = reader["google_maps_link"]?.ToString() ?? "",
                tags = reader["tags"]?.ToString() ?? "",
                organisation_id = orgId,
            };
        }

        private long ResolveOrganisationId(long? requested)
        {
            var jwtOrg = _requestState.usercontext?.organisationid ?? 0;
            if (requested.HasValue && requested.Value > 0)
            {
                if (jwtOrg > 0 && requested.Value != jwtOrg)
                {
                    throw new UnauthorizedAccessException("Cross-organisation access is not allowed.");
                }
                return requested.Value;
            }
            if (jwtOrg <= 0) throw new Exception("Organisation is required.");
            return jwtOrg;
        }

        private string MapsKey()
        {
            return (
                _configuration["GoogleMapsApiKey"]
                ?? _configuration["ApplicationSettings:GoogleMapsApiKey"]
                ?? _configuration["Napz:GoogleMapsApiKey"]
                ?? ""
            ).Trim();
        }

        private static string BuildMapsUrl(CrmDiscoveredPlace place)
        {
            if (!string.IsNullOrWhiteSpace(place.place_id))
            {
                return $"https://www.google.com/maps/place/?q=place_id:{place.place_id.Trim()}";
            }
            if (double.IsFinite(place.lat) && double.IsFinite(place.lng) && (place.lat != 0 || place.lng != 0))
            {
                return $"https://www.google.com/maps?q={place.lat.ToString(CultureInfo.InvariantCulture)},{place.lng.ToString(CultureInfo.InvariantCulture)}";
            }
            return "";
        }

        private static string NormalizePhone(string? phone)
        {
            var raw = (phone ?? "").Trim();
            if (string.IsNullOrWhiteSpace(raw)) return "";
            return raw;
        }

        private static string DigitsOnly(string? value) =>
            new string((value ?? "").Where(char.IsDigit).ToArray());

        private static void ApplyAddressParts(Enquiry enquiry, string? address)
        {
            var parts = (address ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length >= 2)
            {
                enquiry.area = parts[0];
                enquiry.city = parts.Length >= 3 ? parts[^3] : parts[^2];
                enquiry.state = parts.Length >= 2 ? parts[^2] : "";
            }
        }
    }
}
