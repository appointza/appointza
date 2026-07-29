-- AppointzaStay / Lodge — PostgreSQL schema
-- Property content on organisations; Site Builder layout in organisations.website (JSONB)

CREATE TABLE IF NOT EXISTS organisations (
    id                  VARCHAR(64)   PRIMARY KEY,
    owner_id            VARCHAR(64)   NOT NULL,
    name                VARCHAR(255)  NOT NULL,
    property_type       VARCHAR(30)   NOT NULL DEFAULT 'hotel',
    booking_type        VARCHAR(20)   NOT NULL DEFAULT 'overnight',
    minimum_hours       INT           NOT NULL DEFAULT 2,
    overnight_time_mode VARCHAR(20)   NOT NULL DEFAULT 'fixed',
    slug                VARCHAR(120)  NOT NULL DEFAULT '',
    tagline             TEXT          NOT NULL DEFAULT '',
    description         TEXT          NOT NULL DEFAULT '',
    address             TEXT          NOT NULL DEFAULT '',
    city                VARCHAR(100)  NOT NULL DEFAULT '',
    state               VARCHAR(100)  NOT NULL DEFAULT '',
    country             VARCHAR(100)  NOT NULL DEFAULT 'India',
    pincode             VARCHAR(20)   NOT NULL DEFAULT '',
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    phone               VARCHAR(30)   NOT NULL DEFAULT '',
    whatsapp            VARCHAR(30)   NOT NULL DEFAULT '',
    email               VARCHAR(255)  NOT NULL DEFAULT '',
    checkin_time        TIME          NOT NULL DEFAULT '14:00',
    checkout_time       TIME          NOT NULL DEFAULT '11:00',
    cancellation_policy TEXT          NOT NULL DEFAULT '',
    payment_policy      TEXT          NOT NULL DEFAULT '',
    rules               JSONB         NOT NULL DEFAULT '{"houseRules":[]}'::jsonb,
    highlights          JSONB         NOT NULL DEFAULT '[]'::jsonb,
    amenities           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    images              JSONB         NOT NULL DEFAULT '[]'::jsonb,
    nearby_places       JSONB         NOT NULL DEFAULT '[]'::jsonb,
    activities          JSONB         NOT NULL DEFAULT '[]'::jsonb,
    packages            JSONB         NOT NULL DEFAULT '[]'::jsonb,
    guest_services      JSONB         NOT NULL DEFAULT '[]'::jsonb,
    offers              JSONB         NOT NULL DEFAULT '[]'::jsonb,
    reviews             JSONB         NOT NULL DEFAULT '[]'::jsonb,
    food_menu           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    travel_info         JSONB         NOT NULL DEFAULT '[]'::jsonb,
    faq                 JSONB         NOT NULL DEFAULT '[]'::jsonb,
    weather             JSONB         NOT NULL DEFAULT '{}'::jsonb,
    contact_info        JSONB         NOT NULL DEFAULT '{}'::jsonb,
    seo                 JSONB         NOT NULL DEFAULT '{}'::jsonb,
    messaging           JSONB         NOT NULL DEFAULT '{}'::jsonb,
    payment_gateway     JSONB         NOT NULL DEFAULT '{}'::jsonb,
    onboarding          JSONB         NOT NULL DEFAULT '{"bannerDismissed":false}'::jsonb,
    website_url         VARCHAR(500)  NOT NULL DEFAULT '',
    subdomain           VARCHAR(63)   NOT NULL DEFAULT '',
    referral_code       VARCHAR(32)   NOT NULL DEFAULT '',
    referred_by_organisation_id VARCHAR(64),
    is_verified         BOOLEAN       NOT NULL DEFAULT false,
    verified_at         TIMESTAMPTZ,
    verified_by_user_id VARCHAR(64),
    logo_asset_id       VARCHAR(64),
    website             JSONB         NOT NULL DEFAULT '{"blocks":[],"settings":{"backgroundColor":"#FAF8F3","textColor":"#1F2937"}}'::jsonb,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS organisation_assets (
    id               VARCHAR(64)  PRIMARY KEY,
    organisation_id  VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL DEFAULT '',
    kind             VARCHAR(20)  NOT NULL DEFAULT 'upload',
    category         VARCHAR(30)  NOT NULL DEFAULT 'other',
    url              TEXT         NOT NULL DEFAULT '',
    file_name        VARCHAR(255),
    mime_type        VARCHAR(100),
    notes            TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id               VARCHAR(64)  PRIMARY KEY,
    organisation_id  VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(255) NOT NULL DEFAULT '',
    password_hash    VARCHAR(255) NOT NULL DEFAULT '',
    role             VARCHAR(30)  NOT NULL DEFAULT 'receptionist',
    department       VARCHAR(30)  NOT NULL DEFAULT 'front_office',
    status           VARCHAR(20)  NOT NULL DEFAULT 'active',
    permissions      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id               VARCHAR(64)  PRIMARY KEY,
    organisation_id  VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(255),
    user_account_id  VARCHAR(64)  REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id                   VARCHAR(64)  PRIMARY KEY,
    organisation_id      VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    room_number          VARCHAR(20)  NOT NULL,
    room_name            VARCHAR(255) NOT NULL DEFAULT '',
    room_type            VARCHAR(20)  NOT NULL DEFAULT 'double',
    floor_number         INT          NOT NULL DEFAULT 1,
    building_wing        VARCHAR(100) NOT NULL DEFAULT '',
    status               VARCHAR(30)  NOT NULL DEFAULT 'available',
    capacity             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    pricing              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    amenities            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    main_photo           TEXT         NOT NULL DEFAULT '',
    gallery_photos       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    room_video           TEXT         NOT NULL DEFAULT '',
    booking_rules        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    cleaning_assignment  JSONB,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (organisation_id, room_number)
);

CREATE TABLE IF NOT EXISTS booking_details (
    id               VARCHAR(64)   PRIMARY KEY,
    organisation_id  VARCHAR(64)   NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    customer_id      VARCHAR(64)   NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    room_id          VARCHAR(64)   REFERENCES rooms(id) ON DELETE RESTRICT,
    booking_code     VARCHAR(50)   NOT NULL,
    check_in         DATE          NOT NULL,
    check_out        DATE          NOT NULL,
    check_in_time    VARCHAR(8)    NOT NULL DEFAULT '14:00',
    check_out_time   VARCHAR(8)    NOT NULL DEFAULT '11:00',
    nights           INT           NOT NULL DEFAULT 1,
    duration         INT           NOT NULL DEFAULT 0,
    hours            INT           NOT NULL DEFAULT 0,
    booking_type     VARCHAR(20)   NOT NULL DEFAULT 'overnight',
    persons          INT           NOT NULL DEFAULT 2,
    extra_beds       INT           NOT NULL DEFAULT 0,
    total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    status           VARCHAR(20)   NOT NULL DEFAULT 'active',
    guest_services   JSONB         NOT NULL DEFAULT '[]'::jsonb,
    packages         JSONB         NOT NULL DEFAULT '[]'::jsonb,
    payment_reference VARCHAR(120) NOT NULL DEFAULT '',
    razorpay_order_id VARCHAR(120) NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (organisation_id, booking_code)
);

CREATE TABLE IF NOT EXISTS organisation_billing (
    organisation_id   VARCHAR(64)  PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,
    plan_id           VARCHAR(30)  NOT NULL DEFAULT 'silver',
    booking_credits   INT          NOT NULL DEFAULT 0,
    plan_started_at   TIMESTAMPTZ,
    plan_renews_at    TIMESTAMPTZ,
    billing_mode      VARCHAR(20)  NOT NULL DEFAULT 'subscription',
    wallet_credit_balance INT      NOT NULL DEFAULT 0,
    wallet_free_used_month INT     NOT NULL DEFAULT 0,
    wallet_free_month_key VARCHAR(7) NOT NULL DEFAULT '',
    credits_per_booking INT      NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id               VARCHAR(64)  PRIMARY KEY,
    organisation_id  VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    type             VARCHAR(20)  NOT NULL DEFAULT 'booking',
    amount           INT          NOT NULL,
    description      TEXT         NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id               VARCHAR(64)  PRIMARY KEY,
    organisation_id  VARCHAR(64)  NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id          VARCHAR(64)  REFERENCES users(id) ON DELETE SET NULL,
    action           VARCHAR(50)  NOT NULL,
    entity_type      VARCHAR(50)  NOT NULL,
    entity_id        VARCHAR(64),
    message          TEXT         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_owner ON organisations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_assets_org ON organisation_assets(organisation_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rooms_org ON rooms(organisation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_org ON booking_details(organisation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON booking_details(room_id);
CREATE INDEX IF NOT EXISTS idx_billing_org ON organisation_billing(organisation_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_org ON credit_transactions(organisation_id);
CREATE INDEX IF NOT EXISTS idx_logs_org ON logs(organisation_id);

ALTER TABLE organisations DROP CONSTRAINT IF EXISTS fk_organisations_owner;

-- Wallet billing columns (idempotent for existing databases)
ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NOT NULL DEFAULT 'subscription';
ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_credit_balance INT NOT NULL DEFAULT 0;
ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_free_used_month INT NOT NULL DEFAULT 0;
ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_free_month_key VARCHAR(7) NOT NULL DEFAULT '';
ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS credits_per_booking INT NOT NULL DEFAULT 1;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS packages JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE booking_details ALTER COLUMN room_id DROP NOT NULL;
ALTER TABLE organisations
    ADD CONSTRAINT fk_organisations_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
