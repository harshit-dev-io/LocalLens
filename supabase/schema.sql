-- =========================================================================
-- LocalLens V2: Supabase PostgreSQL Schema & Seed Data
-- =========================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the 'vendors' table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    lat FLOAT8 NOT NULL,
    lng FLOAT8 NOT NULL,
    verified_badge BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create geospatial index for high-performance bounding box/proximity filtering
CREATE INDEX IF NOT EXISTS idx_vendors_coords ON public.vendors (lat, lng);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors (category);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow public anonymous reads and inserts for seamless hackathon onboarding
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.vendors;
CREATE POLICY "Allow anonymous read access" 
ON public.vendors 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.vendors;
CREATE POLICY "Allow anonymous insert access" 
ON public.vendors 
FOR INSERT 
WITH CHECK (true);

-- =========================================================================
-- 6. Seed Data: Authentic Street Artisans, Heritage Stalls & Micro-Vendors
-- Coordinated around Demo Hubs (Chandni Chowk Cultural Heritage & Tech Corridor)
-- =========================================================================

INSERT INTO public.vendors (id, name, category, description, lat, lng, verified_badge)
VALUES
  -- Demo Cluster A: Heritage Quarter (Coords ~ 28.6506, 77.2309 / 30.1337, 77.3000)
  ('e1a10001-0000-4000-a000-000000000001', 'Ustadji Handcrafted Brass Jalebi', 'Food', 'Third-generation sweet maker churning saffron jalebis in pure desi ghee over charcoal embers.', 28.6508, 77.2312, true),
  ('e1a10002-0000-4000-a000-000000000002', 'Punditji Masala Chai & Clay Kulhads', 'Food', 'Crushed fresh ginger and cardamon slow-brewed tea served in artisan-crafted terracotta cups.', 28.6502, 77.2305, true),
  ('e1a10003-0000-4000-a000-000000000003', 'Noor Zari & Hand-Embroidered Stoles', 'Craft', 'Master zardozi artisan creating metallic thread embroidery using 200-year-old family wooden needles.', 28.6515, 77.2318, true),
  ('e1a10004-0000-4000-a000-000000000004', 'Dharampura Copper & Brass Heirlooms', 'Heritage', 'Restored vintage brass lamps, hand-beaten spice grinders, and heirloom water vessels.', 28.6498, 77.2299, true),
  ('e1a10005-0000-4000-a000-000000000005', 'Ram Prasad Clay Pottery & Diya Guild', 'Craft', 'Hand-turned terracotta planters, terracotta cookware, and festive oil lamps thrown live on a manual wheel.', 28.6511, 77.2301, true),
  
  -- Demo Cluster B: Rules.md Demo Zone (30.1337, 77.3000)
  ('f2b20001-0000-4000-b000-000000000001', 'Shyam Lal Handcrafted Bamboo Flutes', 'Craft', 'Seasoned bamboo bansuri craftsman tuning pitch-perfect folk flutes right on the cobblestone walkway.', 30.1339, 77.3002, true),
  ('f2b20002-0000-4000-b000-000000000002', 'Kashi Kulfi & Rabri Falooda Cart', 'Food', 'Chilled rose-syrup falooda with dense slow-churned clotted cream served on dried sal leaf bowls.', 30.1335, 77.2996, true),
  ('f2b20003-0000-4000-b000-000000000003', 'Gurudev Wooden Block Prints', 'Heritage', 'Original teakwood stamp prints using vegetable indigo and turmeric dyes on organic khadi cotton.', 30.1342, 77.3006, true)
ON CONFLICT (id) DO NOTHING;
