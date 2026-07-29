-- Add email and whatsapp_mobile columns to organisationlocation table
-- When someone books at a location, notifications are sent to this location's email and WhatsApp number

ALTER TABLE organisationlocation ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organisationlocation ADD COLUMN IF NOT EXISTS whatsapp_mobile VARCHAR(20);

COMMENT ON COLUMN organisationlocation.email IS 'Location-specific email for booking notifications';
COMMENT ON COLUMN organisationlocation.whatsapp_mobile IS 'Location-specific WhatsApp/mobile number for booking notifications';
