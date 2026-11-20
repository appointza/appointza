using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Utils;
using Xunit;

namespace appointza.Tests;

public class PublicHtmlVersionKeyTests
{
    [Fact]
    public void Build_changes_when_template_html_changes()
    {
        var site = SampleSite();
        var a = PublicHtmlVersionKey.Build(site, [], "<html>v1</html>");
        var b = PublicHtmlVersionKey.Build(site, [], "<html>v2</html>");
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void Build_changes_when_service_is_removed()
    {
        var site = SampleSite();
        site.orgnaisatinservice =
        [
            new OrganisationServices { id = 1, createdon = DateTime.UtcNow, modifiedon = DateTime.UtcNow },
            new OrganisationServices { id = 2, createdon = DateTime.UtcNow, modifiedon = DateTime.UtcNow },
        ];
        var withTwo = PublicHtmlVersionKey.Build(site, [], "same");
        site.orgnaisatinservice.RemoveAt(1);
        var withOne = PublicHtmlVersionKey.Build(site, [], "same");
        Assert.NotEqual(withTwo, withOne);
    }

    [Fact]
    public void Build_changes_when_room_is_added()
    {
        var site = SampleSite();
        var before = PublicHtmlVersionKey.Build(site, [], "same");
        site.hospitality_rooms =
        [
            new OrganisationRoom { id = 9, room_number = "101", updated_at = DateTime.UtcNow },
        ];
        var after = PublicHtmlVersionKey.Build(site, [], "same");
        Assert.NotEqual(before, after);
    }

    static Sitedetails SampleSite() => new()
    {
        locationdetail = new OrganisationLocation
        {
            id = 42,
            templateid = 7,
            modifiedon = new DateTime(2026, 1, 1),
            createdon = new DateTime(2026, 1, 1),
        },
        organisationdetail = new Organisation
        {
            modifiedon = new DateTime(2026, 1, 1),
            createdon = new DateTime(2026, 1, 1),
        },
        orgnaisatinservice = [],
        hospitality_rooms = [],
        template_html = "",
    };
}

public class SiteTemplateDraftGeneratorTests
{
    [Fact]
    public void Generate_includes_live_service_hours_and_booking_blocks()
    {
        var draft = SiteTemplateDraftGenerator.Generate(new SiteTemplateDraftRequest
        {
            description = "A friendly salon with online booking",
            organisation_name = "QA Salon",
            has_services = true,
        });

        Assert.Contains("appointza-services", draft.live_blocks);
        Assert.Contains("appointza-hours", draft.live_blocks);
        Assert.Contains("appointza-booking-button", draft.live_blocks);
        Assert.DoesNotContain("hardcoded-service", draft.page_json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("QA Salon", draft.page_json);
    }

    [Fact]
    public void Generate_rooms_chip_adds_live_room_blocks()
    {
        var draft = SiteTemplateDraftGenerator.Generate(new SiteTemplateDraftRequest
        {
            description = "Add rooms section",
            chips = ["rooms"],
            has_rooms = true,
        });

        Assert.Contains("appointza-rooms", draft.live_blocks);
        Assert.Contains("appointza-hospitality-packages", draft.live_blocks);
    }
}
