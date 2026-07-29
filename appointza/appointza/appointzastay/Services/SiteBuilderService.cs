using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class SiteBuilderService
{
    private readonly OrganisationResolver _org;
    private readonly WebsiteProfileSyncService _profileSync;

    public SiteBuilderService(
        OrganisationResolver org,
        WebsiteProfileSyncService profileSync)
    {
        _org = org;
        _profileSync = profileSync;
        EnsureWebsite();
    }

    /// <summary>Returns the site page with profile data merged into blocks (for preview/builder).</summary>
    public SitePage GetPage()
    {
        EnsureWebsite();
        return _profileSync.HydratePage(_org.Current);
    }

    public List<PageBlock> GetBlocks() => GetPage().Blocks;

    public SitePageSettings GetSettings() => GetPage().Settings;

    public void SavePage(SitePage page)
    {
        var org = _org.Current;
        page.TemplateMode = string.Equals(page.TemplateMode, "html", StringComparison.OrdinalIgnoreCase)
            ? "html"
            : "blocks";
        page.CustomHtml = StayHtmlTemplateRenderer.SanitizeTemplate(
            (page.CustomHtml ?? "").Length > StayHtmlTemplateRenderer.MaxTemplateLength
                ? page.CustomHtml[..StayHtmlTemplateRenderer.MaxTemplateLength]
                : page.CustomHtml ?? "");
        if (page.TemplateMode == "html" && string.IsNullOrWhiteSpace(page.CustomHtml))
            page.CustomHtml = StayDefaultHtmlTemplate.Html;
        org.Website = page;
        org.Website.Settings ??= new SitePageSettings();
        org.Website.Blocks ??= [];

        if (page.ProfileSync?.SyncFromOrganisation ?? true)
            _profileSync.SyncFromProfile(org);

        _org.Save(org);
    }

    public string RenderCustomHtml(IReadOnlyList<Room> rooms, string? template = null)
    {
        var org = _org.Current;
        var html = template ?? org.Website.CustomHtml;
        if (string.IsNullOrWhiteSpace(html))
            html = StayDefaultHtmlTemplate.Html;
        return StayHtmlTemplateRenderer.Render(html, org, rooms);
    }

    /// <summary>Re-apply organisation profile fields onto website blocks and persist.</summary>
    public SitePage SyncFromOrganisation()
    {
        var org = _org.Current;
        _profileSync.EnsureWebsite(org);
        _profileSync.SyncFromProfile(org);
        _org.Save(org);
        return _profileSync.HydratePage(org);
    }

    public void SaveBlocks(List<PageBlock> blocks)
    {
        var page = _org.Current.Website;
        page.Blocks = blocks;
        SavePage(page);
    }

    private void EnsureWebsite()
    {
        var org = _org.Current;
        var beforeHtml = org.Website?.CustomHtml ?? "";
        var beforeMode = org.Website?.TemplateMode ?? "";
        _profileSync.EnsureWebsite(org);

        var seededHtml = !string.Equals(beforeHtml, org.Website.CustomHtml, StringComparison.Ordinal);
        var seededMode = !string.Equals(beforeMode, org.Website.TemplateMode, StringComparison.OrdinalIgnoreCase);

        if (org.Website.Blocks.Count == 0)
        {
            _profileSync.SyncFromProfile(org);
            _org.Save(org);
            return;
        }

        if (seededHtml || seededMode)
            _org.Save(org);
    }
}
