using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Hosting;

namespace appointza.Middlewares
{
    /// <summary>
    /// Resolves organisation from custom URL subdomain and redirects to /template/{orgloctempid}.
    /// Example: awonderonesurprise.localhost:5000 → /template/{guid}
    /// </summary>
    public class SubdomainOrganizationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SubdomainOrganizationMiddleware> _logger;

        public SubdomainOrganizationMiddleware(RequestDelegate next, ILogger<SubdomainOrganizationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        static bool NeedsOrganisationResolve(string path)
        {
            if (string.IsNullOrEmpty(path) || path == "/") return true;
            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        public async Task InvokeAsync(
            HttpContext context,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService)
        {
            try
            {
                var host = context.Request.Host.Host;
                var customUrlSlug = SubdomainHelper.ExtractCustomUrlSlug(host);
                var path = context.Request.Path.Value ?? "";

                context.Items["CustomUrlSlug"] = customUrlSlug ?? "";

                if (!string.IsNullOrEmpty(customUrlSlug))
                {
                    // Skip DB work for SPA assets (/template/*, JS/CSS). Resolve only for / and /api/*.
                    if (NeedsOrganisationResolve(path))
                    {
                        _logger.LogInformation("Processing request for custom URL subdomain: {CustomUrl}", customUrlSlug);

                        // Single SQL-filtered lookup (no full-table scan).
                        var publicSite = await organisationLocationService.ResolvePublicSiteByCustomUrl(customUrlSlug);

                        if (publicSite != null && publicSite.id > 0)
                        {
                            context.Items["OrganizationId"] = publicSite.organisationid;
                            context.Items["OrganisationLocationId"] = publicSite.id;

                            var organization = await organisationService.GetOrganisationByCustomUrl(customUrlSlug);
                            if (organization != null)
                            {
                                context.Items["CurrentOrganization"] = organization;
                                context.Items["OrganizationName"] = organization.organisationname;
                                _logger.LogInformation(
                                    "Found organization: {OrganizationName} (ID: {OrganizationId}) for custom URL: {CustomUrl}",
                                    organization.organisationname,
                                    organization.organisationid,
                                    customUrlSlug);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("No organization found for custom URL: {CustomUrl}", customUrlSlug);
                            context.Items["OrganizationId"] = 0;
                        }

                        // Server-side redirect: subdomain root → same renderer as /template/{orgloctempid}
                        if (HttpMethods.IsGet(context.Request.Method)
                            && (path == "/" || string.IsNullOrEmpty(path)))
                        {
                            var orgLocTempId = publicSite?.orgloctempid?.Trim() ?? "";

                            if (string.IsNullOrEmpty(orgLocTempId) && publicSite?.id > 0)
                            {
                                orgLocTempId = (await organisationLocationService.GetOrgLocTempIdByLocationId(
                                    publicSite.id)).Trim();
                            }

                            if (!string.IsNullOrEmpty(orgLocTempId))
                            {
                                var target = $"/template/{Uri.EscapeDataString(orgLocTempId)}";
                                _logger.LogInformation(
                                    "Redirecting subdomain {CustomUrl} to {Target}",
                                    customUrlSlug,
                                    target);
                                context.Response.Redirect(target, permanent: false);
                                return;
                            }

                            _logger.LogWarning(
                                "Subdomain {CustomUrl} matched but orgloctempid is missing on location {LocationId}",
                                customUrlSlug,
                                publicSite?.id ?? 0);
                        }
                    }
                    else
                    {
                        context.Items["OrganizationId"] = 0;
                    }
                }
                else
                {
                    _logger.LogInformation("No custom URL subdomain detected");
                    context.Items["OrganizationId"] = 0;

                    if (path == "/" || string.IsNullOrEmpty(path))
                    {
                        try
                        {
                            var webHostEnvironment = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
                            var indexPath = Path.Combine(webHostEnvironment.WebRootPath, "index.html");

                            if (File.Exists(indexPath))
                            {
                                _logger.LogInformation("Serving index.html from: {IndexPath}", indexPath);
                                context.Response.ContentType = "text/html";
                                await context.Response.SendFileAsync(indexPath);
                                return;
                            }

                            _logger.LogWarning("Index.html not found at: {IndexPath}", indexPath);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error serving index.html");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SubdomainOrganizationMiddleware");
            }

            await _next(context);
        }
    }

    public static class SubdomainOrganizationMiddlewareExtensions
    {
        public static IApplicationBuilder UseSubdomainOrganization(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SubdomainOrganizationMiddleware>();
        }
    }
}
