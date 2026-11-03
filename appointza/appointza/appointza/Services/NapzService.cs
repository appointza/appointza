using appointza.Authentication.Services;
using appointza.Models;
using appointza.Razorpay;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class NapzService
    {
        readonly IDbProvider dbprovider;
        readonly RequestState requeststate;
        readonly OrganisationService organisationService;
        readonly UserProductProfileService productProfileService;
        readonly RazorpayService razorpayService;
        readonly ILogger<NapzService> logger;
        bool schemaReady;

        public NapzService(
            IDbProvider dbprovider,
            RequestState requeststate,
            OrganisationService organisationService,
            UserProductProfileService productProfileService,
            RazorpayService razorpayService,
            ILogger<NapzService> logger)
        {
            this.dbprovider = dbprovider;
            this.requeststate = requeststate;
            this.organisationService = organisationService;
            this.productProfileService = productProfileService;
            this.razorpayService = razorpayService;
            this.logger = logger;
        }

        public async Task EnsureSchema()
        {
            if (schemaReady) return;
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            schemaReady = true;
        }

        public async Task EnsureSchemaTransaction(IDb db)
        {
            const string sql = @"
CREATE TABLE IF NOT EXISTS napz_entitlements (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL UNIQUE,
    organisationid BIGINT NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'free',
    product_id VARCHAR(64) NULL,
    expires_at TIMESTAMPTZ NULL,
    is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
    saved_place_limit INT NOT NULL DEFAULT 3,
    free_trial_used BOOLEAN NOT NULL DEFAULT FALSE,
    createdon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE napz_entitlements
    ADD COLUMN IF NOT EXISTS free_trial_used BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS napz_orders (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL,
    organisationid BIGINT NOT NULL,
    package_id VARCHAR(64) NOT NULL,
    amount_paise INT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    razorpay_order_id VARCHAR(128) NOT NULL,
    razorpay_payment_id VARCHAR(128) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'created',
    createdon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_napz_orders_userid ON napz_orders (userid);
CREATE UNIQUE INDEX IF NOT EXISTS ux_napz_orders_razorpay_order ON napz_orders (razorpay_order_id);
";
            var cmd = db.GetCommand(sql);
            await db.ExecuteNonQuery(cmd);
        }

        /// <summary>Find or create the shared Napz product organisation shell.</summary>
        public async Task<Organisation> EnsureProductOrganisationTransaction(IDb db)
        {
            var existing = (await organisationService.SelectTransaction(db, new OrganisationSelectReq
            {
                gstnumber = ProductOrganisationMarkers.NapzGst,
            })).FirstOrDefault();
            if (existing != null) return existing;

            var org = new Organisation
            {
                name = ProductOrganisationMarkers.NapzName,
                gstnumber = ProductOrganisationMarkers.NapzGst,
                notes = ProductOrganisationMarkers.NapzNotes,
                primarytype = 0,
                secondarytype = 0,
                primarytypecode = "",
                secondarytypecode = "",
                isactive = true,
                organisation_type = "service",
            };
            await organisationService.InsertTransaction(db, org);
            logger.LogInformation("Created Napz product organisation id={Id}", org.id);
            return org;
        }

        public async Task<NapzEnsureUserRes> EnsureUser(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                await EnsureSchemaTransaction(db);
                var org = await EnsureProductOrganisationTransaction(db);
                await productProfileService.EnsureActiveProfileTransaction(
                    db,
                    userid,
                    ProductCodes.Napz,
                    "user",
                    org.id.ToString(),
                    userid.ToString());
                var entitlement = await EnsureFreeEntitlementTransaction(db, userid, org.id);
                await db.CommitTransaction();
                return new NapzEnsureUserRes
                {
                    userid = userid,
                    organisationid = org.id,
                    organisationname = org.name ?? ProductOrganisationMarkers.NapzName,
                    product = ProductCodes.Napz,
                    entitlement = entitlement,
                };
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<NapzEntitlement> GetEntitlement(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            var row = await SelectEntitlementTransaction(db, userid);
            if (row != null) return NormalizeEntitlement(row);
            var org = await EnsureProductOrganisationTransaction(db);
            return await EnsureFreeEntitlementTransaction(db, userid, org.id);
        }

        public async Task<NapzEntitlement> ClaimFreeTrial(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                await EnsureSchemaTransaction(db);
                var org = await EnsureProductOrganisationTransaction(db);
                var current = await EnsureFreeEntitlementTransaction(db, userid, org.id);

                if (current.free_trial_used
                    || string.Equals(current.product_id, NapzEntitlement.FreeTrialProductId, StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Free trial already used.");
                }

                if (current.is_lifetime || current.is_premium)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Premium is already active.");
                }

                var now = DateTime.UtcNow;
                const string sql = @"
INSERT INTO napz_entitlements (
    userid, organisationid, tier, product_id, expires_at, is_lifetime, saved_place_limit, free_trial_used, createdon, modifiedon
) VALUES (
    @userid, @organisationid, 'premium', @product_id, @expires_at, false, 10, true, @now, @now
)
ON CONFLICT (userid) DO UPDATE SET
    organisationid = EXCLUDED.organisationid,
    tier = EXCLUDED.tier,
    product_id = EXCLUDED.product_id,
    expires_at = EXCLUDED.expires_at,
    is_lifetime = false,
    saved_place_limit = GREATEST(napz_entitlements.saved_place_limit, EXCLUDED.saved_place_limit),
    free_trial_used = true,
    modifiedon = EXCLUDED.modifiedon;
";
                var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
                db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = org.id;
                db.AddParameter(cmd, "product_id", DbTypes.Types.String).Value = NapzEntitlement.FreeTrialProductId;
                db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value = now.AddDays(10);
                db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(cmd);

                var entitlement = await SelectEntitlementTransaction(db, userid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Could not start free trial.");
                await db.CommitTransaction();
                return NormalizeEntitlement(entitlement);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<NapzCreateOrderRes> CreateOrder(long userid, string packageId)
        {
            if (!NapzCatalog.TryGet(packageId, out var pkg))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unknown Napz package.");
            }

            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            var org = await EnsureProductOrganisationTransaction(db);

            var receipt = $"napz_{pkg.package_id}_{userid}_{DateTime.UtcNow:yyyyMMddHHmmss}";
            var razorpayOrder = await razorpayService.CreatePlatformOrder(new RazorpayOrderReq
            {
                amount = pkg.amount_paise,
                currency = "INR",
                receipt = receipt.Length > 40 ? receipt[..40] : receipt,
                notes = new RazorpayOrderNotes
                {
                    customerid = userid,
                },
            });

            await InsertOrderTransaction(db, new NapzOrderRow
            {
                userid = userid,
                organisationid = org.id,
                package_id = pkg.package_id,
                amount_paise = pkg.amount_paise,
                currency = "INR",
                razorpay_order_id = razorpayOrder.id,
                status = "created",
            });

            return new NapzCreateOrderRes
            {
                orderId = razorpayOrder.id,
                key = razorpayService.GetPlatformKeyId(),
                amountPaise = pkg.amount_paise,
                currency = "INR",
                receipt = razorpayOrder.receipt ?? receipt,
                package_id = pkg.package_id,
            };
        }

        public async Task<NapzEntitlement> VerifyPayment(long userid, NapzVerifyPaymentReq req)
        {
            if (req == null
                || string.IsNullOrWhiteSpace(req.razorpay_order_id)
                || string.IsNullOrWhiteSpace(req.razorpay_payment_id)
                || string.IsNullOrWhiteSpace(req.razorpay_signature))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Payment verification fields are required.");
            }

            if (!razorpayService.VerifyPlatformPaymentSignature(
                    req.razorpay_order_id,
                    req.razorpay_payment_id,
                    req.razorpay_signature))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid Razorpay signature.");
            }

            using var db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                await EnsureSchemaTransaction(db);

                var order = await SelectOrderByRazorpayIdTransaction(db, req.razorpay_order_id);
                if (order == null || order.userid != userid)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Napz order not found for this user.");
                }

                if (!string.Equals(order.status, "paid", StringComparison.OrdinalIgnoreCase))
                {
                    order.razorpay_payment_id = req.razorpay_payment_id;
                    order.status = "paid";
                    await MarkOrderPaidTransaction(db, order);
                    await ApplyPackageEntitlementTransaction(db, userid, order.organisationid, order.package_id);
                }

                var entitlement = await SelectEntitlementTransaction(db, userid)
                    ?? await EnsureFreeEntitlementTransaction(db, userid, order.organisationid);
                await db.CommitTransaction();
                return NormalizeEntitlement(entitlement);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        /// <summary>Merge a Firebase entitlement snapshot into napz_entitlements (never downgrades lifetime).</summary>
        public async Task ImportFirebaseEntitlement(long userid, NapzFirebaseEntitlementImport imported)
        {
            if (imported == null) return;
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            var org = await EnsureProductOrganisationTransaction(db);
            var current = await SelectEntitlementTransaction(db, userid);
            await EnsureFreeEntitlementTransaction(db, userid, org.id);

            if (current?.is_lifetime == true)
            {
                // Keep lifetime; only mark free trial used if needed.
                if (imported.free_trial_used)
                {
                    const string mark = @"UPDATE napz_entitlements SET free_trial_used = true, modifiedon = @now WHERE userid = @userid;";
                    var markCmd = db.GetCommand(mark);
                    db.AddParameter(markCmd, "userid", DbTypes.Types.Long).Value = userid;
                    db.AddParameter(markCmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                    await db.ExecuteNonQuery(markCmd);
                }
                return;
            }

            var isLifetime = imported.is_lifetime
                || string.Equals(imported.tier, "lifetime", StringComparison.OrdinalIgnoreCase)
                || string.Equals(imported.product_id, "napz_lifetime", StringComparison.OrdinalIgnoreCase)
                || string.Equals(imported.product_id, "napz_premium_lifetime", StringComparison.OrdinalIgnoreCase);
            var premium = imported.premium || isLifetime
                || string.Equals(imported.tier, "premium", StringComparison.OrdinalIgnoreCase)
                || string.Equals(imported.tier, "lifetime", StringComparison.OrdinalIgnoreCase);
            var freeTrialUsed = imported.free_trial_used
                || string.Equals(imported.product_id, NapzEntitlement.FreeTrialProductId, StringComparison.OrdinalIgnoreCase);

            if (!premium && !freeTrialUsed)
            {
                return;
            }

            var tier = isLifetime ? "lifetime" : premium ? "premium" : "free";
            var expires = isLifetime ? (DateTime?)null : imported.expires_at;
            if (premium && !isLifetime && expires == null)
            {
                expires = DateTime.UtcNow.AddDays(10);
            }

            var limit = imported.saved_place_limit > 0
                ? imported.saved_place_limit
                : isLifetime ? 500 : premium ? 50 : 3;
            var productId = string.IsNullOrWhiteSpace(imported.product_id) ? null : imported.product_id;

            const string sql = @"
INSERT INTO napz_entitlements (
    userid, organisationid, tier, product_id, expires_at, is_lifetime, saved_place_limit, free_trial_used, createdon, modifiedon
) VALUES (
    @userid, @organisationid, @tier, @product_id, @expires_at, @is_lifetime, @saved_place_limit, @free_trial_used, @now, @now
)
ON CONFLICT (userid) DO UPDATE SET
    organisationid = EXCLUDED.organisationid,
    tier = CASE
        WHEN napz_entitlements.is_lifetime THEN napz_entitlements.tier
        WHEN EXCLUDED.is_lifetime THEN EXCLUDED.tier
        WHEN EXCLUDED.tier = 'premium' AND (napz_entitlements.tier = 'free' OR napz_entitlements.expires_at IS NULL OR napz_entitlements.expires_at < EXCLUDED.expires_at)
            THEN EXCLUDED.tier
        ELSE napz_entitlements.tier
    END,
    product_id = CASE WHEN napz_entitlements.is_lifetime THEN napz_entitlements.product_id ELSE COALESCE(EXCLUDED.product_id, napz_entitlements.product_id) END,
    expires_at = CASE
        WHEN EXCLUDED.is_lifetime THEN NULL
        WHEN napz_entitlements.is_lifetime THEN NULL
        WHEN EXCLUDED.expires_at IS NOT NULL AND (napz_entitlements.expires_at IS NULL OR napz_entitlements.expires_at < EXCLUDED.expires_at)
            THEN EXCLUDED.expires_at
        ELSE napz_entitlements.expires_at
    END,
    is_lifetime = napz_entitlements.is_lifetime OR EXCLUDED.is_lifetime,
    saved_place_limit = GREATEST(napz_entitlements.saved_place_limit, EXCLUDED.saved_place_limit),
    free_trial_used = napz_entitlements.free_trial_used OR EXCLUDED.free_trial_used,
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = org.id;
            db.AddParameter(cmd, "tier", DbTypes.Types.String).Value = tier;
            db.AddParameter(cmd, "product_id", DbTypes.Types.String).Value = (object?)productId ?? DBNull.Value;
            db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value = (object?)expires ?? DBNull.Value;
            db.AddParameter(cmd, "is_lifetime", DbTypes.Types.Boolean).Value = isLifetime;
            db.AddParameter(cmd, "saved_place_limit", DbTypes.Types.Integer).Value = limit;
            db.AddParameter(cmd, "free_trial_used", DbTypes.Types.Boolean).Value = freeTrialUsed;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(cmd);
        }

        async Task<NapzEntitlement> EnsureFreeEntitlementTransaction(IDb db, long userid, long organisationId)
        {
            var existing = await SelectEntitlementTransaction(db, userid);
            if (existing != null) return NormalizeEntitlement(existing);

            const string sql = @"
INSERT INTO napz_entitlements (
    userid, organisationid, tier, product_id, expires_at, is_lifetime, saved_place_limit, free_trial_used, createdon, modifiedon
) VALUES (
    @userid, @organisationid, 'free', NULL, NULL, false, 3, false, @now, @now
)
ON CONFLICT (userid) DO NOTHING;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);

            return await SelectEntitlementTransaction(db, userid)
                ?? new NapzEntitlement
                {
                    userid = userid,
                    organisationid = organisationId,
                    tier = "free",
                    saved_place_limit = 3,
                };
        }

        async Task ApplyPackageEntitlementTransaction(IDb db, long userid, long organisationId, string packageId)
        {
            if (!NapzCatalog.TryGet(packageId, out var pkg))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unknown Napz package on order.");
            }

            var now = DateTime.UtcNow;
            var current = await SelectEntitlementTransaction(db, userid);
            DateTime? expires = null;
            var isLifetime = pkg.lifetime;
            var tier = isLifetime ? "lifetime" : "premium";
            var freeTrialUsed = current?.free_trial_used == true
                || string.Equals(current?.product_id, NapzEntitlement.FreeTrialProductId, StringComparison.OrdinalIgnoreCase);

            if (!isLifetime)
            {
                var baseDate = current?.expires_at.HasValue == true && current.expires_at.Value > now
                    ? current.expires_at.Value
                    : now;
                if (pkg.days.HasValue) expires = baseDate.AddDays(pkg.days.Value);
                else if (pkg.months.HasValue) expires = baseDate.AddMonths(pkg.months.Value);
                else expires = baseDate.AddDays(1);
            }

            if (current?.is_lifetime == true)
            {
                isLifetime = true;
                tier = "lifetime";
                expires = null;
            }

            const string sql = @"
INSERT INTO napz_entitlements (
    userid, organisationid, tier, product_id, expires_at, is_lifetime, saved_place_limit, free_trial_used, createdon, modifiedon
) VALUES (
    @userid, @organisationid, @tier, @product_id, @expires_at, @is_lifetime, @saved_place_limit, @free_trial_used, @now, @now
)
ON CONFLICT (userid) DO UPDATE SET
    organisationid = EXCLUDED.organisationid,
    tier = EXCLUDED.tier,
    product_id = EXCLUDED.product_id,
    expires_at = EXCLUDED.expires_at,
    is_lifetime = EXCLUDED.is_lifetime,
    saved_place_limit = GREATEST(napz_entitlements.saved_place_limit, EXCLUDED.saved_place_limit),
    free_trial_used = napz_entitlements.free_trial_used OR EXCLUDED.free_trial_used,
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "tier", DbTypes.Types.String).Value = tier;
            db.AddParameter(cmd, "product_id", DbTypes.Types.String).Value = pkg.package_id;
            db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value = (object?)expires ?? DBNull.Value;
            db.AddParameter(cmd, "is_lifetime", DbTypes.Types.Boolean).Value = isLifetime;
            db.AddParameter(cmd, "saved_place_limit", DbTypes.Types.Integer).Value = pkg.saved_place_limit;
            db.AddParameter(cmd, "free_trial_used", DbTypes.Types.Boolean).Value = freeTrialUsed;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(cmd);
        }

        async Task InsertOrderTransaction(IDb db, NapzOrderRow order)
        {
            const string sql = @"
INSERT INTO napz_orders (
    userid, organisationid, package_id, amount_paise, currency, razorpay_order_id, status, createdon, modifiedon
) VALUES (
    @userid, @organisationid, @package_id, @amount_paise, @currency, @razorpay_order_id, @status, @now, @now
);
";
            var cmd = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = order.userid;
            db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = order.organisationid;
            db.AddParameter(cmd, "package_id", DbTypes.Types.String).Value = order.package_id;
            db.AddParameter(cmd, "amount_paise", DbTypes.Types.Integer).Value = order.amount_paise;
            db.AddParameter(cmd, "currency", DbTypes.Types.String).Value = order.currency;
            db.AddParameter(cmd, "razorpay_order_id", DbTypes.Types.String).Value = order.razorpay_order_id;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = order.status;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(cmd);
        }

        async Task MarkOrderPaidTransaction(IDb db, NapzOrderRow order)
        {
            const string sql = @"
UPDATE napz_orders
SET razorpay_payment_id = @razorpay_payment_id,
    status = 'paid',
    modifiedon = @now
WHERE razorpay_order_id = @razorpay_order_id;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "razorpay_payment_id", DbTypes.Types.String).Value = order.razorpay_payment_id ?? "";
            db.AddParameter(cmd, "razorpay_order_id", DbTypes.Types.String).Value = order.razorpay_order_id;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        async Task<NapzOrderRow?> SelectOrderByRazorpayIdTransaction(IDb db, string razorpayOrderId)
        {
            const string sql = @"
SELECT id, userid, organisationid, package_id, amount_paise, currency, razorpay_order_id, razorpay_payment_id, status
FROM napz_orders
WHERE razorpay_order_id = @razorpay_order_id
LIMIT 1;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "razorpay_order_id", DbTypes.Types.String).Value = razorpayOrderId;
            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return new NapzOrderRow
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]),
                package_id = reader["package_id"]?.ToString() ?? "",
                amount_paise = reader["amount_paise"] == DBNull.Value ? 0 : Convert.ToInt32(reader["amount_paise"]),
                currency = reader["currency"]?.ToString() ?? "INR",
                razorpay_order_id = reader["razorpay_order_id"]?.ToString() ?? "",
                razorpay_payment_id = reader["razorpay_payment_id"] == DBNull.Value ? null : reader["razorpay_payment_id"]?.ToString(),
                status = reader["status"]?.ToString() ?? "",
            };
        }

        async Task<NapzEntitlement?> SelectEntitlementTransaction(IDb db, long userid)
        {
            const string sql = @"
SELECT userid, organisationid, tier, product_id, expires_at, is_lifetime, saved_place_limit, free_trial_used
FROM napz_entitlements
WHERE userid = @userid
LIMIT 1;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return new NapzEntitlement
            {
                userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]),
                tier = reader["tier"]?.ToString() ?? "free",
                product_id = reader["product_id"] == DBNull.Value ? null : reader["product_id"]?.ToString(),
                expires_at = reader["expires_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["expires_at"]),
                is_lifetime = reader["is_lifetime"] != DBNull.Value && Convert.ToBoolean(reader["is_lifetime"]),
                saved_place_limit = reader["saved_place_limit"] == DBNull.Value ? 3 : Convert.ToInt32(reader["saved_place_limit"]),
                free_trial_used = reader["free_trial_used"] != DBNull.Value && Convert.ToBoolean(reader["free_trial_used"]),
            };
        }

        static NapzEntitlement NormalizeEntitlement(NapzEntitlement row)
        {
            if (string.Equals(row.product_id, NapzEntitlement.FreeTrialProductId, StringComparison.OrdinalIgnoreCase))
            {
                row.free_trial_used = true;
            }

            if (row.is_lifetime)
            {
                row.tier = "lifetime";
                return row;
            }
            if (string.Equals(row.tier, "premium", StringComparison.OrdinalIgnoreCase)
                && row.expires_at.HasValue
                && row.expires_at.Value <= DateTime.UtcNow)
            {
                row.tier = "free";
                row.product_id = null;
            }
            return row;
        }

        class NapzOrderRow
        {
            public long id { get; set; }
            public long userid { get; set; }
            public long organisationid { get; set; }
            public string package_id { get; set; } = "";
            public int amount_paise { get; set; }
            public string currency { get; set; } = "INR";
            public string razorpay_order_id { get; set; } = "";
            public string? razorpay_payment_id { get; set; }
            public string status { get; set; } = "created";
        }
    }
}
