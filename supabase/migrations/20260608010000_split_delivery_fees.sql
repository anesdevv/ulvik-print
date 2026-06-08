-- Migration to support both Home Delivery and pickup office fees per Wilaya
ALTER TABLE delivery_prices ADD COLUMN IF NOT EXISTS home_fee INTEGER DEFAULT 0;
ALTER TABLE delivery_prices ADD COLUMN IF NOT EXISTS desk_fee INTEGER DEFAULT 0;

-- Copy existing fee column into home_fee
UPDATE delivery_prices SET home_fee = fee;

-- Set desk_fee to fee - 300 (minimum 0) as a reasonable pickup discount default
UPDATE delivery_prices SET desk_fee = GREATEST(0, fee - 300);

-- Drop the old fee column
ALTER TABLE delivery_prices DROP COLUMN IF EXISTS fee;
