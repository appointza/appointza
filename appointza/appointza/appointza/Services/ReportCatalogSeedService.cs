using appointza.Models;

namespace appointza.Services
{
    /// <summary>
    /// Seeds the priority record-level business reports into report_definitions (idempotent by catalog_key).
    /// </summary>
    public class ReportCatalogSeedService
    {
        private readonly ReportDefinitionService _definitions;
        private readonly ILogger<ReportCatalogSeedService> _logger;
        private static int _seeded;

        public ReportCatalogSeedService(ReportDefinitionService definitions, ILogger<ReportCatalogSeedService> logger)
        {
            _definitions = definitions;
            _logger = logger;
        }

        public Task EnsurePriorityCatalog() => EnsurePriorityCatalog(force: false);

        public async Task EnsurePriorityCatalog(bool force)
        {
            // Once per process is enough unless force=true (idempotent upserts by catalog_key).
            if (!force && Interlocked.CompareExchange(ref _seeded, 1, 0) != 0) return;
            if (force) Interlocked.Exchange(ref _seeded, 1);
            try
            {
                await _definitions.EnsureSchema();
                var count = 0;
                foreach (var report in BuildPriorityReports())
                {
                    await _definitions.Save(report);
                    count++;
                }
                _logger.LogInformation("Seeded {Count} priority catalog reports.", count);
            }
            catch (Exception ex)
            {
                Interlocked.Exchange(ref _seeded, 0);
                _logger.LogWarning(ex, "Priority report catalog seed failed.");
                throw;
            }
        }

        public static List<ReportDefinitionUpsertReq> BuildPriorityReports()
        {
            return new List<ReportDefinitionUpsertReq>
            {
                Report(
                    "cust_complete",
                    "Complete Customer Report",
                    "Customers",
                    "All customers who have booked appointments or registered for events, with contact details and first/last activity.",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  COALESCE(u.email, '') AS email,
  u.createdon AS registration_date,
  COUNT(DISTINCT a.id) AS appointment_count,
  COUNT(DISTINCT eb.id) AS event_registration_count,
  GREATEST(MAX(a.appoinmentdate::timestamp), MAX(eb.created_at)) AS last_activity
FROM users u
LEFT JOIN appoinment a
  ON a.userid = u.id AND a.organisationid = @OrgId AND COALESCE(a.isactive, TRUE) = TRUE
LEFT JOIN event_bookings eb
  ON eb.user_id = u.id AND COALESCE(eb.isactive, TRUE) = TRUE
LEFT JOIN events e
  ON e.id = eb.event_id AND e.organisation_id = @OrgId AND COALESCE(e.isactive, TRUE) = TRUE
WHERE (a.id IS NOT NULL OR e.id IS NOT NULL)
  AND (@Search IS NULL OR @Search = '' OR u.name ILIKE '%' || @Search || '%' OR u.mobile ILIKE '%' || @Search || '%')
GROUP BY u.id, u.name, u.mobile, u.email, u.createdon
ORDER BY last_activity DESC NULLS LAST, u.name",
                    Params(
                        P("Search", "Search name / phone", "string", "text", false)),
                    Cols(
                        C("customer_id", "Customer ID", "number"),
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("email", "Email"),
                        C("registration_date", "Registration date", "date"),
                        C("appointment_count", "Bookings", "number"),
                        C("event_registration_count", "Event regs", "number"),
                        C("last_activity", "Last activity", "date"))),

                Report(
                    "cust_complete_activity",
                    "Customer Complete Activity",
                    "Cross-Module Analytics",
                    "Customer-level activity across bookings, events, attendance and payments.",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  u.createdon AS registration_date,
  COUNT(DISTINCT a.id) AS total_bookings,
  COUNT(DISTINCT a.id) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) = 'COMPLETED') AS completed_bookings,
  COUNT(DISTINCT a.id) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) IN ('CANCELLED','CANCELED')) AS cancelled_bookings,
  COUNT(DISTINCT eb.id) AS events_registered,
  COUNT(DISTINCT eb.id) FILTER (WHERE LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in') AS events_attended,
  COUNT(DISTINCT eb.id) FILTER (
    WHERE LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in'
      AND LOWER(COALESCE(e.status,'')) = 'completed'
  ) AS events_completed,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) AS total_payments,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 3), 0) AS total_refunds,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0)
    - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 3), 0) AS total_spending,
  GREATEST(MAX(a.appoinmentdate::timestamp), MAX(eb.created_at), MAX(p.createdon)) AS last_activity
FROM users u
LEFT JOIN appoinment a
  ON a.userid = u.id AND a.organisationid = @OrgId AND COALESCE(a.isactive, TRUE) = TRUE
LEFT JOIN payment p ON p.appoinmentid = a.id AND COALESCE(p.isactive, TRUE) = TRUE
LEFT JOIN event_bookings eb
  ON eb.user_id = u.id AND COALESCE(eb.isactive, TRUE) = TRUE
LEFT JOIN events e
  ON e.id = eb.event_id AND e.organisation_id = @OrgId AND COALESCE(e.isactive, TRUE) = TRUE
WHERE (a.id IS NOT NULL OR e.id IS NOT NULL)
  AND (@CustomerId IS NULL OR u.id = @CustomerId)
  AND (@Search IS NULL OR @Search = '' OR u.name ILIKE '%' || @Search || '%' OR u.mobile ILIKE '%' || @Search || '%')
GROUP BY u.id, u.name, u.mobile, u.createdon
ORDER BY total_spending DESC, last_activity DESC NULLS LAST",
                    Params(
                        P("CustomerId", "Customer ID", "number", "number", false),
                        P("Search", "Search", "string", "text", false)),
                    Cols(
                        C("customer_id", "Customer ID", "number"),
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("registration_date", "Registered", "date"),
                        C("total_bookings", "Bookings", "number"),
                        C("completed_bookings", "Completed", "number"),
                        C("cancelled_bookings", "Cancelled", "number"),
                        C("events_registered", "Events registered", "number"),
                        C("events_attended", "Events attended", "number"),
                        C("events_completed", "Events completed", "number"),
                        C("total_payments", "Payments", "currency"),
                        C("total_refunds", "Refunds", "currency"),
                        C("total_spending", "Net spending", "currency"),
                        C("last_activity", "Last activity", "date")),
                    Chart("bar", "customer_name", "total_spending", "Top spenders")),

                Report(
                    "evt_last_month_participants",
                    "Last Month Event Participants",
                    "Events & Participants",
                    "Participants registered for events whose event date fell in the previous calendar month (override with date filters).",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS participant,
  COALESCE(u.mobile, '') AS phone,
  e.id AS event_id,
  e.event_name,
  e.event_type,
  COALESCE(e.event_date, e.from_date) AS event_date,
  eb.created_at AS registration_date,
  COALESCE(eb.payment_status, 'pending') AS payment_status,
  COALESCE(eb.check_in_status, 'not_checked_in') AS attendance_status,
  CASE
    WHEN LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in' AND LOWER(COALESCE(e.status,'')) = 'completed' THEN 'Completed'
    WHEN LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in' THEN 'Attended'
    ELSE 'Not completed'
  END AS completion_status,
  COALESCE(eb.total_amount, 0) AS amount,
  COALESCE(eb.confirmation_status, 'pending') AS confirmation_status
FROM event_bookings eb
INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
LEFT JOIN users u ON u.id = eb.user_id
WHERE e.organisation_id = @OrgId
  AND COALESCE(eb.isactive, TRUE) = TRUE
  AND COALESCE(e.event_date, e.from_date) >= COALESCE(@EventStartDate::date, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date)
  AND COALESCE(e.event_date, e.from_date) < COALESCE(@EventEndDate::date, date_trunc('month', CURRENT_DATE)::date)
  AND (@EventId IS NULL OR e.id = @EventId)
  AND (@PaymentStatus IS NULL OR @PaymentStatus = '' OR LOWER(eb.payment_status) = LOWER(@PaymentStatus))
  AND (@AttendanceStatus IS NULL OR @AttendanceStatus = '' OR LOWER(eb.check_in_status) = LOWER(@AttendanceStatus))
ORDER BY event_date, e.event_name, participant",
                    Params(
                        P("EventStartDate", "Event start", "date", "date", false),
                        P("EventEndDate", "Event end", "date", "date", false),
                        P("EventId", "Event", "number", "dropdown", false, "system", "events"),
                        P("PaymentStatus", "Payment status", "string", "dropdown", false, "static",
                            "[{\"label\":\"Pending\",\"value\":\"pending\"},{\"label\":\"Paid\",\"value\":\"paid\"},{\"label\":\"Failed\",\"value\":\"failed\"},{\"label\":\"Refunded\",\"value\":\"refunded\"}]"),
                        P("AttendanceStatus", "Attendance", "string", "dropdown", false, "static",
                            "[{\"label\":\"Not checked in\",\"value\":\"not_checked_in\"},{\"label\":\"Checked in\",\"value\":\"checked_in\"},{\"label\":\"Cancelled\",\"value\":\"cancelled\"}]")),
                    Cols(
                        C("participant", "Participant"),
                        C("phone", "Phone"),
                        C("event_name", "Event"),
                        C("event_date", "Event date", "date"),
                        C("registration_date", "Registered", "date"),
                        C("payment_status", "Payment"),
                        C("attendance_status", "Attendance"),
                        C("completion_status", "Completion"),
                        C("amount", "Amount", "currency"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "evt_completed_participants",
                    "Completed Event Participants",
                    "Events & Participants",
                    "Participants who checked in for events marked completed.",
                    @"
SELECT
  COALESCE(u.name, '') AS participant,
  COALESCE(u.mobile, '') AS phone,
  e.event_name,
  COALESCE(e.event_date, e.from_date) AS event_date,
  eb.created_at AS registration_date,
  eb.payment_status,
  eb.check_in_status AS attendance_status,
  e.status AS event_status,
  u.id AS customer_id
FROM event_bookings eb
INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
LEFT JOIN users u ON u.id = eb.user_id
WHERE e.organisation_id = @OrgId
  AND COALESCE(eb.isactive, TRUE) = TRUE
  AND LOWER(COALESCE(e.status,'')) = 'completed'
  AND LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in'
  AND (@EventStartDate IS NULL OR COALESCE(e.event_date, e.from_date) >= @EventStartDate::date)
  AND (@EventEndDate IS NULL OR COALESCE(e.event_date, e.from_date) <= @EventEndDate::date)
  AND (@EventId IS NULL OR e.id = @EventId)
ORDER BY event_date DESC, participant",
                    Params(
                        P("EventStartDate", "Event start", "date", "date", false),
                        P("EventEndDate", "Event end", "date", "date", false),
                        P("EventId", "Event", "number", "dropdown", false, "system", "events")),
                    Cols(
                        C("participant", "Participant"),
                        C("phone", "Phone"),
                        C("event_name", "Event"),
                        C("event_date", "Event date", "date"),
                        C("registration_date", "Registered", "date"),
                        C("payment_status", "Payment"),
                        C("attendance_status", "Attendance"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "evt_registered_not_attended",
                    "Registered But Not Attended",
                    "Events & Participants",
                    "Registrations that were not checked in (no-shows / absent).",
                    @"
SELECT
  COALESCE(u.name, '') AS participant,
  COALESCE(u.mobile, '') AS phone,
  e.event_name,
  COALESCE(e.event_date, e.from_date) AS event_date,
  eb.created_at AS registration_date,
  eb.payment_status,
  eb.check_in_status AS attendance_status,
  eb.confirmation_status,
  u.id AS customer_id,
  e.id AS event_id
FROM event_bookings eb
INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
LEFT JOIN users u ON u.id = eb.user_id
WHERE e.organisation_id = @OrgId
  AND COALESCE(eb.isactive, TRUE) = TRUE
  AND LOWER(COALESCE(eb.check_in_status,'')) <> 'checked_in'
  AND LOWER(COALESCE(eb.check_in_status,'')) <> 'cancelled'
  AND LOWER(COALESCE(eb.confirmation_status,'')) <> 'rejected'
  AND (@EventStartDate IS NULL OR COALESCE(e.event_date, e.from_date) >= @EventStartDate::date)
  AND (@EventEndDate IS NULL OR COALESCE(e.event_date, e.from_date) <= @EventEndDate::date)
  AND (@EventId IS NULL OR e.id = @EventId)
ORDER BY event_date DESC, participant",
                    Params(
                        P("EventStartDate", "Event start", "date", "date", false),
                        P("EventEndDate", "Event end", "date", "date", false),
                        P("EventId", "Event", "number", "dropdown", false, "system", "events")),
                    Cols(
                        C("participant", "Participant"),
                        C("phone", "Phone"),
                        C("event_name", "Event"),
                        C("event_date", "Event date", "date"),
                        C("registration_date", "Registered", "date"),
                        C("payment_status", "Payment"),
                        C("attendance_status", "Attendance"),
                        C("confirmation_status", "Confirmation"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "cust_event_history",
                    "Customer Event History",
                    "Events & Participants",
                    "All event registrations and attendance for each customer.",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  e.event_name,
  e.event_type,
  COALESCE(e.event_date, e.from_date) AS event_date,
  eb.created_at AS registration_date,
  eb.payment_status,
  eb.check_in_status AS attendance_status,
  e.status AS event_status,
  COALESCE(eb.total_amount, 0) AS amount
FROM event_bookings eb
INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
LEFT JOIN users u ON u.id = eb.user_id
WHERE e.organisation_id = @OrgId
  AND COALESCE(eb.isactive, TRUE) = TRUE
  AND (@CustomerId IS NULL OR u.id = @CustomerId)
  AND (@Search IS NULL OR @Search = '' OR u.name ILIKE '%' || @Search || '%' OR u.mobile ILIKE '%' || @Search || '%')
ORDER BY customer_name, event_date DESC",
                    Params(
                        P("CustomerId", "Customer ID", "number", "number", false),
                        P("Search", "Search", "string", "text", false)),
                    Cols(
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("event_name", "Event"),
                        C("event_date", "Event date", "date"),
                        C("registration_date", "Registered", "date"),
                        C("payment_status", "Payment"),
                        C("attendance_status", "Attendance"),
                        C("event_status", "Event status"),
                        C("amount", "Amount", "currency"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "evt_repeat_participants",
                    "Repeat Event Participants",
                    "Events & Participants",
                    "Customers who registered for more than one event.",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  COUNT(DISTINCT eb.event_id) AS events_count,
  COUNT(DISTINCT eb.id) FILTER (WHERE LOWER(COALESCE(eb.check_in_status,'')) = 'checked_in') AS attended_count,
  MIN(COALESCE(e.event_date, e.from_date)) AS first_event_date,
  MAX(COALESCE(e.event_date, e.from_date)) AS last_event_date
FROM event_bookings eb
INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
INNER JOIN users u ON u.id = eb.user_id
WHERE e.organisation_id = @OrgId
  AND COALESCE(eb.isactive, TRUE) = TRUE
GROUP BY u.id, u.name, u.mobile
HAVING COUNT(DISTINCT eb.event_id) >= COALESCE(@MinEvents, 2)
ORDER BY events_count DESC, customer_name",
                    Params(P("MinEvents", "Minimum events", "number", "number", false, "none", "", "2")),
                    Cols(
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("events_count", "Events", "number"),
                        C("attended_count", "Attended", "number"),
                        C("first_event_date", "First event", "date"),
                        C("last_event_date", "Last event", "date"),
                        C("customer_id", "Customer ID", "number")),
                    Chart("bar", "customer_name", "events_count", "Repeat participants")),

                Report(
                    "book_complete_history",
                    "Complete Booking History",
                    "Bookings & Appointments",
                    "Record-level appointment bookings with customer, staff, branch and status.",
                    @"
SELECT
  a.id AS booking_id,
  a.appoinmentdate AS booking_date,
  a.fromtime AS start_time,
  a.totime AS end_time,
  COALESCE(a.statuscode, '') AS status_code,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  COALESCE(a.staffname, '') AS staff_name,
  COALESCE(ol.name, '') AS branch_name,
  COALESCE(a.ispaid, FALSE) AS is_paid,
  u.id AS customer_id,
  a.staffid AS staff_id,
  a.organisationlocationid AS branch_id
FROM appoinment a
LEFT JOIN users u ON u.id = a.userid
LEFT JOIN organisationlocation ol ON ol.id = a.organisationlocationid
WHERE a.organisationid = @OrgId
  AND COALESCE(a.isactive, TRUE) = TRUE
  AND (@StartDate IS NULL OR a.appoinmentdate >= @StartDate::date)
  AND (@EndDate IS NULL OR a.appoinmentdate <= @EndDate::date)
  AND (@StatusCode IS NULL OR @StatusCode = '' OR UPPER(a.statuscode) = UPPER(@StatusCode))
  AND (@BranchId IS NULL OR a.organisationlocationid = @BranchId)
  AND (@StaffId IS NULL OR a.staffid = @StaffId)
  AND (@Search IS NULL OR @Search = '' OR u.name ILIKE '%' || @Search || '%' OR u.mobile ILIKE '%' || @Search || '%')
ORDER BY a.appoinmentdate DESC, a.fromtime DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false),
                        P("StatusCode", "Status", "string", "dropdown", false, "static",
                            "[{\"label\":\"Pending\",\"value\":\"PENDING\"},{\"label\":\"Confirmed\",\"value\":\"CONFIRMED\"},{\"label\":\"Completed\",\"value\":\"COMPLETED\"},{\"label\":\"Cancelled\",\"value\":\"CANCELLED\"},{\"label\":\"No-show\",\"value\":\"NOSHOW\"}]"),
                        P("BranchId", "Branch", "number", "dropdown", false, "system", "branches"),
                        P("StaffId", "Staff", "number", "dropdown", false, "system", "staff"),
                        P("Search", "Customer search", "string", "text", false)),
                    Cols(
                        C("booking_id", "Booking ID", "number"),
                        C("booking_date", "Date", "date"),
                        C("start_time", "From"),
                        C("end_time", "To"),
                        C("status_code", "Status"),
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("staff_name", "Staff"),
                        C("branch_name", "Branch"),
                        C("is_paid", "Paid"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "book_completed",
                    "Completed Appointments",
                    "Bookings & Appointments",
                    "Appointments with COMPLETED status.",
                    @"
SELECT
  a.id AS booking_id,
  a.appoinmentdate AS booking_date,
  a.fromtime AS start_time,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  COALESCE(a.staffname, '') AS staff_name,
  COALESCE(ol.name, '') AS branch_name,
  COALESCE(a.ispaid, FALSE) AS is_paid,
  u.id AS customer_id
FROM appoinment a
LEFT JOIN users u ON u.id = a.userid
LEFT JOIN organisationlocation ol ON ol.id = a.organisationlocationid
WHERE a.organisationid = @OrgId
  AND COALESCE(a.isactive, TRUE) = TRUE
  AND UPPER(COALESCE(a.statuscode,'')) = 'COMPLETED'
  AND (@StartDate IS NULL OR a.appoinmentdate >= @StartDate::date)
  AND (@EndDate IS NULL OR a.appoinmentdate <= @EndDate::date)
  AND (@StaffId IS NULL OR a.staffid = @StaffId)
ORDER BY a.appoinmentdate DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false),
                        P("StaffId", "Staff", "number", "dropdown", false, "system", "staff")),
                    Cols(
                        C("booking_id", "Booking ID", "number"),
                        C("booking_date", "Date", "date"),
                        C("start_time", "From"),
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("staff_name", "Staff"),
                        C("branch_name", "Branch"),
                        C("is_paid", "Paid"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "fin_customer_revenue",
                    "Customer-Wise Revenue",
                    "Sales & Finance",
                    "Successful payment totals per customer (appointment payments).",
                    @"
SELECT
  u.id AS customer_id,
  COALESCE(u.name, '') AS customer_name,
  COALESCE(u.mobile, '') AS phone,
  COUNT(DISTINCT p.id) AS payment_count,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) AS total_paid,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 3), 0) AS total_refunded,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0)
    - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 3), 0) AS net_revenue,
  MAX(p.createdon) AS last_payment_at
FROM payment p
INNER JOIN appoinment a ON a.id = p.appoinmentid AND a.organisationid = @OrgId
INNER JOIN users u ON u.id = a.userid
WHERE COALESCE(p.isactive, TRUE) = TRUE
  AND COALESCE(a.isactive, TRUE) = TRUE
  AND (@StartDate IS NULL OR p.createdon::date >= @StartDate::date)
  AND (@EndDate IS NULL OR p.createdon::date <= @EndDate::date)
GROUP BY u.id, u.name, u.mobile
HAVING COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) > 0
ORDER BY net_revenue DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false)),
                    Cols(
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("payment_count", "Payments", "number"),
                        C("total_paid", "Paid", "currency"),
                        C("total_refunded", "Refunded", "currency"),
                        C("net_revenue", "Net revenue", "currency"),
                        C("last_payment_at", "Last payment", "date"),
                        C("customer_id", "Customer ID", "number")),
                    Chart("bar", "customer_name", "net_revenue", "Customer revenue")),

                Report(
                    "fin_pending_payments",
                    "Pending Payments",
                    "Sales & Finance",
                    "Unpaid appointments and pending event registrations.",
                    @"
SELECT * FROM (
  SELECT
    'appointment'::text AS source,
    a.id AS record_id,
    a.appoinmentdate::timestamp AS activity_date,
    COALESCE(u.name, '') AS customer_name,
    COALESCE(u.mobile, '') AS phone,
    COALESCE(a.statuscode, '') AS status_label,
    'pending'::text AS payment_status,
    COALESCE((
      SELECT SUM(p.amount) FROM payment p
      WHERE p.appoinmentid = a.id AND p.status = 0 AND COALESCE(p.isactive, TRUE) = TRUE
    ), 0) AS amount_due,
    u.id AS customer_id
  FROM appoinment a
  LEFT JOIN users u ON u.id = a.userid
  WHERE a.organisationid = @OrgId
    AND COALESCE(a.isactive, TRUE) = TRUE
    AND COALESCE(a.ispaid, FALSE) = FALSE
    AND UPPER(COALESCE(a.statuscode,'')) NOT IN ('CANCELLED','CANCELED')

  UNION ALL

  SELECT
    'event'::text AS source,
    eb.id AS record_id,
    COALESCE(e.event_date, e.from_date)::timestamp AS activity_date,
    COALESCE(u.name, '') AS customer_name,
    COALESCE(u.mobile, '') AS phone,
    e.event_name AS status_label,
    COALESCE(eb.payment_status, 'pending') AS payment_status,
    COALESCE(eb.total_amount, 0) AS amount_due,
    u.id AS customer_id
  FROM event_bookings eb
  INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
  LEFT JOIN users u ON u.id = eb.user_id
  WHERE e.organisation_id = @OrgId
    AND COALESCE(eb.isactive, TRUE) = TRUE
    AND LOWER(COALESCE(eb.payment_status, 'pending')) = 'pending'
) q
WHERE (@StartDate IS NULL OR q.activity_date::date >= @StartDate::date)
  AND (@EndDate IS NULL OR q.activity_date::date <= @EndDate::date)
ORDER BY activity_date DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false)),
                    Cols(
                        C("source", "Source"),
                        C("record_id", "Record ID", "number"),
                        C("activity_date", "Date", "date"),
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("status_label", "Detail"),
                        C("payment_status", "Payment"),
                        C("amount_due", "Amount due", "currency"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "staff_performance",
                    "Staff Performance",
                    "Staff Performance",
                    "Appointments completed, cancelled and customers served per staff member.",
                    @"
SELECT
  COALESCE(a.staffid, 0) AS staff_id,
  COALESCE(NULLIF(a.staffname, ''), su.name, 'Unassigned') AS staff_name,
  COUNT(*) AS total_bookings,
  COUNT(*) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) = 'COMPLETED') AS completed_bookings,
  COUNT(*) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) IN ('CANCELLED','CANCELED')) AS cancelled_bookings,
  COUNT(*) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) = 'NOSHOW') AS noshow_bookings,
  COUNT(DISTINCT a.userid) AS customers_served,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) AS revenue
FROM appoinment a
LEFT JOIN users su ON su.id = a.staffid
LEFT JOIN payment p ON p.appoinmentid = a.id AND COALESCE(p.isactive, TRUE) = TRUE
WHERE a.organisationid = @OrgId
  AND COALESCE(a.isactive, TRUE) = TRUE
  AND (@StartDate IS NULL OR a.appoinmentdate >= @StartDate::date)
  AND (@EndDate IS NULL OR a.appoinmentdate <= @EndDate::date)
  AND (@StaffId IS NULL OR a.staffid = @StaffId)
GROUP BY COALESCE(a.staffid, 0), COALESCE(NULLIF(a.staffname, ''), su.name, 'Unassigned')
ORDER BY completed_bookings DESC, revenue DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false),
                        P("StaffId", "Staff", "number", "dropdown", false, "system", "staff")),
                    Cols(
                        C("staff_name", "Staff"),
                        C("total_bookings", "Total", "number"),
                        C("completed_bookings", "Completed", "number"),
                        C("cancelled_bookings", "Cancelled", "number"),
                        C("noshow_bookings", "No-shows", "number"),
                        C("customers_served", "Customers", "number"),
                        C("revenue", "Revenue", "currency"),
                        C("staff_id", "Staff ID", "number")),
                    Chart("bar", "staff_name", "completed_bookings", "Completed bookings")),

                Report(
                    "fin_service_revenue",
                    "Service-Wise Revenue",
                    "Sales & Finance",
                    "Revenue inferred from appointment service line items in attributes JSON, joined to successful payments when present.",
                    @"
SELECT
  COALESCE(svc.servicename, item.service_name, 'Unknown service') AS service_name,
  COUNT(DISTINCT a.id) AS booking_count,
  COALESCE(SUM(item.service_price), 0) AS listed_amount,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) AS paid_amount
FROM appoinment a
CROSS JOIN LATERAL (
  SELECT
    COALESCE(el->>'servicename', el->>'name', '') AS service_name,
    COALESCE(NULLIF(el->>'serviceprice', '')::numeric, NULLIF(el->>'price', '')::numeric, 0) AS service_price,
    NULLIF(el->>'id', '')::bigint AS service_id
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(COALESCE(a.attributes, '{}'::jsonb)->'servicelist') = 'array'
        THEN a.attributes->'servicelist'
      ELSE '[]'::jsonb
    END
  ) el
) item
LEFT JOIN organisationservices svc ON svc.id = item.service_id
LEFT JOIN payment p ON p.appoinmentid = a.id AND COALESCE(p.isactive, TRUE) = TRUE
WHERE a.organisationid = @OrgId
  AND COALESCE(a.isactive, TRUE) = TRUE
  AND (@StartDate IS NULL OR a.appoinmentdate >= @StartDate::date)
  AND (@EndDate IS NULL OR a.appoinmentdate <= @EndDate::date)
GROUP BY COALESCE(svc.servicename, item.service_name, 'Unknown service')
ORDER BY paid_amount DESC, booking_count DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false)),
                    Cols(
                        C("service_name", "Service"),
                        C("booking_count", "Bookings", "number"),
                        C("listed_amount", "Listed amount", "currency"),
                        C("paid_amount", "Paid amount", "currency")),
                    Chart("bar", "service_name", "paid_amount", "Service revenue")),

                Report(
                    "mkt_customer_inactivity",
                    "Customer Inactivity (30/60/90 days)",
                    "Marketing & Loyalty",
                    "Customers with no appointment or event activity within the selected inactive-days window.",
                    @"
WITH activity AS (
  SELECT u.id AS customer_id,
         COALESCE(u.name, '') AS customer_name,
         COALESCE(u.mobile, '') AS phone,
         COALESCE(u.email, '') AS email,
         GREATEST(
           MAX(a.appoinmentdate::timestamp),
           MAX(eb.created_at)
         ) AS last_activity
  FROM users u
  LEFT JOIN appoinment a
    ON a.userid = u.id AND a.organisationid = @OrgId AND COALESCE(a.isactive, TRUE) = TRUE
  LEFT JOIN event_bookings eb
    ON eb.user_id = u.id AND COALESCE(eb.isactive, TRUE) = TRUE
  LEFT JOIN events e
    ON e.id = eb.event_id AND e.organisation_id = @OrgId AND COALESCE(e.isactive, TRUE) = TRUE
  WHERE a.id IS NOT NULL OR e.id IS NOT NULL
  GROUP BY u.id, u.name, u.mobile, u.email
)
SELECT
  customer_id,
  customer_name,
  phone,
  email,
  last_activity,
  (CURRENT_DATE - last_activity::date) AS days_inactive
FROM activity
WHERE last_activity IS NOT NULL
  AND last_activity::date <= (CURRENT_DATE - (COALESCE(@InactiveDays, 90) || ' days')::interval)
ORDER BY days_inactive DESC, customer_name",
                    Params(
                        P("InactiveDays", "Inactive days", "number", "dropdown", false, "static",
                            "[{\"label\":\"30 days\",\"value\":\"30\"},{\"label\":\"60 days\",\"value\":\"60\"},{\"label\":\"90 days\",\"value\":\"90\"}]",
                            "90")),
                    Cols(
                        C("customer_name", "Customer"),
                        C("phone", "Phone"),
                        C("email", "Email"),
                        C("last_activity", "Last activity", "date"),
                        C("days_inactive", "Days inactive", "number"),
                        C("customer_id", "Customer ID", "number"))),

                Report(
                    "ops_branch_performance",
                    "Branch Performance",
                    "Cross-Module Analytics",
                    "Bookings, completions, event registrations and payment revenue by branch.",
                    @"
SELECT
  ol.id AS branch_id,
  COALESCE(ol.name, 'Unassigned') AS branch_name,
  COUNT(DISTINCT a.id) AS bookings,
  COUNT(DISTINCT a.id) FILTER (WHERE UPPER(COALESCE(a.statuscode,'')) = 'COMPLETED') AS completed_bookings,
  COUNT(DISTINCT eb.id) AS event_registrations,
  COUNT(DISTINCT a.userid) AS unique_customers,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 1), 0) AS revenue
FROM organisationlocation ol
LEFT JOIN appoinment a
  ON a.organisationlocationid = ol.id AND a.organisationid = @OrgId AND COALESCE(a.isactive, TRUE) = TRUE
  AND (@StartDate IS NULL OR a.appoinmentdate >= @StartDate::date)
  AND (@EndDate IS NULL OR a.appoinmentdate <= @EndDate::date)
LEFT JOIN payment p ON p.appoinmentid = a.id AND COALESCE(p.isactive, TRUE) = TRUE
LEFT JOIN events e
  ON e.organisation_location_id = ol.id AND e.organisation_id = @OrgId AND COALESCE(e.isactive, TRUE) = TRUE
LEFT JOIN event_bookings eb
  ON eb.event_id = e.id AND COALESCE(eb.isactive, TRUE) = TRUE
WHERE ol.organisationid = @OrgId
  AND COALESCE(ol.isactive, TRUE) = TRUE
GROUP BY ol.id, ol.name
ORDER BY revenue DESC, bookings DESC",
                    Params(
                        P("StartDate", "From date", "date", "date", false),
                        P("EndDate", "To date", "date", "date", false)),
                    Cols(
                        C("branch_name", "Branch"),
                        C("bookings", "Bookings", "number"),
                        C("completed_bookings", "Completed", "number"),
                        C("event_registrations", "Event regs", "number"),
                        C("unique_customers", "Customers", "number"),
                        C("revenue", "Revenue", "currency"),
                        C("branch_id", "Branch ID", "number")),
                    Chart("bar", "branch_name", "revenue", "Branch revenue")),
            };
        }

        private static ReportDefinitionUpsertReq Report(
            string key, string name, string category, string description, string sql,
            List<ReportParameterDto> parameters, List<ReportColumnDto> columns, ReportChartDto? chart = null)
        {
            return new ReportDefinitionUpsertReq
            {
                catalog_key = key,
                name = name,
                category = category,
                description = description,
                sql_query = sql.Trim(),
                is_active = true,
                is_published = true,
                export_csv = true,
                export_excel = true,
                export_pdf = true,
                max_rows = 10000,
                timeout_seconds = 45,
                parameters = parameters,
                columns = columns,
                chart = chart,
                permissions = new List<ReportPermissionDto>
                {
                    new() { organisation_id = null, role_key = "org_admin", can_view = true, can_export = true },
                },
            };
        }

        private static List<ReportParameterDto> Params(params ReportParameterDto[] items) => items.ToList();

        private static ReportParameterDto P(
            string name, string label, string dataType, string inputType, bool required,
            string optionsSource = "none", string optionsConfig = "", string defaultValue = "") =>
            new()
            {
                parameter_name = name,
                display_name = label,
                data_type = dataType,
                input_type = inputType,
                is_required = required,
                is_visible = true,
                options_source = optionsSource,
                options_config = optionsConfig,
                default_value = defaultValue,
            };

        private static List<ReportColumnDto> Cols(params ReportColumnDto[] items)
        {
            for (var i = 0; i < items.Length; i++) items[i].sort_order = i;
            return items.ToList();
        }

        private static ReportColumnDto C(string key, string label, string format = "text") =>
            new() { column_key = key, display_name = label, format_type = format, is_visible = true };

        private static ReportChartDto Chart(string type, string x, string y, string title) =>
            new() { chart_type = type, x_column = x, y_column = y, title = title, is_enabled = true };
    }
}
