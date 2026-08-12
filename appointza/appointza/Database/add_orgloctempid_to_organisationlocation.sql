-- Migration: Add orgloctempid (stable location template/public id) to OrganisationLocation
-- GUID is assigned in application code on INSERT; existing rows backfilled via backfill_orgloctempid_organisationlocation.sql

ALTER TABLE organisationlocation
ADD COLUMN IF NOT EXISTS orgloctempid UUID;

COMMENT ON COLUMN organisationlocation.orgloctempid IS 'Stable GUID for organisation location; set once on create, never updated';

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisationlocation_orgloctempid
ON organisationlocation (orgloctempid)
WHERE orgloctempid IS NOT NULL;
