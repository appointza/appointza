import psycopg2
import json

conn = psycopg2.connect(
    host="43.205.255.163",
    port=5432,
    user="postgres",
    password="abc123",
    dbname="APPOINTZA",
    sslmode="require",
)
cur = conn.cursor()

print("=== organization_integrations whatsapp ===")
cur.execute(
    """
    SELECT id, organisation_id, provider, status, is_active, created_at, updated_at
    FROM organization_integrations
    WHERE provider = 'whatsapp'
    ORDER BY id
    """
)
rows = cur.fetchall()
print("count", len(rows))
for r in rows:
    print(r)

print("\n=== integration_secrets for those ===")
if rows:
    ids = [r[0] for r in rows]
    cur.execute(
        """
        SELECT integration_id, secret_type, left(encrypted_value, 20), created_at
        FROM integration_secrets
        WHERE integration_id = ANY(%s)
        """,
        (ids,),
    )
    for r in cur.fetchall():
        print(r)

print("\n=== whatsapp_webhook_events full ===")
cur.execute(
    """
    SELECT id, event_type, phone_number_id, status, error_message, received_at, processed_at
    FROM whatsapp_webhook_events
    ORDER BY id
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== payload phone_number_id extract ===")
cur.execute("SELECT id, left(payload::text, 400) FROM whatsapp_webhook_events ORDER BY id")
for r in cur.fetchall():
    print("--- id", r[0])
    print(r[1])

print("\n=== conversations/messages ===")
cur.execute("SELECT count(*) FROM whatsapp_conversations")
print("conversations", cur.fetchone()[0])
cur.execute(
    """
    SELECT column_name FROM information_schema.columns
    WHERE table_name='whatsapp_messages' ORDER BY ordinal_position
    """
)
print("msg cols", [c[0] for c in cur.fetchall()])
cur.execute("SELECT count(*) FROM whatsapp_messages")
print("messages", cur.fetchone()[0])

print("\n=== outbound control ===")
cur.execute("SELECT * FROM whatsapp_outbound_control LIMIT 5")
cols = [d[0] for d in cur.description]
print(cols)
for r in cur.fetchall():
    print(r)

conn.close()
