using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationServicesController : ControllerBase
    {
        ILogger<OrganizationServicesController> logger;
        OrganizationServicesService organizationservicesService;
        public OrganizationServicesController(ILogger<OrganizationServicesController> logger, OrganizationServicesService organizationservicesService)
        {
            this.logger = logger;
            this.organizationservicesService = organizationservicesService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganizationServices>>> Entity()
        {
            ActionRes<OrganizationServices> result = new ActionRes<OrganizationServices>()
            {
               item = new OrganizationServices()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganizationServices>>>> Select(ActionReq<OrganizationServicesSelectReq> req)
        {
            ActionRes<List<OrganizationServices>> result = new ActionRes<List<OrganizationServices>>();

            result.item = await organizationservicesService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganizationServices>>> Insert(ActionReq<OrganizationServices> req)
        {
            ActionRes<OrganizationServices> result = new ActionRes<OrganizationServices>();

            result.item = await organizationservicesService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganizationServices>>> Update(ActionReq<OrganizationServices> req)
        {
            ActionRes<OrganizationServices> result = new ActionRes<OrganizationServices>();

            result.item = await organizationservicesService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganizationServices>>> Save(ActionReq<OrganizationServices> req)
        {
            ActionRes<OrganizationServices> result = new ActionRes<OrganizationServices>();

            if(req.item.id > 0){
                result.item = await organizationservicesService.Update(req.item);
            }else{
                result.item = await organizationservicesService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganizationServicesDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organizationservicesService.Delete(req.item);

            return Ok(result);
        }
    }
}
