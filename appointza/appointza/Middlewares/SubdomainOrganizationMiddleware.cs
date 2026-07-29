using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Hosting;

namespace appointza.Middlewares
{
    /// <summary>
    /// Middleware to extract organization ID from subdomain and store it in request context
    /// Example: appointza-panruti-cuddalore-tamilnadu.appointza.com
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

        public async Task InvokeAsync(HttpContext context, OrganisationService organisationService)
        {
            try
            {
                // Extract organization information from subdomain
                var host = context.Request.Host.Host;
                var locationInfo = SubdomainHelper.ExtractLocationFromSubdomain(host);
             


                // Store location info in request context
                context.Items["LocationInfo"] = locationInfo;
                
                // Check if URL matches the pattern {organization}-{area}-{city}-{state}
                bool isSubdomainPattern = !string.IsNullOrEmpty(locationInfo.FullLocationString) && 
                                        !string.IsNullOrEmpty(locationInfo.OrganizationName) &&
                                        !string.IsNullOrEmpty(locationInfo.Area) &&
                                        !string.IsNullOrEmpty(locationInfo.City) &&
                                        !string.IsNullOrEmpty(locationInfo.State);
                
                if (isSubdomainPattern)
                {
                    _logger.LogInformation($"Processing request for subdomain pattern: {locationInfo.FullLocationString}");
                    
                    // Find organization by location
                    var organization = await organisationService.FindOrganisationByLocation(locationInfo.OrganizationName,
                        locationInfo.Area, 
                        locationInfo.City, 
                        locationInfo.State);

                    if (organization != null)
                    {
                        // Store organization details in request context
                        context.Items["CurrentOrganization"] = organization;
                        context.Items["OrganizationId"] = organization.organisationid;
                        context.Items["OrganizationName"] = organization.organisationname;
                        
                        _logger.LogInformation($"Found organization: {organization.organisationname} (ID: {organization.organisationid}) for location: {locationInfo.FullLocationString}");
                        
                        // For subdomain pattern, let MVC routing handle the request
                        // Don't serve index.html, continue to MVC routing
                    }
                    else
                    {
                        _logger.LogWarning($"No organization found for location: {locationInfo.FullLocationString}");
                        context.Items["OrganizationId"] = 0;
                        
                        // Even if no organization found, still let MVC handle it for proper error handling
                    }
                }
                else
                {
                    _logger.LogInformation("No subdomain pattern detected, checking for fallback to index.html");
                    context.Items["OrganizationId"] = 0;
                    
                    // Check if this is a root path request or any other non-subdomain request
                    // Only serve index.html for non-subdomain requests
                    
                    if (context.Request.Path.Value == "/" || string.IsNullOrEmpty(context.Request.Path.Value))
                    {
                        try
                        {
                            // Serve the index.html file from wwwroot
                            var webHostEnvironment = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
                            var indexPath = Path.Combine(webHostEnvironment.WebRootPath, "index.html");
                            
                            if (File.Exists(indexPath))
                            {
                                _logger.LogInformation($"Serving index.html from: {indexPath}");
                                context.Response.ContentType = "text/html";
                                await context.Response.SendFileAsync(indexPath);
                                return; // Don't continue to next middleware
                            }
                            else
                            {
                                _logger.LogWarning($"Index.html not found at: {indexPath}");
                            }
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

            // Continue to the next middleware
            await _next(context);
        }
    }

    /// <summary>
    /// Extension methods for registering the middleware
    /// </summary>
    public static class SubdomainOrganizationMiddlewareExtensions
    {
        public static IApplicationBuilder UseSubdomainOrganization(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SubdomainOrganizationMiddleware>();
        }
    }
}
