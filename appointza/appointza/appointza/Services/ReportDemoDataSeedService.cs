using appointza.Utils;
using System.Text.Json;

namespace appointza.Services
{
    /// <summary>
    /// Inserts tagged demo customers/events/bookings/payments for report verification.
    /// Idempotent: skips when demo marker email already exists for the organisation.
    /// </summary>
    public class ReportDemoDataSeedService
    {
        public const string DemoEmailDomain = "report-demo.appointza.local";
        private readonly IDbProvider _dbProvider;
        private readonly ILogger<ReportDemoDataSeedService> _logger;

        public ReportDemoDataSeedService(IDbProvider dbProvider, ILogger<ReportDemoDataSeedService> logger)
        {
            _dbProvider = dbProvider;
            _logger = logger;
        }

        public async Task<object> SeedForOrganisation(long organisationId)
        {
            if (organisationId <= 0) throw new Exception("organisation_id is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            // Already seeded?
            using (var check = db.GetCommand(@"
                SELECT COUNT(*)::int AS c FROM users
                WHERE email LIKE @pattern;"))
            {
                db.AddParameter(check, "pattern", DbTypes.Types.String).Value =
                    $"%@org{organisationId}.{DemoEmailDomain}";
                using var reader = await db.Execute(check);
                if (await reader.ReadAsync() && Convert.ToInt32(reader["c"]) > 0)
                {
                    return new { seeded = false, message = "Demo data already present for this organisation.", organisation_id = organisationId };
                }
            }

            long locationId = await EnsureLocation(db, organisationId);
            long staffId = await EnsureStaffUser(db, organisationId, locationId);
            var serviceId = await EnsureService(db, organisationId, locationId);

            var customers = new[]
            {
                ("Arun Kumar", "9000000001", "arun"),
                ("Priya Sharma", "9000000002", "priya"),
                ("Ravi Patel", "9000000003", "ravi"),
                ("Suresh Nair", "9000000004", "suresh"),
                ("Kumar Raj", "9000000005", "kumar"),
            };

            var customerIds = new List<long>();
            foreach (var (name, mobile, slug) in customers)
            {
                var email = $"{slug}@org{organisationId}.{DemoEmailDomain}";
                customerIds.Add(await InsertCustomer(db, name, mobile, email));
            }

            // Appointments: mix of completed / cancelled / upcoming / unpaid
            var today = DateTime.UtcNow.Date;
            await InsertAppointment(db, organisationId, locationId, customerIds[0], staffId, "Arun Staff", today.AddDays(-10), "COMPLETED", true, serviceId, 1500);
            await InsertAppointment(db, organisationId, locationId, customerIds[0], staffId, "Arun Staff", today.AddDays(-3), "COMPLETED", true, serviceId, 1200);
            await InsertAppointment(db, organisationId, locationId, customerIds[1], staffId, "Arun Staff", today.AddDays(-8), "CANCELLED", false, serviceId, 900);
            await InsertAppointment(db, organisationId, locationId, customerIds[2], staffId, "Arun Staff", today.AddDays(5), "CONFIRMED", false, serviceId, 1100);
            await InsertAppointment(db, organisationId, locationId, customerIds[3], staffId, "Arun Staff", today.AddDays(-40), "COMPLETED", true, serviceId, 800);
            await InsertAppointment(db, organisationId, locationId, customerIds[4], staffId, "Arun Staff", today.AddDays(-100), "COMPLETED", true, serviceId, 700); // inactive 90d

            // Events last month + attendance variety
            var lastMonth = new DateTime(today.Year, today.Month, 1).AddMonths(-1);
            long eventCricket = await InsertEvent(db, organisationId, locationId, "Cricket Tournament", lastMonth.AddDays(10), "completed");
            long eventFootball = await InsertEvent(db, organisationId, locationId, "Football Camp", lastMonth.AddDays(18), "completed");
            long eventUpcoming = await InsertEvent(db, organisationId, locationId, "Yoga Workshop", today.AddDays(14), "active");

            await InsertEventBooking(db, eventCricket, organisationId, locationId, customerIds[0], "paid", "checked_in", 500, lastMonth.AddDays(5));
            await InsertEventBooking(db, eventCricket, organisationId, locationId, customerIds[1], "paid", "checked_in", 500, lastMonth.AddDays(7));
            await InsertEventBooking(db, eventCricket, organisationId, locationId, customerIds[2], "paid", "not_checked_in", 500, lastMonth.AddDays(8)); // registered not attended
            await InsertEventBooking(db, eventFootball, organisationId, locationId, customerIds[0], "paid", "checked_in", 750, lastMonth.AddDays(12)); // repeat
            await InsertEventBooking(db, eventFootball, organisationId, locationId, customerIds[3], "pending", "not_checked_in", 750, lastMonth.AddDays(14));
            await InsertEventBooking(db, eventUpcoming, organisationId, locationId, customerIds[1], "paid", "not_checked_in", 300, today.AddDays(-2));

            _logger.LogInformation("Seeded report demo data for organisation {OrgId}", organisationId);
            return new
            {
                seeded = true,
                organisation_id = organisationId,
                location_id = locationId,
                staff_id = staffId,
                customers = customerIds.Count,
                message = "Demo customers, appointments, events and payments inserted.",
            };
        }

        private async Task<long> EnsureLocation(IDb db, long organisationId)
        {
            using (var cmd = db.GetCommand(@"
                SELECT id FROM organisationlocation
                WHERE organisationid = @organisation_id AND COALESCE(isactive, TRUE) = TRUE
                ORDER BY id LIMIT 1;"))
            {
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using var reader = await db.Execute(cmd);
                if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            }

            using var insert = db.GetCommand(@"
                INSERT INTO organisationlocation (name, organisationid, city, isactive, createdon, modifiedon)
                VALUES ('Demo Branch', @organisation_id, 'Demo City', TRUE, @now, @now)
                RETURNING id;");
            db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(insert, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            using var r = await db.Execute(insert);
            await r.ReadAsync();
            return Convert.ToInt64(r["id"]);
        }

        private async Task<long> EnsureStaffUser(IDb db, long organisationId, long locationId)
        {
            var email = $"staff@org{organisationId}.{DemoEmailDomain}";
            using (var cmd = db.GetCommand("SELECT id FROM users WHERE email = @email LIMIT 1;"))
            {
                db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
                using var reader = await db.Execute(cmd);
                if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            }

            using var insert = db.GetCommand(@"
                INSERT INTO users (name, email, mobile, organisationid, locationid, isactive, createdon, modifiedon)
                VALUES ('Demo Staff', @email, '9111111111', @organisation_id, @location_id, TRUE, @now, @now)
                RETURNING id;");
            db.AddParameter(insert, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(insert, "location_id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(insert, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            using var r = await db.Execute(insert);
            await r.ReadAsync();
            var userId = Convert.ToInt64(r["id"]);

            try
            {
                using var staff = db.GetCommand(@"
                    INSERT INTO staff (userid, organisationid, organisationlocationid, isactive, createdon, modifiedon)
                    VALUES (@userid, @organisation_id, @location_id, TRUE, @now, @now);");
                db.AddParameter(staff, "userid", DbTypes.Types.Long).Value = userId;
                db.AddParameter(staff, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(staff, "location_id", DbTypes.Types.Long).Value = locationId;
                db.AddParameter(staff, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(staff);
            }
            catch { /* staff table optional */ }

            return userId;
        }

        private async Task<long> EnsureService(IDb db, long organisationId, long locationId)
        {
            using (var cmd = db.GetCommand(@"
                SELECT id FROM organisationservices
                WHERE organisationid = @organisation_id AND COALESCE(isactive, TRUE) = TRUE
                ORDER BY id LIMIT 1;"))
            {
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using var reader = await db.Execute(cmd);
                if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            }

            try
            {
                using var insert = db.GetCommand(@"
                    INSERT INTO organisationservices (servicename, organisationid, organisationlocationid, prize, isactive, createdon, modifiedon)
                    VALUES ('Demo Service', @organisation_id, @location_id, 1000, TRUE, @now, @now)
                    RETURNING id;");
                db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(insert, "location_id", DbTypes.Types.Long).Value = locationId;
                db.AddParameter(insert, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                using var r = await db.Execute(insert);
                await r.ReadAsync();
                return Convert.ToInt64(r["id"]);
            }
            catch
            {
                return 0;
            }
        }

        private async Task<long> InsertCustomer(IDb db, string name, string mobile, string email)
        {
            using var cmd = db.GetCommand(@"
                INSERT INTO users (name, email, mobile, isactive, createdon, modifiedon)
                VALUES (@name, @email, @mobile, TRUE, @now, @now)
                RETURNING id;");
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = name;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = mobile;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow.AddDays(-120);
            using var reader = await db.Execute(cmd);
            await reader.ReadAsync();
            return Convert.ToInt64(reader["id"]);
        }

        private async Task InsertAppointment(
            IDb db, long orgId, long locationId, long userId, long staffId, string staffName,
            DateTime date, string statusCode, bool isPaid, long serviceId, decimal amount)
        {
            var attrs = JsonSerializer.Serialize(new
            {
                servicelist = new[]
                {
                    new { id = serviceId, servicename = "Demo Service", serviceprice = amount },
                },
            });

            using var cmd = db.GetCommand(@"
                INSERT INTO appoinment (
                    userid, organisationid, organisationlocationid, appoinmentdate, fromtime, totime,
                    statuscode, status, staffid, staffname, ispaid, attributes, isactive, createdon, modifiedon
                ) VALUES (
                    @userid, @organisationid, @locationid, @appoinmentdate, @fromtime, @totime,
                    @statuscode, 0, @staffid, @staffname, @ispaid, CAST(@attributes AS jsonb), TRUE, @now, @now
                ) RETURNING id;");
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "organisationid", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(cmd, "locationid", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(cmd, "appoinmentdate", DbTypes.Types.DateTime).Value = date;
            db.AddParameter(cmd, "fromtime", DbTypes.Types.DateTime).Value = TimeSpan.FromHours(10);
            db.AddParameter(cmd, "totime", DbTypes.Types.DateTime).Value = TimeSpan.FromHours(11);
            db.AddParameter(cmd, "statuscode", DbTypes.Types.String).Value = statusCode;
            db.AddParameter(cmd, "staffid", DbTypes.Types.Long).Value = staffId;
            db.AddParameter(cmd, "staffname", DbTypes.Types.String).Value = staffName;
            db.AddParameter(cmd, "ispaid", DbTypes.Types.Boolean).Value = isPaid;
            db.AddParameter(cmd, "attributes", DbTypes.Types.String).Value = attrs;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            using var reader = await db.Execute(cmd);
            await reader.ReadAsync();
            var appointmentId = Convert.ToInt64(reader["id"]);

            if (isPaid)
            {
                using var pay = db.GetCommand(@"
                    INSERT INTO payment (appoinmentid, amount, status, mode, isactive, createdon, modifiedon)
                    VALUES (@appoinmentid, @amount, 1, 0, TRUE, @now, @now);");
                db.AddParameter(pay, "appoinmentid", DbTypes.Types.Long).Value = appointmentId;
                db.AddParameter(pay, "amount", DbTypes.Types.Decimal).Value = amount;
                db.AddParameter(pay, "now", DbTypes.Types.DateTime).Value = date;
                try { await db.ExecuteNonQuery(pay); } catch { /* payment schema variants */ }
            }
        }

        private async Task<long> InsertEvent(IDb db, long orgId, long locationId, string name, DateTime eventDate, string status)
        {
            using var cmd = db.GetCommand(@"
                INSERT INTO events (
                    organisation_id, organisation_location_id, event_name, event_type, event_date,
                    payment_type, entry_amount, slot_limit, status, is_public, isactive, created_at, updated_at
                ) VALUES (
                    @organisation_id, @location_id, @event_name, 'single', @event_date,
                    'clientpay', 500, 50, @status, TRUE, TRUE, @now, @now
                ) RETURNING id;");
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(cmd, "location_id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(cmd, "event_name", DbTypes.Types.String).Value = name;
            db.AddParameter(cmd, "event_date", DbTypes.Types.DateTime).Value = eventDate;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            using var reader = await db.Execute(cmd);
            await reader.ReadAsync();
            return Convert.ToInt64(reader["id"]);
        }

        private async Task InsertEventBooking(
            IDb db, long eventId, long orgId, long locationId, long userId,
            string paymentStatus, string checkInStatus, decimal amount, DateTime registeredAt)
        {
            using var cmd = db.GetCommand(@"
                INSERT INTO event_bookings (
                    event_id, user_id,
                    number_of_people, total_amount, payment_status, check_in_status, confirmation_status,
                    isactive, created_at, updated_at
                ) VALUES (
                    @event_id, @user_id,
                    1, @total_amount, @payment_status, @check_in_status, 'approved',
                    TRUE, @created_at, @created_at
                );");
            db.AddParameter(cmd, "event_id", DbTypes.Types.Long).Value = eventId;
            db.AddParameter(cmd, "user_id", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "total_amount", DbTypes.Types.Decimal).Value = amount;
            db.AddParameter(cmd, "payment_status", DbTypes.Types.String).Value = paymentStatus;
            db.AddParameter(cmd, "check_in_status", DbTypes.Types.String).Value = checkInStatus;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = registeredAt;
            await db.ExecuteNonQuery(cmd);
        }
    }
}
