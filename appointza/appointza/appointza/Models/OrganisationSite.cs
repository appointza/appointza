using appointza.Models.Hospitality;
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
        public OrganisationHospitalityProfile? hospitality_profile { get; set; }
        public List<OrganisationRoom> hospitality_rooms { get; set; } = [];
        /// <summary>Resolved facility display labels for {{#facilities}} template loops.</summary>
        public List<string> facilities { get; set; } = [];
    }

    public class OrganisationTemplateResolveReq
    {
        /// <summary>Stored organisationlocation.customurl slug.</summary>
        [JsonPropertyName("customUrl")]
        public string customUrl { get; set; } = "";
    }

    public class OrganisationTemplateResolveRes
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        /// <summary>Stable public booking GUID (`organisationlocation.orgloctempid`).</summary>
        public string orgloctempid { get; set; } = "";
        public long templateid { get; set; }
        public string html { get; set; } = "";
        /// <summary>Fingerprint for client cache revalidation.</summary>
        public string versionKey { get; set; } = "";
    }

    public class PublicSiteLocationResolve
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public string orgloctempid { get; set; } = "";
        public long templateid { get; set; }
        public string customurl { get; set; } = "";
    }
} 