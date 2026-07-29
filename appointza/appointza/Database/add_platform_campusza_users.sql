-- Platform user store: email/password for Campusza and cross-product identity
-- Run against APPOINTZA database (Database=APPOINTZA)

-- Add password column (required before any migration INSERT)
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

CREATE INDEX IF NOT EXISTS idx_user_product_profile_user_product
    ON user_product_profile (userid, product)
    WHERE isactive = true;

-- Verify column exists (should return one row)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'passwordhash';
