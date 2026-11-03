using appointza.Services;

namespace appointza.Tests;

public class ReportSqlQueryValidatorTests
{
    [Fact]
    public void Validate_allows_select_with_org_param()
    {
        var result = ReportSqlQueryValidator.Validate(
            "SELECT id, name FROM organisationlocation WHERE organisationid = @OrgId AND createdon >= @StartDate");

        Assert.True(result.is_valid);
        Assert.Empty(result.errors);
        Assert.Contains("StartDate", result.detected_parameters);
    }

    [Fact]
    public void Validate_rejects_mutating_keywords()
    {
        var result = ReportSqlQueryValidator.Validate("DELETE FROM users WHERE id = 1");
        Assert.False(result.is_valid);
        Assert.Contains(result.errors, e => e.Contains("DELETE", StringComparison.OrdinalIgnoreCase) || e.Contains("SELECT", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_rejects_multiple_statements()
    {
        var result = ReportSqlQueryValidator.Validate("SELECT 1; DROP TABLE users;");
        Assert.False(result.is_valid);
        Assert.Contains(result.errors, e => e.Contains("Multiple", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_warns_when_org_filter_missing()
    {
        var result = ReportSqlQueryValidator.Validate("SELECT id FROM organisation");
        Assert.True(result.is_valid);
        Assert.NotEmpty(result.warnings);
    }

    [Fact]
    public void Validate_allows_cte_select()
    {
        var result = ReportSqlQueryValidator.Validate(@"
            WITH q AS (SELECT id FROM appointments WHERE organisationid = @OrgId)
            SELECT * FROM q");
        Assert.True(result.is_valid);
    }
}
