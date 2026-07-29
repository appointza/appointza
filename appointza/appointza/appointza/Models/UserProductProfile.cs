namespace appointza.Models
{
    public static class ProductCodes
    {
        public const string Campusza = "campusza";
        public const string Appointza = "appointza";
        public const string Webzys = "webzys";
    }

    public class UserProductProfile
    {
        public long id { get; set; }
        public long userid { get; set; }
        public string product { get; set; } = "";
        public string role { get; set; } = "";
        public string externalorgid { get; set; } = "";
        public string profileid { get; set; } = "";
        public string status { get; set; } = "active";
        public bool isactive { get; set; } = true;
    }

    public class UserProductProfileSelectReq
    {
        public long userid { get; set; }
        public string product { get; set; } = "";
        public string externalorgid { get; set; } = "";
    }

    /// <summary>Platform user row fields used for email/password products.</summary>
    public class PlatformUserCredential
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string email { get; set; } = "";
        public string mobile { get; set; } = "";
        public string passwordhash { get; set; } = "";
        public bool isactive { get; set; }
        public bool accountactive { get; set; }
    }
}
