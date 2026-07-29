using appointza.Models;
using appointza.Models.Campusza;
using appointza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        ILogger<UserController> logger;
        UserService userService;

        public UserController(ILogger<UserController> logger, UserService userService)
        {
            this.logger = logger;
            this.userService = userService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<User>>> Entity()
        {
            ActionRes<User> result = new ActionRes<User>()
            {
               item = new User()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<User>>>> Select(ActionReq<UserSelectReq> req)
        {
            ActionRes<List<User>> result = new ActionRes<List<User>>();

            result.item = await userService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<User>>> Insert(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            result.item = await userService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<User>>> Update(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            result.item = await userService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<User>>> Save(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            if(req.item.id > 0){
                result.item = await userService.Update(req.item);
            }else{
                result.item = await userService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<UserDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await userService.Delete(req.item);

            return Ok(result);
        }
    }
}
