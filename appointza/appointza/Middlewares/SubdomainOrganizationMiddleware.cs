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

        public async Task InvokeAsync(
            HttpContext context,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService)
        {
            try
            {
                var host = context.Request.Host.Host;
                var customUrlSlug = SubdomainHelper.ExtractCustomUrlSlug(host);

                context.Items["CustomUrlSlug"] = customUrlSlug ?? "";

                if (!string.IsNullOrEmpty(customUrlSlug))
                {
                    _logger.LogInformation("Processing request for custom URL subdomain: {CustomUrl}", customUrlSlug);

                    var organization = await organisationService.GetOrganisationByCustomUrl(customUrlSlug);

                    if (organization != null)
                    {
                        context.Items["CurrentOrganization"] = organization;
                        context.Items["OrganizationId"] = organization.organisationid;
                        context.Items["OrganizationName"] = organization.organisationname;

                        _logger.LogInformation(
                            "Found organization: {OrganizationName} (ID: {OrganizationId}) for custom URL: {CustomUrl}",
                            organization.organisationname,
                            organization.organisationid,
                            customUrlSlug);
                    }
                    else
                    {
                        _logger.LogWarning("No organization found for custom URL: {CustomUrl}", customUrlSlug);
                        context.Items["OrganizationId"] = 0;
                    }

                    // Server-side redirect: subdomain root → same renderer as /template/{orgloctempid}
                    if (HttpMethods.IsGet(context.Request.Method))
                    {
                        var path = context.Request.Path.Value ?? "";
                        if (path == "/" || string.IsNullOrEmpty(path))
                        {
                            var publicSite = await organisationLocationService.ResolvePublicSiteByCustomUrl(customUrlSlug);
                            var orgLocTempId = publicSite?.orgloctempid?.Trim() ?? "";

                            if (string.IsNullOrEmpty(orgLocTempId) && organization?.organisationlocationid > 0)
                            {
                                orgLocTempId = (await organisationLocationService.GetOrgLocTempIdByLocationId(
                                    organization.organisationlocationid)).Trim();
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
                                publicSite?.id ?? organization?.organisationlocationid ?? 0);
                        }
                    }
                }
                else
                {
                    _logger.LogInformation("No custom URL subdomain detected");
                    context.Items["OrganizationId"] = 0;

                    if (context.Request.Path.Value == "/" || string.IsNullOrEmpty(context.Request.Path.Value))
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
                _logger.LogError(ex, "Error processing subdomain organization middleware");
                context.Items["OrganizationId"] = 0;
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
