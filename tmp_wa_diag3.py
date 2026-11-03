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

print("connections count:", end=" ")
cur.execute("SELECT count(*) FROM whatsapp_connections")
print(cur.fetchone()[0])

print("\n=== related tables ===")
cur.execute(
    """
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND (
      table_name ILIKE '%whatsapp%' OR table_name ILIKE '%communication%'
    )
    ORDER BY table_name
    """
)
for r in cur.fetchall():
    print(r[0])

for table in [
    "organisationcommunicationintegration",
    "organisation_communication_integration",
    "communication_integrations",
]:
    cur.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=%s)",
        (table,),
    )
    if cur.fetchone()[0]:
        print("exists", table)

# find any table with phone_number_id
cur.execute(
    """
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'phone_number_id'
    ORDER BY table_name
    """
)
print("\ntables with phone_number_id:")
for r in cur.fetchall():
    print(r[0])
    cur2 = conn.cursor()
    cur2.execute(f"SELECT count(*) FROM {r[0]}")
    print("  count=", cur2.fetchone()[0])

print("\n=== whatsapp_messages sample ===")
cur.execute("SELECT count(*) FROM whatsapp_messages")
print("messages", cur.fetchone()[0])
cur.execute(
    """
    SELECT id, direction, status, left(coalesce(body_text,''),60), created_at
    FROM whatsapp_messages ORDER BY id DESC LIMIT 10
    """
)
for r in cur.fetchall():
    print(r)

print("\n=== webhook event dates span ===")
cur.execute(
    "SELECT min(received_at), max(received_at), count(*) FROM whatsapp_webhook_events"
)
print(cur.fetchone())

conn.close()
