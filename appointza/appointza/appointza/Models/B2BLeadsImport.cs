namespace appointza.Models
{
    public class LeadsImportReq
    {
        /// <summary>Appointza account email (organisation owner or staff).</summary>
        public string email { get; set; } = "";

        /// <summary>Optional when organisation is already known.</summary>
        public long organisation_id { get; set; }
    }

    public class OrganisationResolveRes
    {
        public long organisation_id { get; set; }
        public string organisation_name { get; set; } = "";
        public long location_id { get; set; }
        public string location_name { get; set; } = "";
        public long owner_user_id { get; set; }
        public string owner_email { get; set; } = "";
        public string owner_name { get; set; } = "";
    }

    public class LeadsImportRes
    {
        public OrganisationResolveRes organisation { get; set; } = new OrganisationResolveRes();
        public List<Enquiry> leads { get; set; } = new List<Enquiry>();
        public List<ClientInfoRes> customers { get; set; } = new List<ClientInfoRes>();
    }
}
