using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationServicesController : ControllerBase
    {
        ILogger<OrganisationServicesController> logger;
        OrganisationServicesService organisationservicesService;
        public OrganisationServicesController(ILogger<OrganisationServicesController> logger, OrganisationServicesService organisationservicesService)
        {
            this.logger = logger;
            this.organisationservicesService = organisationservicesService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationServices>>> Entity()
        {
            ActionRes<OrganisationServices> result = new ActionRes<OrganisationServices>()
            {
               item = new OrganisationServices()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationServices>>>> Select(ActionReq<OrganisationServicesSelectReq> req)
        {
            ActionRes<List<OrganisationServices>> result = new ActionRes<List<OrganisationServices>>();

            result.item = await organisationservicesService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationServices>>> Insert(ActionReq<OrganisationServices> req)
        {
            ActionRes<OrganisationServices> result = new ActionRes<OrganisationServices>();

            result.item = await organisationservicesService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationServices>>> Update(ActionReq<OrganisationServices> req)
        {
            ActionRes<OrganisationServices> result = new ActionRes<OrganisationServices>();

            result.item = await organisationservicesService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationServices>>> Save(ActionReq<OrganisationServices> req)
        {
            ActionRes<OrganisationServices> result = new ActionRes<OrganisationServices>();

            if(req.item.id > 0){
                result.item = await organisationservicesService.Update(req.item);
            }else{
                result.item = await organisationservicesService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationServicesDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationservicesService.Delete(req.item);

            return Ok(result);
        }
    }
}
