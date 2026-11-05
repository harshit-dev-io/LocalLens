\# master_context.md
# SYSTEM CONTEXT: LOCALLENS V2
Target Agent: Antigravity (Code Generation)
Role: Principal Architecture & UX/UI Blueprint

## 1. Executive Summary
LocalLens V2 is a Two-Sided Hyper-Local Context Engine built as a web-first Progressive Web App (React/Vite). It solves the "empty map" problem of local tourism by bridging digital AI with hyper-local physical commerce.

To eliminate AI hallucination, LocalLens V2 uses a Mini-RAG (Retrieval-Augmented Generation) Architecture. The client fetches verified vendors from a Supabase database within a 500m radius using Haversine distance and injects them into the Gemini 2.5 Flash prompt alongside the user's photo. Gemini synthesizes the cultural context and routes the user only to verified local micro-entrepreneurs.

## 2. Dependencies & Environment
- Runtime: React 18+ (Vite)
- Styling: Tailwind CSS (Glassmorphism: backdrop-blur-md, bg-white/70, dark:bg-zinc-900/60, border-white/20)
- Icons: `lucide-react`
- Maps: `leaflet`, `react-leaflet` (Fix marker icons via L.Icon.Default overrides)
- Database: `@supabase/supabase-js`
- AI SDK: `@google/generative-ai`

Environment Variables:
- `VITE_GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. Database Schema (Supabase PostgreSQL)
Table Name: `vendors`
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `name`: text (Not Null)
- `category`: text (Not Null: e.g., 'Heritage Food', 'Handicraft', 'Street Art', 'Traditional Tea')
- `description`: text (Not Null)
- `lat`: float8 (Not Null)
- `lng`: float8 (Not Null)
- `verified_badge`: boolean (default: true)
- `created_at`: timestamptz (default: `now()`)

## 4. Core API & Data Flow

### Flow A: Tourist Mode (Snap to Explore)
1. Capture: User triggers `<input type="file" capture="environment" accept="image/*" />`.
2. Compress: Client draws image to HTML5 `<canvas>`, downscales to max width/height 800px, quality 0.7 JPEG (target <100KB).
3. Geolocation: `navigator.geolocation.getCurrentPosition` or Fallback/Demo coordinates (`lat: 30.1337, lng: 77.3000`).
4. Grounding (Mini-RAG): Query `vendors` table from Supabase. Compute Haversine distance on client; retain vendors <= 500m (or nearest 5).
5. AI Synthesis: Call Gemini 2.5 Flash with image base64, location, and the vendor array.
6. Execution: Parse JSON response, render the glassmorphic `AiResponseCard`, trigger Web Speech API (`window.speechSynthesis`), and pan Leaflet map.

### Flow B: Artisan Mode (Snap to Onboard)
1. Capture & Compress: Same canvas pipeline.
2. Extraction: Gemini analyzes street cart photo and extracts vendor profile.
3. Database Insert: Inserts row directly into Supabase `vendors` table and optimistically updates local map state.

## 5. Gemini API Prompts & Strict JSON Schemas

### Tourist Exploration Prompt:
"You are LocalLens, a hyper-local cultural guide. Analyze the provided image and user coordinates [LAT, LNG].
1. Provide a concise, engaging 2-sentence cultural or historical story of the visible landmark/street setting.
2. Choose up to 2 vendor IDs from this verified local vendors list that best complement this visit: [VENDORS_JSON].
Respond strictly with valid JSON. Do not include markdown codeblocks or prose outside the JSON:
{
  \"context\": \"2-sentence story here.\",
  \"vendor_ids\": [\"uuid-1\", \"uuid-2\"]
}"

### Artisan Onboarding Prompt:
"You are a local business cataloger. Analyze the provided image of a local artisan or street cart. 
Infer:
1. Stall name (or a descriptive title if unbranded, e.g., 'Verma Traditional Clay Pottery').
2. Category ('Heritage Food', 'Handicrafts', 'Textiles', or 'Local Produce').
3. A compelling 1-2 sentence description highlighting authentic craftsmanship or recipes.
Respond strictly with valid JSON:
{
  \"name\": \"Vendor Name\",
  \"category\": \"Category\",
  \"description\": \"1-2 sentence description\"
}"

## 6. Judge-Proof Demo Dataset
Coordinates: `lat: 30.1337, lng: 77.3000`
Preloaded Vendors:
1. id: "demo-v1", name: "Chacha's Heritage Masala Chai", category: "Traditional Tea", description: "Brewing slow-simmered spiced tea with freshly crushed cardamom since 1974.", lat: 30.1345, lng: 77.3012
2. id: "demo-v2", name: "Gupta Handloom & Khadi Weavers", category: "Handicraft", description: "Authentic hand-spun cotton stoles and regional terracotta artifacts.", lat: 30.1329, lng: 77.2988