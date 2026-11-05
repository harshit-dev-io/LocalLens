-- =========================================================================
-- LocalLens: Consumer Travel Platform Schema & Spatial Registry
-- =========================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create the 'vendors' table with TTL, Fair Price, and Trust Scores
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  description text not null,
  lat float8 not null,
  lng float8 not null,
  verified_badge boolean default true,
  is_active boolean default true,
  freshness_score int default 100,
  last_seen_at timestamptz default now(),
  community_trust_score int default 95,
  is_fair_price_verified boolean default true,
  menu_items jsonb default '[]'::jsonb,
  experience_pulses text[] default array['Authentic Heritage', 'Master Craft'],
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.vendors enable row level security;

-- 4. Policies: Allow public anonymous reads, inserts, and update pings
drop policy if exists "Allow public read" on public.vendors;
create policy "Allow public read" on public.vendors for select using (true);

drop policy if exists "Allow public insert" on public.vendors;
create policy "Allow public insert" on public.vendors for insert with check (true);

drop policy if exists "Allow public ping updates" on public.vendors;
create policy "Allow public ping updates" on public.vendors for update using (true);

-- 5. Geospatial Indexes
create index if not exists idx_vendors_coords on public.vendors (lat, lng);
create index if not exists idx_vendors_category on public.vendors (category);
create index if not exists idx_vendors_active on public.vendors (is_active);

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';
