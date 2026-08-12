using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationRoomController : ControllerBase
    {
        readonly ILogger<OrganisationRoomController> logger;
        readonly OrganisationRoomService organisationRoomService;

        public OrganisationRoomController(
            ILogger<OrganisationRoomController> logger,
            OrganisationRoomService organisationRoomService)
        {
            this.logger = logger;
            this.organisationRoomService = organisationRoomService;
        }

        [HttpGet("Entity")]
        public ActionResult<ActionRes<OrganisationRoom>> Entity()
        {
            return Ok(new ActionRes<OrganisationRoom> { item = new OrganisationRoom() });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationRoom>>>> Select(ActionReq<OrganisationRoomSelectReq>? req)
        {
            try
            {
                var items = await organisationRoomService.Select(req?.item ?? new OrganisationRoomSelectReq());
                return Ok(new ActionRes<List<OrganisationRoom>> { item = items });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationRoom Select failed");
                return BadRequest(new ActionRes<List<OrganisationRoom>> { error = ex.Message });
            }
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationRoom>>> Save(ActionReq<OrganisationRoom>? req)
        {
            if (req?.item == null)
                return BadRequest(new ActionRes<OrganisationRoom> { error = "Room payload is required." });

            try
            {
                var saved = await organisationRoomService.Save(req.item);
                return Ok(new ActionRes<OrganisationRoom> { item = saved });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationRoom Save failed");
                return BadRequest(new ActionRes<OrganisationRoom> { error = ex.Message });
            }
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationRoomDeleteReq>? req)
        {
            if (req?.item == null || req.item.id <= 0)
                return BadRequest(new ActionRes<bool> { error = "Room id is required." });

            try
            {
                var deleted = await organisationRoomService.Delete(req.item);
                return Ok(new ActionRes<bool> { item = deleted });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationRoom Delete failed");
                return BadRequest(new ActionRes<bool> { error = ex.Message });
            }
        }

        [HttpPost("GetStatusBoard")]
        public async Task<ActionResult<ActionRes<OrganisationRoomStatusBoardRes>>> GetStatusBoard(
            ActionReq<OrganisationRoomStatusReq>? req)
        {
            if (req?.item == null || req.item.organisation_id <= 0)
                return BadRequest(new ActionRes<OrganisationRoomStatusBoardRes> { error = "organisation_id is required." });

            try
            {
                var board = await organisationRoomService.GetStatusBoard(req.item);
                return Ok(new ActionRes<OrganisationRoomStatusBoardRes> { item = board });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetStatusBoard failed");
                return BadRequest(new ActionRes<OrganisationRoomStatusBoardRes> { error = ex.Message });
            }
        }

        [HttpPost("UpdateStatus")]
        public async Task<ActionResult<ActionRes<bool>>> UpdateStatus(ActionReq<OrganisationRoomStatusUpdateReq>? req)
        {
            if (req?.item == null || req.item.id <= 0)
                return BadRequest(new ActionRes<bool> { error = "Room id is required." });

            try
            {
                var ok = await organisationRoomService.UpdateStatus(req.item);
                return Ok(new ActionRes<bool> { item = ok });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "UpdateStatus failed");
                return BadRequest(new ActionRes<bool> { error = ex.Message });
            }
        }

        [HttpPost("Checkout")]
        public async Task<ActionResult<ActionRes<bool>>> Checkout(ActionReq<OrganisationRoomIdReq>? req)
        {
            if (req?.item == null || req.item.id <= 0)
                return BadRequest(new ActionRes<bool> { error = "Room id is required." });

            try
            {
                var ok = await organisationRoomService.Checkout(req.item);
                return Ok(new ActionRes<bool> { item = ok });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Checkout failed");
                return BadRequest(new ActionRes<bool> { error = ex.Message });
            }
        }

        [HttpPost("MarkClean")]
        public async Task<ActionResult<ActionRes<bool>>> MarkClean(ActionReq<OrganisationRoomIdReq>? req)
        {
            if (req?.item == null || req.item.id <= 0)
                return BadRequest(new ActionRes<bool> { error = "Room id is required." });

            try
            {
                var ok = await organisationRoomService.MarkClean(req.item);
                return Ok(new ActionRes<bool> { item = ok });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "MarkClean failed");
                return BadRequest(new ActionRes<bool> { error = ex.Message });
            }
        }
    }
}
