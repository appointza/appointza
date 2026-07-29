using Microsoft.Extensions.Configuration;
using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace appointza.Services
{
    /// <summary>
    /// Settles unpaid booking-fee overage (beyond the free monthly quota) into the
    /// platform's own Razorpay account configured in appsettings.json:
    ///     ApplicationSettings:razorpay:key_id / key_secret
    /// </summary>
    public class SubscriptionTopUpService
    {
        readonly IDbProvider dbprovider;
        readonly OrganisationSubscriptionService organisationSubscriptionService;
        readonly IConfiguration configuration;
        const string RazorpayBaseUrl = "https://api.razorpay.com/v1/";

        public SubscriptionTopUpService(
            IDbProvider dbprovider,
            OrganisationSubscriptionService organisationSubscriptionService,
            IConfiguration configuration)
        {
            this.dbprovider = dbprovider;
            this.organisationSubscriptionService = organisationSubscriptionService;
            this.configuration = configuration;
        }

        /// <summary>
        /// Sum of unpaid booking-fee ledger rows for an organisation.
        /// Returns (amount, count). Includes only rows that were actually charged
        /// (fee_waived = FALSE) and never settled (payment_id IS NULL).
        /// </summary>
        public async Task<(decimal amount, int count)> GetOutstandingTransaction(IDb db, long organisationId)
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

        public async Task<PlatformTopUpDueRes> GetOutstanding(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var status = await organisationSubscriptionService.GetStatusTransaction(db, organisationId);
            var (amount, count) = await GetOutstandingTransaction(db, organisationId);

            return new PlatformTopUpDueRes
            {
                organisation_id = organisationId,
                plan_code = status.plan_code,
                outstanding_amount_inr = amount,
                unpaid_bookings_count = count,
                can_pay = amount > 0,
            };
        }

        /// <summary>
        /// Creates a Razorpay order on the platform account for the current outstanding amount.
        /// </summary>
        public async Task<PlatformTopUpOrderRes> CreateOrder(long organisationId)
        {
            (string keyId, string keySecret) = GetPlatformRazorpayCredentials();

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var status = await organisationSubscriptionService.GetStatusTransaction(db, organisationId);
            var (amount, count) = await GetOutstandingTransaction(db, organisationId);

            if (amount <= 0 || count <= 0)
            {
                throw new InvalidOperationException(
                    "No outstanding booking fees. There is nothing to pay right now.");
            }

            int amountPaise = (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);
            if (amountPaise < 100)
            {
                amountPaise = 100;
            }

            string receipt = $"AZ_TOPUP_{organisationId}_{DateTime.UtcNow:yyyyMMddHHmmss}";

            var orderPayload = new
            {
                amount = amountPaise,
                currency = "INR",
                receipt,
                notes = new Dictionary<string, string>
                {
                    ["organisation_id"] = organisationId.ToString(),
                    ["plan_code"] = status.plan_code ?? "",
                    ["bookings_covered"] = count.ToString(),
                    ["purpose"] = "appointza_booking_fee_topup",
                },
            };

            string orderResponseText;
            using (var client = BuildRazorpayClient(keyId, keySecret))
            {
                using var orderRequest = new HttpRequestMessage(HttpMethod.Post, "orders");
                orderRequest.Content = new StringContent(
                    JsonSerializer.Serialize(orderPayload), Encoding.UTF8, "application/json");
                using var orderResponse = await client.SendAsync(orderRequest);
                orderResponseText = await orderResponse.Content.ReadAsStringAsync();
                if (orderResponse.StatusCode != System.Net.HttpStatusCode.OK)
                {
                    throw new InvalidOperationException(
                        $"Razorpay rejected order creation: {orderResponseText}");
                }
            }

            using var doc = JsonDocument.Parse(orderResponseText);
            string orderId = doc.RootElement.GetProperty("id").GetString() ?? "";
            if (string.IsNullOrEmpty(orderId))
            {
                throw new InvalidOperationException("Razorpay returned an empty order id.");
            }

            long topupId = await InsertTopUpTransaction(
                db,
                organisationId,
                status.plan_code ?? "",
                amount,
                count,
                orderId,
                receipt);

            return new PlatformTopUpOrderRes
            {
                topup_id = topupId,
                razorpay_order_id = orderId,
                razorpay_key = keyId,
                amount_paise = amountPaise,
                amount_inr = amount,
                currency = "INR",
                receipt = receipt,
                bookings_covered = count,
            };
        }

        /// <summary>
        /// Verifies the Razorpay payment signature and marks the related booking-fee
        /// ledger rows as paid (payment_id = topup_id) so they no longer show as outstanding.
        /// </summary>
        public async Task<PlatformTopUpDueRes> Verify(PlatformTopUpVerifyReq req)
        {
            if (req == null || req.organisation_id <= 0 || req.topup_id <= 0
                || string.IsNullOrWhiteSpace(req.razorpay_order_id)
                || string.IsNullOrWhiteSpace(req.razorpay_payment_id)
                || string.IsNullOrWhiteSpace(req.razorpay_signature))
            {
                throw new ArgumentException("Missing Razorpay payment fields for verification.");
            }

            (_, string keySecret) = GetPlatformRazorpayCredentials();
            string expected = ComputeHmacSha256Hex(
                $"{req.razorpay_order_id}|{req.razorpay_payment_id}",
                keySecret);

            if (!FixedTimeEquals(expected, req.razorpay_signature))
            {
                throw new InvalidOperationException("Razorpay signature verification failed.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var topup = await SelectTopUpTransaction(db, req.topup_id, req.organisation_id);
            if (topup == null)
            {
                throw new InvalidOperationException("Top-up record not found for this organisation.");
            }

            if (!string.Equals(topup.razorpay_order_id, req.razorpay_order_id, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Razorpay order id does not match the top-up record.");
            }

            await MarkTopUpPaidTransaction(db, req.topup_id, req.razorpay_payment_id, req.razorpay_signature);
            await SettleLedgerRowsTransaction(db, req.organisation_id, req.topup_id);

            return await GetOutstanding(req.organisation_id);
        }

        async Task<long> InsertTopUpTransaction(
            IDb db,
            long organisationId,
            string planCode,
            decimal amountInr,
            int bookingsCovered,
            string razorpayOrderId,
            string receipt)
        {
            const string insert = @"
                INSERT INTO subscription_topup_payments (
                    organisation_id, plan_code, amount_inr, bookings_covered,
                    razorpay_order_id, receipt, status, created_at
                )
                VALUES (
                    @organisation_id, @plan_code, @amount_inr, @bookings_covered,
                    @razorpay_order_id, @receipt, 'created', @created_at
                )
                RETURNING id";

            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = planCode ?? "";
            db.AddParameter(command, "amount_inr", DbTypes.Types.Decimal).Value = amountInr;
            db.AddParameter(command, "bookings_covered", DbTypes.Types.Integer).Value = bookingsCovered;
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

        async Task<SubscriptionTopUpPayment?> SelectTopUpTransaction(IDb db, long topupId, long organisationId)
        {
            const string query = @"
                SELECT id, organisation_id, plan_code, amount_inr, bookings_covered,
                       COALESCE(razorpay_order_id, '')   AS razorpay_order_id,
                       COALESCE(razorpay_payment_id, '') AS razorpay_payment_id,
                       COALESCE(razorpay_signature, '')  AS razorpay_signature,
                       COALESCE(receipt, '')             AS receipt,
                       status, notes, created_at, paid_at
                FROM subscription_topup_payments
                WHERE id = @id AND organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = topupId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new SubscriptionTopUpPayment
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                plan_code = reader["plan_code"]?.ToString() ?? "",
                amount_inr = reader["amount_inr"] == DBNull.Value ? 0m : Convert.ToDecimal(reader["amount_inr"]),
                bookings_covered = reader["bookings_covered"] == DBNull.Value ? 0 : Convert.ToInt32(reader["bookings_covered"]),
                razorpay_order_id = reader["razorpay_order_id"]?.ToString() ?? "",
                razorpay_payment_id = reader["razorpay_payment_id"]?.ToString() ?? "",
                razorpay_signature = reader["razorpay_signature"]?.ToString() ?? "",
                receipt = reader["receipt"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "created",
                notes = reader["notes"] == DBNull.Value ? null : reader["notes"]?.ToString(),
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                paid_at = reader["paid_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["paid_at"]),
            };
        }

        static async Task MarkTopUpPaidTransaction(IDb db, long topupId, string paymentId, string signature)
        {
            const string update = @"
                UPDATE subscription_topup_payments
                SET status = 'paid',
                    razorpay_payment_id = @payment_id,
                    razorpay_signature  = @signature,
                    paid_at             = @paid_at
                WHERE id = @id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "payment_id", DbTypes.Types.String).Value = paymentId;
            db.AddParameter(command, "signature", DbTypes.Types.String).Value = signature;
            db.AddParameter(command, "paid_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = topupId;
            await db.ExecuteNonQuery(command);
        }

        static async Task SettleLedgerRowsTransaction(IDb db, long organisationId, long topupId)
        {
            const string update = @"
                UPDATE booking_fee_ledger
                SET payment_id = @payment_id,
                    notes = COALESCE(notes, '') || ' | settled_topup'
                WHERE organisation_id = @organisation_id
                  AND fee_waived = FALSE
                  AND COALESCE(fee_inr, 0) > 0
                  AND payment_id IS NULL";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "payment_id", DbTypes.Types.Long).Value = topupId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            await db.ExecuteNonQuery(command);
        }

        (string keyId, string keySecret) GetPlatformRazorpayCredentials()
        {
            string keyId = configuration["ApplicationSettings:razorpay:key_id"] ?? "";
            string keySecret = configuration["ApplicationSettings:razorpay:key_secret"] ?? "";
            if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
            {
                throw new InvalidOperationException(
                    "Platform Razorpay credentials are missing. Configure " +
                    "ApplicationSettings:razorpay:key_id and ApplicationSettings:razorpay:key_secret in appsettings.json.");
            }
            return (keyId, keySecret);
        }

        static HttpClient BuildRazorpayClient(string keyId, string keySecret)
        {
            var client = new HttpClient
            {
                BaseAddress = new Uri(RazorpayBaseUrl),
                Timeout = TimeSpan.FromSeconds(30),
            };
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            var bytes = Encoding.ASCII.GetBytes($"{keyId}:{keySecret}");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Basic", Convert.ToBase64String(bytes));
            return client;
        }

        static string ComputeHmacSha256Hex(string payload, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var sb = new StringBuilder(hash.Length * 2);
            foreach (byte b in hash)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        static bool FixedTimeEquals(string a, string b)
        {
            if (a == null || b == null || a.Length != b.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++)
            {
                diff |= a[i] ^ b[i];
            }
            return diff == 0;
        }
    }
}
