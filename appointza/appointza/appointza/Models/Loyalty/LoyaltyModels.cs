namespace appointza.Models.Loyalty
{
    public class OrganisationLoyaltySettings
    {
        public long organisation_id { get; set; }
        public int points_per_service { get; set; }
        public decimal points_per_rupee_spent { get; set; }
        public int bonus_points { get; set; }
        public int referral_points { get; set; }
        public int birthday_bonus_points { get; set; }
        public int anniversary_bonus_points { get; set; }
        public int redemption_points_per_rupee { get; set; } = 100;
        public decimal redemption_rupee_value { get; set; } = 50;
        public int min_redemption_points { get; set; } = 100;
        public int points_expiry_days { get; set; } = 365;
        public int max_points_per_transaction { get; set; }
        public bool combine_with_discounts { get; set; }
        public bool allow_transfer { get; set; }
        public bool allow_partial_redemption { get; set; } = true;
        public bool isactive { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class LoyaltyScheme
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string name { get; set; } = "";
        public string description { get; set; } = "";
        public string status { get; set; } = "inactive";
        public string? start_date { get; set; }
        public string? end_date { get; set; }
        public List<long> eligible_customer_ids { get; set; } = [];
        public List<long> eligible_service_ids { get; set; } = [];
        public int min_completed_services { get; set; }
        public string reward_type { get; set; } = "loyalty_points";
        public decimal reward_value { get; set; }
        public decimal max_reward_limit { get; set; }
        public int reward_expiry_days { get; set; } = 30;
        public string terms_and_conditions { get; set; } = "";
        public int sort_order { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public List<LoyaltyRule> rules { get; set; } = [];
    }

    public class LoyaltyRule
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long scheme_id { get; set; }
        public string name { get; set; } = "";
        public string trigger_type { get; set; } = "completed_services";
        public string trigger_operator { get; set; } = ">=";
        public decimal trigger_value { get; set; }
        public int trigger_period_days { get; set; }
        public string reward_type { get; set; } = "percentage_discount";
        public decimal reward_value { get; set; }
        public string apply_on { get; set; } = "next_service";
        public decimal max_discount_amount { get; set; }
        public int reward_expiry_days { get; set; } = 30;
        public long free_service_id { get; set; }
        public int priority { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class LoyaltyTier
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string name { get; set; } = "";
        public int min_services { get; set; }
        public int? max_services { get; set; }
        public decimal discount_percent { get; set; }
        public List<string> benefits { get; set; } = [];
        public int sort_order { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class ClientLoyaltyWallet
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long client_user_id { get; set; }
        public string? client_name { get; set; }
        public string? client_mobile { get; set; }
        public int current_points { get; set; }
        public int total_points_earned { get; set; }
        public int total_points_redeemed { get; set; }
        public int completed_services_count { get; set; }
        public decimal total_spend { get; set; }
        public long? current_tier_id { get; set; }
        public string? current_tier_name { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public List<LoyaltyPointTransaction> recent_transactions { get; set; } = [];
        public List<LoyaltyRewardGrant> available_rewards { get; set; } = [];
    }

    public class LoyaltyPointTransaction
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long client_user_id { get; set; }
        public string transaction_type { get; set; } = "";
        public int points_delta { get; set; }
        public int balance_after { get; set; }
        public string reference_type { get; set; } = "";
        public long reference_id { get; set; }
        public string description { get; set; } = "";
        public long created_by { get; set; }
        public DateTime? expires_at { get; set; }
        public DateTime created_at { get; set; }
    }

    public class LoyaltyRewardGrant
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long client_user_id { get; set; }
        public long? scheme_id { get; set; }
        public long? rule_id { get; set; }
        public string reward_type { get; set; } = "";
        public decimal reward_value { get; set; }
        public string status { get; set; } = "available";
        public string apply_on { get; set; } = "next_service";
        public decimal max_discount_amount { get; set; }
        public long source_appointment_id { get; set; }
        public string coupon_code { get; set; } = "";
        public DateTime granted_at { get; set; }
        public DateTime? expires_at { get; set; }
        public DateTime? redeemed_at { get; set; }
        public long redeemed_appointment_id { get; set; }
        public DateTime created_at { get; set; }
    }

    public class LoyaltyDashboard
    {
        public long organisation_id { get; set; }
        public int active_schemes { get; set; }
        public int total_schemes { get; set; }
        public int enrolled_customers { get; set; }
        public int points_issued { get; set; }
        public int points_redeemed { get; set; }
        public int available_rewards { get; set; }
        public OrganisationLoyaltySettings settings { get; set; } = new();
    }

    public class LoyaltyOrgReq
    {
        public long organisation_id { get; set; }
    }

    public class LoyaltySchemeSelectReq : LoyaltyOrgReq
    {
        public long id { get; set; }
        public string? status { get; set; }
    }

    public class LoyaltySchemeSaveReq : LoyaltyScheme { }

    public class LoyaltySchemeDeleteReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class LoyaltyRuleSelectReq : LoyaltyOrgReq
    {
        public long scheme_id { get; set; }
    }

    public class LoyaltyRuleSaveReq : LoyaltyRule { }

    public class LoyaltyRuleDeleteReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class LoyaltyTierSelectReq : LoyaltyOrgReq { }

    public class LoyaltyTierSaveReq : LoyaltyTier { }

    public class LoyaltyTierDeleteReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }

    public class LoyaltySettingsSaveReq : OrganisationLoyaltySettings { }

    public class LoyaltyCustomerSelectReq : LoyaltyOrgReq
    {
        public long client_user_id { get; set; }
        public string? search { get; set; }
        /// <summary>Max rows (default 100). Use 0 for no limit (org bulk lookup).</summary>
        public int limit { get; set; } = 100;
    }

    public class LoyaltyTransactionSelectReq : LoyaltyOrgReq
    {
        public long client_user_id { get; set; }
        public int limit { get; set; } = 50;
    }

    public class LoyaltyRewardGrantSelectReq : LoyaltyOrgReq
    {
        public long client_user_id { get; set; }
        public string? status { get; set; }
    }

    public class LoyaltyAdjustPointsReq
    {
        public long organisation_id { get; set; }
        public long client_user_id { get; set; }
        public int points_delta { get; set; }
        public string description { get; set; } = "";
        public long created_by { get; set; }
    }

    public class LoyaltyEvaluateCompletionReq
    {
        public long organisation_id { get; set; }
        public long client_user_id { get; set; }
        public long appointment_id { get; set; }
        public long service_id { get; set; }
        public decimal amount_spent { get; set; }
        public bool is_cancelled { get; set; }
        public bool is_refunded { get; set; }
    }

    public class LoyaltyEvaluationResult
    {
        public int points_earned { get; set; }
        public List<LoyaltyRewardGrant> rewards_granted { get; set; } = [];
        public string? tier_name { get; set; }
        public string message { get; set; } = "";
    }
}
