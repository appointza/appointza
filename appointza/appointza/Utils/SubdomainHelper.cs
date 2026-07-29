using System.Text.RegularExpressions;
using appointza.Models;
using appointza.Services;

namespace appointza.Utils
{
    public static class SubdomainHelper
    {
        /// <summary>
        /// Extracts location information from subdomain
        /// Example: appointza-panruti-cuddalore-tamilnadu.appointza.com
        /// Returns: { Area: "panruti", City: "cuddalore", State: "tamilnadu" }
        /// </summary>
        public static LocationInfo ExtractLocationFromSubdomain(string host)
        {
            if (string.IsNullOrEmpty(host))
                return new LocationInfo();

            // Remove protocol if present
            if (host.StartsWith("http://") || host.StartsWith("https://"))
            {
                var uri = new Uri(host);
                host = uri.Host;
            }

            // Remove port number if present (e.g., localhost:5000 -> localhost)
            if (host.Contains(':'))
            {
                host = host.Split(':')[0];
            }

            // Split by dots to get subdomain parts
            var parts = host.Split('.');
            
            
            if (parts.Length < 2)
                return new LocationInfo();


            // First part should be the subdomain: dreamproperties-cuddalore-villianur-tamilnadu
            var subdomain = parts[0];
            var subdomainParts = subdomain.Split('-');


            if (subdomainParts.Length < 3)
                return new LocationInfo();
            
            // Handle different subdomain formats:
            // Format 1: {organization}-{area}-{city}-{state} (4 parts total) - CORRECT FORMAT
            // Format 2: {area}-{city}-{state} (3 parts total)
            // Format 3: {organization}-{area}-{city} (3 parts total)
            // Format 4: appointza-{organization}-{area}-{city}-{state} (5 parts total)
            
            if (subdomainParts.Length >= 4)
            {
                // Format 1: {organization}-{area}-{city}-{state} (CORRECT FORMAT)
                return new LocationInfo
                {
                    OrganizationName = subdomainParts[0],
                    Area = subdomainParts[1],
                    City = subdomainParts[2],
                    State = subdomainParts[3],
                    FullLocationString = string.Join("-", subdomainParts)
                };
            }
         
            return new LocationInfo();
        }

        /// <summary>
        /// Gets the organization ID from subdomain by matching location
        /// </summary>
        public static async Task<long> GetOrganizationIdFromSubdomain(
            string host, 
            OrganisationService organisationService)
        {
            var locationInfo = ExtractLocationFromSubdomain(host);
            
            if (string.IsNullOrEmpty(locationInfo.FullLocationString))
                return 0;

            // Get all organizations with their locations
            var orgReq = new OrganisationSelectReq();
            var organizations = await organisationService.SelectOrganisationDetail(orgReq);

            // Find organization that matches the location
            var matchingOrg = organizations.FirstOrDefault(org => 
                IsLocationMatch(org, locationInfo));

            return matchingOrg?.organisationid ?? 0;
        }

        /// <summary>
        /// Checks if organization location matches the subdomain location
        /// </summary>
        private static bool IsLocationMatch(OrganisationDetail org, LocationInfo locationInfo)
        {
            if (org == null || locationInfo == null)
                return false;

            var orgCity = org.organisationlocationcity?.ToLower() ?? "";
            var orgState = org.organisationlocationstate?.ToLower() ?? "";
            var orgArea = org.organisationlocationname?.ToLower() ?? "";

            var subdomainCity = locationInfo.City?.ToLower() ?? "";
            var subdomainState = locationInfo.State?.ToLower() ?? "";
            var subdomainArea = locationInfo.Area?.ToLower() ?? "";

            // Match by city and state (most reliable)
            bool cityStateMatch = orgCity.Contains(subdomainCity) && 
                                 orgState.Contains(subdomainState);

            // Also check if area matches
            bool areaMatch = !string.IsNullOrEmpty(subdomainArea) && 
                           (orgArea.Contains(subdomainArea) || orgCity.Contains(subdomainArea));

            return cityStateMatch || areaMatch;
        }

        /// <summary>
        /// Gets organization details from subdomain
        /// </summary>
        public static async Task<OrganisationDetail> GetOrganizationFromSubdomain(
            string host, 
            OrganisationService organisationService)
        {
            var locationInfo = ExtractLocationFromSubdomain(host);
            
            if (string.IsNullOrEmpty(locationInfo.FullLocationString))
                return null;

            var orgReq = new OrganisationSelectReq();
            var organizations = await organisationService.SelectOrganisationDetail(orgReq);

            return organizations.FirstOrDefault(org => 
                IsLocationMatch(org, locationInfo));
        }

        /// <summary>
        /// Gets organization details using SubdomainHelper location parts
        /// </summary>
        public static async Task<OrganisationDetail> GetOrganizationByLocationParts(
            string area, 
            string city, 
            string state, 
            string organizationName,
            OrganisationService organisationService)
        {
            return await organisationService.GetOrganisationBySubdomainLocation(area, city, state, organizationName);
        }

        /// <summary>
        /// Gets organization details from subdomain using the new service method
        /// </summary>
        public static async Task<OrganisationDetail> GetOrganizationFromSubdomainWithNewService(
            string host, 
            OrganisationService organisationService)
        {
            var locationInfo = ExtractLocationFromSubdomain(host);
            
            if (string.IsNullOrEmpty(locationInfo.FullLocationString))
                return null;

            // Use the new service method that returns full location object
            return await organisationService.GetOrganisationBySubdomainLocation(
                locationInfo.Area, 
                locationInfo.City, 
                locationInfo.State, 
                ""); // organizationName can be empty for subdomain matching
        }
    }

    public class LocationInfo
    {
        public string Area { get; set; } = "";
        public string City { get; set; } = "";
        public string State { get; set; } = "";
        public string OrganizationName { get; set; } = "";
        public string FullLocationString { get; set; } = "";

        public override string ToString()
        {
            return $"{Area}-{City}-{State}";
        }
    }
}
