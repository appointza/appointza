using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class SubscriptionPlanService
    {
        readonly IDbProvider dbprovider;

        public SubscriptionPlanService(IDbProvider dbprovider)
        {
            this.dbprovider = dbprovider;
        }

        public async Task<List<SubscriptionPlan>> SelectAll(string? projectName = null)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectAllTransaction(db, projectName);
        }

        public async Task<List<SubscriptionPlan>> SelectAllTransaction(IDb db, string? projectName = null)
        {
            var result = new List<SubscriptionPlan>();
            var query = @"
                SELECT id, plan_code, project_name, display_name, monthly_price_inr, booking_fee_inr,
                       booking_fee_percent, trial_days,
                       COALESCE(free_bookings_per_month, 0) AS free_bookings_per_month,
                       sort_order, isactive
                FROM subscription_plans
                WHERE isactive = TRUE";

            if (!string.IsNullOrWhiteSpace(projectName))
            {
                query += " AND LOWER(TRIM(project_name)) = LOWER(TRIM(@project_name))";
            }

            query += " ORDER BY sort_order ASC, id ASC";

            DbCommand command = db.GetCommand(query);
            if (!string.IsNullOrWhiteSpace(projectName))
            {
                db.AddParameter(command, "project_name", DbTypes.Types.String).Value = projectName.Trim();
            }

            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                result.Add(MapPlan(reader));
            }
            return result;
        }

        public async Task<SubscriptionPlan?> GetByCodeTransaction(IDb db, string planCode)
        {
            const string query = @"
                SELECT id, plan_code, project_name, display_name, monthly_price_inr, booking_fee_inr,
                       booking_fee_percent, trial_days,
                       COALESCE(free_bookings_per_month, 0) AS free_bookings_per_month,
                       sort_order, isactive
                FROM subscription_plans
                WHERE LOWER(TRIM(plan_code)) = LOWER(TRIM(@plan_code))
                  AND isactive = TRUE
                LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = (planCode ?? "").Trim();
            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return MapPlan(reader);
            }
            return null;
        }

        /// <summary>
        /// Recharge packs shown on the billing tab — sourced from subscription_plans (paid tiers only).
        /// </summary>
        public async Task<List<CreditWalletPack>> SelectCreditWalletPacksTransaction(
            IDb db,
            string? projectName = "appointza")
        {
            var plans = await SelectAllTransaction(db, projectName);
            var paidPlans = plans
                .Where(p => p.monthly_price_inr > 0)
                .OrderBy(p => p.sort_order)
                .ThenBy(p => p.id)
                .ToList();

            if (paidPlans.Count == 0)
            {
                return new List<CreditWalletPack>();
            }

            var topSortOrder = paidPlans.Max(p => p.sort_order);
            return paidPlans
                .Select(p => MapSubscriptionPlanToCreditPack(p, p.sort_order == topSortOrder))
                .ToList();
        }

        public async Task<CreditWalletPack?> GetCreditWalletPackByCodeTransaction(IDb db, string packId)
        {
            var plan = await GetByCodeTransaction(db, packId);
            if (plan == null || plan.monthly_price_inr <= 0)
            {
                return null;
            }

            var allPaid = (await SelectAllTransaction(db, plan.project_name))
                .Where(p => p.monthly_price_inr > 0)
                .ToList();
            var topSortOrder = allPaid.Count > 0 ? allPaid.Max(p => p.sort_order) : plan.sort_order;
            return MapSubscriptionPlanToCreditPack(plan, plan.sort_order == topSortOrder);
        }

        static CreditWalletPack MapSubscriptionPlanToCreditPack(SubscriptionPlan plan, bool highlighted)
        {
            var credits = Math.Max(0, plan.free_bookings_per_month);
            var price = plan.monthly_price_inr;
            return new CreditWalletPack
            {
                id = plan.plan_code,
                name = plan.display_name,
                description = credits > 0
                    ? $"₹{price:N0} recharge → {credits} booking credits"
                    : $"₹{price:N0} recharge pack",
                price_inr = price,
                credits = credits,
                highlighted = highlighted,
            };
        }

        static SubscriptionPlan MapPlan(DbDataReader reader)
        {
            return new SubscriptionPlan
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt32(reader["id"]),
                plan_code = reader["plan_code"]?.ToString() ?? "",
                project_name = reader["project_name"]?.ToString() ?? "appointza",
                display_name = reader["display_name"]?.ToString() ?? "",
                monthly_price_inr = reader["monthly_price_inr"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["monthly_price_inr"]),
                booking_fee_inr = reader["booking_fee_inr"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["booking_fee_inr"]),
                booking_fee_percent = reader["booking_fee_percent"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["booking_fee_percent"]),
                trial_days = reader["trial_days"] == DBNull.Value ? 0 : Convert.ToInt32(reader["trial_days"]),
                free_bookings_per_month = reader["free_bookings_per_month"] == DBNull.Value ? 0 : Convert.ToInt32(reader["free_bookings_per_month"]),
                sort_order = reader["sort_order"] == DBNull.Value ? 0 : Convert.ToInt32(reader["sort_order"]),
                isactive = reader["isactive"] == DBNull.Value || Convert.ToBoolean(reader["isactive"]),
            };
        }
    }
}
