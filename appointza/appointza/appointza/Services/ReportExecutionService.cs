using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Diagnostics;
using System.Globalization;
using System.Text.Json;

namespace appointza.Services
{
    public class ReportExecutionService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly ReportDefinitionService _definitions;
        private readonly ReportParameterOptionsService _options;
        private readonly ILogger<ReportExecutionService> _logger;

        public ReportExecutionService(
            IDbProvider dbProvider,
            RequestState requestState,
            ReportDefinitionService definitions,
            ReportParameterOptionsService options,
            ILogger<ReportExecutionService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _definitions = definitions;
            _options = options;
            _logger = logger;
        }

        public async Task<ReportExecutionResult> Preview(ReportPreviewReq req)
        {
            long orgId = req.organisation_id.GetValueOrDefault();
            if (orgId <= 0) orgId = RequireOrgOptional();
            if (orgId <= 0)
                throw new Exception("organisation_id is required for preview.");

            string sql;
            ReportDefinitionDto? report = null;
            int maxRows = Math.Clamp(req.sample_limit <= 0 ? 50 : req.sample_limit, 1, 500);

            if (req.report_id.GetValueOrDefault() > 0)
            {
                report = await _definitions.GetById(req.report_id!.Value)
                    ?? throw new Exception("Report not found.");
                sql = report.sql_query;
                maxRows = Math.Min(maxRows, report.max_rows);
            }
            else
            {
                var validation = ReportSqlQueryValidator.Validate(req.sql_query);
                if (!validation.is_valid)
                    throw new Exception(string.Join(" ", validation.errors));
                sql = ReportSqlParameterParser.NormalizeOrgPlaceholders(req.sql_query!.Trim());
            }

            return await ExecuteInternal(sql, report, orgId, req.parameters ?? new(), maxRows, report?.timeout_seconds ?? 30, log: false);
        }

        public async Task<ReportExecutionResult> ExecuteForOrganisation(long reportId, ReportExecuteReq req)
        {
            long orgId = RequireOrg();
            var report = await _definitions.GetById(reportId)
                ?? throw new Exception("Report not found.");
            if (!report.is_active || !report.is_published)
                throw new Exception("Report is not available.");

            await EnsureOrgCanView(report, orgId);
            await _options.ResolveOptions(report, orgId);

            ValidateRequiredParameters(report, req.parameters ?? new());

            int limit = req.limit.GetValueOrDefault(report.max_rows);
            limit = Math.Clamp(limit, 1, Math.Min(report.max_rows, 50000));

            return await ExecuteInternal(
                report.sql_query,
                report,
                orgId,
                req.parameters ?? new(),
                limit,
                report.timeout_seconds,
                log: true);
        }

        public async Task<ReportDefinitionDto> GetRunnableReport(long reportId)
        {
            long orgId = RequireOrg();
            var report = await _definitions.GetById(reportId)
                ?? throw new Exception("Report not found.");
            if (!report.is_active || !report.is_published)
                throw new Exception("Report is not available.");
            await EnsureOrgCanView(report, orgId);
            await _options.ResolveOptions(report, orgId);
            // Never send raw SQL to organisation clients.
            report.sql_query = "";
            return report;
        }

        private async Task EnsureOrgCanView(ReportDefinitionDto report, long organisationId)
        {
            if (report.permissions == null || report.permissions.Count == 0) return;
            var allowed = report.permissions.Any(p =>
                p.can_view &&
                (!p.organisation_id.HasValue || p.organisation_id.Value == 0 || p.organisation_id.Value == organisationId));
            if (!allowed) throw new Exception("You do not have permission to view this report.");
        }

        public Task EnsureOrgCanExport(ReportDefinitionDto report) =>
            EnsureOrgCanExport(report, RequireOrg());

        public async Task EnsureOrgCanExport(ReportDefinitionDto report, long organisationId)
        {
            await EnsureOrgCanView(report, organisationId);
            if (report.permissions == null || report.permissions.Count == 0) return;
            var allowed = report.permissions.Any(p =>
                p.can_export &&
                (!p.organisation_id.HasValue || p.organisation_id.Value == 0 || p.organisation_id.Value == organisationId));
            if (!allowed) throw new Exception("You do not have permission to export this report.");
        }

        private static void ValidateRequiredParameters(ReportDefinitionDto report, Dictionary<string, object?> values)
        {
            foreach (var p in report.parameters.Where(x => x.is_required && x.is_visible))
            {
                if (!values.TryGetValue(p.parameter_name, out var raw) || raw == null || string.IsNullOrWhiteSpace(Convert.ToString(raw)))
                {
                    // Also accept case-insensitive keys
                    var match = values.FirstOrDefault(kv =>
                        string.Equals(kv.Key, p.parameter_name, StringComparison.OrdinalIgnoreCase));
                    if (match.Key == null || match.Value == null || string.IsNullOrWhiteSpace(Convert.ToString(match.Value)))
                        throw new Exception($"Parameter '{(string.IsNullOrWhiteSpace(p.display_name) ? p.parameter_name : p.display_name)}' is required.");
                }
            }
        }

        private async Task<ReportExecutionResult> ExecuteInternal(
            string sql,
            ReportDefinitionDto? report,
            long organisationId,
            Dictionary<string, object?> parameters,
            int maxRows,
            int timeoutSeconds,
            bool log)
        {
            var validation = ReportSqlQueryValidator.Validate(sql);
            if (!validation.is_valid)
                throw new Exception(string.Join(" ", validation.errors));

            sql = ReportSqlParameterParser.NormalizeOrgPlaceholders(sql);
            var sw = Stopwatch.StartNew();
            var result = new ReportExecutionResult { report = report };

            try
            {
                using var db = await _dbProvider.GetDb();
                await db.Connect();

                // Wrap with row limit for safety (Postgres).
                string limitedSql = $@"SELECT * FROM ({sql.Trim().TrimEnd(';')}) AS report_q LIMIT {maxRows}";

                using (var cmd = db.GetCommand(limitedSql))
                {
                    try { cmd.CommandTimeout = Math.Clamp(timeoutSeconds, 5, 120); } catch { /* provider may ignore */ }

                    // Always bind tenant id from server context — never from client params.
                    db.AddParameter(cmd, "OrgId", DbTypes.Types.Long).Value = organisationId;

                    var declared = ReportSqlParameterParser.DetectParameters(sql);
                    foreach (var name in declared)
                    {
                        var value = FindParam(parameters, name);
                        var meta = report?.parameters.FirstOrDefault(p =>
                            string.Equals(p.parameter_name, name, StringComparison.OrdinalIgnoreCase));
                        BindTyped(db, cmd, name, value, meta);
                    }

                    // Fully consume + dispose the reader before any follow-up command on this connection.
                    using var reader = await db.Execute(cmd);
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        result.columns.Add(reader.GetName(i));
                    }

                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var col = reader.GetName(i);
                            row[col] = reader.IsDBNull(i) ? null : NormalizeCell(reader.GetValue(i));
                        }
                        result.rows.Add(row);
                    }
                }

                result.row_count = result.rows.Count;
                sw.Stop();
                result.duration_ms = (int)sw.ElapsedMilliseconds;

                if (log && report != null)
                {
                    await WriteLog(db, report.id, organisationId, parameters, result.row_count, result.duration_ms, true, "");
                }
            }
            catch (Exception ex)
            {
                sw.Stop();
                result.duration_ms = (int)sw.ElapsedMilliseconds;
                _logger.LogWarning(ex, "Report execution failed for org {OrgId}", organisationId);
                if (log && report != null)
                {
                    try
                    {
                        using var db = await _dbProvider.GetDb();
                        await db.Connect();
                        await WriteLog(db, report.id, organisationId, parameters, 0, result.duration_ms, false, Truncate(ex.Message, 1000));
                    }
                    catch { /* ignore log failures */ }
                }
                throw;
            }

            return result;
        }

        private async Task WriteLog(
            IDb db,
            long reportId,
            long organisationId,
            Dictionary<string, object?> parameters,
            int rowCount,
            int durationMs,
            bool success,
            string error)
        {
            string sql = @"
                INSERT INTO report_execution_logs (
                    report_id, organisation_id, executed_by, parameter_values,
                    row_count, duration_ms, success, error_message, created_at
                ) VALUES (
                    @report_id, @organisation_id, @executed_by, @parameter_values,
                    @row_count, @duration_ms, @success, @error_message, @created_at
                );";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "executed_by", DbTypes.Types.Long).Value = SafeUserId() > 0 ? SafeUserId() : (object)DBNull.Value;
            db.AddParameter(cmd, "parameter_values", DbTypes.Types.String).Value =
                JsonSerializer.Serialize(parameters ?? new Dictionary<string, object?>());
            db.AddParameter(cmd, "row_count", DbTypes.Types.Integer).Value = rowCount;
            db.AddParameter(cmd, "duration_ms", DbTypes.Types.Integer).Value = durationMs;
            db.AddParameter(cmd, "success", DbTypes.Types.Boolean).Value = success;
            db.AddParameter(cmd, "error_message", DbTypes.Types.String).Value = error ?? "";
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private static object? FindParam(Dictionary<string, object?> parameters, string name)
        {
            if (parameters.TryGetValue(name, out var direct)) return direct;
            var match = parameters.FirstOrDefault(kv =>
                string.Equals(kv.Key, name, StringComparison.OrdinalIgnoreCase));
            return match.Key == null ? null : match.Value;
        }

        private static void BindTyped(
            IDb db,
            DbCommand cmd,
            string name,
            object? value,
            ReportParameterDto? meta)
        {
            var dataType = (meta?.data_type ?? GuessType(name)).ToLowerInvariant();
            if (value == null || (value is string s && string.IsNullOrWhiteSpace(s)))
            {
                // NULL binding by type
                var nullType = dataType switch
                {
                    "number" or "int" or "long" => DbTypes.Types.Long,
                    "boolean" or "bool" => DbTypes.Types.Boolean,
                    "date" or "datetime" => DbTypes.Types.DateTime,
                    _ => DbTypes.Types.String,
                };
                db.AddParameter(cmd, name, nullType).Value = DBNull.Value;
                return;
            }

            switch (dataType)
            {
                case "number":
                case "int":
                case "long":
                    db.AddParameter(cmd, name, DbTypes.Types.Long).Value =
                        Convert.ToInt64(Convert.ToString(value, CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);
                    break;
                case "boolean":
                case "bool":
                    db.AddParameter(cmd, name, DbTypes.Types.Boolean).Value =
                        value is bool b ? b : bool.Parse(Convert.ToString(value) ?? "false");
                    break;
                case "date":
                case "datetime":
                    db.AddParameter(cmd, name, DbTypes.Types.DateTime).Value =
                        value is DateTime dt ? dt : DateTime.Parse(Convert.ToString(value)!, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
                    break;
                default:
                    // Multi-select may arrive as array/json — store as CSV string for simple equality/IN helpers in SQL.
                    if (value is JsonElement je)
                    {
                        if (je.ValueKind == JsonValueKind.Array)
                        {
                            var parts = je.EnumerateArray().Select(x => x.ToString()).Where(x => !string.IsNullOrWhiteSpace(x));
                            db.AddParameter(cmd, name, DbTypes.Types.String).Value = string.Join(",", parts);
                        }
                        else
                        {
                            db.AddParameter(cmd, name, DbTypes.Types.String).Value = je.ToString();
                        }
                    }
                    else if (value is System.Collections.IEnumerable enumerable && value is not string)
                    {
                        var parts = new List<string>();
                        foreach (var item in enumerable)
                        {
                            var part = Convert.ToString(item);
                            if (!string.IsNullOrWhiteSpace(part)) parts.Add(part);
                        }
                        db.AddParameter(cmd, name, DbTypes.Types.String).Value = string.Join(",", parts);
                    }
                    else
                    {
                        db.AddParameter(cmd, name, DbTypes.Types.String).Value = Convert.ToString(value) ?? "";
                    }
                    break;
            }
        }

        private static string GuessType(string name)
        {
            var n = name.ToLowerInvariant();
            if (n.Contains("date") || n.Contains("time")) return "date";
            if (n.EndsWith("id") || n.Contains("amount") || n.Contains("count")) return "number";
            if (n.StartsWith("is")) return "boolean";
            return "string";
        }

        private static object? NormalizeCell(object value)
        {
            if (value is DateTime dt) return dt.ToString("o");
            if (value is DateTimeOffset dto) return dto.UtcDateTime.ToString("o");
            if (value is decimal or double or float or int or long or short or byte) return value;
            if (value is bool) return value;
            return Convert.ToString(value, CultureInfo.InvariantCulture);
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) ? "" : value.Length <= max ? value : value[..max];

        private long RequireOrg()
        {
            try
            {
                var ctx = _requestState.usercontext;
                if (ctx != null && ctx.organisationid > 0) return ctx.organisationid;
            }
            catch { /* ignore */ }
            throw new Exception("Organisation is required.");
        }

        private long RequireOrgOptional()
        {
            try { return _requestState.usercontext?.organisationid ?? 0; }
            catch { return 0; }
        }

        private long SafeUserId()
        {
            try { return _requestState.usercontext?.userid ?? 0; }
            catch { return 0; }
        }
    }
}
