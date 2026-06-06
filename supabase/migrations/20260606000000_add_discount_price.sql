-- Add discount_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price INTEGER;
