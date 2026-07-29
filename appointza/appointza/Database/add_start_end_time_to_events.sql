-- Add dedicated event start/end times for appointment slot blocking.
-- Run against PostgreSQL (events table must already exist).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

COMMENT ON COLUMN events.start_time IS 'Event start time; appointment slots overlapping this range are blocked.';
COMMENT ON COLUMN events.end_time IS 'Event end time; appointment slots overlapping this range are blocked.';

-- Migrate legacy JSON timing_config StartTime/EndTime into columns (best-effort).
UPDATE events
SET
  start_time = NULLIF(TRIM(timing_config->>'StartTime'), '')::time,
  end_time = NULLIF(TRIM(timing_config->>'EndTime'), '')::time
WHERE timing_config IS NOT NULL
  AND timing_config->>'StartTime' IS NOT NULL
  AND timing_config->>'EndTime' IS NOT NULL
  AND start_time IS NULL
  AND end_time IS NULL;
