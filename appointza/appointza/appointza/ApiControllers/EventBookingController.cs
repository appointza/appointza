using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventBookingController : ControllerBase
    {
        ILogger<EventBookingController> logger;
        EventBookingService eventBookingService;
        
        public EventBookingController(ILogger<EventBookingController> logger, EventBookingService eventBookingService)
        {
            this.logger = logger;
            this.eventBookingService = eventBookingService;
        }
        
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<EventBooking>>> Entity()
        {
            ActionRes<EventBooking> result = new ActionRes<EventBooking>()
            {
                item = new EventBooking()
            };

            return Ok(result);
        }
        
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<EventBooking>>>> Select([FromBody] ActionReq<EventBookingSelectReq> req)
        {
            // Check ModelState for validation errors
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                logger.LogWarning("Model validation failed: {Errors}", string.Join(", ", errors));
                return BadRequest(new { error = "Model validation failed", message = "Invalid request data", errors = errors });
            }

            ActionRes<List<EventBooking>> result = new ActionRes<List<EventBooking>>();

            try
            {
                // Log the incoming request for debugging
                if (req != null && req.item != null)
                {
                    logger.LogInformation("EventBooking Select request: id={id}, event_id={event_id}, user_id={user_id}, payment_status={payment_status}, check_in_status={check_in_status}, confirmation_status={confirmation_status}",
                        req.item.id, req.item.event_id, req.item.user_id, req.item.payment_status ?? "null", req.item.check_in_status ?? "null", req.item.confirmation_status ?? "null");
                }
                else
                {
                    logger.LogWarning("Select request is null or req.item is null");
                    return BadRequest(new { error = "Request is null or invalid", message = "Request body must contain a valid item" });
                }

                // Ensure string properties are not null
                if (req.item.payment_status == null) req.item.payment_status = "";
                if (req.item.check_in_status == null) req.item.check_in_status = "";
                if (req.item.confirmation_status == null) req.item.confirmation_status = "";

                result.item = await eventBookingService.Select(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in EventBooking Select endpoint: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message, message = "Error fetching event bookings" });
            }

            return Ok(result);
        }
        
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<EventBooking>>> Insert(ActionReq<EventBooking> req)
        {
            ActionRes<EventBooking> result = new ActionRes<EventBooking>();

            result.item = await eventBookingService.Insert(req.item);

            return Ok(result);
        }
        
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<EventBooking>>> Update(ActionReq<EventBooking> req)
        {
            ActionRes<EventBooking> result = new ActionRes<EventBooking>();

            try
            {
                result.item = await eventBookingService.Update(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating event booking {BookingId}", req.item.id);
                return BadRequest(new { error = ex.Message, message = ex.Message });
            }

            return Ok(result);
        }
        
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<EventBookingDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await eventBookingService.Delete(req.item);

            return Ok(result);
        }
    }
}

