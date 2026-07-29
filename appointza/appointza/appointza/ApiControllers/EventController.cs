using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        ILogger<EventController> logger;
        EventService eventService;
        
        public EventController(ILogger<EventController> logger, EventService eventService)
        {
            this.logger = logger;
            this.eventService = eventService;
        }
        
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Event>>> Entity()
        {
            ActionRes<Event> result = new ActionRes<Event>()
            {
                item = new Event()
            };

            return Ok(result);
        }
        
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Event>>>> Select(ActionReq<EventSelectReq> req)
        {
            ActionRes<List<Event>> result = new ActionRes<List<Event>>();

            result.item = await eventService.Select(req.item);

            return Ok(result);
        }
        
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Event>>> Insert(ActionReq<Event> req)
        {
            ActionRes<Event> result = new ActionRes<Event>();

            result.item = await eventService.Insert(req.item);

            return Ok(result);
        }
        
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Event>>> Update(ActionReq<Event> req)
        {
            ActionRes<Event> result = new ActionRes<Event>();

            try
            {
                result.item = await eventService.Update(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating event {EventId}", req.item.id);
                // Return BadRequest with error message in response body
                return BadRequest(new { error = ex.Message, message = ex.Message });
            }

            return Ok(result);
        }
        
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Event>>> Save(ActionReq<Event> req)
        {
            ActionRes<Event> result = new ActionRes<Event>();

            try
            {
                if(req.item.id > 0)
                {
                    result.item = await eventService.Update(req.item);
                }
                else
                {
                    result.item = await eventService.Insert(req.item);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving event {EventId}", req.item.id);
                // Return BadRequest with error message in response body
                return BadRequest(new { error = ex.Message, message = ex.Message });
            }

            return Ok(result);
        }
        
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<EventDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            try
            {
                result.item = await eventService.Delete(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting event {EventId}", req.item.id);
                // Return BadRequest with error message in response body
                return BadRequest(new { error = ex.Message, message = ex.Message });
            }

            return Ok(result);
        }
    }
}

