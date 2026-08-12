-- One-time manual seed for subscription_plans (run only when the table is empty).
-- The API does NOT insert or upsert this table on startup.

INSERT INTO subscription_plans (
    plan_code, project_name, display_name, monthly_price_inr,
    booking_fee_inr, booking_fee_percent, trial_days,
    free_bookings_per_month, sort_order, isactive
)
VALUES
  ('starter',    'appointza', 'Starter',           499,     20, 2.000, 0,    25,    1),
    ('growth',     'appointza', 'Growth',            999,     14, 1.500, 0,    71,    2),
    ('business',   'appointza', 'Business',         2499,     12, 1.000, 0,   200,    3),
    ('pro',        'appointza', 'Pro',              4999,     10, 0.800, 0,   500,    4),
    ('enterprise', 'appointza', 'Enterprise',       9999,      8, 0.700, 0,  1250,    5),
    ('premium',    'appointza', 'Premium Enterprise', 19999,  7, 0.500, 0, 2857,    6)
ON CONFLICT (plan_code) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    display_name = EXCLUDED.display_name,
    monthly_price_inr = EXCLUDED.monthly_price_inr,
    booking_fee_inr = EXCLUDED.booking_fee_inr,
    booking_fee_percent = EXCLUDED.booking_fee_percent,
    trial_days = EXCLUDED.trial_days,
    free_bookings_per_month = EXCLUDED.free_bookings_per_month,
    sort_order = EXCLUDED.sort_order,
    isactive = TRUE;
