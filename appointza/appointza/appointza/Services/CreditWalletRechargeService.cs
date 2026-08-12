using appointza.Models;
using appointza.Razorpay;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    /// <summary>
    /// Credit Wallet pack recharges via integrations/Razorpay (platform appointza account).
    /// </summary>
    public class CreditWalletRechargeService
    {
        readonly IDbProvider dbprovider;
        readonly CreditWalletService creditWalletService;
        readonly SubscriptionPlanService subscriptionPlanService;
        readonly RazorpayService razorpayService;

        public CreditWalletRechargeService(
            IDbProvider dbprovider,
            CreditWalletService creditWalletService,
            SubscriptionPlanService subscriptionPlanService,
            RazorpayService razorpayService)
        {
            this.dbprovider = dbprovider;
            this.creditWalletService = creditWalletService;
            this.subscriptionPlanService = subscriptionPlanService;
            this.razorpayService = razorpayService;
        }

        public async Task<CreditWalletRechargeOrderRes> CreateOrder(long organisationId, string packId)
        {
            if (organisationId <= 0)
            {
                throw new ArgumentException("organisation_id is required", nameof(organisationId));
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            var pack = await subscriptionPlanService.GetCreditWalletPackByCodeTransaction(db, packId)
                ?? throw new ArgumentException("Unknown credit pack.");

            await creditWalletService.EnsureSchemaTransaction(db);
            await EnsureRechargePaymentsTableTransaction(db);
            await creditWalletService.GetOrCreateTransaction(db, organisationId);

            int amountPaise = (int)Math.Round(pack.price_inr * 100m, MidpointRounding.AwayFromZero);
            if (amountPaise < 100)
            {
                amountPaise = 100;
            }

            string receipt = $"AZ_WALLET_{organisationId}_{DateTime.UtcNow:yyyyMMddHHmmss}";

            var razorpayOrder = await razorpayService.CreatePlatformOrder(new RazorpayOrderReq
            {
                amount = amountPaise,
                currency = "INR",
                receipt = receipt,
                notes = new RazorpayOrderNotes
                {
                    organisation_id = organisationId,
                    pack_id = pack.id,
                    wallet_credits = pack.credits,
                    purpose = "appointza_credit_wallet_recharge",
                },
            });

            if (string.IsNullOrEmpty(razorpayOrder.id))
            {
                throw new InvalidOperationException("Razorpay returned an empty order id.");
            }

            long rechargeId = await InsertRechargePaymentTransaction(
                db,
                organisationId,
                pack.id,
                pack.credits,
                pack.price_inr,
                razorpayOrder.id,
                receipt);

            return new CreditWalletRechargeOrderRes
            {
                recharge_id = rechargeId,
                pack_id = pack.id,
                credits = pack.credits,
                razorpay_order_id = razorpayOrder.id,
                razorpay_key = razorpayService.GetPlatformKeyId(),
                amount_paise = amountPaise,
                amount_inr = pack.price_inr,
                currency = "INR",
                receipt = receipt,
            };
        }

        public async Task<CreditWalletStatusRes> Verify(CreditWalletRechargeVerifyReq req)
        {
            if (req == null || req.organisation_id <= 0 || req.recharge_id <= 0
                || string.IsNullOrWhiteSpace(req.razorpay_order_id)
                || string.IsNullOrWhiteSpace(req.razorpay_payment_id)
                || string.IsNullOrWhiteSpace(req.razorpay_signature))
            {
                throw new ArgumentException("Missing Razorpay payment fields for verification.");
            }

            if (!razorpayService.VerifyPlatformPaymentSignature(
                    req.razorpay_order_id,
                    req.razorpay_payment_id,
                    req.razorpay_signature))
            {
                throw new InvalidOperationException("Razorpay signature verification failed.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureRechargePaymentsTableTransaction(db);

            var payment = await SelectRechargePaymentTransaction(db, req.recharge_id, req.organisation_id);
            if (payment == null)
            {
                throw new InvalidOperationException("Recharge record not found for this organisation.");
            }

            if (!string.Equals(payment.razorpay_order_id, req.razorpay_order_id, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Razorpay order id does not match the recharge record.");
            }

            if (string.Equals(payment.status, "paid", StringComparison.OrdinalIgnoreCase))
            {
                return await creditWalletService.GetStatusTransaction(db, req.organisation_id);
            }

            await MarkRechargePaidTransaction(
                db,
                req.recharge_id,
                req.razorpay_payment_id,
                req.razorpay_signature);

            return await creditWalletService.ApplyRechargeAfterPaymentTransaction(
                db,
                req.organisation_id,
                payment.pack_id,
                payment.credits,
                payment.amount_inr);
        }

        public async Task EnsureRechargePaymentsTableTransaction(IDb db)
        {
            const string sql = """
                CREATE TABLE IF NOT EXISTS credit_wallet_recharge_payments (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    pack_id VARCHAR(32) NOT NULL,
                    credits INT NOT NULL DEFAULT 0,
                    amount_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    razorpay_order_id VARCHAR(128),
                    razorpay_payment_id VARCHAR(128),
                    razorpay_signature VARCHAR(256),
                    receipt VARCHAR(64),
                    status VARCHAR(32) NOT NULL DEFAULT 'created',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP
                )
                """;
            try
            {
                DbCommand cmd = db.GetCommand(sql);
                await db.ExecuteNonQuery(cmd);
            }
            catch
            {
                // subscription_tables.sql is authoritative on fresh installs.
            }
        }

        async Task<long> InsertRechargePaymentTransaction(
            IDb db,
            long organisationId,
            string packId,
            int credits,
            decimal amountInr,
            string razorpayOrderId,
            string receipt)
        {
            const string insert = @"
                INSERT INTO credit_wallet_recharge_payments (
                    organisation_id, pack_id, credits, amount_inr,
                    razorpay_order_id, receipt, status, created_at
                )
                VALUES (
                    @organisation_id, @pack_id, @credits, @amount_inr,
                    @razorpay_order_id, @receipt, 'created', @created_at
                )
                RETURNING id";

            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "pack_id", DbTypes.Types.String).Value = packId;
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = credits;
            db.AddParameter(command, "amount_inr", DbTypes.Types.Decimal).Value = amountInr;
            db.AddParameter(command, "razorpay_order_id", DbTypes.Types.String).Value = razorpayOrderId;
            db.AddParameter(command, "receipt", DbTypes.Types.String).Value = receipt;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
            }
            return 0;
        }

        async Task<CreditWalletRechargePayment?> SelectRechargePaymentTransaction(
            IDb db,
            long rechargeId,
            long organisationId)
        {
            const string query = @"
                SELECT id, organisation_id, pack_id, credits, amount_inr,
                       COALESCE(razorpay_order_id, '')   AS razorpay_order_id,
                       COALESCE(razorpay_payment_id, '') AS razorpay_payment_id,
                       COALESCE(razorpay_signature, '')  AS razorpay_signature,
                       COALESCE(receipt, '')             AS receipt,
                       status, created_at, paid_at
                FROM credit_wallet_recharge_payments
                WHERE id = @id AND organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = rechargeId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new CreditWalletRechargePayment
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                pack_id = reader["pack_id"]?.ToString() ?? "",
                credits = reader["credits"] == DBNull.Value ? 0 : Convert.ToInt32(reader["credits"]),
                amount_inr = reader["amount_inr"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["amount_inr"]),
                razorpay_order_id = reader["razorpay_order_id"]?.ToString() ?? "",
                razorpay_payment_id = reader["razorpay_payment_id"]?.ToString() ?? "",
                razorpay_signature = reader["razorpay_signature"]?.ToString() ?? "",
                receipt = reader["receipt"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "created",
                created_at = reader["created_at"] == DBNull.Value
                    ? DateTime.UtcNow
                    : Convert.ToDateTime(reader["created_at"]),
                paid_at = reader["paid_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["paid_at"]),
            };
        }

        static async Task MarkRechargePaidTransaction(
            IDb db,
            long rechargeId,
            string paymentId,
            string signature)
        {
            const string update = @"
                UPDATE credit_wallet_recharge_payments
                SET status = 'paid',
                    razorpay_payment_id = @payment_id,
                    razorpay_signature  = @signature,
                    paid_at             = @paid_at
                WHERE id = @id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "payment_id", DbTypes.Types.String).Value = paymentId;
            db.AddParameter(command, "signature", DbTypes.Types.String).Value = signature;
            db.AddParameter(command, "paid_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = rechargeId;
            await db.ExecuteNonQuery(command);
        }
    }
}
