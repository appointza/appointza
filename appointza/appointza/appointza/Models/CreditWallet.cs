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
        public int wallet_free_bookings_used_this_month { get; set; }
        public int wallet_free_bookings_remaining { get; set; }
        public int wallet_free_bookings_per_month { get; set; } = CreditWalletCatalog.FreeBookingsPerMonth;
        /// <summary>Free credits granted per calendar month when claimed (same as FreeBookingsPerMonth).</summary>
        public int monthly_free_credits_amount { get; set; } = CreditWalletCatalog.FreeBookingsPerMonth;
        public bool monthly_free_credits_claimed { get; set; }
        public bool can_claim_monthly_free_credits { get; set; }
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
        public const int FreeBookingsPerMonth = 5;

        public static readonly IReadOnlyList<CreditWalletPack> Packs =
        [
            new()
            {
                id = "pack_500",
                name = "Starter",
                description = "₹500 recharge → 50 booking credits",
                price_inr = 500,
                credits = 50,
            },
            new()
            {
                id = "pack_1000",
                name = "Growth",
                description = "₹1,000 recharge → 200 booking credits",
                price_inr = 1000,
                credits = 200,
            },
            new()
            {
                id = "pack_2500",
                name = "Business",
                description = "₹2,500 recharge → 600 booking credits",
                price_inr = 2500,
                credits = 600,
            },
            new()
            {
                id = "pack_5000",
                name = "Pro",
                description = "₹5,000 recharge → 1,500 booking credits",
                price_inr = 5000,
                credits = 1500,
            },
            new()
            {
                id = "pack_10000",
                name = "Enterprise",
                description = "₹10,000 recharge → 4,000 booking credits — best value",
                price_inr = 10000,
                credits = 4000,
                highlighted = true,
            },
        ];

        public static CreditWalletPack GetPack(string? packId) =>
            Packs.FirstOrDefault(p => string.Equals(p.id, packId?.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException("Unknown credit pack.");

        public static string CurrentMonthKeyUtc() =>
            DateTime.UtcNow.ToString("yyyy-MM");

        public static void EnsureFreeMonthReset(OrganisationCreditWallet wallet)
        {
            var monthKey = CurrentMonthKeyUtc();
            if (wallet.wallet_free_month_key == monthKey)
                return;

            wallet.wallet_free_month_key = monthKey;
            wallet.wallet_free_used_month = 0;
        }

        public static int FreeBookingsRemaining(OrganisationCreditWallet wallet)
        {
            EnsureFreeMonthReset(wallet);
            return Math.Max(0, FreeBookingsPerMonth - wallet.wallet_free_used_month);
        }
    }
}
