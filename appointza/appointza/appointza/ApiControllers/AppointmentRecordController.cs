using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentRecordController : ControllerBase
    {
        ILogger<AppointmentRecordController> logger;
        AppointmentRecordService appointmentRecordService;
        
        public AppointmentRecordController(ILogger<AppointmentRecordController> logger, AppointmentRecordService appointmentRecordService)
        {
            this.logger = logger;
            this.appointmentRecordService = appointmentRecordService;
        }
        
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<AppointmentRecord>>> Entity()
        {
            ActionRes<AppointmentRecord> result = new ActionRes<AppointmentRecord>()
            {
                item = new AppointmentRecord()
            };

            return Ok(result);
        }
        
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<AppointmentRecord>>>> Select(ActionReq<AppointmentRecordSelectReq> req)
        {
            ActionRes<List<AppointmentRecord>> result = new ActionRes<List<AppointmentRecord>>();

            result.item = await appointmentRecordService.Select(req.item);

            return Ok(result);
        }
        
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<AppointmentRecord>>> Insert(ActionReq<AppointmentRecord> req)
        {
            ActionRes<AppointmentRecord> result = new ActionRes<AppointmentRecord>();

            // Log incoming data for debugging
            logger.LogInformation("Insert AppointmentRecord - FileIds object: {FileIds}", 
                System.Text.Json.JsonSerializer.Serialize(req.item.fileids));
            logger.LogInformation("Insert AppointmentRecord - FileIds JSON: {FileIdsJson}", 
                req.item.fileids_json);

            // Ensure fileids_json is populated by accessing the property (triggers getter)
            var _ = req.item.fileids_json;

            result.item = await appointmentRecordService.Insert(req.item);

            return Ok(result);
        }
        
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<AppointmentRecord>>> Update(ActionReq<AppointmentRecord> req)
        {
            ActionRes<AppointmentRecord> result = new ActionRes<AppointmentRecord>();

            // Log incoming data for debugging
            logger.LogInformation("Update AppointmentRecord - FileIds object: {FileIds}", 
                System.Text.Json.JsonSerializer.Serialize(req.item.fileids));
            logger.LogInformation("Update AppointmentRecord - FileIds JSON: {FileIdsJson}", 
                req.item.fileids_json);

            // Ensure fileids_json is populated by accessing the property (triggers getter)
            var _ = req.item.fileids_json;

            result.item = await appointmentRecordService.Update(req.item);

            return Ok(result);
        }
        
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<AppointmentRecord>>> Save(ActionReq<AppointmentRecord> req)
        {
            ActionRes<AppointmentRecord> result = new ActionRes<AppointmentRecord>();

            if (req.item.id > 0)
            {
                result.item = await appointmentRecordService.Update(req.item);
            }
            else
            {
                result.item = await appointmentRecordService.Insert(req.item);
            }

            return Ok(result);
        }
        
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<AppointmentRecordDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await appointmentRecordService.Delete(req.item);

            return Ok(result);
        }
    }
}

