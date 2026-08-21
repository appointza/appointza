-- Organisation-scoped loyalty points, schemes, rules, tiers, and customer wallets
-- Prerequisite: public.organisation must exist (see create_all_tables.sql)
-- Verify: SELECT id, name FROM organisation LIMIT 5;

CREATE TABLE IF NOT EXISTS organisation_loyalty_settings (
    organisation_id BIGINT PRIMARY KEY REFERENCES organisation(id),
    points_per_service INT NOT NULL DEFAULT 0,
    points_per_rupee_spent DECIMAL(10, 4) NOT NULL DEFAULT 0,
    bonus_points INT NOT NULL DEFAULT 0,
    referral_points INT NOT NULL DEFAULT 0,
    birthday_bonus_points INT NOT NULL DEFAULT 0,
    anniversary_bonus_points INT NOT NULL DEFAULT 0,
    redemption_points_per_rupee INT NOT NULL DEFAULT 100,
    redemption_rupee_value DECIMAL(10, 2) NOT NULL DEFAULT 50,
    min_redemption_points INT NOT NULL DEFAULT 100,
    points_expiry_days INT NOT NULL DEFAULT 365,
    max_points_per_transaction INT NOT NULL DEFAULT 0,
    combine_with_discounts BOOLEAN NOT NULL DEFAULT FALSE,
    allow_transfer BOOLEAN NOT NULL DEFAULT FALSE,
    allow_partial_redemption BOOLEAN NOT NULL DEFAULT TRUE,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organisation_loyalty_schemes (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    start_date DATE,
    end_date DATE,
    eligible_customer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    eligible_service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_completed_services INT NOT NULL DEFAULT 0,
    reward_type VARCHAR(40) NOT NULL DEFAULT 'loyalty_points',
    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    max_reward_limit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reward_expiry_days INT NOT NULL DEFAULT 30,
    terms_and_conditions TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_schemes_org ON organisation_loyalty_schemes (organisation_id);

CREATE TABLE IF NOT EXISTS organisation_loyalty_rules (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    scheme_id BIGINT REFERENCES organisation_loyalty_schemes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL DEFAULT '',
    trigger_type VARCHAR(40) NOT NULL DEFAULT 'completed_services',
    trigger_operator VARCHAR(10) NOT NULL DEFAULT '>=',
    trigger_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    trigger_period_days INT NOT NULL DEFAULT 0,
    reward_type VARCHAR(40) NOT NULL DEFAULT 'percentage_discount',
    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    apply_on VARCHAR(40) NOT NULL DEFAULT 'next_service',
    max_discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reward_expiry_days INT NOT NULL DEFAULT 30,
    free_service_id BIGINT NOT NULL DEFAULT 0,
    priority INT NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rules_org ON organisation_loyalty_rules (organisation_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_scheme ON organisation_loyalty_rules (scheme_id);

CREATE TABLE IF NOT EXISTS organisation_loyalty_tiers (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    name VARCHAR(100) NOT NULL,
    min_services INT NOT NULL DEFAULT 0,
    max_services INT,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    benefits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_org ON organisation_loyalty_tiers (organisation_id);

CREATE TABLE IF NOT EXISTS client_loyalty_wallet (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    client_user_id BIGINT NOT NULL,
    current_points INT NOT NULL DEFAULT 0,
    total_points_earned INT NOT NULL DEFAULT 0,
    total_points_redeemed INT NOT NULL DEFAULT 0,
    completed_services_count INT NOT NULL DEFAULT 0,
    total_spend DECIMAL(14, 2) NOT NULL DEFAULT 0,
    current_tier_id BIGINT REFERENCES organisation_loyalty_tiers(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organisation_id, client_user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_wallet_org ON client_loyalty_wallet (organisation_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_wallet_client ON client_loyalty_wallet (client_user_id);

CREATE TABLE IF NOT EXISTS loyalty_point_transactions (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    client_user_id BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    points_delta INT NOT NULL,
    balance_after INT NOT NULL,
    reference_type VARCHAR(40) NOT NULL DEFAULT '',
    reference_id BIGINT NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_by BIGINT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_ptx_org_client ON loyalty_point_transactions (organisation_id, client_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ptx_ref ON loyalty_point_transactions (reference_type, reference_id);

CREATE TABLE IF NOT EXISTS loyalty_reward_grants (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisation(id),
    client_user_id BIGINT NOT NULL,
    scheme_id BIGINT REFERENCES organisation_loyalty_schemes(id),
    rule_id BIGINT REFERENCES organisation_loyalty_rules(id),
    reward_type VARCHAR(40) NOT NULL,
    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    apply_on VARCHAR(40) NOT NULL DEFAULT 'next_service',
    max_discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    source_appointment_id BIGINT NOT NULL DEFAULT 0,
    coupon_code VARCHAR(64) NOT NULL DEFAULT '',
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    redeemed_at TIMESTAMP,
    redeemed_appointment_id BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_grants_org_client ON loyalty_reward_grants (organisation_id, client_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_grants_no_dup_appt
    ON loyalty_reward_grants (organisation_id, client_user_id, rule_id, source_appointment_id)
    WHERE source_appointment_id > 0 AND rule_id IS NOT NULL;

-- Verify migration
SELECT 'organisation_loyalty tables created successfully!' AS status;
SELECT id, name FROM organisation ORDER BY id LIMIT 5;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organisation_loyalty_settings',
    'organisation_loyalty_schemes',
    'organisation_loyalty_rules',
    'organisation_loyalty_tiers',
    'client_loyalty_wallet',
    'loyalty_point_transactions',
    'loyalty_reward_grants'
  )
ORDER BY table_name;
