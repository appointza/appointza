using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;
using appointza.Utils;
using appointza.Authentication.Utils;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authenticate]
    public class StaffController : ControllerBase
    {
        ILogger<StaffController> logger;
        StaffService staffService;
        public StaffController(ILogger<StaffController> logger, StaffService staffService)
        {
            this.logger = logger;
            this.staffService = staffService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Staff>>> Entity()
        {
            ActionRes<Staff> result = new ActionRes<Staff>()
            {
               item = new Staff()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Staff>>>> Select(ActionReq<StaffSelectReq> req)
        {
            ActionRes<List<Staff>> result = new ActionRes<List<Staff>>();

            result.item = await staffService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Staff>>> Insert(ActionReq<Staff> req)
        {
            ActionRes<Staff> result = new ActionRes<Staff>();

            result.item = await staffService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Staff>>> Update(ActionReq<Staff> req)
        {
            ActionRes<Staff> result = new ActionRes<Staff>();

            result.item = await staffService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Staff>>> Save(ActionReq<Staff> req)
        {
            ActionRes<Staff> result = new ActionRes<Staff>();

            if(req.item.id > 0){
                result.item = await staffService.Update(req.item);
            }else{
                result.item = await staffService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<StaffDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await staffService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("SelectStaffDetail")]
        public async Task<ActionResult<ActionRes<List<staffuser>>>> SelectStaffDetail(ActionReq<StaffSelectReq> req)
        {
            ActionRes<List<staffuser>> result = new ActionRes<List<staffuser>>();

            result.item = await staffService.SelectStaffDetail(req.item);

            return Ok(result);
        }
    }
}
