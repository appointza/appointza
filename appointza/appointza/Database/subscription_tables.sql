-- Appointza SaaS subscription & booking-fee ledger
-- Run once against your PostgreSQL database.

CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(32) NOT NULL UNIQUE,
    project_name VARCHAR(64) NOT NULL DEFAULT 'appointza',
    display_name VARCHAR(64) NOT NULL,
    monthly_price_inr DECIMAL(10, 2) NOT NULL DEFAULT 0,
    booking_fee_inr DECIMAL(10, 2) NOT NULL DEFAULT 0,
    booking_fee_percent NUMERIC(6, 3) NOT NULL DEFAULT 0,
    trial_days INTEGER NOT NULL DEFAULT 0,
    free_bookings_per_month INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- If subscription_plans already exists without project_name, run:
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS project_name VARCHAR(64) NOT NULL DEFAULT 'appointza';

-- Free bookings per calendar month (0 = unlimited)
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS free_bookings_per_month INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN subscription_plans.free_bookings_per_month IS
    'Free bookings per calendar month before booking fees apply. 0 = unlimited.';

CREATE TABLE IF NOT EXISTS organisation_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    plan_code VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'trialing',
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    razorpay_customer_id VARCHAR(128),
    razorpay_subscription_id VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isactive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_subscriptions_org_active
    ON organisation_subscriptions (organisation_id)
    WHERE isactive = TRUE;

-- Legacy one-time launch entitlements (older 6-month trials may still exist)
CREATE TABLE IF NOT EXISTS organisation_launch_entitlements (
    organisation_id BIGINT PRIMARY KEY,
    offer_code VARCHAR(64) NOT NULL DEFAULT 'fifty_bookings_free',
    plan_code VARCHAR(32) NOT NULL,
    availed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP NOT NULL
);

COMMENT ON TABLE organisation_launch_entitlements IS 'Legacy launch-offer tracking per organisation (time-based trials discontinued)';

-- Backfill for orgs already on launch trial (safe to re-run)
INSERT INTO organisation_launch_entitlements (organisation_id, offer_code, plan_code, availed_at, trial_ends_at)
SELECT os.organisation_id,
       'six_month_free',
       os.plan_code,
       os.created_at,
       os.trial_ends_at
FROM organisation_subscriptions os
WHERE os.isactive = TRUE
  AND os.trial_ends_at IS NOT NULL
  AND os.plan_code IN ('starter', 'basic', 'pro')
  AND NOT EXISTS (
      SELECT 1 FROM organisation_launch_entitlements e WHERE e.organisation_id = os.organisation_id
  );

CREATE TABLE IF NOT EXISTS booking_fee_ledger (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    plan_code VARCHAR(32) NOT NULL,
    appointment_id BIGINT,
    event_booking_id BIGINT,
    booking_amount_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    fee_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    fee_waived BOOLEAN NOT NULL DEFAULT FALSE,
    payment_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_fee_ledger_org ON booking_fee_ledger (organisation_id);
CREATE INDEX IF NOT EXISTS idx_booking_fee_ledger_appt ON booking_fee_ledger (appointment_id);

-- Platform top-up payments (Razorpay) for booking-fee overage beyond the monthly free quota.
-- These are paid into the platform's own Razorpay account (configured in appsettings.json).
CREATE TABLE IF NOT EXISTS subscription_topup_payments (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    plan_code VARCHAR(32) NOT NULL,
    amount_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    bookings_covered INTEGER NOT NULL DEFAULT 0,
    razorpay_order_id VARCHAR(128),
    razorpay_payment_id VARCHAR(128),
    razorpay_signature VARCHAR(256),
    receipt VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'created', -- created | paid | failed
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_topups_org ON subscription_topup_payments (organisation_id);
CREATE INDEX IF NOT EXISTS idx_subscription_topups_order ON subscription_topup_payments (razorpay_order_id);

COMMENT ON TABLE subscription_topup_payments IS
    'Razorpay payments to settle platform booking-fee overage beyond the free monthly quota';

-- Seed plans (idempotent)
-- free_bookings_per_month: included bookings per calendar month before overage fees apply
INSERT INTO subscription_plans (plan_code, project_name, display_name, monthly_price_inr, booking_fee_inr, booking_fee_percent, trial_days, free_bookings_per_month, sort_order)
VALUES
    ('free',       'appointza', 'Free',       0,     10, 3.000, 0,    50,   0),
    ('starter',    'appointza', 'Starter',    1000,  20, 2.000, 0,    50,   1),
    ('growth',     'appointza', 'Growth',     3000,  15, 1.500, 0,   200,   2),
    ('business',   'appointza', 'Business',   5000,  10, 1.000, 0,   500,   3),
    ('enterprise', 'appointza', 'Enterprise', 10000,  7, 0.700, 0,  1400,   4),
    ('premium',    'appointza', 'Premium',    20000,  5, 0.500, 0,  4000,   5)
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

-- Retire legacy tier codes replaced by Growth / Business
UPDATE subscription_plans SET isactive = FALSE WHERE LOWER(TRIM(plan_code)) IN ('basic', 'pro');

COMMENT ON TABLE subscription_plans IS 'Catalog of Appointza SaaS tiers';
COMMENT ON TABLE organisation_subscriptions IS 'Active subscription row per organisation';
COMMENT ON COLUMN organisation_subscriptions.current_period_start IS 'Pack/billing period start (shown as Started on in UI)';
COMMENT ON COLUMN organisation_subscriptions.trial_ends_at IS 'Launch trial end (shown as Ends on while in trial)';
COMMENT ON COLUMN organisation_subscriptions.current_period_end IS 'Billing period end after trial';

-- Backfill missing pack dates for existing rows (safe to re-run)
UPDATE organisation_subscriptions os
SET
    current_period_start = COALESCE(os.current_period_start, os.created_at),
    updated_at = NOW()
WHERE os.isactive = TRUE
  AND os.current_period_start IS NULL;

UPDATE organisation_subscriptions os
SET
    current_period_end = COALESCE(
        os.current_period_end,
        os.trial_ends_at,
        os.current_period_start + INTERVAL '1 month'
    ),
    status = CASE
        WHEN os.trial_ends_at IS NOT NULL AND NOW() < os.trial_ends_at THEN 'trialing'
        ELSE COALESCE(NULLIF(os.status, ''), 'active')
    END,
    updated_at = NOW()
WHERE os.isactive = TRUE
  AND os.current_period_end IS NULL;
COMMENT ON TABLE booking_fee_ledger IS 'Per-booking platform fee (rupee or percent, whichever higher)';

-- Credit Wallet (prepaid booking credits) — alternative to subscription per-booking fees.
CREATE TABLE IF NOT EXISTS organisation_credit_wallet (
    organisation_id BIGINT PRIMARY KEY,
    billing_mode VARCHAR(20) NOT NULL DEFAULT 'subscription',
    wallet_credit_balance INT NOT NULL DEFAULT 0,
    wallet_free_used_month INT NOT NULL DEFAULT 0,
    wallet_free_month_key VARCHAR(7) NOT NULL DEFAULT '',
    credits_per_booking INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'wallet_deduction',
    amount INT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    appointment_id BIGINT,
    event_booking_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_wallet_tx_org ON credit_wallet_transactions (organisation_id);

CREATE TABLE IF NOT EXISTS credit_wallet_recharge_payments (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    pack_id VARCHAR(32) NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    amount_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    razorpay_order_id VARCHAR(128),
    razorpay_payment_id VARCHAR(128),
    razorpay_signature VARCHAR(256),
    receipt VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_wallet_recharge_org ON credit_wallet_recharge_payments (organisation_id);
CREATE INDEX IF NOT EXISTS idx_credit_wallet_recharge_order ON credit_wallet_recharge_payments (razorpay_order_id);

COMMENT ON TABLE credit_wallet_recharge_payments IS
    'Razorpay payments for Credit Wallet pack recharges (platform appointza account)';

COMMENT ON TABLE organisation_credit_wallet IS
    'Prepaid booking credit wallet — coexists with subscription plans in organisation_subscriptions';
COMMENT ON TABLE credit_wallet_transactions IS
    'Ledger of wallet recharges, monthly free grants, and booking deductions';
