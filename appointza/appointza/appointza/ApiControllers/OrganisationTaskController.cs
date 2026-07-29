using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationTaskController : ControllerBase
    {
        ILogger<OrganisationTaskController> logger;
        OrganisationTaskService organisationtaskService;
        public OrganisationTaskController(ILogger<OrganisationTaskController> logger, OrganisationTaskService organisationtaskService)
        {
            this.logger = logger;
            this.organisationtaskService = organisationtaskService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationTask>>> Entity()
        {
            ActionRes<OrganisationTask> result = new ActionRes<OrganisationTask>()
            {
               item = new OrganisationTask()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationTask>>>> Select(ActionReq<OrganisationTaskSelectReq> req)
        {
            ActionRes<List<OrganisationTask>> result = new ActionRes<List<OrganisationTask>>();

            result.item = await organisationtaskService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationTask>>> Insert(ActionReq<OrganisationTask> req)
        {
            ActionRes<OrganisationTask> result = new ActionRes<OrganisationTask>();

            result.item = await organisationtaskService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationTask>>> Update(ActionReq<OrganisationTask> req)
        {
            ActionRes<OrganisationTask> result = new ActionRes<OrganisationTask>();

            result.item = await organisationtaskService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationTask>>> Save(ActionReq<OrganisationTask> req)
        {
            ActionRes<OrganisationTask> result = new ActionRes<OrganisationTask>();

            if(req.item.id > 0){
                result.item = await organisationtaskService.Update(req.item);
            }else{
                result.item = await organisationtaskService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationTaskDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationtaskService.Delete(req.item);

            return Ok(result);
        }
    }
}
