-- Organisation referral codes and signup rewards
ALTER TABLE Organisation ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);
ALTER TABLE Organisation ADD COLUMN IF NOT EXISTS referred_by_organisation_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisation_referral_code
    ON Organisation (referral_code)
    WHERE referral_code IS NOT NULL AND referral_code <> '';

CREATE TABLE IF NOT EXISTS organisation_referral_rewards (
    id BIGSERIAL PRIMARY KEY,
    referrer_organisation_id BIGINT NOT NULL,
    referred_organisation_id BIGINT NOT NULL,
    bonus_credits INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT uq_referral_referred_org UNIQUE (referred_organisation_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer
    ON organisation_referral_rewards (referrer_organisation_id);

COMMENT ON COLUMN Organisation.referral_code IS 'Unique shareable code for referring new organisations';
COMMENT ON COLUMN Organisation.referred_by_organisation_id IS 'Organisation that referred this signup, if any';
