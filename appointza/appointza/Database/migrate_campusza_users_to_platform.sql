-- Migrate campusza.users → APPOINTZA users + user_product_profile
-- Run on APPOINTZA database. Both DBs on same host in dev; adjust conn string if needed.
--
-- Order:
--   1. This file (includes prerequisites + migration)
--   OR run add_platform_campusza_users.sql first, then section B below.

-- =============================================================================
-- A. Prerequisites (safe to re-run)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS dblink;

ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordhash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS user_product_profile (
    id              BIGSERIAL PRIMARY KEY,
    userid          BIGINT NOT NULL,
    product         VARCHAR(50) NOT NULL,
    role            VARCHAR(50) NOT NULL,
    externalorgid   VARCHAR(255) NOT NULL,
    profileid       VARCHAR(255) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'active',
    isactive        BOOLEAN NOT NULL DEFAULT true,
    createdon       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedon      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (userid, product, externalorgid)
);

-- =============================================================================
-- B. Connection to campusza DB (edit password/host if needed)
-- =============================================================================

-- Option 1: inline connection string (same server as APPOINTZA)
-- Replace password/host/db/user as needed.

-- Staging campusza rows in a temp table
DROP TABLE IF EXISTS _cz_users_migrate;

CREATE TEMP TABLE _cz_users_migrate AS
SELECT *
FROM dblink(
    'host=43.205.255.163 port=5432 dbname=campusza user=postgres password=abc123',
    $q$
    SELECT
        email,
        COALESCE(NULLIF(username, ''), split_part(email, '@', 1)) AS username,
        password_hash,
        role,
        status,
        organization_id,
        profile_id,
        is_active,
        email_verified,
        created_at,
        updated_at
    FROM users
    WHERE is_active = true
    $q$
) AS cz(
    email text,
    username text,
    password_hash text,
    role text,
    status text,
    organization_id text,
    profile_id text,
    is_active boolean,
    email_verified boolean,
    created_at timestamp,
    updated_at timestamp
);

-- =============================================================================
-- C. Insert platform Users (skip emails already on APPOINTZA)
-- =============================================================================

INSERT INTO users (
    name, email, mobile, mobilecountrycode, designation,
    otp, otpexpirationtime, organisationid, locationid, profileimage,
    passwordhash, version, createdby, createdon, modifiedby, modifiedon,
    attributes, isactive, issuspended, parentid, isfactory, notes,
    isverified, accountactive, push_token
)
SELECT
    cz.username,
    cz.email,
    '',
    '',
    '',
    '',
    NOW(),
    0,
    0,
    0,
    cz.password_hash,
    1,
    0,
    COALESCE(cz.created_at, NOW()),
    0,
    COALESCE(cz.updated_at, NOW()),
    '{}'::jsonb,
    cz.is_active,
    false,
    0,
    false,
    '',
    COALESCE(cz.email_verified, false),
    true,
    ''
FROM _cz_users_migrate cz
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE lower(u.email) = lower(cz.email)
);

-- =============================================================================
-- D. Insert user_product_profile for Campusza
-- =============================================================================

INSERT INTO user_product_profile (userid, product, role, externalorgid, profileid, status, isactive, createdon, modifiedon)
SELECT
    u.id,
    'campusza',
    cz.role,
    cz.organization_id,
    COALESCE(NULLIF(cz.profile_id, ''), u.id::text),
    COALESCE(NULLIF(cz.status, ''), 'active'),
    true,
    NOW(),
    NOW()
FROM _cz_users_migrate cz
INNER JOIN users u ON lower(u.email) = lower(cz.email)
WHERE NOT EXISTS (
    SELECT 1 FROM user_product_profile p
    WHERE p.userid = u.id
      AND p.product = 'campusza'
      AND p.externalorgid = cz.organization_id
);

-- =============================================================================
-- E. Verify
-- =============================================================================

SELECT 'platform_users_with_password' AS check_name, COUNT(*) AS cnt
FROM users WHERE passwordhash IS NOT NULL AND passwordhash <> '';

SELECT 'campusza_profiles' AS check_name, COUNT(*) AS cnt
FROM user_product_profile WHERE product = 'campusza';

-- After verifying logins, campusza.users can be deprecated (do not drop until verified).
