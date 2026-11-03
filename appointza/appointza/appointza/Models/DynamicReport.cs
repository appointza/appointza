namespace appointza.Models
{
    public class ReportDefinitionDto
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string description { get; set; } = "";
        public string category { get; set; } = "General";
        public string catalog_key { get; set; } = "";
        public string sql_query { get; set; } = "";
        public bool is_active { get; set; } = true;
        public bool is_published { get; set; }
        public bool export_excel { get; set; } = true;
        public bool export_csv { get; set; } = true;
        public bool export_pdf { get; set; } = true;
        public int max_rows { get; set; } = 5000;
        public int timeout_seconds { get; set; } = 30;
        public int version { get; set; } = 1;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public List<ReportParameterDto> parameters { get; set; } = new();
        public List<ReportColumnDto> columns { get; set; } = new();
        public ReportChartDto? chart { get; set; }
        public List<ReportPermissionDto> permissions { get; set; } = new();
    }

    public class ReportParameterDto
    {
        public long id { get; set; }
        public long report_id { get; set; }
        public string parameter_name { get; set; } = "";
        public string display_name { get; set; } = "";
        public string data_type { get; set; } = "string";
        public string input_type { get; set; } = "text";
        public bool is_required { get; set; }
        public bool is_visible { get; set; } = true;
        public string default_value { get; set; } = "";
        public string options_source { get; set; } = "none";
        public string options_config { get; set; } = "";
        public int sort_order { get; set; }
        public List<ReportOptionItem>? resolved_options { get; set; }
    }

    public class ReportOptionItem
    {
        public string label { get; set; } = "";
        public string value { get; set; } = "";
    }

    public class ReportColumnDto
    {
        public long id { get; set; }
        public long report_id { get; set; }
        public string column_key { get; set; } = "";
        public string display_name { get; set; } = "";
        public bool is_visible { get; set; } = true;
        public string format_type { get; set; } = "text";
        public int sort_order { get; set; }
    }

    public class ReportChartDto
    {
        public long id { get; set; }
        public long report_id { get; set; }
        public string chart_type { get; set; } = "none";
        public string x_column { get; set; } = "";
        public string y_column { get; set; } = "";
        public string title { get; set; } = "";
        public bool is_enabled { get; set; }
    }

    public class ReportPermissionDto
    {
        public long id { get; set; }
        public long report_id { get; set; }
        public long? organisation_id { get; set; }
        public string role_key { get; set; } = "org_admin";
        public bool can_view { get; set; } = true;
        public bool can_export { get; set; } = true;
    }

    public class ReportDefinitionUpsertReq
    {
        public long? id { get; set; }
        public string name { get; set; } = "";
        public string description { get; set; } = "";
        public string category { get; set; } = "General";
        public string catalog_key { get; set; } = "";
        public string sql_query { get; set; } = "";
        public bool is_active { get; set; } = true;
        public bool is_published { get; set; }
        public bool export_excel { get; set; } = true;
        public bool export_csv { get; set; } = true;
        public bool export_pdf { get; set; } = true;
        public int max_rows { get; set; } = 5000;
        public int timeout_seconds { get; set; } = 30;
        public List<ReportParameterDto> parameters { get; set; } = new();
        public List<ReportColumnDto> columns { get; set; } = new();
        public ReportChartDto? chart { get; set; }
        public List<ReportPermissionDto> permissions { get; set; } = new();
    }

    public class ReportValidateReq
    {
        public string sql_query { get; set; } = "";
    }

    public class ReportValidateResult
    {
        public bool is_valid { get; set; }
        public List<string> errors { get; set; } = new();
        public List<string> detected_parameters { get; set; } = new();
        public List<string> warnings { get; set; } = new();
    }

    public class ReportPreviewReq
    {
        public long? report_id { get; set; }
        public string? sql_query { get; set; }
        public long? organisation_id { get; set; }
        public Dictionary<string, object?> parameters { get; set; } = new();
        public int sample_limit { get; set; } = 50;
    }

    public class ReportExecuteReq
    {
        public Dictionary<string, object?> parameters { get; set; } = new();
        public int? limit { get; set; }
    }

    public class ReportExecutionResult
    {
        public List<string> columns { get; set; } = new();
        public List<Dictionary<string, object?>> rows { get; set; } = new();
        public int row_count { get; set; }
        public int duration_ms { get; set; }
        public ReportDefinitionDto? report { get; set; }
    }

    public class ReportExportReq
    {
        public string format { get; set; } = "csv"; // csv | excel | pdf
        public Dictionary<string, object?> parameters { get; set; } = new();
    }

    public class ReportListItemDto
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string description { get; set; } = "";
        public string category { get; set; } = "";
        public string catalog_key { get; set; } = "";
        public bool is_active { get; set; }
        public bool is_published { get; set; }
        public bool export_excel { get; set; }
        public bool export_csv { get; set; }
        public bool export_pdf { get; set; }
        public DateTime updated_at { get; set; }
    }
}
