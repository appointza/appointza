using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimelineController : ControllerBase
    {
        ILogger<TimelineController> logger;
        TimelineService timelineService;
        public TimelineController(ILogger<TimelineController> logger, TimelineService timelineService)
        {
            this.logger = logger;
            this.timelineService = timelineService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Timeline>>> Entity()
        {
            ActionRes<Timeline> result = new ActionRes<Timeline>()
            {
               item = new Timeline()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Timeline>>>> Select(ActionReq<TimelineSelectReq> req)
        {
            ActionRes<List<Timeline>> result = new ActionRes<List<Timeline>>();

            result.item = await timelineService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Timeline>>> Insert(ActionReq<Timeline> req)
        {
            ActionRes<Timeline> result = new ActionRes<Timeline>();

            result.item = await timelineService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Timeline>>> Update(ActionReq<Timeline> req)
        {
            ActionRes<Timeline> result = new ActionRes<Timeline>();

            result.item = await timelineService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Timeline>>> Save(ActionReq<Timeline> req)
        {
            ActionRes<Timeline> result = new ActionRes<Timeline>();

            if(req.item.id > 0){
                result.item = await timelineService.Update(req.item);
            }else{
                result.item = await timelineService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<TimelineDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await timelineService.Delete(req.item);

            return Ok(result);
        }
    }
}
