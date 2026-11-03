using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/reports")]
    [Authenticate]
    public class OrganisationReportsController : ControllerBase
    {
        private readonly ReportDefinitionService _definitions;
        private readonly ReportExecutionService _execution;
        private readonly ReportExportService _exports;
        private readonly ReportParameterOptionsService _options;
        private readonly ReportCatalogSeedService _catalog;
        private readonly RequestState _requestState;

        public OrganisationReportsController(
            ReportDefinitionService definitions,
            ReportExecutionService execution,
            ReportExportService exports,
            ReportParameterOptionsService options,
            ReportCatalogSeedService catalog,
            RequestState requestState)
        {
            _definitions = definitions;
            _execution = execution;
            _exports = exports;
            _options = options;
            _catalog = catalog;
            _requestState = requestState;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<ReportListItemDto>>>> List()
        {
            try
            {
                var orgId = RequireOrg();
                try { await _catalog.EnsurePriorityCatalog(); } catch { /* listing should still work */ }
                var item = await _definitions.ListForOrganisation(orgId);
                return Ok(new ActionRes<List<ReportListItemDto>> { item = item });
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
                var item = await _execution.GetRunnableReport(id);
                return Ok(new ActionRes<ReportDefinitionDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/execute")]
        public async Task<ActionResult<ActionRes<ReportExecutionResult>>> Execute(long id, [FromBody] ReportExecuteReq? body)
        {
            try
            {
                var item = await _execution.ExecuteForOrganisation(id, body ?? new ReportExecuteReq());
                // Strip SQL from nested report payload.
                if (item.report != null) item.report.sql_query = "";
                return Ok(new ActionRes<ReportExecutionResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/export")]
        public async Task<IActionResult> Export(long id, [FromBody] ReportExportReq? body)
        {
            try
            {
                var req = body ?? new ReportExportReq();
                var (bytes, contentType, fileName) = await _exports.ExportForOrganisation(id, req);
                return File(bytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}/parameter-options/{parameterName}")]
        public async Task<ActionResult<ActionRes<List<ReportOptionItem>>>> ParameterOptions(long id, string parameterName)
        {
            try
            {
                var report = await _execution.GetRunnableReport(id);
                var param = report.parameters.FirstOrDefault(p =>
                    string.Equals(p.parameter_name, parameterName, StringComparison.OrdinalIgnoreCase));
                if (param == null) return NotFound(new { success = false, message = "Parameter not found." });
                var item = await _options.ResolveOne(param, RequireOrg());
                return Ok(new ActionRes<List<ReportOptionItem>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private long RequireOrg()
        {
            var ctx = _requestState.usercontext;
            if (ctx == null || ctx.organisationid <= 0)
                throw new Exception("Organisation is required.");
            return ctx.organisationid;
        }
    }
}
