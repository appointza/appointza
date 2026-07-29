using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
public class HomeController : ControllerBase
{
    private readonly SiteBuilderService _builder;
    private readonly RoomService _rooms;
    private readonly OrganisationService _org;
    private readonly OrganisationResolver _resolver;

    public HomeController(
        SiteBuilderService builder,
        RoomService rooms,
        OrganisationService org,
        OrganisationResolver resolver)
    {
        _builder = builder;
        _rooms = rooms;
        _org = org;
        _resolver = resolver;
    }

    [HttpGet("Property")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Property()
    {
        var subdomain = _resolver.SubdomainFromRequest();
        if (!string.IsNullOrEmpty(subdomain) && !_resolver.ExistsBySubdomain(subdomain))
            return NotFound(new { error = $"No property found for subdomain '{subdomain}'." });

        try
        {
            var page = _builder.GetPage();
            var organisation = _org.Get();
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
                    organisation = PublicWebsiteProjection.Organisation(organisation),
                    resolvedSubdomain = subdomain,
                    websiteUrl = organisation.WebsiteUrl,
                },
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("Resolve")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Resolve()
    {
        var subdomain = _resolver.SubdomainFromRequest();
        if (string.IsNullOrEmpty(subdomain))
            return Ok(new ActionRes<object> { item = new { isTenant = false } });

        var tenant = _resolver.GetBySubdomain(subdomain);
        if (tenant == null)
            return NotFound(new { error = $"No property found for subdomain '{subdomain}'." });

        return Ok(new ActionRes<object>
        {
            item = new
            {
                isTenant = true,
                subdomain,
                organisationId = tenant.Id,
                name = tenant.Name,
                websiteUrl = tenant.WebsiteUrl,
            },
        });
    }

    [HttpGet("Context")]
    [AllowAnonymous]
    public ActionResult<ActionRes<object>> Context()
    {
        var user = RequireStaffAttribute.GetCurrentUser(HttpContext);
        return Ok(new ActionRes<object>
        {
            item = new
            {
                isStaff = user != null && StayAuthService.IsStaff(user),
                user = user == null ? null : new { user.Id, user.Name, user.Role, user.OrganisationId },
                organisation = _org.Get(),
            },
        });
    }
}
