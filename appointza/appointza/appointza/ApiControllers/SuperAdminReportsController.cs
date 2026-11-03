using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/superadmin/reports")]
    [SuperAdminAuthenticate]
    public class SuperAdminReportsController : ControllerBase
    {
        private readonly ReportDefinitionService _definitions;
        private readonly ReportExecutionService _execution;
        private readonly ReportExportService _exports;
        private readonly ReportCatalogSeedService _catalog;
        private readonly ReportDemoDataSeedService _demoData;

        public SuperAdminReportsController(
            ReportDefinitionService definitions,
            ReportExecutionService execution,
            ReportExportService exports,
            ReportCatalogSeedService catalog,
            ReportDemoDataSeedService demoData)
        {
            _definitions = definitions;
            _execution = execution;
            _exports = exports;
            _catalog = catalog;
            _demoData = demoData;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<ReportListItemDto>>>> List()
        {
            try
            {
                await _catalog.EnsurePriorityCatalog();
                var item = await _definitions.ListAll();
                return Ok(new ActionRes<List<ReportListItemDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("seed-catalog")]
        public async Task<ActionResult<ActionRes<object>>> SeedCatalog()
        {
            try
            {
                await _catalog.EnsurePriorityCatalog(force: true);
                var item = await _definitions.ListAll();
                return Ok(new ActionRes<object>
                {
                    item = new { seeded = true, count = item.Count },
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("seed-demo-data")]
        public async Task<ActionResult<ActionRes<object>>> SeedDemoData([FromBody] ReportDemoSeedReq? body)
        {
            try
            {
                var orgId = body?.organisation_id ?? 0;
                if (orgId <= 0) throw new Exception("organisation_id is required.");
                await _catalog.EnsurePriorityCatalog();
                var item = await _demoData.SeedForOrganisation(orgId);
                return Ok(new ActionRes<object> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ActionRes<ReportDefinitionDto>>> Get(long id)
        {
            try
            {
                var item = await _definitions.GetById(id);
                if (item == null) return NotFound(new { success = false, message = "Report not found." });
                return Ok(new ActionRes<ReportDefinitionDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ActionRes<ReportDefinitionDto>>> Save([FromBody] ReportDefinitionUpsertReq? body)
        {
            try
            {
                var item = await _definitions.Save(body ?? new ReportDefinitionUpsertReq());
                return Ok(new ActionRes<ReportDefinitionDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/active")]
        public async Task<ActionResult<ActionRes<bool>>> SetActive(long id, [FromBody] ReportActiveReq? body)
        {
            try
            {
                var ok = await _definitions.SetActive(id, body?.is_active ?? true);
                if (!ok) return NotFound(new { success = false, message = "Report not found." });
                return Ok(new ActionRes<bool> { item = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id:long}")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(long id)
        {
            try
            {
                var ok = await _definitions.Delete(id);
                if (!ok) return NotFound(new { success = false, message = "Report not found." });
                return Ok(new ActionRes<bool> { item = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("validate")]
        public ActionResult<ActionRes<ReportValidateResult>> Validate([FromBody] ReportValidateReq? body)
        {
            try
            {
                var item = _definitions.ValidateSql(body?.sql_query ?? "");
                return Ok(new ActionRes<ReportValidateResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("preview")]
        public async Task<ActionResult<ActionRes<ReportExecutionResult>>> Preview([FromBody] ReportPreviewReq? body)
        {
            try
            {
                var item = await _execution.Preview(body ?? new ReportPreviewReq());
                return Ok(new ActionRes<ReportExecutionResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("preview/export")]
        public async Task<IActionResult> PreviewExport(
            [FromQuery] string format = "csv",
            [FromBody] ReportPreviewReq? body = null)
        {
            try
            {
                var (bytes, contentType, fileName) = await _exports.ExportPreview(body ?? new ReportPreviewReq(), format);
                return File(bytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class ReportActiveReq
    {
        public bool is_active { get; set; } = true;
    }

    public class ReportDemoSeedReq
    {
        public long organisation_id { get; set; }
    }
}
