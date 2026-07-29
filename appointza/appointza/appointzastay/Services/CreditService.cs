using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class CreditService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _org;
    private readonly LogService _logs;

    public CreditService(AppDataStore data, OrganisationResolver org, LogService logs)
    {
        _data = data;
        _org = org;
        _logs = logs;
    }

    public IReadOnlyList<SubscriptionPlan> GetPlans() => CreditCatalog.Plans;

    public IReadOnlyList<CreditWalletPack> GetWalletPacks() => CreditWalletCatalog.Packs;

    public OrganisationBilling GetAccount()
    {
        var orgId = _org.OrganisationId;
        var account = _data.BillingAccounts.FirstOrDefault(b => b.OrganisationId == orgId);
        var changed = false;

        if (account != null)
        {
            var normalized = CreditCatalog.NormalizePlanId(account.PlanId);
            if (account.PlanId != normalized)
            {
                account.PlanId = normalized;
                changed = true;
            }

            var before = account.BookingCredits;
            CreditCatalog.MigrateLegacyCredits(account);
            if (account.BookingCredits != before || account.SmsCredits != 0 || account.WhatsAppCredits != 0)
                changed = true;

            CreditWalletCatalog.EnsureFreeMonthReset(account);

            if (changed)
                _data.SaveBilling();

            return account;
        }

        account = CreditCatalog.CreateSignupAccount(orgId);
        _data.BillingAccounts.Add(account);
        _data.SaveBilling();
        return account;
    }

    public CreditsPageViewModel GetPageModel()
    {
        var account = GetAccount();
        var plan = CreditCatalog.GetPlan(account.PlanId);
        var org = _data.RequireOrganisation(_org.OrganisationId);
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var bookingTx = account.Transactions
            .Where(t => t.Type == CreditType.booking && t.Amount < 0 && t.CreatedAt >= monthStart)
            .ToList();

        CreditWalletCatalog.EnsureFreeMonthReset(account);

        return new CreditsPageViewModel
        {
            Account = account,
            CurrentPlan = plan,
            Plans = CreditCatalog.Plans,
            BookingCreditsUsedThisMonth = bookingTx.Sum(t => -t.Amount),
            BookingsThisMonth = bookingTx.Count,
            BillingMode = account.BillingMode,
            WalletCreditBalance = account.WalletCreditBalance,
            WalletFreeBookingsUsedThisMonth = account.WalletFreeBookingsUsedThisMonth,
            WalletFreeBookingsRemaining = CreditWalletCatalog.FreeBookingsRemaining(account),
            CreditsPerBooking = account.CreditsPerBooking,
            WalletPacks = CreditWalletCatalog.Packs,
            Referral = GetReferralInfo(org),
        };
    }

    public CreditReferralInfo GetReferralInfo() =>
        GetReferralInfo(_data.RequireOrganisation(_org.OrganisationId));

    private CreditReferralInfo GetReferralInfo(Organisation org)
    {
        EnsureReferralCode(org);
        var successfulReferrals = _data.Organisations.Count(o =>
            string.Equals(o.ReferredByOrganisationId, org.Id, StringComparison.OrdinalIgnoreCase));

        return new CreditReferralInfo
        {
            ReferralCode = org.ReferralCode,
            SuccessfulReferrals = successfulReferrals,
            BonusCreditsPerReferral = 5,
            ReferralAlreadyApplied = !string.IsNullOrWhiteSpace(org.ReferredByOrganisationId),
            CanApplyReferralCode = string.IsNullOrWhiteSpace(org.ReferredByOrganisationId),
        };
    }

    public ApplyReferralCodeRes ApplyReferralCode(string? referralCode)
    {
        var org = _data.RequireOrganisation(_org.OrganisationId);
        if (!string.IsNullOrWhiteSpace(org.ReferredByOrganisationId))
        {
            return new ApplyReferralCodeRes
            {
                Success = false,
                Message = "Referral code already applied for this organization.",
            };
        }

        var normalized = NormalizeReferralCode(referralCode);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return new ApplyReferralCodeRes
            {
                Success = false,
                Message = "Please enter a referral code.",
            };
        }

        EnsureReferralCode(org);
        if (string.Equals(org.ReferralCode, normalized, StringComparison.OrdinalIgnoreCase))
        {
            return new ApplyReferralCodeRes
            {
                Success = false,
                Message = "You cannot use your own referral code.",
            };
        }

        var referrer = _data.Organisations.FirstOrDefault(o =>
            string.Equals(o.ReferralCode, normalized, StringComparison.OrdinalIgnoreCase));
        if (referrer == null)
        {
            return new ApplyReferralCodeRes
            {
                Success = false,
                Message = "Invalid referral code. Please check and try again.",
            };
        }

        org.ReferredByOrganisationId = referrer.Id;
        _data.SaveOrganisation(org);

        const int referralCredits = 5;

        // Credit the referrer
        var referrerAccount = _data.BillingAccounts.FirstOrDefault(a => a.OrganisationId == referrer.Id);
        if (referrerAccount == null)
        {
            referrerAccount = CreditCatalog.CreateDefaultAccount(referrer.Id);
            _data.BillingAccounts.Add(referrerAccount);
        }
        referrerAccount.WalletCreditBalance += referralCredits;
        referrerAccount.Transactions.Insert(0, new CreditTransaction
        {
            Type = CreditType.wallet_recharge,
            Amount = referralCredits,
            Description = $"Referral reward — {referralCredits} free bookings from {org.Name}",
        });

        // Credit the applier
        var ownAccount = GetAccount();
        ownAccount.WalletCreditBalance += referralCredits;
        ownAccount.Transactions.Insert(0, new CreditTransaction
        {
            Type = CreditType.wallet_recharge,
            Amount = referralCredits,
            Description = $"Referral reward — {referralCredits} free bookings (applied code {normalized})",
        });

        _data.SaveBilling();

        _logs.Add("referral_applied", "billing", org.Id,
            $"Applied referral code {normalized}; {referralCredits} credits each to {org.Id} and {referrer.Id}");

        return new ApplyReferralCodeRes
        {
            Success = true,
            Message = "Referral code applied successfully.",
        };
    }

    private void EnsureReferralCode(Organisation org)
    {
        if (!string.IsNullOrWhiteSpace(org.ReferralCode))
            return;

        var seed = string.Concat((org.Subdomain ?? "") + (org.Slug ?? "") + org.Id)
            .ToUpperInvariant();
        seed = new string(seed.Where(char.IsLetterOrDigit).ToArray());
        if (seed.Length < 8)
            seed = (seed + Guid.NewGuid().ToString("N").ToUpperInvariant()).Substring(0, 8);

        var candidate = $"STAY-{seed[..8]}";
        var suffix = 1;
        while (_data.Organisations.Any(o =>
                   o.Id != org.Id &&
                   string.Equals(o.ReferralCode, candidate, StringComparison.OrdinalIgnoreCase)))
        {
            candidate = $"STAY-{seed[..Math.Min(6, seed.Length)]}{suffix:00}";
            suffix++;
        }

        org.ReferralCode = candidate;
        _data.SaveOrganisation(org);
    }

    private static string NormalizeReferralCode(string? code) =>
        string.IsNullOrWhiteSpace(code)
            ? ""
            : code.Trim().ToUpperInvariant();

    public void ChangePlan(string planId)
    {
        var plan = CreditCatalog.GetPlan(planId);
        var account = GetAccount();
        if (account.PlanId == plan.Id)
            return;

        account.PlanId = plan.Id;
        account.PlanStartedAt = DateTime.UtcNow;
        account.PlanRenewsAt = DateTime.UtcNow.AddMonths(1);

        account.Transactions.Insert(0, new CreditTransaction
        {
            Amount = 0,
            Description = $"{plan.Name} plan activated — {plan.MonthlyCommitmentLabel}, {plan.BookingFeeLabel}",
        });

        _data.SaveBilling();
        _logs.Add("plan_changed", "billing", account.OrganisationId, $"Switched to {plan.Name} subscription plan");
    }

    public void SetBillingMode(BillingMode mode)
    {
        var account = GetAccount();
        if (account.BillingMode == mode)
            return;

        account.BillingMode = mode;
        account.Transactions.Insert(0, new CreditTransaction
        {
            Amount = 0,
            Description = mode == BillingMode.credit_wallet
                ? "Switched to Credit Wallet billing"
                : "Switched to subscription billing",
        });

        _data.SaveBilling();
        _logs.Add("billing_mode", "billing", account.OrganisationId, $"Billing mode: {mode}");
    }

    public void SetBillingMode(string modeKey)
    {
        var mode = modeKey.Equals("credit_wallet", StringComparison.OrdinalIgnoreCase)
            ? BillingMode.credit_wallet
            : BillingMode.subscription;
        SetBillingMode(mode);
    }

    /// <summary>
    /// Direct recharge is disabled — credits are added only after Razorpay payment verification.
    /// </summary>
    public void RechargeWallet(string packId)
    {
        throw new InvalidOperationException(
            "Direct wallet recharge is disabled. Pay with Razorpay, then verify payment.");
    }

    /// <summary>Add pack credits only after Razorpay signature verification succeeds.</summary>
    public OrganisationBilling ApplyRechargeAfterPayment(string packId, string razorpayPaymentId)
    {
        var pack = CreditWalletCatalog.GetPack(packId);
        var account = GetAccount();

        // Idempotent: same Razorpay payment must not credit twice.
        if (account.Transactions.Any(t =>
                t.Type == CreditType.wallet_recharge &&
                t.Description.Contains(razorpayPaymentId, StringComparison.OrdinalIgnoreCase)))
        {
            return account;
        }

        account.WalletCreditBalance += pack.Credits;
        account.Transactions.Insert(0, new CreditTransaction
        {
            Type = CreditType.wallet_recharge,
            Amount = pack.Credits,
            Description =
                $"Wallet recharge — {pack.PriceLabel} → {pack.Credits} booking credits (Razorpay {razorpayPaymentId})",
        });

        _data.SaveBilling();
        _logs.Add("wallet_recharge", "billing", account.OrganisationId,
            $"Recharged {pack.Credits} credits ({pack.PriceLabel}) via Razorpay {razorpayPaymentId}");
        return account;
    }

    /// <summary>Deduct booking cost based on active billing mode (subscription or wallet).</summary>
    public BookingCreditConsumptionResult ConsumeForBooking(string bookingCode)
    {
        var account = GetAccount();
        return account.BillingMode == BillingMode.credit_wallet
            ? ConsumeWalletCredit(account, bookingCode)
            : ConsumeSubscriptionFee(account, bookingCode);
    }

    private BookingCreditConsumptionResult ConsumeSubscriptionFee(OrganisationBilling account, string bookingCode)
    {
        var plan = CreditCatalog.GetPlan(account.PlanId);
        var fee = (int)plan.BookingFeeInr;

        if (fee <= 0)
        {
            account.Transactions.Insert(0, new CreditTransaction
            {
                Type = CreditType.booking,
                Amount = 0,
                Description = $"Booking fee waived — {bookingCode}",
            });
            _data.SaveBilling();
            return new BookingCreditConsumptionResult
            {
                Success = true,
                Mode = BillingMode.subscription,
                Message = "No booking fee on current plan.",
            };
        }

        if (account.BookingCredits < fee)
            throw new InvalidOperationException(
                $"Insufficient balance (₹{account.BookingCredits:N0}). Need ₹{fee:N0} per booking on the {plan.Name} plan.");

        account.BookingCredits -= fee;
        account.Transactions.Insert(0, new CreditTransaction
        {
            Type = CreditType.booking,
            Amount = -fee,
            Description = $"Booking fee — {bookingCode}",
        });

        _data.SaveBilling();
        return new BookingCreditConsumptionResult
        {
            Success = true,
            Mode = BillingMode.subscription,
            CreditsConsumed = fee,
            Message = $"₹{fee:N0} booking fee deducted.",
        };
    }

    private BookingCreditConsumptionResult ConsumeWalletCredit(OrganisationBilling account, string bookingCode)
    {
        CreditWalletCatalog.EnsureFreeMonthReset(account);
        var cost = Math.Max(1, account.CreditsPerBooking);

        if (account.WalletCreditBalance >= cost)
        {
            account.WalletCreditBalance -= cost;
            account.Transactions.Insert(0, new CreditTransaction
            {
                Type = CreditType.wallet_deduction,
                Amount = -cost,
                Description = $"Booking credit used — {bookingCode}",
            });
            _data.SaveBilling();
            return new BookingCreditConsumptionResult
            {
                Success = true,
                Mode = BillingMode.credit_wallet,
                CreditsConsumed = cost,
                Message = $"{cost} booking credit(s) deducted. Balance: {account.WalletCreditBalance}.",
            };
        }

        if (account.WalletFreeBookingsUsedThisMonth < CreditWalletCatalog.FreeBookingsPerMonth)
        {
            account.WalletFreeBookingsUsedThisMonth++;
            account.Transactions.Insert(0, new CreditTransaction
            {
                Type = CreditType.wallet_free,
                Amount = 0,
                Description = $"Free monthly booking — {bookingCode}",
            });
            _data.SaveBilling();
            var remaining = CreditWalletCatalog.FreeBookingsRemaining(account);
            return new BookingCreditConsumptionResult
            {
                Success = true,
                Mode = BillingMode.credit_wallet,
                UsedFreeAllowance = true,
                Message = $"Free booking used ({remaining} free bookings left this month).",
            };
        }

        throw new InvalidOperationException(
            "Insufficient booking credits. Recharge your Credit Wallet to accept more bookings.");
    }
}
