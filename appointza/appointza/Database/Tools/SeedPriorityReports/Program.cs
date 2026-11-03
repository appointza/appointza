using System.Text.Json;
using System.Text.RegularExpressions;
using Npgsql;

// Usage:
//   dotnet run --project SeedPriorityReports.csproj -- "<connection-string>" [organisationId]
// Seeds the 15 priority report definitions (+ optional demo data for organisationId).

if (args.Length < 1)
{
    Console.Error.WriteLine("Usage: dotnet run -- \"Host=...;Database=APPOINTZA;...\"");
    return 1;
}

var cs = args[0];
long? orgId = args.Length >= 2 && long.TryParse(args[1], out var o) ? o : null;

await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();

await Exec(conn, @"
CREATE TABLE IF NOT EXISTS report_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(120) NOT NULL DEFAULT 'General',
    catalog_key VARCHAR(80) NULL,
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
);");

// Load catalog JSON exported beside this tool (generated from ReportCatalogSeedService).
var catalogPath = Path.Combine(AppContext.BaseDirectory, "priority_reports.json");
if (!File.Exists(catalogPath))
{
    catalogPath = Path.Combine(Directory.GetCurrentDirectory(), "priority_reports.json");
}
if (!File.Exists(catalogPath))
{
    // Fall back to source tree relative path
    catalogPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "priority_reports.json"));
}

if (!File.Exists(catalogPath))
{
    Console.Error.WriteLine("priority_reports.json not found. Build/export catalog first.");
    return 2;
}

var reports = JsonSerializer.Deserialize<List<CatalogReport>>(
    await File.ReadAllTextAsync(catalogPath),
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

var seeded = 0;
foreach (var report in reports)
{
    long id;
    await using (var find = new NpgsqlCommand(
        "SELECT id FROM report_definitions WHERE catalog_key = @k LIMIT 1;", conn))
    {
        find.Parameters.AddWithValue("k", report.catalog_key);
        var existing = await find.ExecuteScalarAsync();
        if (existing != null && existing != DBNull.Value)
        {
            id = Convert.ToInt64(existing);
            await using var upd = new NpgsqlCommand(@"
                UPDATE report_definitions SET
                  name=@name, description=@description, category=@category, sql_query=@sql,
                  is_active=TRUE, is_published=TRUE, export_excel=TRUE, export_csv=TRUE, export_pdf=TRUE,
                  max_rows=10000, timeout_seconds=45, updated_at=NOW(), version=version+1
                WHERE id=@id;", conn);
            upd.Parameters.AddWithValue("id", id);
            upd.Parameters.AddWithValue("name", report.name);
            upd.Parameters.AddWithValue("description", report.description ?? "");
            upd.Parameters.AddWithValue("category", report.category ?? "General");
            upd.Parameters.AddWithValue("sql", report.sql_query);
            await upd.ExecuteNonQueryAsync();
        }
        else
        {
            await using var ins = new NpgsqlCommand(@"
                INSERT INTO report_definitions (
                  name, description, category, catalog_key, sql_query, is_active, is_published,
                  export_excel, export_csv, export_pdf, max_rows, timeout_seconds, created_at, updated_at
                ) VALUES (
                  @name, @description, @category, @catalog_key, @sql, TRUE, TRUE,
                  TRUE, TRUE, TRUE, 10000, 45, NOW(), NOW()
                ) RETURNING id;", conn);
            ins.Parameters.AddWithValue("name", report.name);
            ins.Parameters.AddWithValue("description", report.description ?? "");
            ins.Parameters.AddWithValue("category", report.category ?? "General");
            ins.Parameters.AddWithValue("catalog_key", report.catalog_key);
            ins.Parameters.AddWithValue("sql", report.sql_query);
            id = Convert.ToInt64(await ins.ExecuteScalarAsync());
        }
    }

    await Exec(conn, "DELETE FROM report_parameters WHERE report_id = " + id);
    await Exec(conn, "DELETE FROM report_columns WHERE report_id = " + id);
    await Exec(conn, "DELETE FROM report_charts WHERE report_id = " + id);
    await Exec(conn, "DELETE FROM report_permissions WHERE report_id = " + id);

    var order = 0;
    foreach (var p in report.parameters ?? new())
    {
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO report_parameters (
              report_id, parameter_name, display_name, data_type, input_type,
              is_required, is_visible, default_value, options_source, options_config, sort_order
            ) VALUES (
              @report_id, @parameter_name, @display_name, @data_type, @input_type,
              @is_required, TRUE, @default_value, @options_source, @options_config, @sort_order
            );", conn);
        cmd.Parameters.AddWithValue("report_id", id);
        cmd.Parameters.AddWithValue("parameter_name", p.parameter_name);
        cmd.Parameters.AddWithValue("display_name", p.display_name ?? p.parameter_name);
        cmd.Parameters.AddWithValue("data_type", p.data_type ?? "string");
        cmd.Parameters.AddWithValue("input_type", p.input_type ?? "text");
        cmd.Parameters.AddWithValue("is_required", p.is_required);
        cmd.Parameters.AddWithValue("default_value", p.default_value ?? "");
        cmd.Parameters.AddWithValue("options_source", p.options_source ?? "none");
        cmd.Parameters.AddWithValue("options_config", p.options_config ?? "");
        cmd.Parameters.AddWithValue("sort_order", order++);
        await cmd.ExecuteNonQueryAsync();
    }

    order = 0;
    foreach (var c in report.columns ?? new())
    {
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO report_columns (report_id, column_key, display_name, is_visible, format_type, sort_order)
            VALUES (@report_id, @column_key, @display_name, TRUE, @format_type, @sort_order);", conn);
        cmd.Parameters.AddWithValue("report_id", id);
        cmd.Parameters.AddWithValue("column_key", c.column_key);
        cmd.Parameters.AddWithValue("display_name", c.display_name ?? c.column_key);
        cmd.Parameters.AddWithValue("format_type", c.format_type ?? "text");
        cmd.Parameters.AddWithValue("sort_order", order++);
        await cmd.ExecuteNonQueryAsync();
    }

    if (report.chart != null && !string.IsNullOrWhiteSpace(report.chart.chart_type) && report.chart.chart_type != "none")
    {
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO report_charts (report_id, chart_type, x_column, y_column, title, is_enabled)
            VALUES (@report_id, @chart_type, @x_column, @y_column, @title, TRUE);", conn);
        cmd.Parameters.AddWithValue("report_id", id);
        cmd.Parameters.AddWithValue("chart_type", report.chart.chart_type);
        cmd.Parameters.AddWithValue("x_column", report.chart.x_column ?? "");
        cmd.Parameters.AddWithValue("y_column", report.chart.y_column ?? "");
        cmd.Parameters.AddWithValue("title", report.chart.title ?? "");
        await cmd.ExecuteNonQueryAsync();
    }

    await using (var perm = new NpgsqlCommand(@"
        INSERT INTO report_permissions (report_id, organisation_id, role_key, can_view, can_export)
        VALUES (@report_id, NULL, 'org_admin', TRUE, TRUE);", conn))
    {
        perm.Parameters.AddWithValue("report_id", id);
        await perm.ExecuteNonQueryAsync();
    }

    seeded++;
    Console.WriteLine($"Upserted {report.catalog_key}: {report.name}");
}

Console.WriteLine($"Catalog reports seeded: {seeded}");

if (orgId is > 0)
{
    Console.WriteLine($"Demo data seeding for organisation {orgId} should be done via API POST /api/superadmin/reports/seed-demo-data");
    Console.WriteLine("Or restart API and call seed-demo-data (C# ReportDemoDataSeedService).");
}

return 0;

static async Task Exec(NpgsqlConnection conn, string sql)
{
    await using var cmd = new NpgsqlCommand(sql, conn);
    await cmd.ExecuteNonQueryAsync();
}

sealed class CatalogReport
{
    public string catalog_key { get; set; } = "";
    public string name { get; set; } = "";
    public string category { get; set; } = "";
    public string description { get; set; } = "";
    public string sql_query { get; set; } = "";
    public List<CatalogParam>? parameters { get; set; }
    public List<CatalogCol>? columns { get; set; }
    public CatalogChart? chart { get; set; }
}
sealed class CatalogParam
{
    public string parameter_name { get; set; } = "";
    public string? display_name { get; set; }
    public string? data_type { get; set; }
    public string? input_type { get; set; }
    public bool is_required { get; set; }
    public string? default_value { get; set; }
    public string? options_source { get; set; }
    public string? options_config { get; set; }
}
sealed class CatalogCol
{
    public string column_key { get; set; } = "";
    public string? display_name { get; set; }
    public string? format_type { get; set; }
}
sealed class CatalogChart
{
    public string chart_type { get; set; } = "none";
    public string? x_column { get; set; }
    public string? y_column { get; set; }
    public string? title { get; set; }
}
