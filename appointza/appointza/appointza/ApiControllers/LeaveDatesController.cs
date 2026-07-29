using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveDatesController : ControllerBase
    {
        ILogger<LeaveDatesController> logger;
        LeaveDatesService leavedatesService;
        public LeaveDatesController(ILogger<LeaveDatesController> logger, LeaveDatesService leavedatesService)
        {
            this.logger = logger;
            this.leavedatesService = leavedatesService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<LeaveDates>>> Entity()
        {
            ActionRes<LeaveDates> result = new ActionRes<LeaveDates>()
            {
               item = new LeaveDates()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<LeaveDates>>>> Select(ActionReq<LeaveDatesSelectReq> req)
        {
            ActionRes<List<LeaveDates>> result = new ActionRes<List<LeaveDates>>();

            result.item = await leavedatesService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<LeaveDates>>> Insert(ActionReq<LeaveDates> req)
        {
            ActionRes<LeaveDates> result = new ActionRes<LeaveDates>();

            result.item = await leavedatesService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<LeaveDates>>> Update(ActionReq<LeaveDates> req)
        {
            ActionRes<LeaveDates> result = new ActionRes<LeaveDates>();

            result.item = await leavedatesService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<LeaveDates>>> Save(ActionReq<LeaveDates> req)
        {
            ActionRes<LeaveDates> result = new ActionRes<LeaveDates>();

            if(req.item.id > 0){
                result.item = await leavedatesService.Update(req.item);
            }else{
                result.item = await leavedatesService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<LeaveDatesDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await leavedatesService.Delete(req.item);

            return Ok(result);
        }
    }
}
