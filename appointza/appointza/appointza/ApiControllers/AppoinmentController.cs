using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppoinmentController : ControllerBase
    {
        ILogger<AppoinmentController> logger;
        AppoinmentService appoinmentService;
        public AppoinmentController(ILogger<AppoinmentController> logger, AppoinmentService appoinmentService)
        {
            this.logger = logger;
            this.appoinmentService = appoinmentService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Appoinment>>> Entity()
        {
            ActionRes<Appoinment> result = new ActionRes<Appoinment>()
            {
               item = new Appoinment()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Appoinment>>>> Select(ActionReq<AppoinmentSelectReq> req)
        {
            ActionRes<List<Appoinment>> result = new ActionRes<List<Appoinment>>();

            result.item = await appoinmentService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Appoinment>>> Insert(ActionReq<Appoinment> req)
        {
            ActionRes<Appoinment> result = new ActionRes<Appoinment>();

            result.item = await appoinmentService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Appoinment>>> Update(ActionReq<Appoinment> req)
        {
            ActionRes<Appoinment> result = new ActionRes<Appoinment>();

            result.item = await appoinmentService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Appoinment>>> Save(ActionReq<Appoinment> req)
        {
            ActionRes<Appoinment> result = new ActionRes<Appoinment>();

            if(req.item.id > 0){
                result.item = await appoinmentService.Update(req.item);
            }else{
                result.item = await appoinmentService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<AppoinmentDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await appoinmentService.Delete(req.item);

            return Ok(result);
        }


        [HttpPost("SelectBookedAppoinment")]
        public async Task<ActionResult<ActionRes<List<BookedAppoinmentRes>>>> SelectBookedAppoinment(ActionReq<AppoinmentSelectReq> req)
        {
            try
            {
                ActionRes<List<BookedAppoinmentRes>> result = new ActionRes<List<BookedAppoinmentRes>>();

                result.item = await appoinmentService.SelectBookedAppoinment(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in SelectBookedAppoinment endpoint: {Message}\n{StackTrace}", ex.Message, ex.StackTrace);
                return StatusCode(500, new ActionRes<List<BookedAppoinmentRes>> 
                { 
                    item = new List<BookedAppoinmentRes>(),
                    error = $"Error: {ex.Message}"
                });
            }
        }


        [HttpPost("Assignstaff")]
        public async Task<ActionResult<ActionRes<bool>>> Assignstaff(ActionReq<AddStaffReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await appoinmentService.Assignstaff(req.item);

            return Ok(result);
        }

        [HttpPost("UpdateStatus")]
        public async Task<ActionResult<ActionRes<bool>>> UpdateStatus(ActionReq<UpdateStatusReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await appoinmentService.UpdateStatus(req.item);

            return Ok(result);
        }

        [HttpPost("CancelAppointment")]
        public async Task<ActionResult<ActionRes<bool>>> CancelAppointment(ActionReq<UpdateStatusReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await appoinmentService.CancelAppointment(req.item);

            return Ok(result);
        }

        // TODO: Future implementation - Payment integration
        // [HttpPost("UpdatePayment")]
        // public async Task<ActionResult<ActionRes<bool>>> UpdatePayment(ActionReq<UpdatePaymentReq> req)
        // {
        //     ActionRes<bool> result = new ActionRes<bool>();
        //
        //     result.item = await appoinmentService.UpdatePayment(req.item);
        //
        //     return Ok(result);
        // }

        [HttpPost("GetAppointmentSummary")]
        public async Task<ActionResult<ActionRes<AppointmentSummary>>> GetAppointmentSummary(ActionReq<AppointmentSummarySelectReq> req)
        {
            try
            {
                ActionRes<AppointmentSummary> result = new ActionRes<AppointmentSummary>();

                result.item = await appoinmentService.GetAppointmentSummary(req.item);

                return Ok(result);
            }
            catch (Exception)
            {
                // Temporarily comment out logger to test if API works
                // logger.LogError(ex, "Error getting appointment summary for appointment ID: {AppointmentId}", req.item.AppointmentId);
                /*Console.WriteLine($"Error getting appointment summary for appointment ID: {req.appointmentid.to}: {ex.Message}");*/
                return BadRequest(new ActionRes<AppointmentSummary> { item = null });
            }
        }

        // Task Management Endpoints
        [HttpPost("AddAppointmentTask")]
        public async Task<ActionResult<ActionRes<ReferenceValue>>> AddAppointmentTask(ActionReq<AddAppointmentTaskReq> req)
        {
            try
            {
                ActionRes<ReferenceValue> result = new ActionRes<ReferenceValue>();

                result.item = await appoinmentService.AddAppointmentTask(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding appointment task");
                return BadRequest(new ActionRes<ReferenceValue> { item = null });
            }
        }

        [HttpPost("GetAppointmentTasks")]
        public async Task<ActionResult<ActionRes<List<ReferenceValue>>>> GetAppointmentTasks(ActionReq<GetAppointmentTasksReq> req)
        {
            try
            {
                ActionRes<List<ReferenceValue>> result = new ActionRes<List<ReferenceValue>>();

                result.item = await appoinmentService.GetAppointmentTasks(req.item.appointmentid, req.item.organizationid);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting appointment tasks");
                return BadRequest(new ActionRes<List<ReferenceValue>> { item = new List<ReferenceValue>() });
            }
        }

        [HttpPost("UpdateAppointmentTask")]
        public async Task<ActionResult<ActionRes<bool>>> UpdateAppointmentTask(ActionReq<UpdateAppointmentTaskReq> req)
        {
            try
            {
                ActionRes<bool> result = new ActionRes<bool>();

                result.item = await appoinmentService.UpdateAppointmentTask(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating appointment task");
                return BadRequest(new ActionRes<bool> { item = false });
            }
        }

        [HttpPost("DeleteAppointmentTask")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteAppointmentTask(ActionReq<DeleteAppointmentTaskReq> req)
        {
            try
            {
                ActionRes<bool> result = new ActionRes<bool>();

                result.item = await appoinmentService.DeleteAppointmentTask(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting appointment task");
                return BadRequest(new ActionRes<bool> { item = false });
            }
        }

        [HttpPost("SearchByMobile")]
        public async Task<ActionResult<ActionRes<List<BookedAppoinmentRes>>>> SearchByMobile(ActionReq<SearchAppointmentByMobileReq> req)
        {
            try
            {
                ActionRes<List<BookedAppoinmentRes>> result = new ActionRes<List<BookedAppoinmentRes>>();

                result.item = await appoinmentService.SearchAppointmentsByMobile(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error searching appointments by mobile");
                return BadRequest(new ActionRes<List<BookedAppoinmentRes>> { item = new List<BookedAppoinmentRes>() });
            }
        }

        [HttpPost("SelectUniqueClients")]
        public async Task<ActionResult<ActionRes<List<ClientInfoRes>>>> SelectUniqueClients(ActionReq<ClientsSelectReq> req)
        {
            try
            {
                ActionRes<List<ClientInfoRes>> result = new ActionRes<List<ClientInfoRes>>();
                result.item = await appoinmentService.SelectUniqueClients(req.item);
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error selecting unique clients");
                return BadRequest(new ActionRes<List<ClientInfoRes>> { item = new List<ClientInfoRes>() });
            }
        }

    }
}
