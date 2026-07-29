using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationSubscriptionService
    {
        readonly IDbProvider dbprovider;
        readonly SubscriptionPlanService subscriptionPlanService;
        readonly CreditWalletService creditWalletService;

        public OrganisationSubscriptionService(
            IDbProvider dbprovider,
            SubscriptionPlanService subscriptionPlanService,
            CreditWalletService creditWalletService)
        {
            this.dbprovider = dbprovider;
            this.subscriptionPlanService = subscriptionPlanService;
            this.creditWalletService = creditWalletService;
        }

        public async Task<OrganisationSubscriptionStatusRes> GetStatus(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetStatusTransaction(db, organisationId);
        }

        public async Task<OrganisationSubscriptionStatusRes> GetStatusTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0)
            {
                throw new ArgumentException("organisation_id is required", nameof(organisationId));
            }

            var sub = await SelectActiveForOrgTransaction(db, organisationId);
            if (sub == null)
            {
                sub = await StartTrialTransaction(db, organisationId, SubscriptionPlanCodes.Free);
            }

            var plan = await subscriptionPlanService.GetByCodeTransaction(db, sub.plan_code)
                ?? await subscriptionPlanService.GetByCodeTransaction(db, SubscriptionPlanCodes.Free);

            var entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            sub = await EnsureSubscriptionPeriodDatesTransaction(db, organisationId, sub, plan, entitlement);
            entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            int bookingsThisMonth = await CountBookingsThisMonthTransaction(db, organisationId);
            var (outstandingAmount, unpaidCount) = await CountOutstandingTransaction(db, organisationId);
            return await BuildAndEnrichStatusDto(
                db,
                organisationId,
                sub,
                plan,
                entitlement,
                bookingsThisMonth,
                outstandingAmount,
                unpaidCount);
        }

        async Task<OrganisationSubscriptionStatusRes> BuildAndEnrichStatusDto(
            IDb db,
            long organisationId,
            OrganisationSubscription sub,
            SubscriptionPlan? plan,
            OrganisationLaunchEntitlement? entitlement,
            int bookingsUsedThisMonth,
            decimal outstandingAmountInr,
            int unpaidBookingsCount)
        {
            var status = BuildStatusDto(
                organisationId,
                sub,
                plan,
                entitlement,
                bookingsUsedThisMonth,
                outstandingAmountInr,
                unpaidBookingsCount);
            await creditWalletService.ApplyWalletFieldsTransaction(db, status, organisationId);
            return status;
        }
        public async Task<(decimal amount, int count)> CountOutstandingTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0) return (0m, 0);
            const string query = @"
                SELECT COALESCE(SUM(fee_inr), 0) AS amount,
                       COUNT(*)                  AS cnt
                FROM booking_fee_ledger
                WHERE organisation_id = @organisation_id
                  AND fee_waived = FALSE
                  AND COALESCE(fee_inr, 0) > 0
                  AND payment_id IS NULL";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                decimal amount = reader["amount"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["amount"]);
                int count = reader["cnt"] == DBNull.Value ? 0 : Convert.ToInt32(reader["cnt"]);
                return (amount, count);
            }
            return (0m, 0);
        }

        /// <summary>
        /// Count distinct bookings recorded in booking_fee_ledger for the current calendar month (UTC).
        /// Each ledger row maps to a single appointment / event booking.
        /// </summary>
        public async Task<int> CountBookingsThisMonthTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0) return 0;
            const string query = @"
                SELECT COUNT(*) AS booking_count
                FROM booking_fee_ledger
                WHERE organisation_id = @organisation_id
                  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return reader["booking_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["booking_count"]);
            }
            return 0;
        }

        public async Task<OrganisationSubscription> StartTrial(long organisationId, string? planCode = null)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await StartTrialTransaction(db, organisationId, planCode);
        }

        public async Task<OrganisationSubscription> StartTrialTransaction(IDb db, long organisationId, string? planCode = null)
        {
            var existing = await SelectActiveForOrgTransaction(db, organisationId);
            if (existing != null)
            {
                return existing;
            }

            var normalizedPlan = NormalizePlanCode(planCode);
            if (string.IsNullOrEmpty(normalizedPlan))
            {
                normalizedPlan = SubscriptionPlanCodes.Free;
            }

            var plan = await subscriptionPlanService.GetByCodeTransaction(db, normalizedPlan);
            if (plan == null)
            {
                throw new ArgumentException(
                    $"Plan '{planCode}' is not available. Add it to subscription_plans with isactive = TRUE.");
            }

            normalizedPlan = NormalizePlanCode(plan.plan_code);

            var entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            var trial = ResolveLaunchTrial(plan, entitlement);

            var now = DateTime.UtcNow;
            const string query = @"
                INSERT INTO organisation_subscriptions (
                    organisation_id, plan_code, status, trial_ends_at,
                    current_period_start, current_period_end,
                    created_at, updated_at, isactive
                )
                VALUES (
                    @organisation_id, @plan_code, @status, @trial_ends_at,
                    @current_period_start, @current_period_end,
                    @created_at, @updated_at, TRUE
                )
                RETURNING id";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = normalizedPlan;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = trial.Status;
            db.AddParameter(command, "trial_ends_at", DbTypes.Types.DateTime).Value =
                trial.TrialEndsAt.HasValue ? trial.TrialEndsAt.Value : DBNull.Value;
            db.AddParameter(command, "current_period_start", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "current_period_end", DbTypes.Types.DateTime).Value =
                trial.TrialEndsAt ?? now.AddMonths(1);
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            long newId = 0;
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    newId = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }

            if (trial.GrantLaunchOffer)
            {
                await InsertLaunchEntitlementTransaction(
                    db,
                    organisationId,
                    normalizedPlan,
                    trial.TrialEndsAt!.Value,
                    now);
            }

            return new OrganisationSubscription
            {
                id = newId,
                organisation_id = organisationId,
                plan_code = normalizedPlan,
                status = trial.Status,
                trial_ends_at = trial.TrialEndsAt,
                current_period_start = now,
                current_period_end = trial.TrialEndsAt ?? now.AddMonths(1),
                created_at = now,
                updated_at = now,
                isactive = true,
            };
        }

        /// <summary>
        /// Adds free subscription time (trial end and billing period end) for referral rewards.
        /// </summary>
        public async Task<bool> ExtendFreePeriodByMonthsTransaction(IDb db, long organisationId, int months)
        {
            if (organisationId <= 0 || months <= 0)
            {
                return false;
            }

            var sub = await SelectActiveForOrgTransaction(db, organisationId);
            if (sub == null)
            {
                return false;
            }

            var now = DateTime.UtcNow;
            DateTime periodStart = IsMeaningfulDate(sub.current_period_start)
                ? sub.current_period_start!.Value
                : IsMeaningfulDate(sub.created_at) ? sub.created_at : now;

            DateTime? trialEnds = IsMeaningfulDate(sub.trial_ends_at) ? sub.trial_ends_at : null;
            DateTime periodEnd = IsMeaningfulDate(sub.current_period_end)
                ? sub.current_period_end!.Value
                : trialEnds ?? periodStart.AddMonths(1);

            DateTime anchor = trialEnds.HasValue && trialEnds.Value > periodEnd ? trialEnds.Value : periodEnd;
            if (anchor < now)
            {
                anchor = now;
            }

            DateTime newTrialEnds = anchor.AddMonths(months);
            DateTime newPeriodEnd = periodEnd.AddMonths(months);
            if (newTrialEnds > newPeriodEnd)
            {
                newPeriodEnd = newTrialEnds;
            }

            string status = newTrialEnds > now ? "trialing" : (sub.status ?? "active");

            const string update = @"
                UPDATE organisation_subscriptions
                SET trial_ends_at = @trial_ends_at,
                    current_period_end = @current_period_end,
                    status = @status,
                    updated_at = @updated_at
                WHERE id = @id AND isactive = TRUE";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "trial_ends_at", DbTypes.Types.DateTime).Value = newTrialEnds;
            db.AddParameter(command, "current_period_end", DbTypes.Types.DateTime).Value = newPeriodEnd;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = sub.id;
            await db.ExecuteNonQuery(command);

            var entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            if (entitlement != null)
            {
                DateTime entitlementEnd = IsMeaningfulDate(entitlement.trial_ends_at)
                    ? entitlement.trial_ends_at
                    : newTrialEnds;
                if (entitlementEnd < now)
                {
                    entitlementEnd = now;
                }

                const string updateEntitlement = @"
                    UPDATE organisation_launch_entitlements
                    SET trial_ends_at = @trial_ends_at
                    WHERE organisation_id = @organisation_id";

                DbCommand entCmd = db.GetCommand(updateEntitlement);
                db.AddParameter(entCmd, "trial_ends_at", DbTypes.Types.DateTime).Value =
                    entitlementEnd.AddMonths(months);
                db.AddParameter(entCmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                await db.ExecuteNonQuery(entCmd);
            }

            return true;
        }

        public async Task<OrganisationSubscriptionStatusRes> ChangePlan(long organisationId, string planCode)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await ChangePlanTransaction(db, organisationId, planCode);
        }

        public async Task<OrganisationSubscriptionStatusRes> ChangePlanTransaction(IDb db, long organisationId, string planCode)
        {
            var normalized = NormalizePlanCode(planCode);
            var plan = await subscriptionPlanService.GetByCodeTransaction(db, normalized);
            if (plan == null)
            {
                throw new ArgumentException(
                    $"Plan '{planCode}' is not available. Add it to subscription_plans with isactive = TRUE.");
            }

            normalized = NormalizePlanCode(plan.plan_code);

            var sub = await SelectActiveForOrgTransaction(db, organisationId);
            if (sub == null)
            {
                await StartTrialTransaction(db, organisationId, normalized);
                sub = await SelectActiveForOrgTransaction(db, organisationId);
            }

            if (sub == null)
            {
                throw new InvalidOperationException("Could not load organisation subscription");
            }

            var entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            var trial = ResolveLaunchTrial(plan, entitlement);

            if (trial.GrantLaunchOffer)
            {
                var now = DateTime.UtcNow;
                const string grantLaunchUpdate = @"
                    UPDATE organisation_subscriptions
                    SET plan_code = @plan_code,
                        status = @status,
                        current_period_start = COALESCE(current_period_start, @current_period_start),
                        trial_ends_at = @trial_ends_at,
                        current_period_end = @current_period_end,
                        updated_at = @updated_at
                    WHERE id = @id AND isactive = TRUE";

                DbCommand grantCmd = db.GetCommand(grantLaunchUpdate);
                db.AddParameter(grantCmd, "plan_code", DbTypes.Types.String).Value = normalized;
                db.AddParameter(grantCmd, "status", DbTypes.Types.String).Value = trial.Status;
                db.AddParameter(grantCmd, "current_period_start", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(grantCmd, "trial_ends_at", DbTypes.Types.DateTime).Value = trial.TrialEndsAt!.Value;
                db.AddParameter(grantCmd, "current_period_end", DbTypes.Types.DateTime).Value = trial.TrialEndsAt!.Value;
                db.AddParameter(grantCmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(grantCmd, "id", DbTypes.Types.Long).Value = sub.id;
                await db.ExecuteNonQuery(grantCmd);

                await InsertLaunchEntitlementTransaction(
                    db,
                    organisationId,
                    normalized,
                    trial.TrialEndsAt!.Value,
                    now);

                sub.plan_code = normalized;
                sub.status = trial.Status;
                sub.trial_ends_at = trial.TrialEndsAt;
            }
            else
            {
                const string update = @"
                    UPDATE organisation_subscriptions
                    SET plan_code = @plan_code, updated_at = @updated_at
                    WHERE id = @id AND isactive = TRUE";

                DbCommand command = db.GetCommand(update);
                db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = normalized;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = sub.id;
                await db.ExecuteNonQuery(command);

                sub.plan_code = normalized;
            }

            sub = await EnsureSubscriptionPeriodDatesTransaction(db, organisationId, sub, plan, entitlement);
            entitlement = await SelectLaunchEntitlementTransaction(db, organisationId);
            int bookingsThisMonth = await CountBookingsThisMonthTransaction(db, organisationId);
            var (outstandingAmount, unpaidCount) = await CountOutstandingTransaction(db, organisationId);
            return await BuildAndEnrichStatusDto(
                db,
                organisationId,
                sub,
                plan,
                entitlement,
                bookingsThisMonth,
                outstandingAmount,
                unpaidCount);
        }

        /// <summary>
        /// Fills missing period dates on organisation_subscriptions (and launch entitlement when applicable).
        /// </summary>
        async Task<OrganisationSubscription> EnsureSubscriptionPeriodDatesTransaction(
            IDb db,
            long organisationId,
            OrganisationSubscription sub,
            SubscriptionPlan? plan,
            OrganisationLaunchEntitlement? entitlement)
        {
            var now = DateTime.UtcNow;
            bool needsPeriodStart = !IsMeaningfulDate(sub.current_period_start);
            bool needsTrialEnd = !IsMeaningfulDate(sub.trial_ends_at);
            bool needsPeriodEnd = !IsMeaningfulDate(sub.current_period_end);
            bool launchEligible = LaunchOfferSettings.IsLaunchEligiblePlan(plan);

            if (!needsPeriodStart && !needsTrialEnd && !needsPeriodEnd)
            {
                if (launchEligible && IsMeaningfulDate(sub.trial_ends_at) && entitlement == null)
                {
                    await InsertLaunchEntitlementTransaction(
                        db,
                        organisationId,
                        sub.plan_code,
                        sub.trial_ends_at!.Value,
                        IsMeaningfulDate(sub.current_period_start) ? sub.current_period_start!.Value : sub.created_at);
                }

                return sub;
            }

            DateTime periodStart = IsMeaningfulDate(sub.current_period_start)
                ? sub.current_period_start!.Value
                : IsMeaningfulDate(entitlement?.availed_at)
                    ? entitlement!.availed_at
                    : IsMeaningfulDate(sub.created_at)
                        ? sub.created_at
                        : now;

            DateTime? trialEnds = IsMeaningfulDate(sub.trial_ends_at) ? sub.trial_ends_at : null;
            if (entitlement != null && IsMeaningfulDate(entitlement.trial_ends_at))
            {
                trialEnds = entitlement.trial_ends_at;
                periodStart = IsMeaningfulDate(entitlement.availed_at) ? entitlement.availed_at : periodStart;
            }
            else if (launchEligible && !trialEnds.HasValue && entitlement == null)
            {
                int trialDays = plan!.trial_days > 0 ? plan.trial_days : LaunchOfferSettings.TrialDays;
                trialEnds = periodStart.AddDays(trialDays);
            }

            DateTime periodEnd = IsMeaningfulDate(sub.current_period_end)
                ? sub.current_period_end!.Value
                : trialEnds ?? periodStart.AddMonths(1);

            string status = trialEnds.HasValue && now < trialEnds.Value ? "trialing" : (sub.status ?? "active");
            if (!launchEligible && !trialEnds.HasValue)
            {
                status = "active";
            }

            const string update = @"
                UPDATE organisation_subscriptions
                SET current_period_start = @current_period_start,
                    current_period_end = @current_period_end,
                    trial_ends_at = @trial_ends_at,
                    status = @status,
                    updated_at = @updated_at
                WHERE id = @id AND isactive = TRUE";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "current_period_start", DbTypes.Types.DateTime).Value = periodStart;
            db.AddParameter(command, "current_period_end", DbTypes.Types.DateTime).Value = periodEnd;
            db.AddParameter(command, "trial_ends_at", DbTypes.Types.DateTime).Value =
                trialEnds.HasValue ? trialEnds.Value : DBNull.Value;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = sub.id;
            await db.ExecuteNonQuery(command);

            if (launchEligible && trialEnds.HasValue && entitlement == null)
            {
                await InsertLaunchEntitlementTransaction(
                    db,
                    organisationId,
                    sub.plan_code,
                    trialEnds.Value,
                    periodStart);
            }

            var refreshed = await SelectActiveForOrgTransaction(db, organisationId);
            return refreshed ?? sub;
        }

        static bool IsMeaningfulDate(DateTime? value) =>
            value.HasValue && value.Value.Year > 2000;

        /// <summary>
        /// Signup uses the Free plan monthly booking quota (50/month); no time-based launch trial.
        /// </summary>
        static LaunchTrialResolution ResolveLaunchTrial(
            SubscriptionPlan? plan,
            OrganisationLaunchEntitlement? existingEntitlement) =>
            new LaunchTrialResolution("active", null, false);

        static string NormalizePlanCode(string? planCode) =>
            (planCode ?? "").Trim().ToLowerInvariant();

        readonly record struct LaunchTrialResolution(string Status, DateTime? TrialEndsAt, bool GrantLaunchOffer);

        async Task<OrganisationLaunchEntitlement?> SelectLaunchEntitlementTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT organisation_id, offer_code, plan_code, availed_at, trial_ends_at
                FROM organisation_launch_entitlements
                WHERE organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new OrganisationLaunchEntitlement
            {
                organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                offer_code = reader["offer_code"]?.ToString() ?? LaunchOfferSettings.FiftyBookingsFree,
                plan_code = reader["plan_code"]?.ToString() ?? "",
                availed_at = reader["availed_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["availed_at"]),
                trial_ends_at = reader["trial_ends_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["trial_ends_at"]),
            };
        }

        static async Task InsertLaunchEntitlementTransaction(
            IDb db,
            long organisationId,
            string planCode,
            DateTime trialEndsAt,
            DateTime availedAt)
        {
            const string query = @"
                INSERT INTO organisation_launch_entitlements (
                    organisation_id, offer_code, plan_code, availed_at, trial_ends_at
                )
                VALUES (
                    @organisation_id, @offer_code, @plan_code, @availed_at, @trial_ends_at
                )
                ON CONFLICT (organisation_id) DO NOTHING";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "offer_code", DbTypes.Types.String).Value = LaunchOfferSettings.FiftyBookingsFree;
            db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = planCode;
            db.AddParameter(command, "availed_at", DbTypes.Types.DateTime).Value = availedAt;
            db.AddParameter(command, "trial_ends_at", DbTypes.Types.DateTime).Value = trialEndsAt;
            await db.ExecuteNonQuery(command);
        }

        async Task<OrganisationSubscription?> SelectActiveForOrgTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT id, organisation_id, plan_code, status, trial_ends_at,
                       current_period_start, current_period_end,
                       razorpay_customer_id, razorpay_subscription_id,
                       created_at, updated_at, isactive
                FROM organisation_subscriptions
                WHERE organisation_id = @organisation_id AND isactive = TRUE
                ORDER BY id DESC
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return MapSubscription(reader);
            }
            return null;
        }

        static OrganisationSubscription MapSubscription(DbDataReader reader)
        {
            return new OrganisationSubscription
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                plan_code = reader["plan_code"]?.ToString() ?? SubscriptionPlanCodes.Free,
                status = reader["status"]?.ToString() ?? "trialing",
                trial_ends_at = reader["trial_ends_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["trial_ends_at"]),
                current_period_start = reader["current_period_start"] == DBNull.Value ? null : Convert.ToDateTime(reader["current_period_start"]),
                current_period_end = reader["current_period_end"] == DBNull.Value ? null : Convert.ToDateTime(reader["current_period_end"]),
                razorpay_customer_id = reader["razorpay_customer_id"]?.ToString() ?? "",
                razorpay_subscription_id = reader["razorpay_subscription_id"]?.ToString() ?? "",
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
                isactive = reader["isactive"] == DBNull.Value || Convert.ToBoolean(reader["isactive"]),
            };
        }

        static OrganisationSubscriptionStatusRes BuildStatusDto(
            long organisationId,
            OrganisationSubscription sub,
            SubscriptionPlan? plan,
            OrganisationLaunchEntitlement? entitlement,
            int bookingsUsedThisMonth,
            decimal outstandingAmountInr,
            int unpaidBookingsCount)
        {
            var now = DateTime.UtcNow;
            bool inTrial = sub.trial_ends_at.HasValue && now < sub.trial_ends_at.Value;
            bool feesWaived = inTrial;
            bool launchAvailed = entitlement != null;
            bool launchAvailable = false;

            int? daysRemaining = null;
            if (sub.trial_ends_at.HasValue && inTrial)
            {
                daysRemaining = Math.Max(0, (int)Math.Ceiling((sub.trial_ends_at.Value - now).TotalDays));
            }

            decimal feeInr = plan?.booking_fee_inr ?? 3;
            decimal feePct = plan?.booking_fee_percent ?? 2;

            DateTime? planStartedAt = IsMeaningfulDate(sub.current_period_start)
                ? sub.current_period_start
                : IsMeaningfulDate(entitlement?.availed_at)
                    ? entitlement!.availed_at
                    : IsMeaningfulDate(sub.created_at)
                        ? sub.created_at
                        : null;

            DateTime? planEndsAt = inTrial
                ? (IsMeaningfulDate(sub.trial_ends_at) ? sub.trial_ends_at : entitlement?.trial_ends_at)
                : (IsMeaningfulDate(sub.current_period_end) ? sub.current_period_end : null);

            if (entitlement != null)
            {
                if (IsMeaningfulDate(entitlement.availed_at))
                {
                    planStartedAt = entitlement.availed_at;
                }

                if (IsMeaningfulDate(entitlement.trial_ends_at))
                {
                    planEndsAt = entitlement.trial_ends_at;
                }
            }

            if (!planEndsAt.HasValue && planStartedAt.HasValue && plan != null && plan.trial_days > 0
                && LaunchOfferSettings.IsLaunchEligiblePlan(plan))
            {
                planEndsAt = planStartedAt.Value.AddDays(plan.trial_days);
            }

            string periodType = inTrial
                ? "launch_trial"
                : string.Equals(sub.plan_code, SubscriptionPlanCodes.Free, StringComparison.OrdinalIgnoreCase)
                    ? "free"
                    : "billing_period";

            int freePerMonth = plan?.free_bookings_per_month ?? 0;
            bool unlimitedFree = freePerMonth <= 0;
            int? freeRemaining = unlimitedFree
                ? null
                : Math.Max(0, freePerMonth - Math.Max(0, bookingsUsedThisMonth));

            return new OrganisationSubscriptionStatusRes
            {
                organisation_id = organisationId,
                plan_code = sub.plan_code,
                plan_display_name = plan?.display_name ?? sub.plan_code,
                status = inTrial ? "trialing" : (sub.status ?? "active"),
                is_in_trial = inTrial,
                booking_fees_waived = feesWaived,
                trial_days_remaining = daysRemaining,
                trial_ends_at = sub.trial_ends_at,
                monthly_price_inr = plan?.monthly_price_inr ?? 0,
                booking_fee_inr = feeInr,
                booking_fee_percent = feePct,
                booking_fee_formula =
                    $"₹{feeInr:0} per booking or {feePct:0.##}% of booking value — whichever is higher",
                launch_offer_availed = launchAvailed,
                launch_offer_availed_at = entitlement?.availed_at,
                launch_offer_available = launchAvailable,
                launch_trial_days = LaunchOfferSettings.TrialDays,
                plan_started_at = planStartedAt,
                plan_ends_at = planEndsAt,
                current_period_start = sub.current_period_start,
                current_period_end = sub.current_period_end,
                subscription_created_at = sub.created_at,
                period_type = periodType,
                free_bookings_per_month = freePerMonth,
                free_bookings_used_this_month = Math.Max(0, bookingsUsedThisMonth),
                free_bookings_remaining = freeRemaining,
                free_bookings_unlimited = unlimitedFree,
                outstanding_amount_inr = Math.Max(0m, outstandingAmountInr),
                unpaid_bookings_count = Math.Max(0, unpaidBookingsCount),
            };
        }
    }
}
