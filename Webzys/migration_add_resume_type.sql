-- ============================================
-- Migration: Add 'resume' to websites type constraint
-- ============================================
-- This migration updates the CHECK constraint on the websites.type column
-- to include 'resume' as a valid website type.

-- Step 1: Drop the existing constraint
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_type_check;

-- Step 2: Add the new constraint with 'resume' included
ALTER TABLE websites ADD CONSTRAINT websites_type_check 
  CHECK (type IN ('normal', 'appointza', 'resume'));

-- Verify the constraint was added
-- You can check with: \d websites (in psql) or SHOW CREATE TABLE websites (in MySQL)

