-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  price INTEGER NOT NULL,          -- DZD, stored in whole units
  category TEXT,
  images TEXT[] DEFAULT '{}',     -- Supabase Storage public URLs
  sizes TEXT[] DEFAULT '{}',      -- e.g. ['S','M','L']
  colors JSONB DEFAULT '[]',      -- [{"label":"Black","hex":"#000000"}]
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,     -- snapshot at order time
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  baladiya TEXT NOT NULL,
  delivery_type TEXT NOT NULL,    -- 'home' | 'desk'
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' -- 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
);

-- Create delivery_prices table
CREATE TABLE IF NOT EXISTS delivery_prices (
  wilaya TEXT PRIMARY KEY,
  fee INTEGER NOT NULL DEFAULT 0   -- DZD
);

-- Seed delivery_prices with the 58 Wilayas of Algeria
INSERT INTO delivery_prices (wilaya, fee) VALUES
('01 - Adrar', 1000),
('02 - Chlef', 700),
('03 - Laghouat', 800),
('04 - Oum El Bouaghi', 700),
('05 - Batna', 700),
('06 - Béjaïa', 700),
('07 - Biskra', 800),
('08 - Béchar', 900),
('09 - Blida', 500),
('10 - Bouira', 600),
('11 - Tamanrasset', 1200),
('12 - Tébessa', 800),
('13 - Tlemcen', 800),
('14 - Tiaret', 700),
('15 - Tizi Ouzou', 600),
('16 - Alger', 400),
('17 - Djelfa', 700),
('18 - Jijel', 700),
('19 - Sétif', 700),
('20 - Saïda', 800),
('21 - Skikda', 700),
('22 - Sidi Bel Abbès', 800),
('23 - Annaba', 700),
('24 - Guelma', 700),
('25 - Constantine', 700),
('26 - Médéa', 600),
('27 - Mostaganem', 700),
('28 - M''Sila', 700),
('29 - Mascara', 800),
('30 - Ouargla', 900),
('31 - Oran', 700),
('32 - El Bayadh', 900),
('33 - Illizi', 1200),
('34 - Bordj Bou Arréridj', 700),
('35 - Boumerdès', 500),
('36 - El Tarf', 800),
('37 - Tindouf', 1200),
('38 - Tissemsilt', 700),
('39 - El Oued', 800),
('40 - Khenchela', 800),
('41 - Souk Ahras', 800),
('42 - Tipaza', 500),
('43 - Mila', 700),
('44 - Aïn Defla', 700),
('45 - Naâma', 900),
('46 - Aïn Témouchent', 800),
('47 - Ghardaïa', 800),
('48 - Relizane', 700),
('49 - Timimoun', 1000),
('50 - Bordj Badji Mokhtar', 1200),
('51 - Ouled Djellal', 800),
('52 - Béni Abbès', 1000),
('53 - In Salah', 1100),
('54 - In Guezzam', 1200),
('55 - Touggourt', 900),
('56 - Djanet', 1200),
('57 - El M''Ghair', 950),
('58 - El Meniaa', 950)
ON CONFLICT (wilaya) DO NOTHING;
