-- Scope OrganisationServices to organisation + location (like events).
ALTER TABLE organisationservices
    ADD COLUMN IF NOT EXISTS organisationlocationid BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_organisationservices_org_location
    ON organisationservices (organisationid, organisationlocationid)
    WHERE isactive = TRUE;

-- Backfill existing services to the first active location of each organisation.
UPDATE organisationservices os
SET organisationlocationid = loc.id
FROM (
    SELECT DISTINCT ON (ol.organisationid)
        ol.organisationid,
        ol.id
    FROM organisationlocation ol
    WHERE ol.isactive = TRUE
    ORDER BY ol.organisationid, ol.id
) loc
WHERE os.organisationid = loc.organisationid
  AND (os.organisationlocationid IS NULL OR os.organisationlocationid = 0);
