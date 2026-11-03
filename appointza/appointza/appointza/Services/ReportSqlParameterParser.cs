using System.Text.RegularExpressions;

namespace appointza.Services
{
    /// <summary>
    /// Detects named SQL parameters like @StartDate from a query text.
    /// OrgId is reserved for server injection and is excluded from editable inputs.
    /// </summary>
    public static class ReportSqlParameterParser
    {
        private static readonly Regex ParamRegex = new(
            @"@([A-Za-z_][A-Za-z0-9_]*)",
            RegexOptions.Compiled);

        private static readonly HashSet<string> Reserved = new(StringComparer.OrdinalIgnoreCase)
        {
            "OrgId",
            "OrganisationId",
            "OrganizationId",
            "organisation_id",
            "organization_id",
        };

        public static List<string> DetectParameters(string? sql)
        {
            if (string.IsNullOrWhiteSpace(sql)) return new List<string>();

            var ordered = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (Match match in ParamRegex.Matches(sql))
            {
                var name = match.Groups[1].Value;
                if (Reserved.Contains(name)) continue;
                if (seen.Add(name)) ordered.Add(name);
            }
            return ordered;
        }

        public static bool MentionsOrgParameter(string? sql)
        {
            if (string.IsNullOrWhiteSpace(sql)) return false;
            foreach (Match match in ParamRegex.Matches(sql))
            {
                if (Reserved.Contains(match.Groups[1].Value)) return true;
            }
            return false;
        }

        public static string NormalizeOrgPlaceholders(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql)) return sql;
            // Canonical bind name used by the executor.
            return Regex.Replace(
                sql,
                @"@(OrgId|OrganisationId|OrganizationId|organisation_id|organization_id)\b",
                "@OrgId",
                RegexOptions.IgnoreCase);
        }
    }
}
