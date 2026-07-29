using System.Text.Json.Serialization;
using System.Text.Json;

namespace appointza.Models
{
    public class OrganisationSite
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string site_html { get; set; }
    }

    public class OrganisationSiteSelectReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class OrganisationSiteDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }

    public class Sitedetails
    {
        public OrganisationLocation locationdetail { get; set; }
        public Organisation organisationdetail { get; set; }
        public List<OrganisationServices> orgnaisatinservice { get; set; } = new List<OrganisationServices>();
        public List<OrganisationServiceTiming> OrganisationServiceTiming { get; set; } = new List<OrganisationServiceTiming>();
        public string template_html { get; set; } = "";
    }

    public class OrganisationTemplateResolveReq
    {
        public string area { get; set; } = "";
        public string city { get; set; } = "";
        public string state { get; set; } = "";
        public string organizationName { get; set; } = "";
    }

    public class OrganisationTemplateResolveRes
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public string html { get; set; } = "";
    }
} 