/**
 * Supabase Client & Resilient Data Layer
 * Handles live Supabase PostgreSQL connections with automatic zero-config fallback
 * for seamless indoor Hackathon Demo Mode evaluations.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your_supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Track schema state to prevent repetitive 404 console spam
let isSchemaCacheMissing = false;
let hasLoggedSchemaWarning = false;

// Initial high-fidelity seed vendors for Hackathon Demo & Offline evaluation
export const DEFAULT_VENDORS = [
  // Demo Cluster A: Rules.md GPS Coords (30.1337, 77.3000)
  {
    id: 'f2b20001-0000-4000-b000-000000000001',
    name: 'Shyam Lal Handcrafted Bamboo Flutes',
    category: 'Craft',
    description: 'Seasoned bansuri craftsman hand-carving and acoustic-tuning folk flutes right on the cobblestones.',
    lat: 30.1339,
    lng: 77.3002,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'f2b20002-0000-4000-b000-000000000002',
    name: 'Kashi Kulfi & Rabri Falooda Cart',
    category: 'Food',
    description: 'Chilled organic rose-syrup falooda with dense slow-churned clotted cream served on dried sal leaves.',
    lat: 30.1335,
    lng: 77.2996,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'f2b20003-0000-4000-b000-000000000003',
    name: 'Gurudev Wooden Block Prints',
    category: 'Heritage',
    description: 'Original teakwood stamp prints using vegetable indigo and turmeric dyes on organic khadi cotton.',
    lat: 30.1342,
    lng: 77.3006,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  // Demo Cluster B: Cultural Heritage Corridor (28.6506, 77.2309)
  {
    id: 'e1a10001-0000-4000-a000-000000000001',
    name: 'Ustadji Handcrafted Brass Jalebi',
    category: 'Food',
    description: 'Third-generation sweet master churning saffron jalebis in pure desi ghee over charcoal embers.',
    lat: 28.6508,
    lng: 77.2312,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e1a10002-0000-4000-a000-000000000002',
    name: 'Punditji Masala Chai & Clay Kulhads',
    category: 'Food',
    description: 'Crushed ginger and cardamon slow-simmered tea served in artisan-crafted porous clay cups.',
    lat: 28.6502,
    lng: 77.2305,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e1a10003-0000-4000-a000-000000000003',
    name: 'Noor Zari & Hand-Embroidered Stoles',
    category: 'Craft',
    description: 'Master zardozi artisan weaving metallic thread embroidery using heirloom family wooden needles.',
    lat: 28.6515,
    lng: 77.2318,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e1a10004-0000-4000-a000-000000000004',
    name: 'Dharampura Copper & Brass Heirlooms',
    category: 'Heritage',
    description: 'Restored vintage brass lanterns, hand-beaten spice grinders, and heirloom water vessels.',
    lat: 28.6498,
    lng: 77.2299,
    verified_badge: true,
    created_at: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'LOCALLENS_CUSTOM_VENDORS';

/**
 * Fetch all vendors from Supabase or fallback mock storage
 * Quietly catches 404 schema cache errors to prevent console spam.
 * @returns {Promise<Array>}
 */
export async function fetchVendors() {
  let customVendors = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) customVendors = JSON.parse(raw);
  } catch (err) {
    // Quiet handling
  }

  // If table is known to be missing from remote project, return mock directly
  if (isSchemaCacheMissing) {
    return [...customVendors, ...DEFAULT_VENDORS];
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Quiet single notification for uninitialized Supabase projects
        if (!hasLoggedSchemaWarning) {
          hasLoggedSchemaWarning = true;
          isSchemaCacheMissing = true;
          console.info(
            "LocalLens V2 Data Layer: 'public.vendors' table not initialized in remote Supabase schema cache. Seamlessly using verified offline dataset. (Run supabase/schema.sql in your Supabase SQL editor to sync live database)"
          );
        }
        return [...customVendors, ...DEFAULT_VENDORS];
      }

      if (data && data.length > 0) {
        return [...customVendors, ...data];
      }
    } catch (err) {
      if (!hasLoggedSchemaWarning) {
        hasLoggedSchemaWarning = true;
        isSchemaCacheMissing = true;
        console.info('LocalLens V2: Supabase connection unavailable, using offline dataset.');
      }
    }
  }

  return [...customVendors, ...DEFAULT_VENDORS];
}

/**
 * Inserts a newly onboarded artisan into Supabase or local state
 * @param {Object} vendor
 * @returns {Promise<{ success: boolean, vendor: Object }>}
 */
export async function insertVendor(vendor) {
  const newVendor = {
    id: `artisan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: vendor.name,
    category: vendor.category || 'Craft',
    description: vendor.description,
    lat: Number(vendor.lat),
    lng: Number(vendor.lng),
    verified_badge: true,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase && !isSchemaCacheMissing) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([
          {
            name: newVendor.name,
            category: newVendor.category,
            description: newVendor.description,
            lat: newVendor.lat,
            lng: newVendor.lng,
            verified_badge: true,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return { success: true, vendor: data };
      }
    } catch (err) {
      // Fall through to local persistence
    }
  }

  // Fallback: Save to LocalStorage so demo reflects changes immediately
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(newVendor);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('LocalStorage persist error:', err);
  }

  return { success: true, vendor: newVendor };
}
