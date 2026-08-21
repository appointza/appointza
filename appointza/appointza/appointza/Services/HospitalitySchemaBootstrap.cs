using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    static class HospitalitySchemaBootstrap
    {
        public static async Task EnsureSchemaTransaction(IDb db)
        {
            string[] statements =
            [
                """
                CREATE TABLE IF NOT EXISTS organisation_hospitality_profile (
                    organisation_id       BIGINT PRIMARY KEY,
                    organisation_type     VARCHAR(30)  NOT NULL DEFAULT 'service',
                    property_type         VARCHAR(30)  NOT NULL DEFAULT 'hotel',
                    booking_type          VARCHAR(20)  NOT NULL DEFAULT 'overnight',
                    minimum_hours         INT          NOT NULL DEFAULT 2,
                    checkin_time          TIME         NOT NULL DEFAULT '14:00',
                    checkout_time         TIME         NOT NULL DEFAULT '11:00',
                    packages              JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    food_menu             JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    nearby_places         JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    guest_services        JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    created_at            TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at            TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(30) NOT NULL DEFAULT 'service'
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS property_type VARCHAR(30) NOT NULL DEFAULT 'hotel'
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) NOT NULL DEFAULT 'overnight'
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS minimum_hours INT NOT NULL DEFAULT 2
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS checkin_time TIME NOT NULL DEFAULT '14:00'
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS checkout_time TIME NOT NULL DEFAULT '11:00'
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS packages JSONB NOT NULL DEFAULT '[]'::jsonb
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS food_menu JSONB NOT NULL DEFAULT '[]'::jsonb
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS nearby_places JSONB NOT NULL DEFAULT '[]'::jsonb
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT ''
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS payment_policy TEXT NOT NULL DEFAULT ''
                """,
                """
                ALTER TABLE organisation_hospitality_profile
                    ADD COLUMN IF NOT EXISTS overnight_time_mode VARCHAR(20) NOT NULL DEFAULT 'fixed'
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_org_hospitality_profile_type
                    ON organisation_hospitality_profile (organisation_type)
                """,
                """
                CREATE TABLE IF NOT EXISTS organisation_rooms (
                    id                        BIGSERIAL PRIMARY KEY,
                    organisation_id           BIGINT       NOT NULL,
                    organisation_location_id  BIGINT,
                    room_number               VARCHAR(50)  NOT NULL,
                    room_name                 VARCHAR(255) NOT NULL DEFAULT '',
                    room_type                 VARCHAR(30)  NOT NULL DEFAULT 'double',
                    floor_number              INT          NOT NULL DEFAULT 1,
                    building_wing             VARCHAR(100) NOT NULL DEFAULT '',
                    status                    VARCHAR(30)  NOT NULL DEFAULT 'available',
                    capacity                  JSONB        NOT NULL DEFAULT '{}'::jsonb,
                    pricing                   JSONB        NOT NULL DEFAULT '{}'::jsonb,
                    amenities                 JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    main_photo                TEXT         NOT NULL DEFAULT '',
                    gallery_photos            JSONB        NOT NULL DEFAULT '[]'::jsonb,
                    booking_rules             JSONB        NOT NULL DEFAULT '{}'::jsonb,
                    guest                     JSONB,
                    booking                   JSONB,
                    payment                   JSONB,
                    cleaning_assignment       JSONB,
                    isactive                  BOOLEAN      NOT NULL DEFAULT TRUE,
                    created_at                TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at                TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_org_rooms_org
                    ON organisation_rooms (organisation_id)
                    WHERE isactive = TRUE
                """,
                """
                DROP INDEX IF EXISTS uq_org_rooms_number
                """,
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_org_rooms_number_location
                    ON organisation_rooms (organisation_id, organisation_location_id, room_number)
                    WHERE isactive = TRUE AND organisation_location_id IS NOT NULL
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_org_rooms_location
                    ON organisation_rooms (organisation_location_id)
                    WHERE isactive = TRUE
                """,
                """
                CREATE TABLE IF NOT EXISTS organisation_room_status_events (
                    id                         BIGSERIAL PRIMARY KEY,
                    organisation_id            BIGINT       NOT NULL,
                    organisation_location_id   BIGINT,
                    organisation_room_id       BIGINT       NOT NULL,
                    booking_id                 VARCHAR(100) NOT NULL DEFAULT '',
                    from_status                VARCHAR(30)  NOT NULL DEFAULT '',
                    to_status                  VARCHAR(30)  NOT NULL,
                    event_type                 VARCHAR(30)  NOT NULL,
                    changed_by_user_id         BIGINT,
                    changed_by_name            VARCHAR(255) NOT NULL DEFAULT '',
                    source                     VARCHAR(40)  NOT NULL DEFAULT 'api',
                    notes                      TEXT         NOT NULL DEFAULT '',
                    occurred_at                TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    created_at                 TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_room_status_events_room_time
                    ON organisation_room_status_events (organisation_room_id, occurred_at DESC)
                """,
                """
                CREATE INDEX IF NOT EXISTS idx_room_status_events_org_booking
                    ON organisation_room_status_events (organisation_id, booking_id)
                    WHERE booking_id <> ''
                """,
                """
                ALTER TABLE Organisation
                    ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(30) NOT NULL DEFAULT 'service'
                """,
            ];

            foreach (var sql in statements)
            {
                DbCommand cmd = db.GetCommand(sql);
                await db.ExecuteNonQuery(cmd);
            }
        }
    }
}
