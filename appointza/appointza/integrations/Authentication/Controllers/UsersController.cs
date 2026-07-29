using appointza.Models;
using appointza.Authentication.Services;
using appointza.Authentication.Models;
using appointza.Services;
using appointza.Utils;
using appointza.Authentication.Utils;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Authentication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        ILogger<UsersController> logger;
        UsersService usersService;
        EventBookingService eventBookingService;
        RequestState requestState;
        
        public UsersController(ILogger<UsersController> logger, UsersService usersService, EventBookingService eventBookingService, RequestState requestState)
        {
            this.logger = logger;
            this.usersService = usersService;
            this.eventBookingService = eventBookingService;
            this.requestState = requestState;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Users>>> Entity()
        {
            ActionRes<Users> result = new ActionRes<Users>()
            {
                item = new Users()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Users>>>> Select(ActionReq<UsersSelectReq> req)
        {
            ActionRes<List<Users>> result = new ActionRes<List<Users>>();

            result.item = await usersService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Users>>> Insert(ActionReq<Users> req)
        {
            ActionRes<Users> result = new ActionRes<Users>();

            result.item = await usersService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Users>>> Update(ActionReq<Users> req)
        {
            ActionRes<Users> result = new ActionRes<Users>();

            result.item = await usersService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Users>>> Save(ActionReq<Users> req)
        {
            ActionRes<Users> result = new ActionRes<Users>();

            if (req.item.id > 0)
            {
                result.item = await usersService.Update(req.item);
            }
            else
            {
                result.item = await usersService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<UsersDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await usersService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("SelectUser")]
        public async Task<ActionResult<ActionRes<UsersContext>>> SelectUser(ActionReq<UsersLoginReq> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();

            result.item = await usersService.SelectUser(req.item);

            return Ok(result);
        }

        [HttpPost("DeleteOrganisationPermananet")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteOrganisationPermananet(ActionReq<Organisationdeletereq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await usersService.DeleteOrganisationPermananet(req.item);

            return Ok(result);
        }

        [HttpPost("Deleteuserpermanent")]
        public async Task<ActionResult<ActionRes<bool>>> Deleteuserpermanent(ActionReq<Organisationdeletereq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await usersService.Deleteuserpermanent(req.item);

            return Ok(result);
        }

        [HttpPost("UpdatePushToken")]
        public async Task<ActionResult<ActionRes<bool>>> UpdatePushToken([FromBody] UpdatePushTokenRequest req)
        {
            try
            {
                if (req == null || req.UserId <= 0)
                {
                    return BadRequest(new ActionRes<bool> { error = "UserId is required" });
                }

                if (string.IsNullOrWhiteSpace(req.PushToken))
                {
                    return BadRequest(new ActionRes<bool> { error = "PushToken is required" });
                }

                var saved = await usersService.UpdatePushToken(
                    req.UserId,
                    req.PushToken.Trim(),
                    req.Platform ?? "android");

                return Ok(new ActionRes<bool> { item = saved });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "UpdatePushToken failed for user {UserId}", req?.UserId);
                return StatusCode(500, new ActionRes<bool> { error = ex.Message });
            }
        }

        [HttpGet("/user/my-event-bookings")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<List<EventBooking>>>> MyEventBookings()
        {
            ActionRes<List<EventBooking>> result = new ActionRes<List<EventBooking>>();

            try
            {
                var userContext = requestState.usercontext;
                
                if (userContext == null || userContext.userid <= 0)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                EventBookingSelectReq req = new EventBookingSelectReq
                {
                    id = 0,
                    event_id = 0,
                    user_id = userContext.userid,
                    payment_status = "",
                    check_in_status = "",
                    confirmation_status = ""
                };

                result.item = await eventBookingService.Select(req);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user event bookings");
                return BadRequest(new { error = ex.Message, message = "Error fetching event bookings" });
            }

            return Ok(result);
        }

        [HttpPost("GetUserDetailsWithOrganisation")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<UserDetailsWithOrganisationRes>>> GetUserDetailsWithOrganisation()
        {
            ActionRes<UserDetailsWithOrganisationRes> result = new ActionRes<UserDetailsWithOrganisationRes>();

            try
            {
                var userContext = requestState.usercontext;
                
                if (userContext == null || userContext.userid <= 0)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                result.item = await usersService.GetUserDetailsWithOrganisation();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user details with organisation");
                return BadRequest(new { error = ex.Message, message = "Error fetching user details" });
            }

            return Ok(result);
        }
    }
}

