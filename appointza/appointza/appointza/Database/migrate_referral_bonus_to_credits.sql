-- Referral rewards: subscription months -> wallet booking credits
ALTER TABLE organisation_referral_rewards
    ADD COLUMN IF NOT EXISTS bonus_credits INT;

UPDATE organisation_referral_rewards
SET bonus_credits = 50
WHERE bonus_credits IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organisation_referral_rewards'
          AND column_name = 'bonus_months'
    ) THEN
        ALTER TABLE organisation_referral_rewards DROP COLUMN bonus_months;
    END IF;
END $$;

ALTER TABLE organisation_referral_rewards
    ALTER COLUMN bonus_credits SET NOT NULL,
    ALTER COLUMN bonus_credits SET DEFAULT 50;
