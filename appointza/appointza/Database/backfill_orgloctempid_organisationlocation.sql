-- Backfill orgloctempid for existing organisation locations that were created before the column existed.
-- Safe to re-run: only rows with NULL orgloctempid are updated.

-- Ensure column exists (run add_orgloctempid_to_organisationlocation.sql first if needed)
ALTER TABLE organisationlocation
ADD COLUMN IF NOT EXISTS orgloctempid UUID;

UPDATE organisationlocation
SET orgloctempid = gen_random_uuid()
WHERE orgloctempid IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisationlocation_orgloctempid
ON organisationlocation (orgloctempid)
WHERE orgloctempid IS NOT NULL;

-- Verify
SELECT
    COUNT(*) AS total_locations,
    COUNT(orgloctempid) AS with_guid,
    COUNT(*) - COUNT(orgloctempid) AS still_missing
FROM organisationlocation;
