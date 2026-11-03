-- Email campaigns + lightweight inbound message store (Gmail/SMTP/IMAP).

CREATE TABLE IF NOT EXISTS email_campaigns (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    integration_id BIGINT NULL REFERENCES organization_integrations(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL DEFAULT '',
    subject VARCHAR(500) NOT NULL DEFAULT '',
    body_text TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    -- draft | sending | sent | sent_with_errors | failed
    audience_mode VARCHAR(40) NOT NULL DEFAULT 'leads_with_email',
    -- leads_with_email | manual
    selected_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    last_error TEXT NOT NULL DEFAULT '',
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org
    ON email_campaigns (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    campaign_id BIGINT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    enquiry_id BIGINT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    email_address VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(40) NOT NULL DEFAULT 'pending',
    -- pending | sent | failed | skipped
    error_message TEXT NOT NULL DEFAULT '',
    provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
    sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign
    ON email_campaign_recipients (campaign_id, delivery_status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_campaign_recipients_email
    ON email_campaign_recipients (campaign_id, lower(btrim(email_address)))
    WHERE email_address IS NOT NULL AND btrim(email_address) <> '';

CREATE TABLE IF NOT EXISTS email_messages (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    integration_id BIGINT NULL REFERENCES organization_integrations(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
    -- inbound | outbound
    provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
    thread_key VARCHAR(255) NOT NULL DEFAULT '',
    from_address VARCHAR(255) NOT NULL DEFAULT '',
    to_address VARCHAR(255) NOT NULL DEFAULT '',
    subject VARCHAR(500) NOT NULL DEFAULT '',
    body_text TEXT NOT NULL DEFAULT '',
    body_preview VARCHAR(500) NOT NULL DEFAULT '',
    received_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_messages_provider
    ON email_messages (organisation_id, provider_message_id)
    WHERE provider_message_id IS NOT NULL AND btrim(provider_message_id) <> '';

CREATE INDEX IF NOT EXISTS idx_email_messages_org
    ON email_messages (organisation_id, received_at DESC NULLS LAST, created_at DESC);

COMMENT ON TABLE email_campaigns IS 'Org email campaigns sent via connected SMTP (e.g. Gmail app password).';
COMMENT ON TABLE email_messages IS 'Synced inbound (IMAP) and logged outbound email messages.';
