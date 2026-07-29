using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;
using appointza.Utils;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnquiryController : ControllerBase
    {
        ILogger<EnquiryController> logger;
        EnquiryService enquiryService;
        
        public EnquiryController(ILogger<EnquiryController> logger, EnquiryService enquiryService)
        {
            this.logger = logger;
            this.enquiryService = enquiryService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Enquiry>>> Entity()
        {
            ActionRes<Enquiry> result = new ActionRes<Enquiry>()
            {
                item = new Enquiry()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Enquiry>>>> Select(ActionReq<EnquirySelectReq> req)
        {
            ActionRes<List<Enquiry>> result = new ActionRes<List<Enquiry>>();

            result.item = await enquiryService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Enquiry>>> Insert(ActionReq<Enquiry> req)
        {
            ActionRes<Enquiry> result = new ActionRes<Enquiry>();

            try
            {
                logger.LogInformation("Enquiry Insert request received: Name={Name}, Email={Email}, Source={Source}", 
                    req.item?.name, req.item?.email, req.item?.source);
                
                result.item = await enquiryService.Insert(req.item);
                
                logger.LogInformation("Enquiry Insert successful: ID={Id}", result.item?.id);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error inserting enquiry: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message, message = "Failed to save enquiry. Please try again." });
            }

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Enquiry>>> Update(ActionReq<Enquiry> req)
        {
            ActionRes<Enquiry> result = new ActionRes<Enquiry>();

            result.item = await enquiryService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Enquiry>>> Save(ActionReq<Enquiry> req)
        {
            ActionRes<Enquiry> result = new ActionRes<Enquiry>();

            if (req.item.id > 0)
            {
                result.item = await enquiryService.Update(req.item);
            }
            else
            {
                result.item = await enquiryService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<EnquiryDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await enquiryService.Delete(req.item);

            return Ok(result);
        }
    }
}

