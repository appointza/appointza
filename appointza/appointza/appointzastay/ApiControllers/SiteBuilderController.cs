using System.Text.Json;
using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
public class SiteBuilderController : ControllerBase
{
    private readonly SiteBuilderService _builder;
    private readonly RoomService _rooms;
    private readonly OrganisationService _org;

    public SiteBuilderController(SiteBuilderService builder, RoomService rooms, OrganisationService org)
    {
        _builder = builder;
        _rooms = rooms;
        _org = org;
    }

    [HttpGet("Index")]
    [RequireStaff]
    public ActionResult<ActionRes<object>> Index()
    {
        if (!CanManageCurrentOrganisation()) return Forbid();
        try
        {
            var page = _builder.GetPage();
            var organisation = _org.Get();
            return Ok(new ActionRes<object>
            {
                item = new
                {
                    organisationId = organisation.Id,
                    blocks = page.Blocks,
                    pageSettings = page.Settings,
                    templateMode = page.TemplateMode,
                    customHtml = page.CustomHtml,
                    renderedHtml = _builder.RenderCustomHtml(_rooms.GetAll()),
                    rooms = _rooms.GetAll(),
                    siteName = organisation.Name,
                    profileSync = page.ProfileSync,
                },
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("Preview")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Preview()
    {
        var page = _builder.GetPage();
        var rooms = _rooms.GetAll();
        return Ok(new ActionRes<object>
        {
            item = new
            {
                blocks = page.Blocks,
                pageSettings = page.Settings,
                pageMeta = page.Meta,
                templateMode = page.TemplateMode,
                renderedHtml = _builder.RenderCustomHtml(rooms),
                rooms = PublicWebsiteProjection.Rooms(rooms),
            },
        });
    }

    [HttpPost("SyncFromProfile")]
    [RequireStaff]
    public ActionResult<ActionRes<object>> SyncFromProfile()
    {
        if (!CanManageCurrentOrganisation()) return Forbid();
        var page = _builder.SyncFromOrganisation();
        var organisation = _org.Get();
        return Ok(new ActionRes<object>
        {
            item = new
            {
                blocks = page.Blocks,
                pageSettings = page.Settings,
                siteName = organisation.Name,
                profileSync = page.ProfileSync,
            },
        });
    }

    [HttpPost("SaveBlocks")]
    [RequireStaff]
    public IActionResult SaveBlocks([FromBody] JsonElement body)
    {
        if (!CanManageCurrentOrganisation()) return Forbid();
        if (body.ValueKind == JsonValueKind.Array)
        {
            var blocks = JsonSerializer.Deserialize<List<StayModels.PageBlock>>(
                body.GetRawText(), appointza.Services.AppointzaStay.JsonOptions.Default) ?? [];
            _builder.SaveBlocks(blocks);
            return Ok(new { success = true });
        }

        var page = JsonSerializer.Deserialize<StayModels.SitePage>(
            body.GetRawText(), appointza.Services.AppointzaStay.JsonOptions.Default);
        if (page == null) return BadRequest();

        var existing = _builder.GetPage();
        if (!HasProperty(body, "templateMode"))
            page.TemplateMode = existing.TemplateMode;
        if (!HasProperty(body, "customHtml"))
            page.CustomHtml = existing.CustomHtml;

        _builder.SavePage(page);
        return Ok(new { success = true });
    }

    [HttpPost("RenderHtmlPreview")]
    [RequireStaff]
    public ActionResult<ActionRes<string>> RenderHtmlPreview(ActionReq<StayModels.HtmlTemplatePreviewReq> req)
    {
        if (!CanManageCurrentOrganisation()) return Forbid();
        if (req?.item == null)
            return BadRequest(new { error = "HTML template is required." });

        return Ok(new ActionRes<string>
        {
            item = _builder.RenderCustomHtml(_rooms.GetAll(), req.item.Html),
        });
    }

    private bool CanManageCurrentOrganisation()
    {
        var user = RequireStaffAttribute.GetCurrentUser(HttpContext);
        if (user == null) return false;
        if (StayAuthService.IsPlatformAdmin(user)) return true;
        return string.Equals(
            user.OrganisationId,
            _org.Get().Id,
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasProperty(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object &&
        element.EnumerateObject().Any(property =>
            string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase));
}
