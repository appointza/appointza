using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;
using appointza.Utils;
using appointza.Authentication.Utils;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authenticate]
    public class OrganisationLocationController : ControllerBase
    {
        ILogger<OrganisationLocationController> logger;
        OrganisationLocationService organisationlocationService;
        OrganisationService organisationService;
        
        public OrganisationLocationController(
            ILogger<OrganisationLocationController> logger, 
            OrganisationLocationService organisationlocationService,
            OrganisationService organisationService)
        {
            this.logger = logger;
            this.organisationlocationService = organisationlocationService;
            this.organisationService = organisationService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationLocation>>> Entity()
        {
            ActionRes<OrganisationLocation> result = new ActionRes<OrganisationLocation>()
            {
               item = new OrganisationLocation()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationLocation>>>> Select(ActionReq<OrganisationLocationSelectReq> req)
        {
            ActionRes<List<OrganisationLocation>> result = new ActionRes<List<OrganisationLocation>>();

            result.item = await organisationlocationService.Select(req.item);

            return Ok(result);
        }

        /// <summary>
        /// Read-only location lookup for public booking (no JWT). Requires organisation id and location id and verifies they match.
        /// </summary>
        [HttpPost("SelectPublic")]
        [AllowAnonymous]
        public async Task<ActionResult<ActionRes<List<OrganisationLocation>>>> SelectPublic(ActionReq<OrganisationLocationSelectReq> req)
        {
            if (req?.item == null || req.item.organisationid <= 0)
            {
                return BadRequest(new { message = "Organisation id is required." });
            }

            if (req.item.id <= 0 && req.item.organisationlocationid <= 0)
            {
                return BadRequest(new { message = "Location id is required." });
            }

            ActionRes<List<OrganisationLocation>> result = new ActionRes<List<OrganisationLocation>>();

            result.item = await organisationlocationService.Select(req.item);

            if (result.item == null || result.item.Count == 0)
            {
                return Ok(result);
            }

            var loc = result.item[0];
            if (loc.organisationid != req.item.organisationid)
            {
                result.item = new List<OrganisationLocation>();
                return Ok(result);
            }

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationLocation>>> Insert(ActionReq<OrganisationLocation> req)
        {
            ActionRes<OrganisationLocation> result = new ActionRes<OrganisationLocation>();

            result.item = await organisationlocationService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationLocation>>> Update(ActionReq<OrganisationLocation> req)
        {
            ActionRes<OrganisationLocation> result = new ActionRes<OrganisationLocation>();

            result.item = await organisationlocationService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]// Support both cases for route compatibility
        public async Task<ActionResult<ActionRes<OrganisationLocation>>> Save(ActionReq<OrganisationLocation> req)
        {
            ActionRes<OrganisationLocation> result = new ActionRes<OrganisationLocation>();

            // Validate request
            if (req == null)
            {
                logger.LogError("Save: Request is null");
                return BadRequest(new { error = "Request cannot be null" });
            }

            if (req.item == null)
            {
                logger.LogError("Save: Request item is null");
                return BadRequest(new { error = "Location data cannot be null" });
            }

            // Validate required fields
            if (string.IsNullOrWhiteSpace(req.item.name))
            {
                logger.LogError("Save: Location name is required");
                return BadRequest(new { error = "Location name is required" });
            }

            if (req.item.organisationid <= 0)
            {
                logger.LogError("Save: Organisation ID is required");
                return BadRequest(new { error = "Organisation ID is required" });
            }

            // Set default values for optional fields that might be required by model validation
            if (string.IsNullOrEmpty(req.item.geolocation_url))
            {
                req.item.geolocation_url = "";
            }
            if (string.IsNullOrEmpty(req.item.googlelocation))
            {
                req.item.googlelocation = "";
            }

            try
            {
            // 🔍 DEBUGGER BREAKPOINT: Set breakpoint here to inspect incoming data
            // Inspect: req.item.facility_list, req.item.id
                var facilityListJson = req.item.facility_list != null 
                    ? System.Text.Json.JsonSerializer.Serialize(req.item.facility_list) 
                    : "null";
                Console.WriteLine($"📥 Save - Received facility_list count: {req.item.facility_list?.Count ?? 0}, JSON: {facilityListJson}");
                Console.WriteLine($"📥 Save - Location ID: {req.item.id}, Name: {req.item.name}");
                
                // 🔍 DEBUGGER: Inspect req.item.facility_list here
                // Check if it's null or empty at this point
                var debugCount = req.item.facility_list?.Count ?? 0;
                if (debugCount == 0)
                {
                    Console.WriteLine($"⚠️ WARNING: facility_list is empty at controller level!");
            }

            // 🔍 DEBUGGER BREAKPOINT: Set breakpoint here before Insert/Update
            // Preserve facility_list before calling Insert/Update
            var facilityListBackup = req.item.facility_list != null ? new List<long>(req.item.facility_list) : new List<long>();
            
            if(req.item.id > 0){
                result.item = await organisationlocationService.Update(req.item);
            }else{
                result.item = await organisationlocationService.Insert(req.item);
            }
            
            // Ensure facility_list is preserved in the result
            if (facilityListBackup.Count > 0 && (result.item.facility_list == null || result.item.facility_list.Count == 0))
            {
                result.item.facility_list = facilityListBackup;
                Console.WriteLine($"🔧 Restored facility_list from backup: {System.Text.Json.JsonSerializer.Serialize(facilityListBackup)}");
            }

            return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving OrganisationLocation");
                return BadRequest(new { error = $"Error saving location: {ex.Message}" });
            }
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationLocationDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationlocationService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("Selectlocation")]
        public async Task<ActionResult<ActionRes<List<orgnisationlocationstaffres>>>> Selectlocation(ActionReq<orgnisationlocationstaffreq> req)
        {
            ActionRes<List<orgnisationlocationstaffres>> result = new ActionRes<List<orgnisationlocationstaffres>>();

            result.item = await organisationlocationService.Selectlocation(req.item);

            return Ok(result);
        }

        [HttpPost("SelectlocationDetail")]
        public async Task<ActionResult<ActionRes<List<OrgLocationStaffResponse>>>> SelectlocationDetail(ActionReq<OrgLocationStaffReq> req)
        {
            ActionRes<List<OrgLocationStaffResponse>> result = new ActionRes<List<OrgLocationStaffResponse>>();

            result.item = await organisationlocationService.SelectlocationDetail(req.item);

            return Ok(result);
        }

        [HttpPost("SelectAppointmentPaymentsummary")]
        public async Task<ActionResult<ActionRes<AppointmentPaymentsummary>>> SelectAppointmentPaymentsummary(ActionReq<OrgLocationStaffReq> req)
        {
            ActionRes<AppointmentPaymentsummary> result = new ActionRes<AppointmentPaymentsummary>();

            result.item = await organisationlocationService.SelectAppointmentPaymentsummary(req.item);

            return Ok(result);
        }

        [HttpPost("GenerateQRCode")]
        public async Task<ActionResult<ActionRes<UsersGenerateQRCodeRes>>> GenerateQRCode(ActionReq<UsersGenerateQRCodeReq> req)
        {
            ActionRes<UsersGenerateQRCodeRes> result = new ActionRes<UsersGenerateQRCodeRes>();

            result.item = await organisationlocationService.GenerateQRCode(req.item.organisationid, req.item.locationid);

            return Ok(result);
        }

        [HttpPost("UpdateLocationTemplateId")]
        public async Task<ActionResult<ActionRes<long>>> UpdateLocationTemplateId(ActionReq<UpdateLocationTemplateIdReq> req)
        {
            ActionRes<long> result = new ActionRes<long>();

            result.item = await organisationlocationService.UpdateLocationTemplateId(req.item.organisationlocationid, req.item.templateid);

            return Ok(result);
        }

        [HttpPost("UpdateLocationMedia")]
        public async Task<ActionResult<ActionRes<OrganisationLocation>>> UpdateLocationMedia(
            ActionReq<UpdateLocationMediaReq> req)
        {
            if (req?.item == null)
            {
                return BadRequest(new { error = "Location media data is required." });
            }

            var result = new ActionRes<OrganisationLocation>
            {
                item = await organisationlocationService.UpdateLocationMedia(req.item)
            };
            return Ok(result);
        }

        /// <summary>
        /// Get location by subdomain (organisation-area-city-state)
        /// This is used by the public booking page to fetch location details
        /// No authentication required as it's for public access
        /// </summary>
        [HttpPost("LocationBySubdomain")]
        [AllowAnonymous]
        public async Task<ActionResult<dynamic>> LocationBySubdomain([FromBody] SubdomainLocationReq req)
        {
            try
            {
                logger.LogInformation($"🔍 Fetching location by subdomain: {req.organisation}-{req.area}-{req.city}-{req.state}");

                // Use the organisation service to find by subdomain location
                // This matches the logic in OrganisationSiteController.ResolveTemplateBySubdomain
                var organisationDetail = await organisationService.GetOrganisationBySubdomainLocation(
                    req.area,
                    req.city,
                    req.state,
                    req.organisation);

                if (organisationDetail == null || organisationDetail.organisationlocationid <= 0)
                {
                    logger.LogWarning($"⚠️ No location found for subdomain: {req.organisation}-{req.area}-{req.city}-{req.state}");
                    return NotFound(new { error = "Location not found for this subdomain" });
                }

                // Now fetch the full location details
                var locationReq = new OrganisationLocationSelectReq
                {
                    organisationlocationid = organisationDetail.organisationlocationid
                };

                var locations = await organisationlocationService.Select(locationReq);

                if (locations == null || locations.Count == 0)
                {
                    logger.LogWarning($"⚠️ Location details not found for ID: {organisationDetail.organisationlocationid}");
                    return NotFound(new { error = "Location details not found" });
                }

                var location = locations[0];
                logger.LogInformation($"✅ Found location: {location.name} (ID: {location.id})");

                return Ok(new
                {
                    id = location.id,
                    organisationlocationid = location.id,
                    name = location.name,
                    city = location.city,
                    state = location.state,
                    templateid = location.templateid
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching location by subdomain");
                return BadRequest(new { error = $"Error: {ex.Message}" });
            }
        }

    }
}
