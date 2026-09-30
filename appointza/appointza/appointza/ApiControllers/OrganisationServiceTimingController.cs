using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationServiceTimingController : ControllerBase
    {
        ILogger<OrganisationServiceTimingController> logger;
        OrganisationServiceTimingService organisationservicetimingService;
        public OrganisationServiceTimingController(ILogger<OrganisationServiceTimingController> logger, OrganisationServiceTimingService organisationservicetimingService)
        {
            this.logger = logger;
            this.organisationservicetimingService = organisationservicetimingService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationServiceTiming>>> Entity()
        {
            ActionRes<OrganisationServiceTiming> result = new ActionRes<OrganisationServiceTiming>()
            {
               item = new OrganisationServiceTiming()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationServiceTiming>>>> Select(ActionReq<OrganisationServiceTimingSelectReq> req)
        {
            ActionRes<List<OrganisationServiceTiming>> result = new ActionRes<List<OrganisationServiceTiming>>();

            result.item = await organisationservicetimingService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationServiceTiming>>> Insert(ActionReq<OrganisationServiceTiming> req)
        {
            ActionRes<OrganisationServiceTiming> result = new ActionRes<OrganisationServiceTiming>();

            result.item = await organisationservicetimingService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationServiceTiming>>> Update(ActionReq<OrganisationServiceTiming> req)
        {
            ActionRes<OrganisationServiceTiming> result = new ActionRes<OrganisationServiceTiming>();

            result.item = await organisationservicetimingService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationServiceTiming>>> Save(ActionReq<OrganisationServiceTiming> req)
        {
            ActionRes<OrganisationServiceTiming> result = new ActionRes<OrganisationServiceTiming>();

            if(req.item.id > 0){
                result.item = await organisationservicetimingService.Update(req.item);
            }else{
                result.item = await organisationservicetimingService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationServiceTimingDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationservicetimingService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("HasAny")]
        public async Task<ActionResult<ActionRes<bool>>> HasAny(ActionReq<OrganisationServiceTimingHasAnyReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>
            {
                item = await organisationservicetimingService.HasAnyForOrganisation(req?.item?.organisationid ?? 0),
            };
            return Ok(result);
        }

        [HttpPost("SaveBulk")]
        public async Task<ActionResult<ActionRes<bool>>> SaveBulk(ActionReq<OrganisationServiceTimingBulkSaveReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>
            {
                item = await organisationservicetimingService.SaveBulk(req.item),
            };
            return Ok(result);
        }

        [HttpPost("selecttimingslot")]
        public async Task<ActionResult<ActionRes<List<Appoinment>>>> selecttimingslot(ActionReq<OrganisationServiceTimingSelectReq> req)
        {
            ActionRes<List<Appoinment>> result = new ActionRes<List<Appoinment>>();

            result.item = await organisationservicetimingService.selecttimingslot(req.item);

            return Ok(result);
        }

        [HttpPost("SelectCalendarOverview")]
        public async Task<ActionResult<ActionRes<CalendarOverviewRes>>> SelectCalendarOverview(ActionReq<CalendarOverviewReq> req)
        {
            ActionRes<CalendarOverviewRes> result = new ActionRes<CalendarOverviewRes>();
            result.item = await organisationservicetimingService.SelectCalendarOverview(req.item);
            return Ok(result);
        }

        [HttpPost("Bookappoinment")]
        public async Task<ActionResult<ActionRes<string>>> Bookappoinment(ActionReq<Appoinment> req)
        {
            try
            {
                // Validate request
                if (req?.item == null)
                {
                    return BadRequest(new ActionRes<string> { item = "Invalid request: appointment data is required" });
                }

                // Validate required fields
                if (req.item.organisationlocationid <= 0)
                {
                    return BadRequest(new ActionRes<string> { item = "Invalid request: organization location ID is required" });
                }

                if (req.item.organizationid <= 0)
                {
                    return BadRequest(new ActionRes<string> { item = "Invalid request: organization ID is required" });
                }

                if (req.item.userid <= 0)
                {
                    return BadRequest(new ActionRes<string> { item = "Invalid request: user ID is required" });
                }

                if (req.item.appoinmentdate == DateTime.MinValue)
                {
                    return BadRequest(new ActionRes<string> { item = "Invalid request: appointment date is required" });
                }

                ActionRes<string> result = new ActionRes<string>();
                result.item = await organisationservicetimingService.Bookappoinment(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error booking appointment");
                return BadRequest(new ActionRes<string> { item = $"Error booking appointment: {ex.Message}" });
            }
        }

        [HttpPost("BookLeave")]
        public async Task<ActionResult<ActionRes<string>>> BookLeave(ActionReq<Leavereq> req)
        {
            ActionRes<string> result = new ActionRes<string>();

            result.item = await organisationservicetimingService.BookLeave(req.item);

            return Ok(result);
        }

        [HttpPost("getLeaveRequests")]
        public async Task<ActionResult<ActionRes<List<Leavereq>>>> GetLeaveRequests(ActionReq<Leavereq> req)
        {
            ActionRes<List<Leavereq>> result = new ActionRes<List<Leavereq>>();

            result.item = await organisationservicetimingService.GetLeaveRequests(req.item);

            return Ok(result);
        }
    }
}
