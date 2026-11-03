using appointza.Models;
using appointza.Services;

namespace appointza.Tests;

/// <summary>
/// Lightweight integration-style checks that do not require a live database.
/// Schema SQL and upsert shape stay aligned with ReportDefinitionService.
/// </summary>
public class ReportDefinitionServiceIntegrationTests
{
    [Fact]
    public void Upsert_req_defaults_are_safe_for_publish_workflow()
    {
        var req = new ReportDefinitionUpsertReq
        {
            name = "Bookings by day",
            description = "Daily booking counts",
            category = "Operations",
            sql_query = "SELECT COUNT(*) AS c FROM appointments WHERE organisationid = @OrgId AND startdate >= @StartDate",
            is_active = true,
            is_published = true,
            parameters =
            {
                new ReportParameterDto
                {
                    parameter_name = "StartDate",
                    display_name = "Start date",
                    data_type = "date",
                    input_type = "date",
                    is_required = true,
                    is_visible = true,
                },
            },
            columns =
            {
                new ReportColumnDto { column_key = "c", display_name = "Count", is_visible = true, format_type = "number" },
            },
            chart = new ReportChartDto { chart_type = "bar", x_column = "day", y_column = "c", is_enabled = true, title = "Bookings" },
            permissions =
            {
                new ReportPermissionDto { organisation_id = null, role_key = "org_admin", can_view = true, can_export = true },
            },
        };

        var validation = ReportSqlQueryValidator.Validate(req.sql_query);
        Assert.True(validation.is_valid);
        Assert.Equal(new[] { "StartDate" }, validation.detected_parameters);
        Assert.True(req.export_csv);
        Assert.True(req.export_excel);
        Assert.True(req.export_pdf);
        Assert.Single(req.parameters);
        Assert.True(req.permissions[0].can_export);
    }

    [Fact]
    public void Execution_result_shape_supports_table_and_chart_binding()
    {
        var result = new ReportExecutionResult
        {
            columns = { "day", "c" },
            rows =
            {
                new Dictionary<string, object?> { ["day"] = "2026-01-01", ["c"] = 3 },
                new Dictionary<string, object?> { ["day"] = "2026-01-02", ["c"] = 5 },
            },
            row_count = 2,
            duration_ms = 12,
        };

        Assert.Equal(2, result.rows.Count);
        Assert.Equal(3, Convert.ToInt32(result.rows[0]["c"]));
        Assert.Contains("day", result.columns);
    }
}
