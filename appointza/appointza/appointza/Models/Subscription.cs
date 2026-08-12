namespace appointza.Models
{
    public class SubscriptionPlan
    {
        public int id { get; set; }
        public string plan_code { get; set; } = "";
        public string project_name { get; set; } = "appointza";
        public string display_name { get; set; } = "";
        public decimal monthly_price_inr { get; set; }
        public decimal booking_fee_inr { get; set; }
        public decimal booking_fee_percent { get; set; }
        public int trial_days { get; set; }
        /// <summary>Free bookings per calendar month before fees apply. 0 = unlimited.</summary>
        public int free_bookings_per_month { get; set; }
        public int sort_order { get; set; }
        public bool isactive { get; set; }
    }

    public class OrganisationSubscription
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "starter";
        public string status { get; set; } = "trialing";
        public DateTime? trial_ends_at { get; set; }
        public DateTime? current_period_start { get; set; }
        public DateTime? current_period_end { get; set; }
        public string razorpay_customer_id { get; set; } = "";
        public string razorpay_subscription_id { get; set; } = "";
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public bool isactive { get; set; }
    }

    public class OrganisationSubscriptionStatusRes
    {
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "";
        public string plan_display_name { get; set; } = "";
        public string status { get; set; } = "";
        public bool is_in_trial { get; set; }
        public bool booking_fees_waived { get; set; }
        public int? trial_days_remaining { get; set; }
        public DateTime? trial_ends_at { get; set; }
        public decimal monthly_price_inr { get; set; }
        public decimal booking_fee_inr { get; set; }
        public decimal booking_fee_percent { get; set; }
        public string booking_fee_formula { get; set; } = "";
        public bool launch_offer_availed { get; set; }
        public DateTime? launch_offer_availed_at { get; set; }
        public bool launch_offer_available { get; set; }
        public int launch_trial_days { get; set; } = 0;
        public DateTime? plan_started_at { get; set; }
        public DateTime? plan_ends_at { get; set; }
        public DateTime? current_period_start { get; set; }
        public DateTime? current_period_end { get; set; }
        public DateTime? subscription_created_at { get; set; }
        /// <summary>launch_trial | billing_period | free</summary>
        public string period_type { get; set; } = "";
        /// <summary>Free bookings allowed per calendar month for the current plan. 0 = unlimited.</summary>
        public int free_bookings_per_month { get; set; }
        /// <summary>Bookings (with or without fee) recorded in the current calendar month.</summary>
        public int free_bookings_used_this_month { get; set; }
        /// <summary>Remaining free bookings this calendar month (null = unlimited).</summary>
        public int? free_bookings_remaining { get; set; }
        /// <summary>True when the plan offers unlimited free bookings.</summary>
        public bool free_bookings_unlimited { get; set; }
        /// <summary>Sum of unpaid booking-fee ledger rows (overage beyond free quota).</summary>
        public decimal outstanding_amount_inr { get; set; }
        /// <summary>Number of overage booking ledger rows that are still unpaid.</summary>
        public int unpaid_bookings_count { get; set; }

        /// <summary>subscription | credit_wallet — alternative prepaid billing.</summary>
        public string billing_mode { get; set; } = BillingModeCodes.Subscription;
        public int wallet_credit_balance { get; set; }
        public int credits_per_booking { get; set; } = 1;
    }

    public class OrganisationLaunchEntitlement
    {
        public long organisation_id { get; set; }
        public string offer_code { get; set; } = LaunchOfferSettings.FiftyBookingsFree;
        public string plan_code { get; set; } = "";
        public DateTime availed_at { get; set; }
        public DateTime trial_ends_at { get; set; }
    }

    public class SubscriptionPlanSelectReq
    {
        /// <summary>Optional. When set, only plans for this project (e.g. appointza) are returned.</summary>
        public string project_name { get; set; } = "";
    }

    public static class LaunchOfferSettings
    {
        public const string FiftyBookingsFree = "fifty_bookings_free";
        public const int TrialDays = 0;
        public const int SignupFreeBookingsPerMonth = 50;

        /// <summary>Time-based launch trials are disabled; signup uses the Free plan quota instead.</summary>
        public static bool IsLaunchEligiblePlan(SubscriptionPlan? plan) => false;
    }

    public class OrganisationSubscriptionSelectReq
    {
        public long organisation_id { get; set; }
    }

    public class OrganisationSubscriptionChangePlanReq
    {
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "";
    }

    public class OrganisationMonthlyBookingStatsReq
    {
        public long organisation_id { get; set; }
        public int months { get; set; } = 12;
    }

    public class OrganisationMonthlyBookingStatsRow
    {
        public int year { get; set; }
        public int month { get; set; }
        public string month_label { get; set; } = "";
        public int appointment_count { get; set; }
        public int event_booking_count { get; set; }
        public int total_bookings { get; set; }
    }

    public class OrganisationMonthlyBookingStatsRes
    {
        public long organisation_id { get; set; }
        public List<OrganisationMonthlyBookingStatsRow> months { get; set; } = new();
        public int total_appointments { get; set; }
        public int total_event_bookings { get; set; }
    }

    /// <summary>
    /// Razorpay top-up payment that settles booking-fee overage beyond the free monthly quota.
    /// </summary>
    public class SubscriptionTopUpPayment
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "";
        public decimal amount_inr { get; set; }
        public int bookings_covered { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_payment_id { get; set; } = "";
        public string razorpay_signature { get; set; } = "";
        public string receipt { get; set; } = "";
        public string status { get; set; } = "created";
        public string? notes { get; set; }
        public DateTime created_at { get; set; }
        public DateTime? paid_at { get; set; }
    }

    public class PlatformTopUpDueRes
    {
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "";
        public decimal outstanding_amount_inr { get; set; }
        public int unpaid_bookings_count { get; set; }
        public bool can_pay { get; set; }
    }

    public class PlatformTopUpOrderRes
    {
        public long topup_id { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_key { get; set; } = "";
        public int amount_paise { get; set; }
        public decimal amount_inr { get; set; }
        public string currency { get; set; } = "INR";
        public string receipt { get; set; } = "";
        public int bookings_covered { get; set; }
    }

    public class PlatformTopUpVerifyReq
    {
        public long organisation_id { get; set; }
        public long topup_id { get; set; }
        public string razorpay_order_id { get; set; } = "";
        public string razorpay_payment_id { get; set; } = "";
        public string razorpay_signature { get; set; } = "";
    }

    public class BookingFeeLedgerEntry
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string plan_code { get; set; } = "";
        public long? appointment_id { get; set; }
        public long? event_booking_id { get; set; }
        public decimal booking_amount_inr { get; set; }
        public decimal fee_inr { get; set; }
        public bool fee_waived { get; set; }
        public long? payment_id { get; set; }
        public DateTime created_at { get; set; }
    }

    public static class SubscriptionPlanCodes
    {
        public const string Free = "free";
        public const string Starter = "starter";
        public const string Growth = "growth";
        public const string Business = "business";
        public const string Enterprise = "enterprise";
        public const string Premium = "premium";

        public static bool IsValid(string? code)
        {
            if (string.IsNullOrWhiteSpace(code)) return false;
            var c = code.Trim().ToLowerInvariant();
            return c is Free or Starter or Growth or Business or Enterprise or Premium
                or "basic" or "pro"; // legacy codes still on old subscriptions
        }

        public static string Normalize(string? code)
        {
            if (!IsValid(code)) return Starter;
            return code!.Trim().ToLowerInvariant();
        }
    }
}
