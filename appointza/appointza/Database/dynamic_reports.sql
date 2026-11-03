-- Metadata-driven dynamic reports (Super Admin definitions → Org Admin execution).

CREATE TABLE IF NOT EXISTS report_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(120) NOT NULL DEFAULT 'General',
    catalog_key VARCHAR(80) NULL,
    sql_query TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    export_excel BOOLEAN NOT NULL DEFAULT TRUE,
    export_csv BOOLEAN NOT NULL DEFAULT TRUE,
    export_pdf BOOLEAN NOT NULL DEFAULT TRUE,
    max_rows INT NOT NULL DEFAULT 5000,
    timeout_seconds INT NOT NULL DEFAULT 30,
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    modified_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_definitions_active
    ON report_definitions (is_active, is_published, category);

ALTER TABLE report_definitions ADD COLUMN IF NOT EXISTS catalog_key VARCHAR(80) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_definitions_catalog_key
    ON report_definitions (catalog_key)
    WHERE catalog_key IS NOT NULL AND btrim(catalog_key) <> '';

CREATE TABLE IF NOT EXISTS report_parameters (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    data_type VARCHAR(50) NOT NULL DEFAULT 'string',
    -- string | number | boolean | date | datetime
    input_type VARCHAR(50) NOT NULL DEFAULT 'text',
    -- text | number | boolean | date | datetime | date_range | dropdown | multi_select | checkbox | search
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    default_value TEXT NOT NULL DEFAULT '',
    options_source VARCHAR(40) NOT NULL DEFAULT 'none',
    -- none | static | system | lookup
    options_config TEXT NOT NULL DEFAULT '',
    -- JSON: static [{label,value}] | system {key} | lookup {sqlKey}
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_parameters_name UNIQUE (report_id, parameter_name)
);

CREATE INDEX IF NOT EXISTS idx_report_parameters_report
    ON report_parameters (report_id, sort_order);

CREATE TABLE IF NOT EXISTS report_columns (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    column_key VARCHAR(120) NOT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    format_type VARCHAR(40) NOT NULL DEFAULT 'text',
    -- text | number | currency | date | datetime | percent
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_columns_key UNIQUE (report_id, column_key)
);

CREATE TABLE IF NOT EXISTS report_charts (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    chart_type VARCHAR(40) NOT NULL DEFAULT 'none',
    -- none | line | bar | pie | donut
    x_column VARCHAR(120) NOT NULL DEFAULT '',
    y_column VARCHAR(120) NOT NULL DEFAULT '',
    title VARCHAR(200) NOT NULL DEFAULT '',
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_permissions (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    organisation_id BIGINT NULL,
    -- NULL = all organisations
    role_key VARCHAR(80) NOT NULL DEFAULT 'org_admin',
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_export BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_permissions_report
    ON report_permissions (report_id, organisation_id);

CREATE TABLE IF NOT EXISTS report_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    organisation_id BIGINT NOT NULL,
    executed_by BIGINT NULL,
    parameter_values TEXT NOT NULL DEFAULT '{}',
    row_count INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_execution_logs_org
    ON report_execution_logs (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS report_saved_filters (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL DEFAULT '',
    filter_values TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_saved_filters_user
    ON report_saved_filters (organisation_id, user_id, report_id);
