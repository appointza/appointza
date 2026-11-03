using System.Text.RegularExpressions;
using appointza.Models;

namespace appointza.Services
{
    /// <summary>
    /// Safety checks for Super Admin authored report SQL. Only single SELECT / WITH…SELECT allowed.
    /// </summary>
    public static class ReportSqlQueryValidator
    {
        private static readonly string[] ForbiddenKeywords =
        {
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
            "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL", "MERGE", "COPY",
            "INTO", "ATTACH", "DETACH", "VACUUM", "REINDEX", "COMMENT ON",
            "SET ROLE", "SET SESSION", "pg_sleep", "dblink", "lo_import",
        };

        public static ReportValidateResult Validate(string? sql)
        {
            var result = new ReportValidateResult();
            var query = (sql ?? "").Trim();
            if (string.IsNullOrWhiteSpace(query))
            {
                result.errors.Add("SQL query is required.");
                return result;
            }

            // Strip trailing semicolons then reject any remaining statement separators.
            query = query.Trim().TrimEnd(';').Trim();
            if (query.Contains(';'))
            {
                result.errors.Add("Multiple SQL statements are not allowed.");
            }

            // Remove simple quoted strings before keyword scans to reduce false positives.
            var scrubbed = Regex.Replace(query, @"'([^']|'')*'", "''", RegexOptions.Singleline);
            scrubbed = Regex.Replace(scrubbed, "\"[^\"]*\"", "\"\"", RegexOptions.Singleline);
            scrubbed = Regex.Replace(scrubbed, @"--.*?$", " ", RegexOptions.Multiline);
            scrubbed = Regex.Replace(scrubbed, @"/\*.*?\*/", " ", RegexOptions.Singleline);
            var upper = $" {scrubbed.ToUpperInvariant()} ";

            if (!Regex.IsMatch(upper, @"\b(SELECT|WITH)\b"))
            {
                result.errors.Add("Only read-only SELECT (or WITH … SELECT) queries are allowed.");
            }

            foreach (var keyword in ForbiddenKeywords)
            {
                if (Regex.IsMatch(upper, $@"\b{Regex.Escape(keyword)}\b"))
                {
                    result.errors.Add($"Forbidden keyword detected: {keyword}.");
                }
            }

            if (!ReportSqlParameterParser.MentionsOrgParameter(query))
            {
                result.warnings.Add(
                    "Query does not reference @OrgId / @organisation_id. Tenant isolation must still filter by organisation.");
            }

            result.detected_parameters = ReportSqlParameterParser.DetectParameters(query);
            result.is_valid = result.errors.Count == 0;
            return result;
        }
    }
}
