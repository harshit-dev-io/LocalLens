-- =========================================================================
-- LocalLens V2: Supabase PostgreSQL Schema & Seed Migration
-- =========================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create the 'vendors' table
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  description text not null,
  lat float8 not null,
  lng float8 not null,
  verified_badge boolean default true,
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.vendors enable row level security;

-- 4. Policies: Allow public anonymous reads and inserts for hackathon demo
drop policy if exists "Allow public read" on public.vendors;
create policy "Allow public read" on public.vendors for select using (true);

drop policy if exists "Allow public insert" on public.vendors;
create policy "Allow public insert" on public.vendors for insert with check (true);

-- 5. Geospatial Indexes
create index if not exists idx_vendors_coords on public.vendors (lat, lng);
create index if not exists idx_vendors_category on public.vendors (category);

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';

-- =========================================================================
-- 7. Seed Data: Authentic Street Artisans, Heritage Stalls & Micro-Vendors
-- =========================================================================

insert into public.vendors (id, name, category, description, lat, lng, verified_badge)
values
  -- Demo Cluster A: Rules.md GPS Coords (30.1337, 77.3000)
  ('f2b20001-0000-4000-b000-000000000001', 'Shyam Lal Handcrafted Bamboo Flutes', 'Craft', 'Seasoned bansuri craftsman hand-carving and acoustic-tuning folk flutes right on the cobblestones.', 30.1339, 77.3002, true),
  ('f2b20002-0000-4000-b000-000000000002', 'Kashi Kulfi & Rabri Falooda Cart', 'Food', 'Chilled organic rose-syrup falooda with dense slow-churned clotted cream served on dried sal leaves.', 30.1335, 77.2996, true),
  ('f2b20003-0000-4000-b000-000000000003', 'Gurudev Wooden Block Prints', 'Heritage', 'Original teakwood stamp prints using vegetable indigo and turmeric dyes on organic khadi cotton.', 30.1342, 77.3006, true),
  
  -- Demo Cluster B: Cultural Heritage Corridor (28.6506, 77.2309)
  ('e1a10001-0000-4000-a000-000000000001', 'Ustadji Handcrafted Brass Jalebi', 'Food', 'Third-generation sweet master churning saffron jalebis in pure desi ghee over charcoal embers.', 28.6508, 77.2312, true),
  ('e1a10002-0000-4000-a000-000000000002', 'Punditji Masala Chai & Clay Kulhads', 'Food', 'Crushed ginger and cardamon slow-simmered tea served in artisan-crafted porous clay cups.', 28.6502, 77.2305, true),
  ('e1a10003-0000-4000-a000-000000000003', 'Noor Zari & Hand-Embroidered Stoles', 'Craft', 'Master zardozi artisan weaving metallic thread embroidery using heirloom family wooden needles.', 28.6515, 77.2318, true),
  ('e1a10004-0000-4000-a000-000000000004', 'Dharampura Copper & Brass Heirlooms', 'Heritage', 'Restored vintage brass lanterns, hand-beaten spice grinders, and heirloom water vessels.', 28.6498, 77.2299, true)
on conflict (id) do nothing;
