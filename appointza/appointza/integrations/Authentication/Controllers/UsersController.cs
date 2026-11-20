using appointza.Models;
using appointza.Authentication.Services;
using appointza.Authentication.Models;
using appointza.Services;
using appointza.Utils;
using appointza.Authentication.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

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
        IMemoryCache memoryCache;
        
        public UsersController(
            ILogger<UsersController> logger,
            UsersService usersService,
            EventBookingService eventBookingService,
            RequestState requestState,
            IMemoryCache memoryCache)
        {
            this.logger = logger;
            this.usersService = usersService;
            this.eventBookingService = eventBookingService;
            this.requestState = requestState;
            this.memoryCache = memoryCache;
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
        [Authenticate]
        public async Task<ActionResult<ActionRes<List<Users>>>> Select(ActionReq<UsersSelectReq> req)
        {
            ActionRes<List<Users>> result = new ActionRes<List<Users>>();
            var ctx = requestState.usercontext;
            if (ctx == null || ctx.userid <= 0)
            {
                return Unauthorized(new ActionRes<List<Users>>
                {
                    error = "Authentication required.",
                });
            }

            var item = req?.item ?? new UsersSelectReq();

            // Block unrestricted phone/email directory lookups (PII leak across organisations).
            if (!ctx.issuperadmin)
            {
                var isMobileOrEmailSearch =
                    !string.IsNullOrWhiteSpace(item.mobile) || !string.IsNullOrWhiteSpace(item.email);
                if (isMobileOrEmailSearch && item.id <= 0)
                {
                    if (ctx.organisationid <= 0)
                    {
                        return BadRequest(new ActionRes<List<Users>>
                        {
                            error = "Mobile lookup requires organisation scope. Use LookupForStaffInvite for staff invites.",
                        });
                    }
                    // Always scope to caller's own organisation; never trust arbitrary organisationid.
                    item.organisationid = ctx.organisationid;
                }
                else if (item.id <= 0 && item.organisationid <= 0)
                {
                    // Prevent unbounded table dump.
                    item.id = ctx.userid;
                }
                else if (item.id <= 0 && item.organisationid > 0 && item.organisationid != ctx.organisationid)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new ActionRes<List<Users>>
                    {
                        error = "Access denied for another organisation.",
                    });
                }
            }

            var rows = await usersService.Select(item);
            if (!ctx.issuperadmin && item.id > 0 && item.id != ctx.userid)
            {
                // Only allow reading another user's record if they belong to the caller's org.
                rows = rows
                    .Where(u => ctx.organisationid > 0 && u.organisationid == ctx.organisationid)
                    .ToList();
            }

            result.item = rows;

            return Ok(result);
        }

        /// <summary>
        /// Org-admin staff invite phone lookup. Does not return name/email for users outside the caller's org.
        /// Rate-limited per caller.
        /// </summary>
        [HttpPost("LookupForStaffInvite")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<StaffInviteLookupRes>>> LookupForStaffInvite(
            ActionReq<StaffInviteLookupReq> req)
        {
            var ctx = requestState.usercontext;
            if (ctx == null || ctx.userid <= 0 || ctx.organisationid <= 0)
            {
                return Unauthorized(new ActionRes<StaffInviteLookupRes>
                {
                    error = "Organisation admin authentication required.",
                });
            }

            var callerRecord = (await usersService.Select(new UsersSelectReq { id = ctx.userid })).FirstOrDefault();
            if (!StaffInvitePrivacy.IsOrgAdminForStaffInvite(callerRecord, ctx.organisationid))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ActionRes<StaffInviteLookupRes>
                {
                    error = "Organisation admin permission required to look up staff.",
                });
            }

            var mobile = (req?.item?.mobile ?? "").Trim();
            if (string.IsNullOrEmpty(mobile))
            {
                return BadRequest(new ActionRes<StaffInviteLookupRes>
                {
                    error = "mobile is required.",
                });
            }

            // Rate limit: 20 lookups / minute / user (and per IP as secondary key).
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var minuteBucket = DateTime.UtcNow.ToString("yyyyMMddHHmm");
            var rateKey = $"staff-invite-lookup:{ctx.userid}:{ip}:{minuteBucket}";
            var count = memoryCache.GetOrCreate(rateKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
                return 0;
            });
            count++;
            memoryCache.Set(rateKey, count, TimeSpan.FromMinutes(2));
            if (count > 20)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new ActionRes<StaffInviteLookupRes>
                {
                    error = "Too many lookup attempts. Please wait a minute and try again.",
                });
            }

            var item = await usersService.LookupForStaffInvite(mobile, ctx.organisationid);
            return Ok(new ActionRes<StaffInviteLookupRes> { item = item });
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

