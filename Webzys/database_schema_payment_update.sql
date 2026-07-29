-- Add payment tracking columns to websites table
-- Run this migration to add payment tracking for website exports

ALTER TABLE websites 
ADD COLUMN IF NOT EXISTS export_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS export_payment_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS export_payment_order_id VARCHAR(255) NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_websites_export_paid ON websites(export_paid);
CREATE INDEX IF NOT EXISTS idx_websites_export_payment_order_id ON websites(export_payment_order_id);

