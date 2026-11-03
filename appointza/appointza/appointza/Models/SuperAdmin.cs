namespace appointza.Models
{
    /// <summary>Result of the "am I a super admin" check. Always computed from the database (users.isfactory).</summary>
    public class SuperAdminStatus
    {
        public bool issuperadmin { get; set; }
        public long userid { get; set; }
    }

    public class SuperAdminOrganisationListReq
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsSuspended { get; set; }
    }

    public class SuperAdminOrganisationSummary
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string gstnumber { get; set; } = "";
        public string primarytypecode { get; set; } = "";
        public string secondarytypecode { get; set; } = "";
        public string tagline { get; set; } = "";
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public DateTime createdon { get; set; }
        public int locationcount { get; set; }
        public int usercount { get; set; }
        public string ownername { get; set; } = "";
        public string ownermobile { get; set; } = "";
        public string owneremail { get; set; } = "";
    }

    public class SuperAdminOrganisationListRes
    {
        public List<SuperAdminOrganisationSummary> items { get; set; } = new List<SuperAdminOrganisationSummary>();
        public long total { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class SuperAdminIdReq
    {
        public long Id { get; set; }
    }

    public class SuperAdminLocation
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string addressline1 { get; set; } = "";
        public string addressline2 { get; set; } = "";
        public string city { get; set; } = "";
        public string state { get; set; } = "";
        public string country { get; set; } = "";
        public string pincode { get; set; } = "";
        public double latitude { get; set; }
        public double longitude { get; set; }
        public string googlelocation { get; set; } = "";
        public bool isactive { get; set; }
        public bool isverified { get; set; }
        public DateTime createdon { get; set; }
    }

    public class SuperAdminUser
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string email { get; set; } = "";
        public string mobile { get; set; } = "";
        public string designation { get; set; } = "";
        public long organisationid { get; set; }
        public string organisationname { get; set; } = "";
        public long locationid { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public bool issuperadmin { get; set; }
        public DateTime createdon { get; set; }
    }

    public class SuperAdminStatusCount
    {
        public string statuscode { get; set; } = "";
        public int count { get; set; }
    }

    public class SuperAdminOrganisationDetail
    {
        public SuperAdminOrganisationSummary organisation { get; set; } = new SuperAdminOrganisationSummary();
        public string notes { get; set; } = "";
        public string attributes { get; set; } = "";
        public DateTime modifiedon { get; set; }
        public List<SuperAdminLocation> locations { get; set; } = new List<SuperAdminLocation>();
        public List<SuperAdminUser> users { get; set; } = new List<SuperAdminUser>();
        public int totalappointments { get; set; }
        public List<SuperAdminStatusCount> appointmentstatuscounts { get; set; } = new List<SuperAdminStatusCount>();
    }

    public class SuperAdminUserListReq
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsSuspended { get; set; }
        public long? OrganisationId { get; set; }
    }

    public class SuperAdminUserListRes
    {
        public List<SuperAdminUser> items { get; set; } = new List<SuperAdminUser>();
        public long total { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class SuperAdminReferenceValuesReq
    {
        public long ReferenceTypeId { get; set; }
    }
}