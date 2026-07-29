-- Integration tokens for third-party apps to fetch leads and customers
CREATE TABLE IF NOT EXISTS integration_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    userid BIGINT NOT NULL,
    organisation_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integration_tokens_userid ON integration_tokens(userid);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_organisation_id ON integration_tokens(organisation_id);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_active ON integration_tokens(is_active) WHERE is_active = true;
