namespace appointza.Models
{
    public class OrganisationReferralInfoRes
    {
        public string referral_code { get; set; } = "";
        public int successful_referrals { get; set; }
        public int bonus_months_per_referral { get; set; } = 1;
        public bool referral_already_applied { get; set; }
        public bool can_apply_referral_code { get; set; }
    }

    public class OrganisationReferralSelectReq
    {
        public long organisation_id { get; set; }
    }

    public class OrganisationReferralApplyReq
    {
        public long organisation_id { get; set; }
        public string referral_code { get; set; } = "";
    }

    public class OrganisationReferralApplyRes
    {
        public bool success { get; set; }
        public string message { get; set; } = "";
    }
}
