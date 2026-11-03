using System.Text.Json;
using appointza.Services;

var reports = ReportCatalogSeedService.BuildPriorityReports()
    .Select(r => new
    {
        r.catalog_key,
        r.name,
        r.category,
        r.description,
        r.sql_query,
        parameters = r.parameters.Select(p => new
        {
            p.parameter_name,
            p.display_name,
            p.data_type,
            p.input_type,
            p.is_required,
            p.default_value,
            p.options_source,
            p.options_config,
        }),
        columns = r.columns.Select(c => new
        {
            c.column_key,
            c.display_name,
            c.format_type,
        }),
        chart = r.chart == null || r.chart.chart_type == "none" ? null : new
        {
            r.chart.chart_type,
            r.chart.x_column,
            r.chart.y_column,
            r.chart.title,
        },
    });

var json = JsonSerializer.Serialize(reports, new JsonSerializerOptions { WriteIndented = true });
var outPath = args.Length > 0
    ? args[0]
    : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "SeedPriorityReports", "priority_reports.json"));

Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);
await File.WriteAllTextAsync(outPath, json);
Console.WriteLine($"Wrote {outPath}");
