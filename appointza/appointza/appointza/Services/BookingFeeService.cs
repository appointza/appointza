using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class BookingFeeService
    {
        readonly IDbProvider dbprovider;
        readonly OrganisationSubscriptionService organisationSubscriptionService;
        readonly SubscriptionPlanService subscriptionPlanService;
        readonly CreditWalletService creditWalletService;

        public BookingFeeService(
            IDbProvider dbprovider,
            OrganisationSubscriptionService organisationSubscriptionService,
            SubscriptionPlanService subscriptionPlanService,
            CreditWalletService creditWalletService)
        {
            this.dbprovider = dbprovider;
            this.organisationSubscriptionService = organisationSubscriptionService;
            this.subscriptionPlanService = subscriptionPlanService;
            this.creditWalletService = creditWalletService;
        }

        public static decimal CalculateFeeAmount(decimal bookingAmountInr, decimal feeInr, decimal feePercent)
        {
            if (bookingAmountInr <= 0)
            {
                return feeInr > 0 ? feeInr : 0;
            }

            decimal percentFee = Math.Round(bookingAmountInr * feePercent / 100m, 2, MidpointRounding.AwayFromZero);
            return Math.Max(feeInr, percentFee);
        }

        public async Task<BookingFeeLedgerEntry?> RecordBookingFeeTransaction(
            IDb db,
            long organisationId,
            decimal bookingAmountInr,
            long? appointmentId = null,
            long? eventBookingId = null,
            long? paymentId = null)
        {
            if (organisationId <= 0)
            {
                return null;
            }

            if (appointmentId.HasValue && appointmentId.Value > 0)
            {
                if (await FeeExistsForAppointmentTransaction(db, appointmentId.Value))
                {
                    return null;
                }
            }

            if (eventBookingId.HasValue && eventBookingId.Value > 0)
            {
                if (await FeeExistsForEventBookingTransaction(db, eventBookingId.Value))
                {
                    return null;
                }
            }

            // Booking credits are deducted when the appointment/event is created.
            // Payment verification only records the ledger row for paid bookings.
            return await InsertLedgerRowTransaction(
                db,
                organisationId,
                "credit_wallet",
                bookingAmountInr,
                0m,
                waived: true,
                appointmentId,
                eventBookingId,
                paymentId,
                "paid_booking");
        }

        async Task<BookingFeeLedgerEntry?> InsertLedgerRowTransaction(
            IDb db,
            long organisationId,
            string planCode,
            decimal bookingAmountInr,
            decimal feeInr,
            bool waived,
            long? appointmentId,
            long? eventBookingId,
            long? paymentId,
            string? notes)
        {
            const string insert = @"
                INSERT INTO booking_fee_ledger (
                    organisation_id, plan_code, appointment_id, event_booking_id,
                    booking_amount_inr, fee_inr, fee_waived, payment_id, notes, created_at
                )
                VALUES (
                    @organisation_id, @plan_code, @appointment_id, @event_booking_id,
                    @booking_amount_inr, @fee_inr, @fee_waived, @payment_id, @notes, @created_at
                )
                RETURNING id, created_at";

            var now = DateTime.UtcNow;
            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "plan_code", DbTypes.Types.String).Value = planCode;
            db.AddParameter(command, "appointment_id", DbTypes.Types.Long).Value =
                appointmentId.HasValue && appointmentId.Value > 0 ? appointmentId.Value : DBNull.Value;
            db.AddParameter(command, "event_booking_id", DbTypes.Types.Long).Value =
                eventBookingId.HasValue && eventBookingId.Value > 0 ? eventBookingId.Value : DBNull.Value;
            db.AddParameter(command, "booking_amount_inr", DbTypes.Types.Decimal).Value = bookingAmountInr;
            db.AddParameter(command, "fee_inr", DbTypes.Types.Decimal).Value = feeInr;
            db.AddParameter(command, "fee_waived", DbTypes.Types.Boolean).Value = waived;
            db.AddParameter(command, "payment_id", DbTypes.Types.Long).Value =
                paymentId.HasValue && paymentId.Value > 0 ? paymentId.Value : DBNull.Value;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value =
                string.IsNullOrEmpty(notes) ? DBNull.Value : (object)notes;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;

            long newId = 0;
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    newId = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    if (reader["created_at"] != DBNull.Value)
                    {
                        now = Convert.ToDateTime(reader["created_at"]);
                    }
                }
            }

            return new BookingFeeLedgerEntry
            {
                id = newId,
                organisation_id = organisationId,
                plan_code = planCode,
                appointment_id = appointmentId,
                event_booking_id = eventBookingId,
                booking_amount_inr = bookingAmountInr,
                fee_inr = feeInr,
                fee_waived = waived,
                payment_id = paymentId,
                created_at = now,
            };
        }

        async Task<bool> FeeExistsForAppointmentTransaction(IDb db, long appointmentId)
        {
            const string query = "SELECT 1 FROM booking_fee_ledger WHERE appointment_id = @appointment_id LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "appointment_id", DbTypes.Types.Long).Value = appointmentId;
            using DbDataReader reader = await db.Execute(command);
            return await reader.ReadAsync();
        }

        async Task<bool> FeeExistsForEventBookingTransaction(IDb db, long eventBookingId)
        {
            const string query = "SELECT 1 FROM booking_fee_ledger WHERE event_booking_id = @event_booking_id LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "event_booking_id", DbTypes.Types.Long).Value = eventBookingId;
            using DbDataReader reader = await db.Execute(command);
            return await reader.ReadAsync();
        }
    }
}
