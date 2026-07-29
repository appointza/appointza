using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReferenceTypeController : ControllerBase
    {
        ILogger<ReferenceTypeController> logger;
        ReferenceTypeService referencetypeService;
        public ReferenceTypeController(ILogger<ReferenceTypeController> logger, ReferenceTypeService referencetypeService)
        {
            this.logger = logger;
            this.referencetypeService = referencetypeService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<ReferenceType>>> Entity()
        {
            ActionRes<ReferenceType> result = new ActionRes<ReferenceType>()
            {
               item = new ReferenceType()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<ReferenceType>>>> Select(ActionReq<ReferenceTypeSelectReq> req)
        {
            ActionRes<List<ReferenceType>> result = new ActionRes<List<ReferenceType>>();

            result.item = await referencetypeService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<ReferenceType>>> Insert(ActionReq<ReferenceType> req)
        {
            ActionRes<ReferenceType> result = new ActionRes<ReferenceType>();

            result.item = await referencetypeService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<ReferenceType>>> Update(ActionReq<ReferenceType> req)
        {
            ActionRes<ReferenceType> result = new ActionRes<ReferenceType>();

            result.item = await referencetypeService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<ReferenceType>>> Save(ActionReq<ReferenceType> req)
        {
            ActionRes<ReferenceType> result = new ActionRes<ReferenceType>();

            if(req.item.id > 0){
                result.item = await referencetypeService.Update(req.item);
            }else{
                result.item = await referencetypeService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<ReferenceTypeDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await referencetypeService.Delete(req.item);

            return Ok(result);
        }
    }
}
