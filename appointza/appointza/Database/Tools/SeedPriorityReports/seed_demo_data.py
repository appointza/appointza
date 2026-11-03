#!/usr/bin/env python3
"""Insert tagged demo customers/events/bookings for report verification."""
from __future__ import annotations

import datetime as dt
import json
import sys

import psycopg2

DEMO_DOMAIN = "report-demo.appointza.local"


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: seed_demo_data.py <connection-string> [organisation_id]")
        return 1

    cs = sys.argv[1]
    org_id = int(sys.argv[2]) if len(sys.argv) > 2 else 0

    conn = psycopg2.connect(cs)
    conn.autocommit = False
    cur = conn.cursor()

    if org_id <= 0:
        cur.execute(
            "SELECT id, name FROM organisation WHERE COALESCE(isactive,true)=true ORDER BY id LIMIT 1"
        )
        row = cur.fetchone()
        if not row:
            print("No active organisation found")
            return 2
        org_id, org_name = row
        print(f"Using organisation {org_id} ({org_name})")
    else:
        print(f"Using organisation {org_id}")

    pattern = f"%@org{org_id}.{DEMO_DOMAIN}"
    cur.execute("SELECT COUNT(*) FROM users WHERE email LIKE %s", (pattern,))
    if cur.fetchone()[0] > 0:
        print("Demo data already present; skipping insert.")
        conn.close()
        return 0

    # location
    cur.execute(
        """
        SELECT id FROM organisationlocation
        WHERE organisationid=%s AND COALESCE(isactive,true)=true
        ORDER BY id LIMIT 1
        """,
        (org_id,),
    )
    loc = cur.fetchone()
    if loc:
        location_id = loc[0]
    else:
        cur.execute(
            """
            INSERT INTO organisationlocation (name, organisationid, city, isactive, createdon, modifiedon)
            VALUES ('Demo Branch', %s, 'Demo City', TRUE, NOW(), NOW())
            RETURNING id
            """,
            (org_id,),
        )
        location_id = cur.fetchone()[0]

    # staff
    staff_email = f"staff@org{org_id}.{DEMO_DOMAIN}"
    cur.execute("SELECT id FROM users WHERE email=%s LIMIT 1", (staff_email,))
    staff_row = cur.fetchone()
    if staff_row:
        staff_id = staff_row[0]
    else:
        cur.execute(
            """
            INSERT INTO users (name, email, mobile, organisationid, locationid, isactive, createdon, modifiedon)
            VALUES ('Demo Staff', %s, '9111111111', %s, %s, TRUE, NOW(), NOW())
            RETURNING id
            """,
            (staff_email, org_id, location_id),
        )
        staff_id = cur.fetchone()[0]
        try:
            cur.execute(
                """
                INSERT INTO staff (userid, organisationid, organisationlocationid, isactive, createdon, modifiedon)
                VALUES (%s, %s, %s, TRUE, NOW(), NOW())
                """,
                (staff_id, org_id, location_id),
            )
        except Exception:
            conn.rollback()
            # reopen transaction after optional staff insert failure
            cur = conn.cursor()

    # service
    cur.execute(
        """
        SELECT id FROM organisationservices
        WHERE organisationid=%s AND COALESCE(isactive,true)=true
        ORDER BY id LIMIT 1
        """,
        (org_id,),
    )
    svc = cur.fetchone()
    if svc:
        service_id = svc[0]
    else:
        try:
            cur.execute(
                """
                INSERT INTO organisationservices
                  (servicename, organisationid, organisationlocationid, prize, isactive, createdon, modifiedon)
                VALUES ('Demo Service', %s, %s, 1000, TRUE, NOW(), NOW())
                RETURNING id
                """,
                (org_id, location_id),
            )
            service_id = cur.fetchone()[0]
        except Exception as ex:
            print("Service insert skipped:", ex)
            conn.rollback()
            cur = conn.cursor()
            service_id = 0

    customers = [
        ("Arun Kumar", "9000000001", "arun"),
        ("Priya Sharma", "9000000002", "priya"),
        ("Ravi Patel", "9000000003", "ravi"),
        ("Suresh Nair", "9000000004", "suresh"),
        ("Kumar Raj", "9000000005", "kumar"),
    ]
    customer_ids = []
    for name, mobile, slug in customers:
        email = f"{slug}@org{org_id}.{DEMO_DOMAIN}"
        cur.execute(
            """
            INSERT INTO users (name, email, mobile, isactive, createdon, modifiedon)
            VALUES (%s, %s, %s, TRUE, NOW() - INTERVAL '120 days', NOW())
            RETURNING id
            """,
            (name, email, mobile),
        )
        customer_ids.append(cur.fetchone()[0])

    today = dt.date.today()

    def insert_appointment(user_id, day_offset, status, is_paid, amount):
        # day_offset: negative = past, positive = future
        d = today + dt.timedelta(days=day_offset)
        attrs = json.dumps(
            {"servicelist": [{"id": service_id, "servicename": "Demo Service", "serviceprice": float(amount)}]}
        )
        cur.execute(
            """
            INSERT INTO appoinment (
              userid, organisationid, organisationlocationid, appoinmentdate, fromtime, totime,
              statuscode, status, staffid, staffname, ispaid, attributes, isactive, createdon, modifiedon
            ) VALUES (
              %s, %s, %s, %s, %s, %s,
              %s, 0, %s, 'Demo Staff', %s, %s::jsonb, TRUE, NOW(), NOW()
            ) RETURNING id
            """,
            (
                user_id,
                org_id,
                location_id,
                d,
                dt.time(10, 0),
                dt.time(11, 0),
                status,
                staff_id,
                is_paid,
                attrs,
            ),
        )
        appt_id = cur.fetchone()[0]
        if is_paid:
            try:
                cur.execute(
                    """
                    INSERT INTO payment (appoinmentid, amount, status, mode, isactive, createdon, modifiedon)
                    VALUES (%s, %s, 1, 0, TRUE, %s, %s)
                    """,
                    (appt_id, amount, dt.datetime.combine(d, dt.time(12, 0)), dt.datetime.combine(d, dt.time(12, 0))),
                )
            except Exception as ex:
                print("payment insert skipped:", ex)
        return appt_id

    insert_appointment(customer_ids[0], -10, "COMPLETED", True, 1500)
    insert_appointment(customer_ids[0], -3, "COMPLETED", True, 1200)
    insert_appointment(customer_ids[1], -8, "CANCELLED", False, 900)
    insert_appointment(customer_ids[2], 5, "CONFIRMED", False, 1100)
    insert_appointment(customer_ids[3], -40, "COMPLETED", True, 800)
    insert_appointment(customer_ids[4], -100, "COMPLETED", True, 700)

    last_month = (today.replace(day=1) - dt.timedelta(days=1)).replace(day=1)

    def insert_event(name, event_day, status):
        cur.execute(
            """
            INSERT INTO events (
              organisation_id, organisation_location_id, event_name, event_type, event_date,
              payment_type, entry_amount, slot_limit, status, is_public, isactive, created_at, updated_at
            ) VALUES (
              %s, %s, %s, 'single', %s,
              'clientpay', 500, 50, %s, TRUE, TRUE, NOW(), NOW()
            ) RETURNING id
            """,
            (org_id, location_id, name, event_day, status),
        )
        return cur.fetchone()[0]

    event_cricket = insert_event("Cricket Tournament", last_month + dt.timedelta(days=10), "completed")
    event_football = insert_event("Football Camp", last_month + dt.timedelta(days=18), "completed")
    event_yoga = insert_event("Yoga Workshop", today + dt.timedelta(days=14), "active")

    def insert_booking(event_id, user_id, payment_status, check_in, amount, registered_on):
        # Live event_bookings rows are scoped via events.organisation_id (org columns may be absent).
        cur.execute(
            """
            INSERT INTO event_bookings (
              event_id, user_id,
              number_of_people, total_amount, payment_status, check_in_status, confirmation_status,
              isactive, created_at, updated_at
            ) VALUES (
              %s, %s,
              1, %s, %s, %s, 'approved',
              TRUE, %s, %s
            )
            """,
            (
                event_id,
                user_id,
                amount,
                payment_status,
                check_in,
                registered_on,
                registered_on,
            ),
        )

    insert_booking(event_cricket, customer_ids[0], "paid", "checked_in", 500, last_month + dt.timedelta(days=5))
    insert_booking(event_cricket, customer_ids[1], "paid", "checked_in", 500, last_month + dt.timedelta(days=7))
    insert_booking(event_cricket, customer_ids[2], "paid", "not_checked_in", 500, last_month + dt.timedelta(days=8))
    insert_booking(event_football, customer_ids[0], "paid", "checked_in", 750, last_month + dt.timedelta(days=12))
    insert_booking(event_football, customer_ids[3], "pending", "not_checked_in", 750, last_month + dt.timedelta(days=14))
    insert_booking(event_yoga, customer_ids[1], "paid", "not_checked_in", 300, today - dt.timedelta(days=2))

    conn.commit()
    print(
        json.dumps(
            {
                "seeded": True,
                "organisation_id": org_id,
                "location_id": location_id,
                "staff_id": staff_id,
                "customers": len(customer_ids),
                "events": [event_cricket, event_football, event_yoga],
            },
            indent=2,
        )
    )
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
