namespace appointza.Models.AppointzaStay;

public enum CreditType
{
    booking,
    wallet_recharge,
    wallet_deduction,
    wallet_free,
}

public enum BillingMode
{
    subscription,
    credit_wallet,
}

public class CreditWalletPack
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal PriceInr { get; set; }
    public int Credits { get; set; }
    public bool Highlighted { get; set; }

    public string PriceLabel => $"₹{PriceInr:N0}";
    public string CreditsLabel => $"{Credits} booking credits";
}

public class BookingCreditConsumptionResult
{
    public bool Success { get; set; }
    public BillingMode Mode { get; set; }
    public int CreditsConsumed { get; set; }
    public bool UsedFreeAllowance { get; set; }
    public string Message { get; set; } = "";
}

public class SubscriptionPlan
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal MonthlyPriceInr { get; set; }
    public decimal BookingFeeInr { get; set; }
    public bool Highlighted { get; set; }

    public string MonthlyCommitmentLabel =>
        MonthlyPriceInr <= 0 ? "₹0" : $"₹{MonthlyPriceInr:N0}/month";

    public string BookingFeeLabel => $"₹{BookingFeeInr:N0} per booking";
}

public class CreditTransaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public CreditType Type { get; set; } = CreditType.booking;
    public int Amount { get; set; }
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class OrganisationBilling
{
    public string OrganisationId { get; set; } = DummyIds.Organisation;
    public string PlanId { get; set; } = CreditCatalog.SilverPlanId;
    public int BookingCredits { get; set; }
    public DateTime? PlanStartedAt { get; set; }
    public DateTime? PlanRenewsAt { get; set; }
    public List<CreditTransaction> Transactions { get; set; } = [];

    /// <summary>subscription = monthly plan + per-booking fee; credit_wallet = prepaid credits.</summary>
    public BillingMode BillingMode { get; set; } = BillingMode.subscription;

    /// <summary>Prepaid booking credit units (wallet).</summary>
    public int WalletCreditBalance { get; set; }

    public int WalletFreeBookingsUsedThisMonth { get; set; }

    /// <summary>UTC month key (yyyy-MM) for free allowance reset.</summary>
    public string WalletFreeMonthKey { get; set; } = "";

    /// <summary>Credits deducted per confirmed booking when using wallet mode.</summary>
    public int CreditsPerBooking { get; set; } = 1;

    // Legacy JSON fields — migrated to BookingCredits on load
    public int SmsCredits { get; set; }
    public int WhatsAppCredits { get; set; }
}

public class CreditsPageViewModel
{
    public OrganisationBilling Account { get; set; } = new();
    public SubscriptionPlan CurrentPlan { get; set; } = new();
    public IReadOnlyList<SubscriptionPlan> Plans { get; set; } = [];
    public int BookingCreditsUsedThisMonth { get; set; }
    public int BookingsThisMonth { get; set; }

    public BillingMode BillingMode { get; set; }
    public int WalletCreditBalance { get; set; }
    public int WalletFreeBookingsUsedThisMonth { get; set; }
    public int WalletFreeBookingsRemaining { get; set; }
    public int CreditsPerBooking { get; set; } = 1;
    public IReadOnlyList<CreditWalletPack> WalletPacks { get; set; } = [];
    public CreditReferralInfo Referral { get; set; } = new();
}

public class CreditReferralInfo
{
    public string ReferralCode { get; set; } = "";
    public int SuccessfulReferrals { get; set; }
    public int BonusCreditsPerReferral { get; set; } = 5;
    public bool ReferralAlreadyApplied { get; set; }
    public bool CanApplyReferralCode { get; set; } = true;
}

public class ApplyReferralCodeReq
{
    public string ReferralCode { get; set; } = "";
}

public class ApplyReferralCodeRes
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
}

public class StayWalletRechargeOrderReq
{
    public string PackId { get; set; } = "";
    /// <summary>Alias used by older clients that send { id }.</summary>
    public string id
    {
        get => PackId;
        set
        {
            if (!string.IsNullOrWhiteSpace(value))
                PackId = value;
        }
    }
}

public class StayWalletRechargeOrderRes
{
    public string RechargeId { get; set; } = "";
    public string PackId { get; set; } = "";
    public int Credits { get; set; }
    public string OrderId { get; set; } = "";
    public string Key { get; set; } = "";
    public decimal Amount { get; set; }
    public int AmountPaise { get; set; }
    public string Currency { get; set; } = "INR";
    public string Receipt { get; set; } = "";
    public string PropertyName { get; set; } = "";
}

public class StayWalletRechargeVerifyReq
{
    public string RechargeId { get; set; } = "";
    public string RazorpayOrderId { get; set; } = "";
    public string RazorpayPaymentId { get; set; } = "";
    public string RazorpaySignature { get; set; } = "";
}

public class StayWalletRechargeVerifyRes
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public int CreditsAdded { get; set; }
    public int WalletCreditBalance { get; set; }
}

public static class CreditCatalog
{
    public const string BasicPlanId = "basic";
    public const string SilverPlanId = "silver";
    public const string GoldPlanId = "gold";
    public const string PlatinumPlanId = "platinum";

    public static readonly IReadOnlyList<SubscriptionPlan> Plans =
    [
        new()
        {
            Id = BasicPlanId,
            Name = "Starter",
            Description = "₹1,000 / month with 50 included bookings (₹20 each).",
            MonthlyPriceInr = 1000,
            BookingFeeInr = 20,
        },
        new()
        {
            Id = SilverPlanId,
            Name = "Growth",
            Description = "₹3,000 / month with 200 included bookings (₹15 each).",
            MonthlyPriceInr = 3000,
            BookingFeeInr = 15,
        },
        new()
        {
            Id = GoldPlanId,
            Name = "Business",
            Description = "₹5,000 / month with 500 included bookings (₹10 each).",
            MonthlyPriceInr = 5000,
            BookingFeeInr = 10,
            Highlighted = true,
        },
        new()
        {
            Id = PlatinumPlanId,
            Name = "Enterprise",
            Description = "₹10,000 / month with 1,400 included bookings (~₹7.14 each).",
            MonthlyPriceInr = 10000,
            BookingFeeInr = 7,
        },
    ];

        public static string NormalizePlanId(string? planId) => planId switch
    {
        "starter" or BasicPlanId => BasicPlanId,
        "growth" or "silver" or SilverPlanId => SilverPlanId,
        "business" or "gold" or GoldPlanId => GoldPlanId,
        "enterprise" or "professional" or "premium" or PlatinumPlanId => PlatinumPlanId,
        _ => BasicPlanId,
    };

    public static SubscriptionPlan GetPlan(string? planId) =>
        Plans.FirstOrDefault(p => p.Id == NormalizePlanId(planId)) ?? Plans[0];

    public static void MigrateLegacyCredits(OrganisationBilling account)
    {
        if (account.BookingCredits > 0)
            return;

        var legacy = account.SmsCredits + account.WhatsAppCredits;
        if (legacy > 0)
            account.BookingCredits = legacy;

        account.SmsCredits = 0;
        account.WhatsAppCredits = 0;

        foreach (var tx in account.Transactions)
            tx.Type = CreditType.booking;
    }

    public static OrganisationBilling CreateDefaultAccount(string organisationId) =>
        CreateSignupAccount(organisationId);

    /// <summary>New organisations get 30 booking credits once at signup (not a monthly allowance).</summary>
    public static OrganisationBilling CreateSignupAccount(string organisationId) =>
        new()
        {
            OrganisationId = organisationId,
            PlanId = BasicPlanId,
            BillingMode = BillingMode.credit_wallet,
            WalletCreditBalance = CreditWalletCatalog.SignupFreeBookings,
            CreditsPerBooking = 1,
            PlanStartedAt = DateTime.UtcNow,
            PlanRenewsAt = DateTime.UtcNow.AddMonths(1),
            Transactions =
            [
                new CreditTransaction
                {
                    Type = CreditType.wallet_recharge,
                    Amount = CreditWalletCatalog.SignupFreeBookings,
                    Description = $"Signup bonus — {CreditWalletCatalog.SignupFreeBookings} free booking credits",
                    CreatedAt = DateTime.UtcNow,
                },
            ],
        };
}

/// <summary>Prepaid booking credit packs — alternative to subscription per-booking fees.</summary>
public static class CreditWalletCatalog
{
    /// <summary>One-time free booking credits granted at organisation signup.</summary>
    public const int SignupFreeBookings = 30;

    /// <summary>Monthly free allowance disabled — signup grant only.</summary>
    public const int FreeBookingsPerMonth = 0;

    public static readonly IReadOnlyList<CreditWalletPack> Packs =
    [
        new()
        {
            Id = "pack_1000",
            Name = "Starter",
            Description = "₹1,000 / month · 50 included bookings (₹20 each)",
            PriceInr = 1000,
            Credits = 50,
        },
        new()
        {
            Id = "pack_3000",
            Name = "Growth",
            Description = "₹3,000 / month · 200 included bookings (₹15 each)",
            PriceInr = 3000,
            Credits = 200,
        },
        new()
        {
            Id = "pack_5000",
            Name = "Business",
            Description = "₹5,000 / month · 500 included bookings (₹10 each)",
            PriceInr = 5000,
            Credits = 500,
            Highlighted = true,
        },
        new()
        {
            Id = "pack_10000",
            Name = "Enterprise",
            Description = "₹10,000 / month · 1,400 included bookings (~₹7.14 each)",
            PriceInr = 10000,
            Credits = 1400,
        },
        new()
        {
            Id = "pack_20000",
            Name = "Premium",
            Description = "₹20,000 / month · 4,000 included bookings (₹5 each)",
            PriceInr = 20000,
            Credits = 4000,
        },
    ];

    public static CreditWalletPack GetPack(string? packId)
    {
        var id = (packId ?? "").Trim();
        // Legacy pack ids → current catalog
        id = id switch
        {
            "pack_500" => "pack_1000",
            "pack_2500" => "pack_5000",
            _ => id,
        };
        return Packs.FirstOrDefault(p => p.Id == id)
            ?? throw new ArgumentException("Unknown credit pack.");
    }

    public static string CurrentMonthKeyUtc() =>
        DateTime.UtcNow.ToString("yyyy-MM");

    public static void EnsureFreeMonthReset(OrganisationBilling account)
    {
        var monthKey = CurrentMonthKeyUtc();
        if (account.WalletFreeMonthKey == monthKey)
            return;

        account.WalletFreeMonthKey = monthKey;
        account.WalletFreeBookingsUsedThisMonth = 0;
    }

    public static int FreeBookingsRemaining(OrganisationBilling account)
    {
        EnsureFreeMonthReset(account);
        return Math.Max(0, FreeBookingsPerMonth - account.WalletFreeBookingsUsedThisMonth);
    }
}
