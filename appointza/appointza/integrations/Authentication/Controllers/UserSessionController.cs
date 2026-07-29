using appointza.Models;
using appointza.Authentication.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Authentication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserSessionController : ControllerBase
    {
        ILogger<UserSessionController> logger;
        UserSessionService usersessionService;
        public UserSessionController(ILogger<UserSessionController> logger, UserSessionService usersessionService)
        {
            this.logger = logger;
            this.usersessionService = usersessionService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<UserSession>>> Entity()
        {
            ActionRes<UserSession> result = new ActionRes<UserSession>()
            {
               item = new UserSession()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<UserSession>>>> Select(ActionReq<UserSessionSelectReq> req)
        {
            ActionRes<List<UserSession>> result = new ActionRes<List<UserSession>>();

            result.item = await usersessionService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<UserSession>>> Insert(ActionReq<UserSession> req)
        {
            ActionRes<UserSession> result = new ActionRes<UserSession>();

            result.item = await usersessionService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<UserSession>>> Update(ActionReq<UserSession> req)
        {
            ActionRes<UserSession> result = new ActionRes<UserSession>();

            result.item = await usersessionService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<UserSession>>> Save(ActionReq<UserSession> req)
        {
            ActionRes<UserSession> result = new ActionRes<UserSession>();

            if(req.item.id > 0){
                result.item = await usersessionService.Update(req.item);
            }else{
                result.item = await usersessionService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<UserSessionDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await usersessionService.Delete(req.item);

            return Ok(result);
        }
    }
}

