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
            // Lazy-migrate + lazy-seed: keep the API working even if the latest
            // subscription_tables.sql hasn't been applied to this database yet.
            await EnsureSchemaTransaction(db);
            await EnsureSeededTransaction(db);
            await EnsurePlanCatalogSyncedTransaction(db);

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
            await EnsureSchemaTransaction(db);
            await EnsureSeededTransaction(db);
            await EnsurePlanCatalogSyncedTransaction(db);

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
        /// Idempotently applies the column additions from
        /// Database/subscription_tables.sql so that the API keeps working even when
        /// the table predates a recent migration (e.g. before
        /// <c>free_bookings_per_month</c> was added). Uses
        /// <c>ADD COLUMN IF NOT EXISTS</c> so it's safe to call on every request.
        /// </summary>
        public async Task EnsureSchemaTransaction(IDb db)
        {
            // PostgreSQL: ADD COLUMN IF NOT EXISTS is a no-op when the column
            // already exists, so this is cheap to run on every read path.
            string[] alterStatements =
            {
                "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS project_name VARCHAR(64) NOT NULL DEFAULT 'appointza'",
                "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS free_bookings_per_month INTEGER NOT NULL DEFAULT 0",
            };

            foreach (var sql in alterStatements)
            {
                try
                {
                    DbCommand cmd = db.GetCommand(sql);
                    await db.ExecuteNonQuery(cmd);
                }
                catch
                {
                    // The table may not exist yet on a brand-new install; the
                    // CREATE TABLE in subscription_tables.sql is authoritative.
                    // Swallow so we don't break unrelated requests.
                }
            }

            // Backfill canonical free-booking quotas for known plan codes that
            // were inserted before the column existed (their value is 0).
            (string code, int quota)[] backfill =
            {
                ("free", 50),
                ("starter", 50),
                ("growth", 200),
                ("business", 500),
                ("enterprise", 1400),
                ("premium", 4000),
            };

            foreach (var b in backfill)
            {
                try
                {
                    const string update = @"
                        UPDATE subscription_plans
                        SET free_bookings_per_month = @quota
                        WHERE LOWER(TRIM(plan_code)) = LOWER(TRIM(@plan_code))
                          AND COALESCE(free_bookings_per_month, 0) = 0";
                    DbCommand cmd = db.GetCommand(update);
                    db.AddParameter(cmd, "quota", DbTypes.Types.Integer).Value = b.quota;
                    db.AddParameter(cmd, "plan_code", DbTypes.Types.String).Value = b.code;
                    await db.ExecuteNonQuery(cmd);
                }
                catch
                {
                    // ignore — table missing on first install, handled by seed step
                }
            }
        }

        /// <summary>
        /// Lazy-seeds the canonical 5 Appointza plans into subscription_plans when the
        /// table is empty. The schema migration in Database/subscription_tables.sql is
        /// still authoritative; this just keeps the API responsive on a fresh database.
        /// </summary>
        public async Task EnsureSeededTransaction(IDb db)
        {
            const string countQuery = "SELECT COUNT(*) AS cnt FROM subscription_plans";
            DbCommand countCmd = db.GetCommand(countQuery);
            int existing = 0;
            using (DbDataReader reader = await db.Execute(countCmd))
            {
                if (await reader.ReadAsync())
                {
                    existing = reader["cnt"] == DBNull.Value ? 0 : Convert.ToInt32(reader["cnt"]);
                }
            }

            if (existing > 0) return;

            const string insert = @"
                INSERT INTO subscription_plans (
                    plan_code, project_name, display_name, monthly_price_inr,
                    booking_fee_inr, booking_fee_percent, trial_days,
                    free_bookings_per_month, sort_order, isactive
                )
                VALUES (
                    @plan_code, 'appointza', @display_name, @monthly_price_inr,
                    @booking_fee_inr, @booking_fee_percent, @trial_days,
                    @free_bookings_per_month, @sort_order, TRUE
                )
                ON CONFLICT (plan_code) DO NOTHING";

            (string code, string name, decimal price, decimal feeInr, decimal feePct, int trial, int freeQuota, int order)[] seed =
            {
                ("free",       "Free",        0m,     10m, 3.000m, 0,   50,   0),
                ("starter",    "Starter",    1000m,   20m, 2.000m, 0,   50,   1),
                ("growth",     "Growth",     3000m,   15m, 1.500m, 0,  200,   2),
                ("business",   "Business",   5000m,   10m, 1.000m, 0,  500,   3),
                ("enterprise", "Enterprise", 10000m,   7m, 0.700m, 0, 1400,   4),
                ("premium",    "Premium",    20000m,   5m, 0.500m, 0, 4000,   5),
            };

            foreach (var s in seed)
            {
                DbCommand cmd = db.GetCommand(insert);
                db.AddParameter(cmd, "plan_code", DbTypes.Types.String).Value = s.code;
                db.AddParameter(cmd, "display_name", DbTypes.Types.String).Value = s.name;
                db.AddParameter(cmd, "monthly_price_inr", DbTypes.Types.Decimal).Value = s.price;
                db.AddParameter(cmd, "booking_fee_inr", DbTypes.Types.Decimal).Value = s.feeInr;
                db.AddParameter(cmd, "booking_fee_percent", DbTypes.Types.Decimal).Value = s.feePct;
                db.AddParameter(cmd, "trial_days", DbTypes.Types.Integer).Value = s.trial;
                db.AddParameter(cmd, "free_bookings_per_month", DbTypes.Types.Integer).Value = s.freeQuota;
                db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = s.order;
                await db.ExecuteNonQuery(cmd);
            }
        }

        /// <summary>
        /// Keeps canonical Appointza plan pricing in sync with Database/subscription_tables.sql.
        /// </summary>
        public async Task EnsurePlanCatalogSyncedTransaction(IDb db)
        {
            (string code, string name, decimal price, decimal feeInr, decimal feePct, int trial, int freeQuota, int order)[] catalog =
            {
                ("free",       "Free",        0m,     10m, 3.000m, 0,   50,   0),
                ("starter",    "Starter",    1000m,   20m, 2.000m, 0,   50,   1),
                ("growth",     "Growth",     3000m,   15m, 1.500m, 0,  200,   2),
                ("business",   "Business",   5000m,   10m, 1.000m, 0,  500,   3),
                ("enterprise", "Enterprise", 10000m,   7m, 0.700m, 0, 1400,   4),
                ("premium",    "Premium",    20000m,   5m, 0.500m, 0, 4000,   5),
            };

            const string upsert = @"
                INSERT INTO subscription_plans (
                    plan_code, project_name, display_name, monthly_price_inr,
                    booking_fee_inr, booking_fee_percent, trial_days,
                    free_bookings_per_month, sort_order, isactive
                )
                VALUES (
                    @plan_code, 'appointza', @display_name, @monthly_price_inr,
                    @booking_fee_inr, @booking_fee_percent, @trial_days,
                    @free_bookings_per_month, @sort_order, TRUE
                )
                ON CONFLICT (plan_code) DO UPDATE SET
                    project_name = EXCLUDED.project_name,
                    display_name = EXCLUDED.display_name,
                    monthly_price_inr = EXCLUDED.monthly_price_inr,
                    booking_fee_inr = EXCLUDED.booking_fee_inr,
                    booking_fee_percent = EXCLUDED.booking_fee_percent,
                    trial_days = EXCLUDED.trial_days,
                    free_bookings_per_month = EXCLUDED.free_bookings_per_month,
                    sort_order = EXCLUDED.sort_order,
                    isactive = TRUE";

            foreach (var s in catalog)
            {
                try
                {
                    DbCommand cmd = db.GetCommand(upsert);
                    db.AddParameter(cmd, "plan_code", DbTypes.Types.String).Value = s.code;
                    db.AddParameter(cmd, "display_name", DbTypes.Types.String).Value = s.name;
                    db.AddParameter(cmd, "monthly_price_inr", DbTypes.Types.Decimal).Value = s.price;
                    db.AddParameter(cmd, "booking_fee_inr", DbTypes.Types.Decimal).Value = s.feeInr;
                    db.AddParameter(cmd, "booking_fee_percent", DbTypes.Types.Decimal).Value = s.feePct;
                    db.AddParameter(cmd, "trial_days", DbTypes.Types.Integer).Value = s.trial;
                    db.AddParameter(cmd, "free_bookings_per_month", DbTypes.Types.Integer).Value = s.freeQuota;
                    db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = s.order;
                    await db.ExecuteNonQuery(cmd);
                }
                catch
                {
                    // Table may not exist yet on first install.
                }
            }

            try
            {
                const string deactivateLegacy = @"
                    UPDATE subscription_plans
                    SET isactive = FALSE
                    WHERE LOWER(TRIM(plan_code)) IN ('basic', 'pro')";
                DbCommand deactivateCmd = db.GetCommand(deactivateLegacy);
                await db.ExecuteNonQuery(deactivateCmd);
            }
            catch
            {
                // ignore
            }
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
