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

print("=== whatsapp_webhook_events columns ===")
cur.execute(
    """
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='whatsapp_webhook_events' ORDER BY ordinal_position
    """
)
cols = cur.fetchall()
for c in cols:
    print(c)

print("\n=== all events ===")
cur.execute("SELECT * FROM whatsapp_webhook_events ORDER BY id")
colnames = [d[0] for d in cur.description]
print("COLS:", colnames)
for r in cur.fetchall():
    row = dict(zip(colnames, r))
    # truncate payload
    p = row.get("payload")
    if p is not None:
        ps = str(p)
        row["payload"] = ps[:350] + ("..." if len(ps) > 350 else "")
    print(row)
    print()

print("=== organization_integrations all providers ===")
cur.execute(
    "SELECT id, organisation_id, provider, status, is_active FROM organization_integrations ORDER BY id DESC LIMIT 20"
)
for r in cur.fetchall():
    print(r)

print("\n=== whatsapp_connections schema ===")
cur.execute(
    """
    SELECT column_name FROM information_schema.columns
    WHERE table_name='whatsapp_connections' ORDER BY ordinal_position
    """
)
print([c[0] for c in cur.fetchall()])

conn.close()
