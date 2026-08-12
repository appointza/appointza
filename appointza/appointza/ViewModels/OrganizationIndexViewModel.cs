using appointza.Models;
using appointza.Utils;

namespace appointza.ViewModels
{
    /// <summary>
    /// Simplified view model for Organization Index page
    /// Contains only essential data needed for rendering organization details
    /// </summary>
    public class OrganizationIndexViewModel
    {
        // Core Organization Information
        public string OrganizationName { get; set; } = "";
        public long OrganizationId { get; set; } = 0;
        public long OrganizationLocationId { get; set; } = 0;
        
        // Full Organization Object
        public OrganisationDetail Organization { get; set; }
        
        // Location Information
        public string LocationName { get; set; } = "";
        public string Address { get; set; } = "";
        public string City { get; set; } = "";
        public string State { get; set; } = "";
        public string Pincode { get; set; } = "";
        public string Country { get; set; } = "";
        
        // Full Location Detail Object
        public OrganisationLocation LocationDetail { get; set; }
        
        // Geolocation
        public double Latitude { get; set; } = 0.0;
        public double Longitude { get; set; } = 0.0;
        public string GoogleLocation { get; set; } = "";
        
        // Services and Timings
        public List<OrganisationServices> Services { get; set; } = new List<OrganisationServices>();
        public List<OrganisationServiceTiming> ServiceTiming { get; set; } = new List<OrganisationServiceTiming>();
        
        // Events (Live events for this organization location)
        public List<Event> Events { get; set; } = new List<Event>();
        
        // Reviews (Comments for services and events related to this organization location)
        public List<Review> Reviews { get; set; } = new List<Review>();
        
        // Facilities (Available facilities for this organization location - just identifier strings)
        public List<string> Facilities { get; set; } = new List<string>();
        
        // Template
        public string TemplateHtml { get; set; } = "";
        
        // Error Handling
        public string Error { get; set; } = "";
        public bool HasError => !string.IsNullOrEmpty(Error);
        
        // Helper Properties
        public bool HasServices => Services?.Any() == true;
        public bool HasServiceTiming => ServiceTiming?.Any() == true;
        public bool HasEvents => Events?.Any() == true;
        public bool HasReviews => Reviews?.Any() == true;
        public bool HasFacilities => Facilities?.Any() == true;
        public bool HasTemplate => !string.IsNullOrEmpty(TemplateHtml);
        
        // Constructor
        public OrganizationIndexViewModel()
        {
            Services = new List<OrganisationServices>();
            ServiceTiming = new List<OrganisationServiceTiming>();
            Events = new List<Event>();
            Reviews = new List<Review>();
            Facilities = new List<string>();
        }
        
        // Factory method to create from existing data
        public static OrganizationIndexViewModel CreateFromViewData(
            OrganisationDetail organization,
            Sitedetails siteDetails,
            string error = null)
        {
            var viewModel = new OrganizationIndexViewModel
            {
                Error = error ?? ""
            };
            
            // Set organization information
            if (organization != null)
            {
                viewModel.Organization = organization;
                viewModel.OrganizationName = organization.organisationname ?? "";
                viewModel.OrganizationId = organization.organisationid;
                viewModel.OrganizationLocationId = organization.organisationlocationid;
                viewModel.LocationName = organization.organisationlocationname ?? "";
                viewModel.Address = organization.organisationlocationaddressline1 ?? "";
                viewModel.City = organization.organisationlocationcity ?? "";
                viewModel.State = organization.organisationlocationstate ?? "";
                viewModel.Pincode = organization.organisationlocationpincode ?? "";
                viewModel.Country = organization.organisationlocationcountry ?? "";
            }
            
            // Set site details if available
            if (siteDetails != null)
            {
                // Set the full location detail object
                viewModel.LocationDetail = siteDetails.locationdetail;
                
                // Override with more detailed location information if available
                if (siteDetails.locationdetail != null)
                {
                    viewModel.LocationName = siteDetails.locationdetail.name ?? viewModel.LocationName;
                    viewModel.Address = siteDetails.locationdetail.addressline1 ?? viewModel.Address;
                    viewModel.City = siteDetails.locationdetail.city ?? viewModel.City;
                    viewModel.State = siteDetails.locationdetail.state ?? viewModel.State;
                    viewModel.Pincode = siteDetails.locationdetail.pincode ?? viewModel.Pincode;
                    viewModel.Country = siteDetails.locationdetail.country ?? viewModel.Country;
                    viewModel.Latitude = siteDetails.locationdetail.latitude;
                    viewModel.Longitude = siteDetails.locationdetail.longitude;
                    viewModel.GoogleLocation = siteDetails.locationdetail.googlelocation ?? "";
                }
                
                // Set organization notes from siteDetails if available
                if (siteDetails.organisationdetail != null && viewModel.Organization != null)
                {
                    viewModel.Organization.organisationnotes = siteDetails.organisationdetail.notes ?? "";
                }
                
                // Set services and timings
                viewModel.Services = siteDetails.orgnaisatinservice ?? new List<OrganisationServices>();
                viewModel.ServiceTiming = siteDetails.OrganisationServiceTiming ?? new List<OrganisationServiceTiming>();
                viewModel.TemplateHtml = siteDetails.template_html ?? "";
            }
            
            return viewModel;
        }
    }
}
