import psycopg2

conn = psycopg2.connect(
    host="43.205.255.163",
    port=5432,
    user="postgres",
    password="abc123",
    dbname="APPOINTZA",
    sslmode="require",
)
cur = conn.cursor()

print("=== recent whatsapp_webhook_events ===")
cur.execute(
    """
    SELECT id, phone_number_id, organisation_id, processing_status, retry_count,
           left(coalesce(last_error,''), 160) AS err, received_at
    FROM whatsapp_webhook_events
    ORDER BY received_at DESC
    LIMIT 30
    """
)
rows = cur.fetchall()
print(f"count_shown={len(rows)}")
for r in rows:
    print(r)

print("\n=== status counts (7d) ===")
cur.execute(
    """
    SELECT processing_status, count(*)
    FROM whatsapp_webhook_events
    WHERE received_at > NOW() - INTERVAL '7 days'
    GROUP BY processing_status
    ORDER BY count(*) DESC
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== whatsapp_connections ===")
cur.execute(
    """
    SELECT id, organisation_id, phone_number_id, business_phone, webhook_status, isactive
    FROM whatsapp_connections
    ORDER BY id DESC
    LIMIT 30
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== recent inbound whatsapp_messages ===")
cur.execute(
    """
    SELECT id, organisation_id, conversation_id, direction, status,
           left(coalesce(body_text,''), 80), created_at
    FROM whatsapp_messages
    WHERE direction = 'inbound'
    ORDER BY created_at DESC
    LIMIT 15
    """
)
for r in cur.fetchall():
    print(r)

conn.close()
