using appointza.Authentication.Models;
using appointza.Authentication.Services;
using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    /// <summary>
    /// Super admin console API (organisations, users, reference data).
    /// Gated server-side by [SuperAdminAuthenticate] (users.isfactory = true, re-checked in the DB per request).
    /// Mutations that already exist live on api/Admin (also super admin only); this controller adds the
    /// read models and the reference-data management that previously had no protected endpoint.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [SuperAdminAuthenticate]
    public class SuperAdminController : ControllerBase
    {
        private readonly ILogger<SuperAdminController> logger;
        private readonly SuperAdminService superAdminService;
        private readonly ReferenceTypeService referenceTypeService;
        private readonly ReferenceValueService referenceValueService;
        private readonly AuthService authService;

        public SuperAdminController(
            ILogger<SuperAdminController> logger,
            SuperAdminService superAdminService,
            ReferenceTypeService referenceTypeService,
            ReferenceValueService referenceValueService,
            AuthService authService)
        {
            this.logger = logger;
            this.superAdminService = superAdminService;
            this.referenceTypeService = referenceTypeService;
            this.referenceValueService = referenceValueService;
            this.authService = authService;
        }

        [HttpGet("Ping")]
        public ActionResult<ActionRes<bool>> Ping()
        {
            return Ok(new ActionRes<bool> { item = true });
        }

        // ---- Organisations -------------------------------------------------
        [HttpPost("ListOrganisations")]
        public async Task<ActionResult<ActionRes<SuperAdminOrganisationListRes>>> ListOrganisations(ActionReq<SuperAdminOrganisationListReq> req)
        {
            return Ok(new ActionRes<SuperAdminOrganisationListRes>
            {
                item = await superAdminService.ListOrganisations(req?.item ?? new SuperAdminOrganisationListReq())
            });
        }

        [HttpPost("GetOrganisation")]
        public async Task<ActionResult<ActionRes<SuperAdminOrganisationDetail>>> GetOrganisation(ActionReq<SuperAdminIdReq> req)
        {
            var detail = await superAdminService.GetOrganisationDetail(req?.item?.Id ?? 0);
            if (detail == null)
            {
                return NotFound(new { message = "Organisation not found" });
            }
            return Ok(new ActionRes<SuperAdminOrganisationDetail> { item = detail });
        }

        /// <summary>
        /// Issue a session JWT scoped to the target organisation so the super admin can open the normal
        /// organisation workspace and edit profile, locations, services, rooms, hours, website, etc.
        /// </summary>
        [HttpPost("AssumeOrganisation")]
        public async Task<ActionResult<ActionRes<UsersContext>>> AssumeOrganisation(ActionReq<SuperAdminIdReq> req)
        {
            var actor = HttpContext.Items["usercontext"] as UsersContext;
            if (actor == null || actor.userid <= 0)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }

            var organisationId = req?.item?.Id ?? 0;
            var detail = await superAdminService.GetOrganisationDetail(organisationId);
            if (detail?.organisation == null)
            {
                return NotFound(new { message = "Organisation not found" });
            }

            var org = detail.organisation;
            var location = detail.locations.FirstOrDefault(l => l.isactive) ?? detail.locations.FirstOrDefault();

            var fullPermission = new UsersPermissionData
            {
                editandviewDashboard = true,
                editandviewAppointments = true,
                editandviewEvents = true,
                editandviewCreateService = true,
                editandviewCreateEvent = true,
                editandviewClients = true,
                editandviewBusinessHours = true,
                editandviewStaffManagement = true,
                editandviewLocationManagement = true,
                editandviewTemplates = true,
                editandviewPaymentSettings = true,
                editandviewBusinessvalues = true,
            };

            var context = new UsersContext
            {
                userid = actor.userid,
                usermobile = actor.usermobile ?? "",
                username = actor.username ?? "",
                useremail = actor.useremail ?? "",
                profileimage = actor.profileimage,
                userpermission = fullPermission,
                organisationid = org.id,
                organisationname = org.name ?? "",
                organisationtype = 0,
                organisationlocationid = location?.id ?? 0,
                organisationlocationname = location?.name ?? "",
                isStaff = false,
                issuperadmin = true,
                refreshtoken = actor.refreshtoken ?? "",
            };

            context.accesstoken = authService.GenerateJwtToken(new GenerateJwtTokenRequest
            {
                userid = context.userid,
                usermobile = context.usermobile,
                useremail = context.useremail,
                username = context.username,
                profileimage = context.profileimage,
                permissionhex = authService.PermissionToHex(fullPermission),
                organisationid = context.organisationid,
                organisationname = context.organisationname,
                organisationtype = context.organisationtype,
                organisationlocationid = context.organisationlocationid,
                organisationlocationname = context.organisationlocationname,
                issuperadmin = true,
            });

            return Ok(new ActionRes<UsersContext> { item = context });
        }

        // ---- Users ---------------------------------------------------------
        [HttpPost("ListUsers")]
        public async Task<ActionResult<ActionRes<SuperAdminUserListRes>>> ListUsers(ActionReq<SuperAdminUserListReq> req)
        {
            return Ok(new ActionRes<SuperAdminUserListRes>
            {
                item = await superAdminService.ListUsers(req?.item ?? new SuperAdminUserListReq())
            });
        }

        // ---- Reference data (types + values) -------------------------------
        [HttpGet("ListReferenceTypes")]
        public async Task<ActionResult<ActionRes<List<ReferenceType>>>> ListReferenceTypes()
        {
            return Ok(new ActionRes<List<ReferenceType>>
            {
                item = await referenceTypeService.Select(new ReferenceTypeSelectReq())
            });
        }

        [HttpPost("ListReferenceValues")]
        public async Task<ActionResult<ActionRes<List<ReferenceValue>>>> ListReferenceValues(ActionReq<SuperAdminReferenceValuesReq> req)
        {
            var typeId = req?.item?.ReferenceTypeId ?? 0;
            return Ok(new ActionRes<List<ReferenceValue>>
            {
                item = await referenceValueService.Select(new ReferenceValueSelectReq { referencetypeid = typeId })
            });
        }

        [HttpPost("SaveReferenceValue")]
        public async Task<ActionResult<ActionRes<ReferenceValue>>> SaveReferenceValue(ActionReq<ReferenceValue> req)
        {
            if (req?.item == null) return BadRequest(new { message = "Missing item" });
            if (string.IsNullOrWhiteSpace(req.item.identifier) || string.IsNullOrWhiteSpace(req.item.displaytext))
            {
                return BadRequest(new { message = "Identifier and display text are required" });
            }

            // Secondary organisation types must point at a primary type value via parentid
            // (same contract as registration: referencetypeid=2, parentid = primary value id).
            const long secondaryTypeId = 2;
            const long primaryTypeId = 1;
            if (req.item.referencetypeid == secondaryTypeId)
            {
                if (req.item.parentid <= 0)
                {
                    return BadRequest(new { message = "Secondary type requires a primary type (parentid)." });
                }
                var parents = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    id = req.item.parentid,
                    referencetypeid = primaryTypeId
                });
                if (parents == null || parents.Count == 0)
                {
                    return BadRequest(new { message = "parentid must be an Organisation Primary Type value id." });
                }
            }
            else if (req.item.referencetypeid == primaryTypeId)
            {
                req.item.parentid = 0;
            }

            req.item.attributes ??= new ReferenceValue.AttributesData();
            req.item.notes ??= "";
            req.item.description ??= "";
            req.item.langcode = string.IsNullOrWhiteSpace(req.item.langcode) ? "en" : req.item.langcode;
            var saved = req.item.id > 0
                ? await referenceValueService.Update(req.item)
                : await referenceValueService.Insert(req.item);
            return Ok(new ActionRes<ReferenceValue> { item = saved });
        }

        [HttpPost("DeleteReferenceValue")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteReferenceValue(ActionReq<ReferenceValueDeleteReq> req)
        {
            return Ok(new ActionRes<bool> { item = await referenceValueService.Delete(req.item) });
        }

        [HttpPost("SaveReferenceType")]
        public async Task<ActionResult<ActionRes<ReferenceType>>> SaveReferenceType(ActionReq<ReferenceType> req)
        {
            if (req?.item == null) return BadRequest(new { message = "Missing item" });
            if (string.IsNullOrWhiteSpace(req.item.identifier) || string.IsNullOrWhiteSpace(req.item.displaytext))
            {
                return BadRequest(new { message = "Identifier and display text are required" });
            }
            req.item.attributes ??= new ReferenceType.AttributesData();
            req.item.notes ??= "";
            req.item.langcode = string.IsNullOrWhiteSpace(req.item.langcode) ? "en" : req.item.langcode;
            var saved = req.item.id > 0
                ? await referenceTypeService.Update(req.item)
                : await referenceTypeService.Insert(req.item);
            return Ok(new ActionRes<ReferenceType> { item = saved });
        }
    }
}