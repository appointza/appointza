using appointza.Models;
using CampusModels = appointza.Models.Campusza;
using appointza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentTermController : ControllerBase
    {
        ILogger<StudentTermController> logger;
        StudentTermService studentTermService;

        public StudentTermController(ILogger<StudentTermController> logger, StudentTermService studentTermService)
        {
            this.logger = logger;
            this.studentTermService = studentTermService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentTerm>>> Entity()
        {
            ActionRes<CampusModels.StudentTerm> result = new ActionRes<CampusModels.StudentTerm>()
            {
               item = new CampusModels.StudentTerm()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StudentTerm>>>> Select(ActionReq<CampusModels.StudentTermSelectReq> req)
        {
            ActionRes<List<CampusModels.StudentTerm>> result = new ActionRes<List<CampusModels.StudentTerm>>();

            result.item = await studentTermService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentTerm>>> Insert(ActionReq<CampusModels.StudentTerm> req)
        {
            ActionRes<CampusModels.StudentTerm> result = new ActionRes<CampusModels.StudentTerm>();

            result.item = await studentTermService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentTerm>>> Update(ActionReq<CampusModels.StudentTerm> req)
        {
            ActionRes<CampusModels.StudentTerm> result = new ActionRes<CampusModels.StudentTerm>();

            result.item = await studentTermService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentTerm>>> Save(ActionReq<CampusModels.StudentTerm> req)
        {
            ActionRes<CampusModels.StudentTerm> result = new ActionRes<CampusModels.StudentTerm>();

            if(req.item.id > 0){
                result.item = await studentTermService.Update(req.item);
            }else{
                result.item = await studentTermService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.StudentTermDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await studentTermService.Delete(req.item);

            return Ok(result);
        }
    }
}
