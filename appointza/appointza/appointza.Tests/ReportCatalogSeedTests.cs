using appointza.Services;

namespace appointza.Tests;

public class ReportCatalogSeedTests
{
    [Fact]
    public void BuildPriorityReports_contains_unique_catalog_keys()
    {
        var reports = ReportCatalogSeedService.BuildPriorityReports();
        Assert.Equal(16, reports.Count);
        Assert.Equal(16, reports.Select(r => r.catalog_key).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.All(reports, r =>
        {
            Assert.False(string.IsNullOrWhiteSpace(r.name));
            Assert.False(string.IsNullOrWhiteSpace(r.sql_query));
            Assert.True(r.is_published);
            Assert.Contains("@OrgId", r.sql_query, StringComparison.OrdinalIgnoreCase);
            Assert.True(ReportSqlQueryValidator.Validate(r.sql_query).is_valid);
        });
    }

    [Fact]
    public void Priority_reports_cover_recommended_business_questions()
    {
        var keys = ReportCatalogSeedService.BuildPriorityReports()
            .Select(r => r.catalog_key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var key in new[]
                 {
                     "cust_complete",
                     "cust_complete_activity",
                     "evt_last_month_participants",
                     "evt_completed_participants",
                     "evt_registered_not_attended",
                     "cust_event_history",
                     "evt_repeat_participants",
                     "book_complete_history",
                     "book_completed",
                     "fin_customer_revenue",
                     "fin_pending_payments",
                     "fin_room_revenue",
                     "staff_performance",
                     "fin_service_revenue",
                     "mkt_customer_inactivity",
                     "ops_branch_performance",
                 })
        {
            Assert.Contains(key, keys);
        }
    }
}
