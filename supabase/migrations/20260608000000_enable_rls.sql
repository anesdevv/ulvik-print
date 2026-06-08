-- Enable Row Level Security (RLS) on all tables to prevent direct client-side database manipulation
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_prices ENABLE ROW LEVEL SECURITY;

-- Note: The Express backend uses the Supabase Service Role key (service_role),
-- which bypasses RLS policies entirely. No additional RLS policies are required
-- since the frontend never queries these tables directly.
