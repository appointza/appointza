import psycopg2
import sys

cs = sys.argv[1]
org_id = int(sys.argv[2]) if len(sys.argv) > 2 else 16
conn = psycopg2.connect(cs)
cur = conn.cursor()
cur.execute(
    """
    SELECT COALESCE(u.name, '') AS participant, e.event_name, eb.payment_status, eb.check_in_status
    FROM event_bookings eb
    INNER JOIN events e ON e.id = eb.event_id AND COALESCE(e.isactive, TRUE) = TRUE
    LEFT JOIN users u ON u.id = eb.user_id
    WHERE e.organisation_id = %s AND COALESCE(eb.isactive, TRUE) = TRUE
    ORDER BY e.event_name, participant
    LIMIT 20
    """,
    (org_id,),
)
print("participants:")
for r in cur.fetchall():
    print(" ", r)
cur.execute(
    "SELECT COUNT(*) FROM report_definitions WHERE catalog_key IS NOT NULL AND is_published = TRUE"
)
print("published_catalog", cur.fetchone()[0])
conn.close()
