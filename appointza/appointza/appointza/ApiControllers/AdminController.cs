using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        ILogger<AdminController> logger;
        AdminService adminService;
        
        public AdminController(ILogger<AdminController> logger, AdminService adminService)
        {
            this.logger = logger;
            this.adminService = adminService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Admin>>> Entity()
        {
            ActionRes<Admin> result = new ActionRes<Admin>()
            {
                item = new Admin()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Admin>>>> Select(ActionReq<AdminSelectReq> req)
        {
            ActionRes<List<Admin>> result = new ActionRes<List<Admin>>();

            result.item = await adminService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Admin>>> Insert(ActionReq<Admin> req)
        {
            ActionRes<Admin> result = new ActionRes<Admin>();

            result.item = await adminService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Admin>>> Update(ActionReq<Admin> req)
        {
            ActionRes<Admin> result = new ActionRes<Admin>();

            result.item = await adminService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Admin>>> Save(ActionReq<Admin> req)
        {
            ActionRes<Admin> result = new ActionRes<Admin>();

            if (req.item.id > 0)
            {
                result.item = await adminService.Update(req.item);
            }
            else
            {
                result.item = await adminService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<AdminDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ActionRes<AdminContext>>> Login(ActionReq<AdminLoginReq> req)
        {
            ActionRes<AdminContext> result = new ActionRes<AdminContext>();

            result.item = await adminService.Login(req.item);

            return Ok(result);
        }

        [HttpPost("GetDashboardStats")]
        public async Task<ActionResult<ActionRes<AdminDashboardStats>>> GetDashboardStats(ActionReq<AdminDashboardStatsReq> req)
        {
            ActionRes<AdminDashboardStats> result = new ActionRes<AdminDashboardStats>();

            result.item = await adminService.GetDashboardStats(req.item);

            return Ok(result);
        }

        [HttpPost("GetAllUsers")]
        public async Task<ActionResult<ActionRes<List<Users>>>> GetAllUsers(ActionReq<AdminGetAllUsersReq> req)
        {
            ActionRes<List<Users>> result = new ActionRes<List<Users>>();

            result.item = await adminService.GetAllUsers(req.item);

            return Ok(result);
        }

        [HttpPost("GetAllOrganisations")]
        public async Task<ActionResult<ActionRes<List<Organisation>>>> GetAllOrganisations(ActionReq<AdminGetAllOrganisationsReq> req)
        {
            ActionRes<List<Organisation>> result = new ActionRes<List<Organisation>>();

            result.item = await adminService.GetAllOrganisations(req.item);

            return Ok(result);
        }

        [HttpPost("SuspendUser")]
        public async Task<ActionResult<ActionRes<bool>>> SuspendUser(ActionReq<AdminSuspendUserReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.SuspendUser(req.item);

            return Ok(result);
        }

        [HttpPost("ActivateUser")]
        public async Task<ActionResult<ActionRes<bool>>> ActivateUser(ActionReq<AdminActivateUserReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.ActivateUser(req.item);

            return Ok(result);
        }

        [HttpPost("SuspendOrganisation")]
        public async Task<ActionResult<ActionRes<bool>>> SuspendOrganisation(ActionReq<AdminSuspendOrganisationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.SuspendOrganisation(req.item);

            return Ok(result);
        }

        [HttpPost("ActivateOrganisation")]
        public async Task<ActionResult<ActionRes<bool>>> ActivateOrganisation(ActionReq<AdminActivateOrganisationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.ActivateOrganisation(req.item);

            return Ok(result);
        }

        // 1. API to get total count organization total isverified and not verified
        [HttpGet("GetOrganizationVerificationStats")]
        public async Task<ActionResult<ActionRes<AdminOrganizationStats>>> GetOrganizationVerificationStats()
        {
            ActionRes<AdminOrganizationStats> result = new ActionRes<AdminOrganizationStats>();

            result.item = await adminService.GetOrganizationVerificationStats();

            return Ok(result);
        }

        // API to get organization and location statistics
        [HttpGet("GetOrganizationLocationStats")]
        public async Task<ActionResult<ActionRes<AdminOrganizationLocationStats>>> GetOrganizationLocationStats()
        {
            ActionRes<AdminOrganizationLocationStats> result = new ActionRes<AdminOrganizationLocationStats>();

            result.item = await adminService.GetOrganizationLocationStats();

            return Ok(result);
        }

        // 2. API to get total appointment count and confirmed count and pending and cancel count
        [HttpPost("GetAppointmentStats")]
        public async Task<ActionResult<ActionRes<AdminAppointmentStats>>> GetAppointmentStats(ActionReq<AdminAppointmentStatsReq> req)
        {
            ActionRes<AdminAppointmentStats> result = new ActionRes<AdminAppointmentStats>();

            result.item = await adminService.GetAppointmentStats(req.item);

            return Ok(result);
        }

        // 3. API that lists all the organisation locations
        [HttpGet("GetAllOrganisationLocations")]
        public async Task<ActionResult<ActionRes<List<AdminOrganisationLocation>>>> GetAllOrganisationLocations()
        {
            ActionRes<List<AdminOrganisationLocation>> result = new ActionRes<List<AdminOrganisationLocation>>();

            result.item = await adminService.GetAllOrganisationLocations();

            return Ok(result);
        }

        // 4. API that makes organisation isverified true and false
        [HttpPost("ToggleOrganisationVerification")]
        public async Task<ActionResult<ActionRes<bool>>> ToggleOrganisationVerification(ActionReq<AdminToggleOrganisationVerificationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.ToggleOrganisationVerification(req.item.OrganisationId, req.item.IsVerified);

            return Ok(result);
        }

        // 5. API that makes location isverified true and false
        [HttpPost("ToggleLocationVerification")]
        public async Task<ActionResult<ActionRes<bool>>> ToggleLocationVerification(ActionReq<AdminToggleLocationVerificationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.ToggleLocationVerification(req.item.LocationId, req.item.IsVerified);

            return Ok(result);
        }

        // 6. API that deletes location (sets isactive to false)
        [HttpPost("DeleteLocation")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteLocation(ActionReq<AdminDeleteLocationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.DeleteLocation(req.item.LocationId);

            return Ok(result);
        }

        // 7. API that activates location (sets isactive to true)
        [HttpPost("ActivateLocation")]
        public async Task<ActionResult<ActionRes<bool>>> ActivateLocation(ActionReq<AdminActivateLocationReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await adminService.ActivateLocation(req.item.LocationId);

            return Ok(result);
        }
    }
}
