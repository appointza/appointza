using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Globalization;

namespace appointza.Services
{
    public class OrganisationBillingStatsService
    {
        readonly IDbProvider dbprovider;

        public OrganisationBillingStatsService(IDbProvider dbprovider)
        {
            this.dbprovider = dbprovider;
        }

        public async Task<OrganisationMonthlyBookingStatsRes> GetMonthlyBookingStats(
            long organisationId,
            int months = 12)
        {
            if (organisationId <= 0)
            {
                throw new ArgumentException("organisation_id is required", nameof(organisationId));
            }

            if (months < 1)
            {
                months = 1;
            }
            else if (months > 24)
            {
                months = 24;
            }

            var nowUtc = DateTime.UtcNow;
            var rangeStart = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc)
                .AddMonths(-(months - 1));

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var appointmentCounts = await SelectAppointmentCountsByMonth(db, organisationId, rangeStart);
            var eventBookingCounts = await SelectEventBookingCountsByMonth(db, organisationId, rangeStart);

            var rows = new List<OrganisationMonthlyBookingStatsRow>();
            var cursor = rangeStart;
            var endMonth = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            while (cursor <= endMonth)
            {
                var key = (cursor.Year, cursor.Month);
                appointmentCounts.TryGetValue(key, out var appointmentCount);
                eventBookingCounts.TryGetValue(key, out var eventBookingCount);

                rows.Add(new OrganisationMonthlyBookingStatsRow
                {
                    year = cursor.Year,
                    month = cursor.Month,
                    month_label = cursor.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    appointment_count = appointmentCount,
                    event_booking_count = eventBookingCount,
                    total_bookings = appointmentCount + eventBookingCount,
                });

                cursor = cursor.AddMonths(1);
            }

            rows.Reverse();

            return new OrganisationMonthlyBookingStatsRes
            {
                organisation_id = organisationId,
                months = rows,
                total_appointments = rows.Sum(r => r.appointment_count),
                total_event_bookings = rows.Sum(r => r.event_booking_count),
            };
        }

        static async Task<Dictionary<(int Year, int Month), int>> SelectAppointmentCountsByMonth(
            IDb db,
            long organisationId,
            DateTime fromDate)
        {
            const string query = @"
                SELECT
                    CAST(EXTRACT(YEAR FROM createdon) AS INTEGER) AS yr,
                    CAST(EXTRACT(MONTH FROM createdon) AS INTEGER) AS mo,
                    COUNT(*)::int AS cnt
                FROM appointmentrecords
                WHERE organisationid = @organisation_id
                  AND createdon >= @from_date
                GROUP BY EXTRACT(YEAR FROM createdon), EXTRACT(MONTH FROM createdon)";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "from_date", DbTypes.Types.DateTime).Value = fromDate;

            var result = new Dictionary<(int Year, int Month), int>();
            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                var year = reader["yr"] == DBNull.Value ? 0 : Convert.ToInt32(reader["yr"]);
                var month = reader["mo"] == DBNull.Value ? 0 : Convert.ToInt32(reader["mo"]);
                var count = reader["cnt"] == DBNull.Value ? 0 : Convert.ToInt32(reader["cnt"]);
                if (year > 0 && month > 0)
                {
                    result[(year, month)] = count;
                }
            }

            return result;
        }

        static async Task<Dictionary<(int Year, int Month), int>> SelectEventBookingCountsByMonth(
            IDb db,
            long organisationId,
            DateTime fromDate)
        {
            const string query = @"
                SELECT
                    CAST(EXTRACT(YEAR FROM eb.created_at) AS INTEGER) AS yr,
                    CAST(EXTRACT(MONTH FROM eb.created_at) AS INTEGER) AS mo,
                    COUNT(*)::int AS cnt
                FROM event_bookings eb
                INNER JOIN events e ON e.id = eb.event_id
                WHERE e.organisation_id = @organisation_id
                  AND eb.isactive = TRUE
                  AND eb.created_at >= @from_date
                GROUP BY EXTRACT(YEAR FROM eb.created_at), EXTRACT(MONTH FROM eb.created_at)";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "from_date", DbTypes.Types.DateTime).Value = fromDate;

            var result = new Dictionary<(int Year, int Month), int>();
            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                var year = reader["yr"] == DBNull.Value ? 0 : Convert.ToInt32(reader["yr"]);
                var month = reader["mo"] == DBNull.Value ? 0 : Convert.ToInt32(reader["mo"]);
                var count = reader["cnt"] == DBNull.Value ? 0 : Convert.ToInt32(reader["cnt"]);
                if (year > 0 && month > 0)
                {
                    result[(year, month)] = count;
                }
            }

            return result;
        }
    }
}
