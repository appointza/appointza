namespace appointza.Models
{
    public static class BillingModeCodes
    {
        public const string Subscription = "subscription";
        public const string CreditWallet = "credit_wallet";

        public static bool IsCreditWallet(string? mode) =>
            string.Equals(mode?.Trim(), CreditWallet, StringComparison.OrdinalIgnoreCase);

        public static string Normalize(string? mode) =>
            IsCreditWallet(mode) ? CreditWallet : Subscription;
    }

    public class CreditWalletPack
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string description { get; set; } = "";
        public decimal price_inr { get; set; }
        public int credits { get; set; }
        public bool highlighted { get; set; }

        public string price_label => $"₹{price_inr:N0}";
        public string credits_label => $"{credits} booking credits";
    }

    public class OrganisationCreditWallet
    {
        public long organisation_id { get; set; }
        public string billing_mode { get; set; } = BillingModeCodes.Subscription;
        public int wallet_credit_balance { get; set; }
        public int wallet_free_used_month { get; set; }
        public string wallet_free_month_key { get; set; } = "";
        public int credits_per_booking { get; set; } = 1;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class CreditWalletTransaction
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string type { get; set; } = "wallet_deduction";
        public int amount { get; set; }
        public string description { get; set; } = "";
        public long? appointment_id { get; set; }
        public long? event_booking_id { get; set; }
        public DateTime created_at { get; set; }
    }

    public class CreditWalletStatusRes
    {
        public long organisation_id { get; set; }
        public string billing_mode { get; set; } = BillingModeCodes.Subscription;
        public int wallet_credit_balance { get; set; }
        public int signup_free_credits { get; set; } = CreditWalletCatalog.SignupFreeCredits;
        public int credits_per_booking { get; set; } = 1;
        public List<CreditWalletPack> packs { get; set; } = new();
        public List<CreditWalletTransaction> recent_transactions { get; set; } = new();
    }

    public class CreditWalletBillingModeReq
    {
        public long organisation_id { get; set; }
        public string mode { get; set; } = BillingModeCodes.Subscription;
    }

    public class CreditWalletRechargeReq
    {
        public long organisation_id { get; set; }
        public string pack_id { get; set; } = "";
    }

    public class CreditWalletRechargePayment
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string pack_id { get; set; } = "";
        public int credits { get; set; }
        public decimal amount_inr { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_payment_id { get; set; } = "";
        public string razorpay_signature { get; set; } = "";
        public string receipt { get; set; } = "";
        public string status { get; set; } = "created";
        public DateTime created_at { get; set; }
        public DateTime? paid_at { get; set; }
    }

    public class CreditWalletRechargeOrderRes
    {
        public long recharge_id { get; set; }
        public string pack_id { get; set; } = "";
        public int credits { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_key { get; set; } = "";
        public int amount_paise { get; set; }
        public decimal amount_inr { get; set; }
        public string currency { get; set; } = "INR";
        public string receipt { get; set; } = "";
    }

    public class CreditWalletRechargeVerifyReq
    {
        public long organisation_id { get; set; }
        public long recharge_id { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_payment_id { get; set; } = "";
        public string razorpay_signature { get; set; } = "";
    }

    public class CreditWalletConsumptionResult
    {
        public bool success { get; set; }
        public bool used_free_allowance { get; set; }
        public int credits_consumed { get; set; }
        public string message { get; set; } = "";
    }

    public static class CreditWalletCatalog
    {
        /// <summary>One-time booking credits granted when the wallet is first created (fallback if free plan row missing).</summary>
        public const int SignupFreeCredits = 50;

        /// <summary>Booking credits granted to the referrer when a referred organisation signs up.</summary>
        public const int ReferralBonusCredits = 50;
    }
}
