-- Backfill missing columns on organisation_hospitality_profile (older installs / partial bootstrap).
ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(30) NOT NULL DEFAULT 'service';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS property_type VARCHAR(30) NOT NULL DEFAULT 'hotel';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) NOT NULL DEFAULT 'overnight';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS minimum_hours INT NOT NULL DEFAULT 2;

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS checkin_time TIME NOT NULL DEFAULT '14:00';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS checkout_time TIME NOT NULL DEFAULT '11:00';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS packages JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS food_menu JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS nearby_places JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT '';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS payment_policy TEXT NOT NULL DEFAULT '';

ALTER TABLE organisation_hospitality_profile
    ADD COLUMN IF NOT EXISTS overnight_time_mode VARCHAR(20) NOT NULL DEFAULT 'fixed';

ALTER TABLE Organisation
    ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(30) NOT NULL DEFAULT 'service';

CREATE INDEX IF NOT EXISTS idx_org_hospitality_profile_type
    ON organisation_hospitality_profile (organisation_type);
