using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>Resolves the active organisation for the current HTTP request (subdomain → tenant, then JWT user).</summary>
public class OrganisationResolver
{
    private readonly AppDataStore _data;
    private readonly IHttpContextAccessor _http;

    public OrganisationResolver(AppDataStore data, IHttpContextAccessor http)
    {
        _data = data;
        _http = http;
    }

    public string OrganisationId => ResolveOrganisationId();

    public Organisation Current
    {
        get
        {
            var id = OrganisationId;
            if (string.IsNullOrEmpty(id))
                throw new KeyNotFoundException(SubdomainFromRequest() is { Length: > 0 } sub
                    ? $"No property found for subdomain '{sub}'."
                    : "Organisation not found.");
            return _data.GetOrganisation(id);
        }
    }

    public void Save(Organisation org) => _data.UpsertOrganisation(org);

    public void SaveCurrent() => _data.UpsertOrganisation(Current);

    public bool SubdomainTaken(string subdomain, string? excludeOrgId = null)
    {
        if (string.IsNullOrWhiteSpace(subdomain))
            return false;

        var normalized = OrganizationDomain.NormalizeSubdomain(subdomain);
        return _data.Organisations.Any(o =>
            o.Id != excludeOrgId &&
            string.Equals(o.Subdomain, normalized, StringComparison.OrdinalIgnoreCase));
    }

    public bool SlugTaken(string slug, string? excludeOrgId = null) =>
        _data.Organisations.Any(o =>
            o.Id != excludeOrgId &&
            string.Equals(o.Slug, slug, StringComparison.OrdinalIgnoreCase));

    public Organisation? GetBySubdomain(string? subdomain)
    {
        if (string.IsNullOrWhiteSpace(subdomain))
            return null;

        var normalized = subdomain.Trim().ToLowerInvariant();
        return _data.Organisations.FirstOrDefault(o =>
            string.Equals(o.Subdomain, normalized, StringComparison.OrdinalIgnoreCase));
    }

    public bool ExistsBySubdomain(string? subdomain) => GetBySubdomain(subdomain) != null;

    public string? SubdomainFromRequest()
    {
        var ctx = _http.HttpContext;
        if (ctx == null)
            return null;

        var header = ctx.Request.Headers["X-AppointzaStay-Subdomain"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(header))
            return header.Trim().ToLowerInvariant();

        var query = ctx.Request.Query["subdomain"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(query))
            return query.Trim().ToLowerInvariant();

        if (OrganizationDomain.TryParseSubdomainFromHost(ctx.Request.Host.Value, out var fromHost))
            return fromHost;

        return null;
    }

    public string? RequestHost() => _http.HttpContext?.Request.Host.Value;

    public string RequestScheme() => _http.HttpContext?.Request.Scheme ?? "https";

    private string ResolveOrganisationId()
    {
        var ctx = _http.HttpContext;
        if (ctx != null)
        {
            var subdomain = SubdomainFromRequest();
            if (!string.IsNullOrEmpty(subdomain))
            {
                var tenant = GetBySubdomain(subdomain);
                if (tenant != null)
                    return tenant.Id;
                ctx.Items["appointzastay_subdomain_missing"] = subdomain;
                return "";
            }

            if (TryResolvePlatformAdminOrganisation(ctx, out var managedOrgId))
                return managedOrgId;

            if (ctx.Items["appointzastay_usercontext"] is AppointzaStayUserContext stayUser
                && !string.IsNullOrEmpty(stayUser.organizationId))
                return stayUser.organizationId;

            var slug = ctx.Request.Query["org"].FirstOrDefault();
            if (!string.IsNullOrEmpty(slug))
            {
                var org = _data.Organisations.FirstOrDefault(o =>
                    string.Equals(o.Slug, slug, StringComparison.OrdinalIgnoreCase));
                if (org != null)
                    return org.Id;
            }
        }

        return "";
    }

    /// <summary>Platform admins may manage any organisation via X-AppointzaStay-OrganisationId.</summary>
    private bool TryResolvePlatformAdminOrganisation(HttpContext ctx, out string organisationId)
    {
        organisationId = "";
        var orgHeader = ctx.Request.Headers["X-AppointzaStay-OrganisationId"].FirstOrDefault()?.Trim();
        if (string.IsNullOrEmpty(orgHeader))
            return false;

        if (ctx.Items["appointzastay_usercontext"] is not AppointzaStayUserContext stayCtx
            || string.IsNullOrEmpty(stayCtx.userId))
            return false;

        var user = _data.Users.FirstOrDefault(u => u.Id == stayCtx.userId);
        if (user == null || !StayAuthService.IsPlatformAdmin(user))
            return false;

        if (!_data.Organisations.Any(o => o.Id == orgHeader))
            return false;

        organisationId = orgHeader;
        return true;
    }
}
