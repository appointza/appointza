using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Models.Campusza;
using appointza.Services.Campusza;

namespace appointza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentPromotionController : ControllerBase
    {
        private StudentPromotionService studentPromotionService;

        public StudentPromotionController(StudentPromotionService service)
        {
            studentPromotionService = service;
        }

        [HttpPost("GetAcademicHistory")]
        public async Task<ActionResult<ActionRes<List<StudentAcademicHistory>>>> GetAcademicHistory(ActionReq<StudentPromotionSelectReq> req)
        {
            ActionRes<List<StudentAcademicHistory>> result = new ActionRes<List<StudentAcademicHistory>>();
            result.item = await studentPromotionService.GetStudentAcademicHistory(req.item.studentid, req.item.organizationid);
            return Ok(result);
        }

        [HttpPost("SelectPromotions")]
        public async Task<ActionResult<ActionRes<List<StudentPromotion>>>> SelectPromotions(ActionReq<StudentPromotionSelectReq> req)
        {
            ActionRes<List<StudentPromotion>> result = new ActionRes<List<StudentPromotion>>();
            result.item = await studentPromotionService.SelectPromotions(req.item);
            return Ok(result);
        }

        [HttpPost("BulkPromote")]
        public async Task<ActionResult<ActionRes<List<StudentPromotion>>>> BulkPromote(ActionReq<BulkPromotionRequest> req)
        {
            if (req.item == null || req.item.studentids == null || req.item.studentids.Count == 0)
            {
                return BadRequest(new ActionRes<List<StudentPromotion>>
                {
                    item = null
                });
            }

            ActionRes<List<StudentPromotion>> result = new ActionRes<List<StudentPromotion>>();
            result.item = await studentPromotionService.BulkPromoteStudents(req.item);
            return Ok(result);
        }
    }
}
