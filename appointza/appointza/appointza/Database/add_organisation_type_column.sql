-- Organisation type: service | hospitality | both
ALTER TABLE Organisation
ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(30) NOT NULL DEFAULT 'service';

COMMENT ON COLUMN Organisation.organisation_type IS 'Appointza mode: service, hospitality, or both';

CREATE INDEX IF NOT EXISTS idx_organisation_organisation_type
    ON Organisation (organisation_type);
