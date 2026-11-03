using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Text.Json;

namespace appointza.Services
{
    public class ReportDefinitionService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        public ReportDefinitionService(IDbProvider dbProvider, RequestState requestState)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
        }

        public async Task EnsureSchema()
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
        }

        public async Task EnsureSchema(IDb db)
        {
            // Keep in sync with Database/dynamic_reports.sql
            const string sql = @"
CREATE TABLE IF NOT EXISTS report_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(120) NOT NULL DEFAULT 'General',
    sql_query TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    export_excel BOOLEAN NOT NULL DEFAULT TRUE,
    export_csv BOOLEAN NOT NULL DEFAULT TRUE,
    export_pdf BOOLEAN NOT NULL DEFAULT TRUE,
    max_rows INT NOT NULL DEFAULT 5000,
    timeout_seconds INT NOT NULL DEFAULT 30,
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    modified_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_definitions_active ON report_definitions (is_active, is_published, category);
ALTER TABLE report_definitions ADD COLUMN IF NOT EXISTS catalog_key VARCHAR(80) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_definitions_catalog_key
    ON report_definitions (catalog_key) WHERE catalog_key IS NOT NULL AND btrim(catalog_key) <> '';

CREATE TABLE IF NOT EXISTS report_parameters (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    data_type VARCHAR(50) NOT NULL DEFAULT 'string',
    input_type VARCHAR(50) NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    default_value TEXT NOT NULL DEFAULT '',
    options_source VARCHAR(40) NOT NULL DEFAULT 'none',
    options_config TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_parameters_name UNIQUE (report_id, parameter_name)
);

CREATE TABLE IF NOT EXISTS report_columns (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    column_key VARCHAR(120) NOT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    format_type VARCHAR(40) NOT NULL DEFAULT 'text',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_columns_key UNIQUE (report_id, column_key)
);

CREATE TABLE IF NOT EXISTS report_charts (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    chart_type VARCHAR(40) NOT NULL DEFAULT 'none',
    x_column VARCHAR(120) NOT NULL DEFAULT '',
    y_column VARCHAR(120) NOT NULL DEFAULT '',
    title VARCHAR(200) NOT NULL DEFAULT '',
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_permissions (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    organisation_id BIGINT NULL,
    role_key VARCHAR(80) NOT NULL DEFAULT 'org_admin',
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_export BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    organisation_id BIGINT NOT NULL,
    executed_by BIGINT NULL,
    parameter_values TEXT NOT NULL DEFAULT '{}',
    row_count INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_saved_filters (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL DEFAULT '',
    filter_values TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);";
            using var cmd = db.GetCommand(sql);
            await db.ExecuteNonQuery(cmd);
        }

        public ReportValidateResult ValidateSql(string sql) => ReportSqlQueryValidator.Validate(sql);

        public async Task<List<ReportListItemDto>> ListAll(bool publishedOnly = false)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);

            var list = new List<ReportListItemDto>();
            string sql = @"
                SELECT id, name, description, category, COALESCE(catalog_key, '') AS catalog_key,
                       is_active, is_published,
                       export_excel, export_csv, export_pdf, updated_at
                FROM report_definitions
                WHERE (@published_only = FALSE OR (is_published = TRUE AND is_active = TRUE))
                ORDER BY category, name;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "published_only", DbTypes.Types.Boolean).Value = publishedOnly;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(MapListItem(reader));
            }
            return list;
        }

        public async Task<List<ReportListItemDto>> ListForOrganisation(long organisationId)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);

            var list = new List<ReportListItemDto>();
            string sql = @"
                SELECT DISTINCT d.id, d.name, d.description, d.category, COALESCE(d.catalog_key, '') AS catalog_key,
                       d.is_active, d.is_published,
                       d.export_excel, d.export_csv, d.export_pdf, d.updated_at
                FROM report_definitions d
                LEFT JOIN report_permissions p ON p.report_id = d.id
                WHERE d.is_active = TRUE AND d.is_published = TRUE
                  AND (
                    NOT EXISTS (SELECT 1 FROM report_permissions x WHERE x.report_id = d.id)
                    OR p.organisation_id IS NULL
                    OR p.organisation_id = @organisation_id
                  )
                  AND COALESCE(p.can_view, TRUE) = TRUE
                ORDER BY d.category, d.name;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(MapListItem(reader));
            }
            return list;
        }

        private static ReportListItemDto MapListItem(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            name = reader["name"]?.ToString() ?? "",
            description = reader["description"]?.ToString() ?? "",
            category = reader["category"]?.ToString() ?? "",
            catalog_key = reader["catalog_key"]?.ToString() ?? "",
            is_active = reader["is_active"] == DBNull.Value || Convert.ToBoolean(reader["is_active"]),
            is_published = reader["is_published"] != DBNull.Value && Convert.ToBoolean(reader["is_published"]),
            export_excel = reader["export_excel"] == DBNull.Value || Convert.ToBoolean(reader["export_excel"]),
            export_csv = reader["export_csv"] == DBNull.Value || Convert.ToBoolean(reader["export_csv"]),
            export_pdf = reader["export_pdf"] == DBNull.Value || Convert.ToBoolean(reader["export_pdf"]),
            updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
        };

        public async Task<ReportDefinitionDto?> GetById(long id, bool includeChildren = true)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            return await GetByIdTx(db, id, includeChildren);
        }

        public async Task<ReportDefinitionDto> Save(ReportDefinitionUpsertReq req)
        {
            if (string.IsNullOrWhiteSpace(req.name)) throw new Exception("Report name is required.");
            var validation = ReportSqlQueryValidator.Validate(req.sql_query);
            if (!validation.is_valid)
                throw new Exception(string.Join(" ", validation.errors));

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);

            var now = DateTime.UtcNow;
            var userId = SafeUserId();
            var sqlNormalized = ReportSqlParameterParser.NormalizeOrgPlaceholders(req.sql_query.Trim());

            long? resolvedId = req.id.HasValue && req.id.Value > 0 ? req.id : null;
            if (!resolvedId.HasValue && !string.IsNullOrWhiteSpace(req.catalog_key))
                resolvedId = await FindIdByCatalogKey(db, req.catalog_key);

            long id;
            if (resolvedId.HasValue && resolvedId.Value > 0)
            {
                id = resolvedId.Value;
                string update = @"
                    UPDATE report_definitions SET
                        name = @name, description = @description, category = @category, catalog_key = @catalog_key,
                        sql_query = @sql_query, is_active = @is_active, is_published = @is_published,
                        export_excel = @export_excel, export_csv = @export_csv, export_pdf = @export_pdf,
                        max_rows = @max_rows, timeout_seconds = @timeout_seconds,
                        modified_by = @modified_by, updated_at = @updated_at, version = version + 1
                    WHERE id = @id;";
                using var cmd = db.GetCommand(update);
                BindDefinition(db, cmd, req, sqlNormalized, now, userId, includeId: true, id);
                if (await db.ExecuteNonQuery(cmd) <= 0) throw new Exception("Report not found.");
                await ReplaceChildren(db, id, req);
            }
            else
            {
                string insert = @"
                    INSERT INTO report_definitions (
                        name, description, category, catalog_key, sql_query, is_active, is_published,
                        export_excel, export_csv, export_pdf, max_rows, timeout_seconds,
                        created_by, modified_by, created_at, updated_at
                    ) VALUES (
                        @name, @description, @category, @catalog_key, @sql_query, @is_active, @is_published,
                        @export_excel, @export_csv, @export_pdf, @max_rows, @timeout_seconds,
                        @created_by, @modified_by, @created_at, @updated_at
                    ) RETURNING id;";
                using (var cmd = db.GetCommand(insert))
                {
                    BindDefinition(db, cmd, req, sqlNormalized, now, userId, includeId: false, 0);
                    using var reader = await db.Execute(cmd);
                    if (!await reader.ReadAsync()) throw new Exception("Failed to create report.");
                    id = Convert.ToInt64(reader["id"]);
                }
                await ReplaceChildren(db, id, req);
            }

            return (await GetByIdTx(db, id, true))!;
        }

        public async Task<long?> FindIdByCatalogKey(string catalogKey)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            return await FindIdByCatalogKey(db, catalogKey);
        }

        private async Task<long?> FindIdByCatalogKey(IDb db, string catalogKey)
        {
            if (string.IsNullOrWhiteSpace(catalogKey)) return null;
            using var cmd = db.GetCommand(
                "SELECT id FROM report_definitions WHERE catalog_key = @catalog_key LIMIT 1;");
            db.AddParameter(cmd, "catalog_key", DbTypes.Types.String).Value = catalogKey.Trim();
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return Convert.ToInt64(reader["id"]);
        }

        public async Task<bool> SetActive(long id, bool isActive)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            string sql = @"UPDATE report_definitions SET is_active = @is_active, updated_at = @updated_at WHERE id = @id;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = isActive;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = id;
            return await db.ExecuteNonQuery(cmd) > 0;
        }

        public async Task<bool> Delete(long id)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            using var cmd = db.GetCommand("DELETE FROM report_definitions WHERE id = @id;");
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = id;
            return await db.ExecuteNonQuery(cmd) > 0;
        }

        public async Task<ReportDefinitionDto?> GetByIdTx(IDb db, long id, bool includeChildren)
        {
            string sql = @"
                SELECT id, name, description, category, COALESCE(catalog_key, '') AS catalog_key, sql_query,
                       is_active, is_published,
                       export_excel, export_csv, export_pdf, max_rows, timeout_seconds, version,
                       created_at, updated_at
                FROM report_definitions WHERE id = @id LIMIT 1;";

            ReportDefinitionDto dto;
            using (var cmd = db.GetCommand(sql))
            {
                db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = id;
                using var reader = await db.Execute(cmd);
                if (!await reader.ReadAsync()) return null;

                dto = new ReportDefinitionDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    name = reader["name"]?.ToString() ?? "",
                    description = reader["description"]?.ToString() ?? "",
                    category = reader["category"]?.ToString() ?? "",
                    catalog_key = reader["catalog_key"]?.ToString() ?? "",
                    sql_query = reader["sql_query"]?.ToString() ?? "",
                    is_active = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                    is_published = reader["is_published"] != DBNull.Value && Convert.ToBoolean(reader["is_published"]),
                    export_excel = reader["export_excel"] == DBNull.Value || Convert.ToBoolean(reader["export_excel"]),
                    export_csv = reader["export_csv"] == DBNull.Value || Convert.ToBoolean(reader["export_csv"]),
                    export_pdf = reader["export_pdf"] == DBNull.Value || Convert.ToBoolean(reader["export_pdf"]),
                    max_rows = reader["max_rows"] == DBNull.Value ? 5000 : Convert.ToInt32(reader["max_rows"]),
                    timeout_seconds = reader["timeout_seconds"] == DBNull.Value ? 30 : Convert.ToInt32(reader["timeout_seconds"]),
                    version = reader["version"] == DBNull.Value ? 1 : Convert.ToInt32(reader["version"]),
                    created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                    updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
                };
            }

            // Reader must be closed before issuing child queries on the same Npgsql connection.
            if (!includeChildren) return dto;
            dto.parameters = await LoadParameters(db, id);
            dto.columns = await LoadColumns(db, id);
            dto.chart = await LoadChart(db, id);
            dto.permissions = await LoadPermissions(db, id);
            return dto;
        }

        private async Task ReplaceChildren(IDb db, long reportId, ReportDefinitionUpsertReq req)
        {
            using (var del = db.GetCommand("DELETE FROM report_parameters WHERE report_id = @report_id;"))
            {
                db.AddParameter(del, "report_id", DbTypes.Types.Long).Value = reportId;
                await db.ExecuteNonQuery(del);
            }
            using (var del = db.GetCommand("DELETE FROM report_columns WHERE report_id = @report_id;"))
            {
                db.AddParameter(del, "report_id", DbTypes.Types.Long).Value = reportId;
                await db.ExecuteNonQuery(del);
            }
            using (var del = db.GetCommand("DELETE FROM report_charts WHERE report_id = @report_id;"))
            {
                db.AddParameter(del, "report_id", DbTypes.Types.Long).Value = reportId;
                await db.ExecuteNonQuery(del);
            }
            using (var del = db.GetCommand("DELETE FROM report_permissions WHERE report_id = @report_id;"))
            {
                db.AddParameter(del, "report_id", DbTypes.Types.Long).Value = reportId;
                await db.ExecuteNonQuery(del);
            }

            var detected = ReportSqlParameterParser.DetectParameters(req.sql_query);
            var paramsToSave = (req.parameters ?? new List<ReportParameterDto>())
                .Where(p => !string.IsNullOrWhiteSpace(p.parameter_name))
                .ToList();

            // Ensure every detected SQL param has a definition.
            foreach (var name in detected)
            {
                if (paramsToSave.Any(p => string.Equals(p.parameter_name, name, StringComparison.OrdinalIgnoreCase)))
                    continue;
                paramsToSave.Add(new ReportParameterDto
                {
                    parameter_name = name,
                    display_name = SplitPascal(name),
                    data_type = GuessDataType(name),
                    input_type = GuessInputType(name),
                    is_visible = true,
                    options_source = "none",
                });
            }

            int order = 0;
            foreach (var p in paramsToSave.OrderBy(x => x.sort_order).ThenBy(x => x.parameter_name))
            {
                string sql = @"
                    INSERT INTO report_parameters (
                        report_id, parameter_name, display_name, data_type, input_type,
                        is_required, is_visible, default_value, options_source, options_config, sort_order,
                        created_at, updated_at
                    ) VALUES (
                        @report_id, @parameter_name, @display_name, @data_type, @input_type,
                        @is_required, @is_visible, @default_value, @options_source, @options_config, @sort_order,
                        @created_at, @updated_at
                    );";
                using var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
                db.AddParameter(cmd, "parameter_name", DbTypes.Types.String).Value = p.parameter_name.Trim();
                db.AddParameter(cmd, "display_name", DbTypes.Types.String).Value =
                    string.IsNullOrWhiteSpace(p.display_name) ? SplitPascal(p.parameter_name) : p.display_name.Trim();
                db.AddParameter(cmd, "data_type", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(p.data_type) ? "string" : p.data_type.Trim();
                db.AddParameter(cmd, "input_type", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(p.input_type) ? "text" : p.input_type.Trim();
                db.AddParameter(cmd, "is_required", DbTypes.Types.Boolean).Value = p.is_required;
                db.AddParameter(cmd, "is_visible", DbTypes.Types.Boolean).Value = p.is_visible;
                db.AddParameter(cmd, "default_value", DbTypes.Types.String).Value = p.default_value ?? "";
                db.AddParameter(cmd, "options_source", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(p.options_source) ? "none" : p.options_source.Trim();
                db.AddParameter(cmd, "options_config", DbTypes.Types.String).Value = p.options_config ?? "";
                db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = p.sort_order > 0 ? p.sort_order : order;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(cmd);
                order++;
            }

            int colOrder = 0;
            foreach (var c in (req.columns ?? new List<ReportColumnDto>()).Where(x => !string.IsNullOrWhiteSpace(x.column_key)))
            {
                string sql = @"
                    INSERT INTO report_columns (
                        report_id, column_key, display_name, is_visible, format_type, sort_order, created_at
                    ) VALUES (
                        @report_id, @column_key, @display_name, @is_visible, @format_type, @sort_order, @created_at
                    );";
                using var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
                db.AddParameter(cmd, "column_key", DbTypes.Types.String).Value = c.column_key.Trim();
                db.AddParameter(cmd, "display_name", DbTypes.Types.String).Value =
                    string.IsNullOrWhiteSpace(c.display_name) ? c.column_key.Trim() : c.display_name.Trim();
                db.AddParameter(cmd, "is_visible", DbTypes.Types.Boolean).Value = c.is_visible;
                db.AddParameter(cmd, "format_type", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(c.format_type) ? "text" : c.format_type.Trim();
                db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = c.sort_order > 0 ? c.sort_order : colOrder++;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(cmd);
            }

            if (req.chart != null && !string.IsNullOrWhiteSpace(req.chart.chart_type) && req.chart.chart_type != "none")
            {
                string sql = @"
                    INSERT INTO report_charts (
                        report_id, chart_type, x_column, y_column, title, is_enabled, created_at
                    ) VALUES (
                        @report_id, @chart_type, @x_column, @y_column, @title, @is_enabled, @created_at
                    );";
                using var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
                db.AddParameter(cmd, "chart_type", DbTypes.Types.String).Value = req.chart.chart_type.Trim();
                db.AddParameter(cmd, "x_column", DbTypes.Types.String).Value = req.chart.x_column ?? "";
                db.AddParameter(cmd, "y_column", DbTypes.Types.String).Value = req.chart.y_column ?? "";
                db.AddParameter(cmd, "title", DbTypes.Types.String).Value = req.chart.title ?? "";
                db.AddParameter(cmd, "is_enabled", DbTypes.Types.Boolean).Value = req.chart.is_enabled;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(cmd);
            }

            foreach (var perm in req.permissions ?? new List<ReportPermissionDto>())
            {
                string sql = @"
                    INSERT INTO report_permissions (
                        report_id, organisation_id, role_key, can_view, can_export, created_at
                    ) VALUES (
                        @report_id, @organisation_id, @role_key, @can_view, @can_export, @created_at
                    );";
                using var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value =
                    perm.organisation_id.HasValue && perm.organisation_id.Value > 0
                        ? perm.organisation_id.Value
                        : (object)DBNull.Value;
                db.AddParameter(cmd, "role_key", DbTypes.Types.String).Value =
                    string.IsNullOrWhiteSpace(perm.role_key) ? "org_admin" : perm.role_key.Trim();
                db.AddParameter(cmd, "can_view", DbTypes.Types.Boolean).Value = perm.can_view;
                db.AddParameter(cmd, "can_export", DbTypes.Types.Boolean).Value = perm.can_export;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(cmd);
            }
        }

        private async Task<List<ReportParameterDto>> LoadParameters(IDb db, long reportId)
        {
            var list = new List<ReportParameterDto>();
            string sql = @"
                SELECT id, report_id, parameter_name, display_name, data_type, input_type,
                       is_required, is_visible, default_value, options_source, options_config, sort_order
                FROM report_parameters WHERE report_id = @report_id ORDER BY sort_order, id;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ReportParameterDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    report_id = Convert.ToInt64(reader["report_id"]),
                    parameter_name = reader["parameter_name"]?.ToString() ?? "",
                    display_name = reader["display_name"]?.ToString() ?? "",
                    data_type = reader["data_type"]?.ToString() ?? "string",
                    input_type = reader["input_type"]?.ToString() ?? "text",
                    is_required = reader["is_required"] != DBNull.Value && Convert.ToBoolean(reader["is_required"]),
                    is_visible = reader["is_visible"] == DBNull.Value || Convert.ToBoolean(reader["is_visible"]),
                    default_value = reader["default_value"]?.ToString() ?? "",
                    options_source = reader["options_source"]?.ToString() ?? "none",
                    options_config = reader["options_config"]?.ToString() ?? "",
                    sort_order = reader["sort_order"] == DBNull.Value ? 0 : Convert.ToInt32(reader["sort_order"]),
                });
            }
            return list;
        }

        private async Task<List<ReportColumnDto>> LoadColumns(IDb db, long reportId)
        {
            var list = new List<ReportColumnDto>();
            string sql = @"
                SELECT id, report_id, column_key, display_name, is_visible, format_type, sort_order
                FROM report_columns WHERE report_id = @report_id ORDER BY sort_order, id;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ReportColumnDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    report_id = Convert.ToInt64(reader["report_id"]),
                    column_key = reader["column_key"]?.ToString() ?? "",
                    display_name = reader["display_name"]?.ToString() ?? "",
                    is_visible = reader["is_visible"] == DBNull.Value || Convert.ToBoolean(reader["is_visible"]),
                    format_type = reader["format_type"]?.ToString() ?? "text",
                    sort_order = reader["sort_order"] == DBNull.Value ? 0 : Convert.ToInt32(reader["sort_order"]),
                });
            }
            return list;
        }

        private async Task<ReportChartDto?> LoadChart(IDb db, long reportId)
        {
            string sql = @"
                SELECT id, report_id, chart_type, x_column, y_column, title, is_enabled
                FROM report_charts WHERE report_id = @report_id ORDER BY id LIMIT 1;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return new ReportChartDto
            {
                id = Convert.ToInt64(reader["id"]),
                report_id = Convert.ToInt64(reader["report_id"]),
                chart_type = reader["chart_type"]?.ToString() ?? "none",
                x_column = reader["x_column"]?.ToString() ?? "",
                y_column = reader["y_column"]?.ToString() ?? "",
                title = reader["title"]?.ToString() ?? "",
                is_enabled = reader["is_enabled"] != DBNull.Value && Convert.ToBoolean(reader["is_enabled"]),
            };
        }

        private async Task<List<ReportPermissionDto>> LoadPermissions(IDb db, long reportId)
        {
            var list = new List<ReportPermissionDto>();
            string sql = @"
                SELECT id, report_id, organisation_id, role_key, can_view, can_export
                FROM report_permissions WHERE report_id = @report_id ORDER BY id;";
            using var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "report_id", DbTypes.Types.Long).Value = reportId;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ReportPermissionDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    report_id = Convert.ToInt64(reader["report_id"]),
                    organisation_id = reader["organisation_id"] == DBNull.Value ? null : Convert.ToInt64(reader["organisation_id"]),
                    role_key = reader["role_key"]?.ToString() ?? "org_admin",
                    can_view = reader["can_view"] == DBNull.Value || Convert.ToBoolean(reader["can_view"]),
                    can_export = reader["can_export"] == DBNull.Value || Convert.ToBoolean(reader["can_export"]),
                });
            }
            return list;
        }

        private static void BindDefinition(
            IDb db, DbCommand cmd, ReportDefinitionUpsertReq req, string sqlNormalized,
            DateTime now, long userId, bool includeId, long id)
        {
            if (includeId) db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(cmd, "description", DbTypes.Types.String).Value = req.description?.Trim() ?? "";
            db.AddParameter(cmd, "category", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.category) ? "General" : req.category.Trim();
            db.AddParameter(cmd, "catalog_key", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.catalog_key) ? (object)DBNull.Value : req.catalog_key.Trim();
            db.AddParameter(cmd, "sql_query", DbTypes.Types.String).Value = sqlNormalized;
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = req.is_active;
            db.AddParameter(cmd, "is_published", DbTypes.Types.Boolean).Value = req.is_published;
            db.AddParameter(cmd, "export_excel", DbTypes.Types.Boolean).Value = req.export_excel;
            db.AddParameter(cmd, "export_csv", DbTypes.Types.Boolean).Value = req.export_csv;
            db.AddParameter(cmd, "export_pdf", DbTypes.Types.Boolean).Value = req.export_pdf;
            db.AddParameter(cmd, "max_rows", DbTypes.Types.Integer).Value = req.max_rows > 0 ? Math.Min(req.max_rows, 50000) : 5000;
            db.AddParameter(cmd, "timeout_seconds", DbTypes.Types.Integer).Value = req.timeout_seconds > 0 ? Math.Min(req.timeout_seconds, 120) : 30;
            db.AddParameter(cmd, "modified_by", DbTypes.Types.Long).Value = userId > 0 ? userId : (object)DBNull.Value;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            if (!includeId)
            {
                db.AddParameter(cmd, "created_by", DbTypes.Types.Long).Value = userId > 0 ? userId : (object)DBNull.Value;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            }
        }

        private static string GuessDataType(string name)
        {
            var n = name.ToLowerInvariant();
            if (n.Contains("date") || n.EndsWith("at") || n.Contains("time")) return "date";
            if (n.Contains("amount") || n.Contains("price") || n.Contains("count") || n.EndsWith("id") || n.Contains("qty") || n.Contains("number"))
                return n.EndsWith("id") ? "number" : "number";
            if (n.StartsWith("is") || n.Contains("active") || n.Contains("enabled")) return "boolean";
            return "string";
        }

        private static string GuessInputType(string name)
        {
            var n = name.ToLowerInvariant();
            if (n is "startdate" or "enddate" || n.EndsWith("date")) return "date";
            if (n.Contains("status") || n.Contains("type") || n.Contains("branch") || n.Contains("staff") || n.Contains("location") || n.EndsWith("id"))
                return "dropdown";
            if (n.StartsWith("is") || n.Contains("active")) return "boolean";
            if (n.Contains("amount") || n.Contains("min") || n.Contains("max") || n.Contains("count")) return "number";
            if (n.Contains("search") || n.Contains("name")) return n.Contains("search") ? "search" : "text";
            return "text";
        }

        private static string SplitPascal(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return value;
            return System.Text.RegularExpressions.Regex.Replace(value, "([a-z])([A-Z])", "$1 $2");
        }

        private long SafeUserId()
        {
            try { return _requestState.usercontext?.userid ?? 0; }
            catch { return 0; }
        }
    }
}
