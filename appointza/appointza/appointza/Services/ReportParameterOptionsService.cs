using appointza.Models;
using appointza.Utils;
using System.Text.Json;

namespace appointza.Services
{
    public class ReportParameterOptionsService
    {
        private readonly IDbProvider _dbProvider;
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        public ReportParameterOptionsService(IDbProvider dbProvider)
        {
            _dbProvider = dbProvider;
        }

        public async Task ResolveOptions(ReportDefinitionDto report, long organisationId)
        {
            foreach (var p in report.parameters)
            {
                p.resolved_options = await ResolveOne(p, organisationId);
            }
        }

        public async Task<List<ReportOptionItem>> ResolveOne(ReportParameterDto parameter, long organisationId)
        {
            var source = (parameter.options_source ?? "none").Trim().ToLowerInvariant();
            if (source == "static")
            {
                return ParseStatic(parameter.options_config);
            }
            if (source == "system" || source == "lookup" || source == "database")
            {
                var key = ParseSystemKey(parameter.options_config);
                return await LoadSystemOptions(key, organisationId);
            }
            return new List<ReportOptionItem>();
        }

        private static List<ReportOptionItem> ParseStatic(string? config)
        {
            if (string.IsNullOrWhiteSpace(config)) return new List<ReportOptionItem>();
            try
            {
                var items = JsonSerializer.Deserialize<List<ReportOptionItem>>(config, JsonOpts);
                return items ?? new List<ReportOptionItem>();
            }
            catch
            {
                // Allow "Label=Value;Label2=Value2" fallback
                var list = new List<ReportOptionItem>();
                foreach (var part in config.Split(new[] { ';', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var kv = part.Split('=', 2);
                    if (kv.Length == 2)
                        list.Add(new ReportOptionItem { label = kv[0].Trim(), value = kv[1].Trim() });
                    else
                        list.Add(new ReportOptionItem { label = part.Trim(), value = part.Trim() });
                }
                return list;
            }
        }

        private static string ParseSystemKey(string? config)
        {
            if (string.IsNullOrWhiteSpace(config)) return "";
            try
            {
                using var doc = JsonDocument.Parse(config);
                if (doc.RootElement.TryGetProperty("key", out var key))
                    return key.GetString() ?? "";
            }
            catch { /* plain string key */ }
            return config.Trim().Trim('"');
        }

        private async Task<List<ReportOptionItem>> LoadSystemOptions(string key, long organisationId)
        {
            var k = (key ?? "").Trim().ToLowerInvariant();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            return k switch
            {
                "branches" or "locations" => await QueryOptions(db, @"
                    SELECT id::text AS value, COALESCE(name, 'Location ' || id::text) AS label
                    FROM organisationlocation
                    WHERE organisationid = @organisation_id AND COALESCE(isactive, TRUE) = TRUE
                    ORDER BY name;", organisationId),
                "staff" => await QueryOptions(db, @"
                    SELECT id::text AS value, COALESCE(name, email, 'Staff ' || id::text) AS label
                    FROM users
                    WHERE organisationid = @organisation_id AND COALESCE(isactive, TRUE) = TRUE
                    ORDER BY name;", organisationId),
                "services" => await QueryOptions(db, @"
                    SELECT id::text AS value, COALESCE(servicename, 'Service ' || id::text) AS label
                    FROM organisationservices
                    WHERE organisationid = @organisation_id AND COALESCE(isactive, TRUE) = TRUE
                    ORDER BY servicename;", organisationId),
                "events" => await QueryOptions(db, @"
                    SELECT id::text AS value, COALESCE(event_name, 'Event ' || id::text) AS label
                    FROM events
                    WHERE organisation_id = @organisation_id
                      AND COALESCE(status, 'active') <> 'cancelled'
                    ORDER BY event_name;", organisationId),
                "lead_status" or "booking_status" => new List<ReportOptionItem>
                {
                    new() { label = "New", value = "new" },
                    new() { label = "Contacted", value = "contacted" },
                    new() { label = "Converted", value = "converted" },
                    new() { label = "Closed", value = "closed" },
                },
                "event_type" => new List<ReportOptionItem>
                {
                    new() { label = "Single", value = "single" },
                    new() { label = "Range", value = "range" },
                    new() { label = "Daily", value = "daily" },
                },
                "event_status" => new List<ReportOptionItem>
                {
                    new() { label = "Active", value = "active" },
                    new() { label = "Completed", value = "completed" },
                    new() { label = "Cancelled", value = "cancelled" },
                },
                _ => new List<ReportOptionItem>(),
            };
        }

        private async Task<List<ReportOptionItem>> QueryOptions(IDb db, string sql, long organisationId)
        {
            var list = new List<ReportOptionItem>();
            try
            {
                using var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using var reader = await db.Execute(cmd);
                while (await reader.ReadAsync())
                {
                    list.Add(new ReportOptionItem
                    {
                        value = reader["value"]?.ToString() ?? "",
                        label = reader["label"]?.ToString() ?? "",
                    });
                }
            }
            catch
            {
                // Table naming can vary across environments; return empty rather than failing the report page.
            }
            return list;
        }
    }
}
