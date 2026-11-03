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

print("=== whatsapp_connections columns ===")
cur.execute(
    """
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'whatsapp_connections'
    ORDER BY ordinal_position
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== whatsapp_connections rows ===")
cur.execute("SELECT * FROM whatsapp_connections ORDER BY id DESC LIMIT 20")
cols = [d[0] for d in cur.description]
print("cols:", cols)
for r in cur.fetchall():
    print(dict(zip(cols, r)))

print("\n=== organisation_communication_integrations (whatsapp-ish) ===")
cur.execute(
    """
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'organisation_communication_integrations'
    ORDER BY ordinal_position
    """
)
print([r[0] for r in cur.fetchall()])

cur.execute(
    """
    SELECT id, organisationid, provider, isactive
    FROM organisation_communication_integrations
    WHERE lower(coalesce(provider,'')) LIKE '%whats%'
       OR lower(coalesce(provider,'')) LIKE '%meta%'
    ORDER BY id DESC
    LIMIT 20
    """
)
print("integrations:")
for r in cur.fetchall():
    print(r)

print("\n=== inbound messages count ===")
cur.execute(
    """
    SELECT direction, count(*), max(created_at)
    FROM whatsapp_messages
    GROUP BY direction
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== latest webhook payload phone ids ===")
cur.execute(
    """
    SELECT id, phone_number_id, processing_status,
           substring(payload from 1 for 200) AS payload_head
    FROM whatsapp_webhook_events
    ORDER BY id DESC
    LIMIT 5
    """
)
for r in cur.fetchall():
    print(r)

conn.close()
