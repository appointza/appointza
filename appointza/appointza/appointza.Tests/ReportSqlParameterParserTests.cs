using appointza.Services;

namespace appointza.Tests;

public class ReportSqlParameterParserTests
{
    [Fact]
    public void DetectParameters_finds_named_params_and_excludes_OrgId()
    {
        var sql = @"
            SELECT * FROM appointments a
            WHERE a.organisationid = @OrgId
              AND a.startdate >= @StartDate
              AND a.enddate <= @EndDate
              AND (@Status IS NULL OR a.status = @Status)";

        var names = ReportSqlParameterParser.DetectParameters(sql);

        Assert.Equal(new[] { "StartDate", "EndDate", "Status" }, names);
        Assert.DoesNotContain(names, n => n.Equals("OrgId", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NormalizeOrgPlaceholders_rewrites_aliases_to_OrgId()
    {
        var sql = "SELECT 1 WHERE organisationid = @organisation_id AND x = @OrganizationId";
        var normalized = ReportSqlParameterParser.NormalizeOrgPlaceholders(sql);
        Assert.Contains("@OrgId", normalized);
        Assert.DoesNotContain("@organisation_id", normalized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("@OrganizationId", normalized);
    }

    [Fact]
    public void MentionsOrgParameter_true_when_present()
    {
        Assert.True(ReportSqlParameterParser.MentionsOrgParameter("SELECT 1 WHERE id = @OrgId"));
        Assert.False(ReportSqlParameterParser.MentionsOrgParameter("SELECT 1 WHERE id = @StartDate"));
    }
}
