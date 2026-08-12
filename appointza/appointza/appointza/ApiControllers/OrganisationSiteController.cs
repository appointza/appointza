using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Services;
using appointza.Utils;
using System.Text.RegularExpressions;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationSiteController : ControllerBase
    {
        ILogger<OrganisationSiteController> logger;
        OrganisationSiteService organisationsiteService;
        OrganisationService organisationService;
        OrganisationLocationService organisationLocationService;
        ReferenceValueService referenceValueService;
        EventService eventService;
        
        public OrganisationSiteController(
            ILogger<OrganisationSiteController> logger,
            OrganisationSiteService organisationsiteService,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            ReferenceValueService referenceValueService,
            EventService eventService)
        {
            this.logger = logger;
            this.organisationsiteService = organisationsiteService;
            this.organisationService = organisationService;
            this.organisationLocationService = organisationLocationService;
            this.referenceValueService = referenceValueService;
            this.eventService = eventService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Entity()
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>()
            {
               item = new OrganisationSite()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationSite>>>> Select(ActionReq<OrganisationSiteSelectReq> req)
        {
            ActionRes<List<OrganisationSite>> result = new ActionRes<List<OrganisationSite>>();

            result.item = await organisationsiteService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Insert(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            result.item = await organisationsiteService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Update(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            result.item = await organisationsiteService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Save(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            if(req.item.id > 0){
                result.item = await organisationsiteService.Update(req.item);
            }else{
                result.item = await organisationsiteService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationSiteDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationsiteService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("GetSiteDetails")]
        public async Task<ActionResult<ActionRes<List<Sitedetails>>>> GetSiteDetails(ActionReq<long> req)
        {
            ActionRes<List<Sitedetails>> result = new ActionRes<List<Sitedetails>>();

            result.item = await organisationsiteService.GetSiteDetails(req.item);

            return Ok(result);
        }

        [HttpGet("GetSiteDetailsByOrgLocTempId/{orgloctempid}")]
        public async Task<ActionResult<ActionRes<List<Sitedetails>>>> GetSiteDetailsByOrgLocTempId(string orgloctempid)
        {
            try
            {
                var locationId = await organisationLocationService.GetLocationIdByOrgLocTempId(orgloctempid);
                if (locationId <= 0)
                {
                    return NotFound("Location not found");
                }

                var result = new ActionRes<List<Sitedetails>>
                {
                    item = await organisationsiteService.GetSiteDetails(locationId)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting site details by orgloctempid: {OrgLocTempId}", orgloctempid);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("ResolveTemplateBySubdomain")]
        public async Task<ActionResult<ActionRes<OrganisationTemplateResolveRes>>> ResolveTemplateBySubdomain(
            ActionReq<OrganisationTemplateResolveReq> req)
        {
            ActionRes<OrganisationTemplateResolveRes> result = new ActionRes<OrganisationTemplateResolveRes>();

            if (req?.item == null)
            {
                return BadRequest("Missing request payload.");
            }

            var customUrl = (req.item.customUrl ?? "").Trim();
            if (string.IsNullOrEmpty(customUrl))
            {
                return BadRequest("customUrl is required.");
            }

            var organisationDetail = await organisationService.GetOrganisationByCustomUrl(customUrl);

            if (organisationDetail == null || organisationDetail.organisationlocationid <= 0)
            {
                result.item = null;
                return Ok(result);
            }

            var siteDetails = await organisationsiteService.GetSiteDetails(organisationDetail.organisationlocationid);
            if (siteDetails == null || siteDetails.Count == 0)
            {
                result.item = null;
                return Ok(result);
            }

            var siteDetail = siteDetails[0];

            var templateHtml = siteDetail.template_html ?? "";
            if (string.IsNullOrWhiteSpace(templateHtml) && siteDetail.locationdetail?.templateid > 0)
            {
                var templateId = siteDetail.locationdetail.templateid;
                var templateItems = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    id = templateId,
                    referencetypeid = 0,
                    organisationid = 0,
                    parentid = 0
                });

                if (templateItems != null && templateItems.Count > 0)
                {
                    templateHtml = templateItems[0].description ?? "";
                }
            }

            if (string.IsNullOrWhiteSpace(templateHtml))
            {
                result.item = new OrganisationTemplateResolveRes
                {
                    organisationid = organisationDetail.organisationid,
                    organisationlocationid = organisationDetail.organisationlocationid,
                    html = ""
                };
                return Ok(result);
            }

            var apiBaseUrl = $"{Request.Scheme}://{Request.Host}";
            var frontendBaseUrl = Request.Headers["Origin"].FirstOrDefault() ?? apiBaseUrl;
            var events = await eventService.Select(new EventSelectReq
            {
                organisation_id = (int)organisationDetail.organisationid,
                organisation_location_id = (int)organisationDetail.organisationlocationid,
                is_public = true
            });

            var facilities = await ResolveFacilities(siteDetail);

            var boundHtml = BindTemplate(templateHtml, siteDetail, organisationDetail, apiBaseUrl, frontendBaseUrl, events, facilities);

            result.item = new OrganisationTemplateResolveRes
            {
                organisationid = organisationDetail.organisationid,
                organisationlocationid = organisationDetail.organisationlocationid,
                html = boundHtml
            };

            return Ok(result);
        }

        private static string BindTemplate(
            string templateHtml,
            Sitedetails siteDetail,
            OrganisationDetail organisationDetail,
            string apiBaseUrl,
            string frontendBaseUrl,
            IList<Event> events,
            IList<string> facilities)
        {
            var html = templateHtml ?? "";

            html = html.Replace("{{environment.baseurl}}", apiBaseUrl);

            var organisationName = siteDetail.organisationdetail?.name ?? organisationDetail?.organisationname ?? "";
            var organisationTagline = siteDetail.organisationdetail?.tagline ?? organisationDetail?.organisationtagline ?? "";
            var organisationLogo = siteDetail.organisationdetail?.organisationlogo ?? organisationDetail?.organisationlogo ?? 0;
            var organisationNotes = siteDetail.organisationdetail?.notes ?? organisationDetail?.organisationnotes ?? "";

            var address1 = siteDetail.locationdetail?.addressline1 ?? organisationDetail?.organisationlocationaddressline1 ?? "";
            var address2 = siteDetail.locationdetail?.addressline2 ?? organisationDetail?.organisationlocationaddressline2 ?? "";
            var city = siteDetail.locationdetail?.city ?? organisationDetail?.organisationlocationcity ?? "";
            var state = siteDetail.locationdetail?.state ?? organisationDetail?.organisationlocationstate ?? "";
            var pincode = siteDetail.locationdetail?.pincode ?? organisationDetail?.organisationlocationpincode ?? "";
            var country = siteDetail.locationdetail?.country ?? organisationDetail?.organisationlocationcountry ?? "";
            var googleLocation = siteDetail.locationdetail?.googlelocation ?? organisationDetail?.organisationlocationgooglelocation ?? "";

            html = html.Replace("{{organisationdetail.name}}", organisationName);
            html = html.Replace("{{organisationdetail.tagline}}", organisationTagline);
            html = html.Replace("{{organisationdetail.organisationlogo}}", organisationLogo.ToString());
            var organisationLogoUrl = organisationLogo > 0
                ? $"{apiBaseUrl}/api/Files/Get?id={organisationLogo}"
                : "";
            html = html.Replace("{{ORGANISATION_LOGO_URL}}", organisationLogoUrl);
            html = html.Replace("{{organisationdetail.notes}}", organisationNotes);
            html = html.Replace("{{organisation.notes}}", organisationNotes);
            html = html.Replace("{{OrganisationNotes}}", organisationNotes);
            var mobile = siteDetail.locationdetail?.whatsapp_mobile ?? "";
            var latitude = siteDetail.locationdetail?.latitude.ToString() ?? "";
            var longitude = siteDetail.locationdetail?.longitude.ToString() ?? "";

            html = html.Replace("{{locationdetail.addressline1}}", address1);
            html = html.Replace("{{locationdetail.addressline2}}", address2);
            html = html.Replace("{{locationdetail.city}}", city);
            html = html.Replace("{{locationdetail.state}}", state);
            html = html.Replace("{{locationdetail.pincode}}", pincode);
            html = html.Replace("{{locationdetail.country}}", country);
            html = html.Replace("{{locationdetail.googlelocation}}", googleLocation);
            html = html.Replace("{{locationdetail.mobile}}", mobile);
            html = html.Replace("{{locationdetail.latitude}}", latitude);
            html = html.Replace("{{locationdetail.longitude}}", longitude);
            html = html.Replace("{{BOOKNOWURL}}", $"{frontendBaseUrl}/book-appointment/{organisationDetail?.organisationid ?? 0}/{organisationDetail?.organisationlocationid ?? 0}");
            html = html.Replace("{{currentyear}}", DateTime.Now.Year.ToString());
            html = html.Replace("{{organizationemail}}", "");

            // Conditional sections — render inner content only when data exists
            html = ApplyConditionalSection(html, "{{#addressline2}}", "{{/addressline2}}", !string.IsNullOrWhiteSpace(address2));
            html = ApplyConditionalSection(html, "{{#country}}", "{{/country}}", !string.IsNullOrWhiteSpace(country));
            html = ApplyConditionalSection(html, "{{#googlemaps}}", "{{/googlemaps}}", !string.IsNullOrWhiteSpace(googleLocation));
            html = ApplyConditionalSection(html, "{{#coordinates}}", "{{/coordinates}}", siteDetail.locationdetail?.latitude != 0 || siteDetail.locationdetail?.longitude != 0);
            html = html.Replace("{{#customurl}}", "").Replace("{{/customurl}}", "");
            html = html.Replace("{{#gstnumber}}", "").Replace("{{/gstnumber}}", "");

            // Organization logo conditional section
            html = ApplyConditionalSection(html, "{{#organizationlogo}}", "{{/organizationlogo}}", organisationLogo > 0);

            // Location videos ({{#locationvideos}}...{{/locationvideos}})
            var locationVideos = (siteDetail.locationdetail?.attributes?.video_urls ?? new List<string>())
                .Where(url => !string.IsNullOrWhiteSpace(BuildVideoEmbedUrl(url)))
                .Take(12)
                .ToList();
            html = ApplyLoopSection(
                html,
                "{{#locationvideos}}",
                "{{/locationvideos}}",
                locationVideos,
                (loop, videoUrl) => loop
                    .Replace("{{LOCATION_VIDEO_EMBED_URL}}", BuildVideoEmbedUrl(videoUrl))
                    .Replace("{{LOCATION_VIDEO_URL}}", videoUrl)
                    .Replace("{{location_video_url}}", videoUrl));

            // Location images ({{#locationimages}}...{{/locationimages}})
            var locationImages = siteDetail.locationdetail?.images ?? new List<long>();
            html = ApplyLoopSection(
                html,
                "{{#locationimages}}",
                "{{/locationimages}}",
                locationImages,
                (loop, imageId) =>
                {
                    var id = imageId;
                    var imageUrl = id > 0 ? $"{apiBaseUrl}/api/Files/Get?id={id}" : "";
                    return loop
                        .Replace("/api/Files/Get?id={{location_image_id}}", imageUrl)
                        .Replace("{{LOCATION_IMAGE_URL}}", imageUrl)
                        .Replace("{{location_image_id}}", id > 0 ? imageUrl : "");
                });

            // Services ({{#orgnaisatinservice}}...{{/orgnaisatinservice}})
            var services = siteDetail.orgnaisatinservice ?? new List<OrganisationServices>();
            html = ApplyLoopSection(
                html,
                "{{#orgnaisatinservice}}",
                "{{/orgnaisatinservice}}",
                services,
                (loop, service) =>
                {
                    var orgId = organisationDetail?.organisationid ?? 0;
                    var locId = organisationDetail?.organisationlocationid ?? 0;
                    var serviceBookUrl = service.id > 0
                        ? $"{frontendBaseUrl}/book-appointment/{orgId}/{locId}?serviceId={service.id}"
                        : $"{frontendBaseUrl}/book-appointment/{orgId}/{locId}";
                    var serviceTemplate = loop
                        .Replace("{{Servicename}}", service.Servicename ?? "")
                        .Replace("{{prize}}", service.prize.ToString())
                        .Replace("{{timetaken}}", service.timetaken.ToString())
                        .Replace("{{notes}}", service.notes ?? "")
                        .Replace("{{service_id}}", service.id.ToString())
                        .Replace("{{SERVICE_BOOK_URL}}", serviceBookUrl);

                    var serviceImageId = service.attributes?.ImageIds?.FirstOrDefault(id => id > 0) ?? 0;
                    var serviceImageUrl = serviceImageId > 0
                        ? $"{apiBaseUrl}/api/Files/Get?id={serviceImageId}"
                        : "";

                    if (serviceImageId > 0)
                    {
                        serviceTemplate = serviceTemplate.Replace(
                            "/api/Files/Get?id={{service_image_id}}",
                            serviceImageUrl);
                    }

                    serviceTemplate = ApplyConditionalSection(
                        serviceTemplate,
                        "{{#service_image_id}}",
                        "{{/service_image_id}}",
                        serviceImageId > 0);
                    serviceTemplate = serviceTemplate
                        .Replace("{{SERVICE_IMAGE_URL}}", serviceImageUrl)
                        .Replace("{{service_image_id}}", serviceImageId > 0 ? serviceImageUrl : "");
                    return serviceTemplate;
                });

            // Service timings ({{#OrganisationServiceTiming}}...{{/OrganisationServiceTiming}})
            var timings = siteDetail.OrganisationServiceTiming ?? new List<OrganisationServiceTiming>();
            var dayNames = new[] { "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
            html = ApplyLoopSection(
                html,
                "{{#OrganisationServiceTiming}}",
                "{{/OrganisationServiceTiming}}",
                timings,
                (loop, timing) =>
                {
                    var dayIndex = (int)Math.Max(0, Math.Min(7, timing.day_of_week));
                    return loop
                        .Replace("{{day_name}}", dayNames[dayIndex])
                        .Replace("{{day_of_week}}", timing.day_of_week.ToString())
                        .Replace("{{start_time}}", timing.start_time.ToString("hh\\:mm"))
                        .Replace("{{end_time}}", timing.end_time.ToString("hh\\:mm"));
                });

            // Handle {{#if locationdetail.images}} ... {{/if}} blocks (used by UI templates)
            if (locationImages.Count > 0)
            {
                var imagesHtml = locationImages.Count == 1
                    ? $"<div class=\"single-image-container\"><img src=\"{apiBaseUrl}/api/Files/Get?id={locationImages[0]}\" alt=\"Location Image\" class=\"single-image\"></div>"
                    : $"<div class=\"image-gallery\">{string.Join("", locationImages.Select(id => $"<img src=\"{apiBaseUrl}/api/Files/Get?id={id}\" alt=\"Location Image\" class=\"gallery-image\">"))}</div>";

                html = Regex.Replace(html, "\\{\\{#if locationdetail\\.images\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}", imagesHtml);
            }
            else
            {
                html = Regex.Replace(html, "\\{\\{#if locationdetail\\.images\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}", "");
            }

            // Events wrapper and loop ({{#hasevents}}...{{/hasevents}} and {{#events}}...{{/events}})
            html = ApplyConditionalSection(html, "{{#hasevents}}", "{{/hasevents}}", events != null && events.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#events}}",
                "{{/events}}",
                events ?? new List<Event>(),
                (loop, evt) =>
                {
                    var eventTemplate = loop
                        .Replace("{{event_name}}", evt.event_name ?? "")
                        .Replace("{{event_date}}", evt.event_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{from_date}}", evt.from_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{to_date}}", evt.to_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{entry_amount}}", evt.entry_amount.ToString())
                        .Replace("{{remainingslot}}", evt.remainingslot.ToString())
                        .Replace("{{description}}", evt.description ?? "")
                        .Replace("{{status}}", evt.status ?? "");

                    var eventImageId = evt.images?.ImageIds?.FirstOrDefault() ?? 0;
                    eventTemplate = ApplyConditionalSection(
                        eventTemplate,
                        "{{#event_image_id}}",
                        "{{/event_image_id}}",
                        eventImageId > 0);
                    // Support both styles:
                    // 1) src="/api/Files/Get?id={{event_image_id}}"
                    // 2) src="{{event_image_id}}" (expects full URL)
                    if (eventImageId > 0)
                    {
                        eventTemplate = eventTemplate.Replace(
                            "/api/Files/Get?id={{event_image_id}}",
                            $"{apiBaseUrl}/api/Files/Get?id={eventImageId}");
                    }

                    // Replace remaining {{event_image_id}} with full URL for templates
                    // that expect a direct URL.
                    eventTemplate = eventTemplate.Replace(
                        "{{event_image_id}}",
                        eventImageId > 0 ? $"{apiBaseUrl}/api/Files/Get?id={eventImageId}" : "");

                    // Also support templates that use {{event_image_url}} explicitly.
                    eventTemplate = eventTemplate.Replace(
                        "{{event_image_url}}",
                        eventImageId > 0 ? $"{apiBaseUrl}/api/Files/Get?id={eventImageId}" : "");

                    eventTemplate = eventTemplate.Replace(
                        "{{EVENT_IMAGE_URL}}",
                        eventImageId > 0 ? $"{apiBaseUrl}/api/Files/Get?id={eventImageId}" : "");

                    eventTemplate = eventTemplate.Replace(
                        "{{EVENTBOOKURL}}",
                        $"{frontendBaseUrl}/user/events/{evt.id}/book");

                    var hasToDate = evt.to_date.HasValue;
                    eventTemplate = ApplyConditionalSection(
                        eventTemplate,
                        "{{#to_date}}",
                        "{{/to_date}}",
                        hasToDate);

                    return eventTemplate;
                });

            // Facilities loop ({{#facilities}}...{{/facilities}})
            html = ApplyLoopSection(
                html,
                "{{#facilities}}",
                "{{/facilities}}",
                facilities ?? new List<string>(),
                (loop, facility) =>
                {
                    return loop.Replace("{{facility_displaytext}}", facility ?? "");
                });

            html = BindHospitalitySections(
                html,
                siteDetail,
                organisationDetail?.organisationid ?? 0,
                organisationDetail?.organisationlocationid ?? 0,
                apiBaseUrl,
                frontendBaseUrl);

            return html;
        }

        private static string BindHospitalitySections(
            string templateHtml,
            Sitedetails siteDetail,
            long organisationId,
            long locationId,
            string apiBaseUrl,
            string frontendBaseUrl)
        {
            var html = templateHtml ?? "";
            var profile = siteDetail.hospitality_profile;
            var rooms = (siteDetail.hospitality_rooms ?? []).Where(r => r.isactive).ToList();
            var packages = (profile?.packages ?? []).Where(p => p.is_active && !string.IsNullOrWhiteSpace(p.name)).OrderBy(p => p.sort_order).ToList();
            var foodMenu = (profile?.food_menu ?? []).Where(f => !string.IsNullOrWhiteSpace(f.title) || !string.IsNullOrWhiteSpace(f.meal)).ToList();
            var nearbyPlaces = (profile?.nearby_places ?? []).Where(p => !string.IsNullOrWhiteSpace(p.name)).ToList();

            var cancellationPolicy = profile?.cancellation_policy ?? "";
            var paymentPolicy = profile?.payment_policy ?? "";
            var checkInTime = profile?.checkin_time ?? "14:00";
            var checkOutTime = profile?.checkout_time ?? "11:00";

            html = html.Replace("{{hospitality.cancellation_policy}}", cancellationPolicy);
            html = html.Replace("{{hospitality.payment_policy}}", paymentPolicy);
            html = html.Replace("{{hospitality.check_in_time}}", checkInTime);
            html = html.Replace("{{hospitality.check_out_time}}", checkOutTime);
            html = html.Replace("{{organisation.cancellation_policy}}", cancellationPolicy);
            html = html.Replace("{{organisation.payment_policy}}", paymentPolicy);
            html = html.Replace("{{organisation.check_in_time}}", checkInTime);
            html = html.Replace("{{organisation.check_out_time}}", checkOutTime);

            html = ApplyConditionalSection(html, "{{#hasrooms}}", "{{/hasrooms}}", rooms.Count > 0);
            html = ApplyConditionalSection(html, "{{#haspackages}}", "{{/haspackages}}", packages.Count > 0);
            html = ApplyConditionalSection(html, "{{#hasfoodmenu}}", "{{/hasfoodmenu}}", foodMenu.Count > 0);
            html = ApplyConditionalSection(html, "{{#hasnearby}}", "{{/hasnearby}}", nearbyPlaces.Count > 0);

            html = ApplyLoopSection(html, "{{#rooms}}", "{{/rooms}}", rooms, (loop, room) =>
            {
                var code = ResolveRoomCode(room);
                var available = string.Equals(room.status, "available", StringComparison.OrdinalIgnoreCase);
                var name = !string.IsNullOrWhiteSpace(room.room_name) ? room.room_name.Trim() : $"Room {room.room_number}";
                var mainPhoto = ResolveHospitalityMediaUrl(room.main_photo, apiBaseUrl, "");
                var bookUrl = $"{frontendBaseUrl}/book?roomId={Uri.EscapeDataString(code)}&organisationId={organisationId}&locationId={locationId}";

                var roomHtml = loop
                    .Replace("{{room.id}}", code)
                    .Replace("{{room.room_number}}", room.room_number ?? "")
                    .Replace("{{room.room_name}}", room.room_name ?? "")
                    .Replace("{{room.name}}", name)
                    .Replace("{{room.type}}", room.room_type ?? "")
                    .Replace("{{room.capacity}}", (room.capacity?.total_guests ?? 2).ToString())
                    .Replace("{{room.price}}", (room.pricing?.price_per_night ?? 0).ToString())
                    .Replace("{{room.main_photo}}", mainPhoto)
                    .Replace("{{room.video_url}}", room.booking_rules?.video_url ?? "")
                    .Replace("{{room.status}}", room.status ?? "")
                    .Replace("{{room.status_label}}", FormatRoomStatusLabel(room.status))
                    .Replace("{{ROOM_BOOK_URL}}", bookUrl);

                roomHtml = ApplyConditionalSection(roomHtml, "{{#if_room_available}}", "{{/if_room_available}}", available);
                roomHtml = ApplyConditionalSection(roomHtml, "{{#if_room_unavailable}}", "{{/if_room_unavailable}}", !available);
                return roomHtml;
            });

            html = ApplyLoopSection(html, "{{#packages}}", "{{/packages}}", packages, (loop, pkg) =>
            {
                var packageId = !string.IsNullOrWhiteSpace(pkg.id) ? pkg.id.Trim() : $"name:{pkg.name.Trim().ToLowerInvariant()}";
                var bookUrl = $"{frontendBaseUrl}/book?packageId={Uri.EscapeDataString(packageId)}&organisationId={organisationId}&locationId={locationId}";
                return loop
                    .Replace("{{package.id}}", packageId)
                    .Replace("{{package.name}}", pkg.name ?? "")
                    .Replace("{{package.price}}", pkg.price ?? "")
                    .Replace("{{package.description}}", pkg.description ?? "")
                    .Replace("{{package.badge}}", pkg.badge ?? "")
                    .Replace("{{package.image_url}}", ResolveHospitalityMediaUrl(pkg.image_url, apiBaseUrl, ""))
                    .Replace("{{package.minimum_nights}}", pkg.minimum_nights.ToString())
                    .Replace("{{package.max_guests}}", pkg.max_guests.ToString())
                    .Replace("{{package.room_type}}", pkg.room_type ?? "")
                    .Replace("{{package.includes}}", string.Join(" · ", pkg.includes ?? []))
                    .Replace("{{PACKAGE_BOOK_URL}}", bookUrl);
            });

            html = ApplyLoopSection(html, "{{#food_menu}}", "{{/food_menu}}", foodMenu, (loop, item) =>
                loop
                    .Replace("{{food.meal}}", item.meal ?? "")
                    .Replace("{{food.title}}", item.title ?? "")
                    .Replace("{{food.description}}", item.description ?? "")
                    .Replace("{{food.cuisines}}", string.Join(", ", item.cuisines ?? [])));

            html = ApplyLoopSection(html, "{{#nearby_places}}", "{{/nearby_places}}", nearbyPlaces, (loop, place) =>
                loop
                    .Replace("{{place.name}}", place.name ?? "")
                    .Replace("{{place.distance}}", place.distance ?? "")
                    .Replace("{{place.travel_time}}", place.travel_time ?? "")
                    .Replace("{{place.icon}}", place.icon ?? "")
                    .Replace("{{place.image_url}}", place.image_url ?? "")
                    .Replace("{{place.map_url}}", place.map_url ?? ""));

            return html;
        }

        private static string ResolveRoomCode(OrganisationRoom room)
        {
            var code = room.booking_rules?.room_code?.Trim();
            if (!string.IsNullOrEmpty(code))
                return code;
            if (!string.IsNullOrWhiteSpace(room.room_number))
                return $"room-{room.room_number.Trim().Replace(' ', '-').ToLowerInvariant()}";
            return $"room-{room.id}";
        }

        private static string ResolveHospitalityMediaUrl(string value, string apiBaseUrl, string fallback)
        {
            var trimmed = (value ?? "").Trim();
            if (string.IsNullOrEmpty(trimmed))
                return fallback;
            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return trimmed;
            if (long.TryParse(trimmed, out var id) && id > 0)
                return $"{apiBaseUrl}/api/Files/Get?id={id}";
            return trimmed;
        }

        private static string FormatRoomStatusLabel(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return "Unknown";
            return char.ToUpper(status[0]) + status[1..].Replace('_', ' ');
        }

        private static string ApplyConditionalSection(string template, string startMarker, string endMarker, bool keepContent)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            if (keepContent)
            {
                var content = template.Substring(startIdx + startMarker.Length, endIdx - startIdx - startMarker.Length);
                return template.Substring(0, startIdx) + content + template.Substring(endIdx + endMarker.Length);
            }

            return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
        }

        private static string RemoveSection(string template, string startMarker, string endMarker)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
        }

        private static string ApplyLoopSection<T>(
            string template,
            string startMarker,
            string endMarker,
            IList<T> items,
            Func<string, T, string> renderItem)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            if (items == null || items.Count == 0)
            {
                return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
            }

            var loopTemplate = template.Substring(startIdx + startMarker.Length, endIdx - startIdx - startMarker.Length);
            var content = string.Join("", items.Select(item => renderItem(loopTemplate, item)));
            return template.Substring(0, startIdx) + content + template.Substring(endIdx + endMarker.Length);
        }

        private static string BuildVideoEmbedUrl(string raw)
        {
            if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return "";
            }

            var host = uri.Host.ToLowerInvariant();
            if (host.StartsWith("www."))
            {
                host = host.Substring(4);
            }

            if (host == "youtu.be")
            {
                var id = uri.AbsolutePath.Trim('/').Split('/').FirstOrDefault() ?? "";
                return Regex.IsMatch(id, @"^[\w-]{6,}$")
                    ? $"https://www.youtube-nocookie.com/embed/{id}"
                    : "";
            }

            if (host == "youtube.com" || host == "m.youtube.com")
            {
                var path = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
                var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query);
                var id = query.TryGetValue("v", out var value)
                    ? value.FirstOrDefault() ?? ""
                    : path.Length > 1 && new[] { "embed", "shorts", "live" }.Contains(path[0])
                        ? path[1]
                        : "";
                return Regex.IsMatch(id, @"^[\w-]{6,}$")
                    ? $"https://www.youtube-nocookie.com/embed/{id}"
                    : "";
            }

            if (host == "vimeo.com" || host == "player.vimeo.com")
            {
                var id = uri.AbsolutePath
                    .Split('/', StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault(part => part.All(char.IsDigit)) ?? "";
                return id.Length > 0 ? $"https://player.vimeo.com/video/{id}" : "";
            }

            return uri.AbsoluteUri;
        }

        private async Task<IList<string>> ResolveFacilities(Sitedetails siteDetail)
        {
            var facilityIds = siteDetail?.locationdetail?.facility_list ?? new List<long>();
            if (facilityIds.Count == 0)
            {
                return new List<string>();
            }

            var facilities = new List<string>();
            foreach (var id in facilityIds)
            {
                var values = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    id = id,
                    referencetypeid = 0,
                    organisationid = 0,
                    parentid = 0
                });

                var displayText = values?.FirstOrDefault()?.displaytext ?? "";
                if (!string.IsNullOrWhiteSpace(displayText))
                {
                    facilities.Add(displayText);
                }
            }

            return facilities;
        }
    }
} 