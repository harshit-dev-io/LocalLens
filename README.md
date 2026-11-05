# 🌐 LocalLens (Heritage Edition)

> **The Two-Sided Hyper-Local Context Engine: Bridging Digital Multimodal AI with Physical Micro-Commerce.**

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Glassmorphism-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Interactive_Maps-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)

---

## 💡 The Problem & Mission

Every year, millions of travelers wander through historic alleys, bustling spice markets, and ancient squares. Yet, they face the **"Empty Map Paradox"**:
- Traditional map apps prioritize registered commercial chains, corporate retail, and ad-paying venues.
- The true cultural heartbeat of a city—the third-generation brass artisan, the clay kulhad tea maker, the heritage wooden block printer—remains completely invisible digitally.
- When tourists turn to LLMs to ask *"What's around me?"*, standard AI chatbots routinely hallucinate phantom stores, closed shops, or generic tourist traps.
- Travelers often fear the arbitrary **"tourist tax"** due to lack of transparent pricing.

**LocalLens solves these fundamental frictions.** By pairing a **Mini-RAG (Retrieval-Augmented Generation)** architecture with crowdsourced **Proof-of-Presence** and an automated **Fair Price Index**, LocalLens provides travelers with a trusted, hallucination-free cultural guide while giving street micro-artisans a digital shopfront.

---

## 🏛️ Core Architectural Engines

### 1. 🧭 Explore Mode & Multi-Stage Atmospheric Scanning HUD
- **Optical Contour Compression**: Off-screen HTML5 Canvas downscales photos to max 800px width at 0.7 JPEG quality in <50ms (`<100KB`).
- **Interactive Scanning HUD**: An atmospheric frosted radar scanner guides the user across 3 progressive phases:
  1. *Stage 1 (0–300ms)*: Compressing optical contours (Canvas 800px)...
  2. *Stage 2 (300–800ms)*: Querying verified artisan registry (500m radius)...
  3. *Stage 3 (800–2000ms)*: Synthesizing cultural backstory & walking trail...
- **Cultural Audio Synthesis**: Native Web Speech API audio narration transforms the device into an instant museum-grade audio tour guide.

### 2. ⏳ Dynamic Ephemeral TTL & Crowdsourced "Ping Check"
- Micro-vendors are inherently mobile. To eliminate phantom listings:
  - Vendors track `last_seen_at` and `freshness_score`.
  - If a stall hasn't been verified in >12 hours, an amber badge warns: `Unconfirmed Today`.
  - When an explorer walks within **50 meters** of a stall, an interactive 1-tap card appears:
    *"Is this artisan here right now? [Yes (Confirm)] • [Moved / Closed]"*
  - Tapping **Yes** resets `last_seen_at = now()`, awards +10 to `freshness_score`, and updates the spatial pin in real time.

### 3. ⚖️ Digital Shopfront & "Fair Price Index" Engine
- **Menu OCR & Structured Extraction**: In Partner Portal, artisans or community contributors snap photos of blackboards, slates, or paper price lists. Gemini Multimodal OCR extracts items, quantities, and numeric prices into structured JSON.
- **Grounded Benchmark Audit**: Extracted prices are evaluated against authenticated regional thresholds (beverages ₹15–₹40, snacks ₹20–₹80, crafts ₹40–₹350).
- **Fair Price Verified Badge**: Qualifying stalls earn `⚖️ Fair Price Verified (Local Standard)`, displayed prominently on their card to eliminate tourist overcharging fears.

### 4. 📍 "Proof-of-Presence" Community Trust Loop
- Prevents fake online reviews and bot manipulation:
  - Users can only submit an **Experience Pulse** rating (*Master Craft*, *Authentic Heritage*, *Fair Price*) if their live device coordinates are mathematically verified within **50 meters** of the vendor coordinates via spherical Haversine distance.
  - Verified reviews dynamically increment `community_trust_score` and Leaflet pin prominence.

---

## 🛠️ Tech Stack & Implementation Details

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite** | Blazing-fast HMR, sub-second production builds, modular JSX architecture. |
| **Styling & UI** | **Tailwind CSS + Glassmorphism** | Claude-style warm charcoal canvas (`#0D0D0C`), terracotta & amber accents, ambient radial glows, and frosted glass. |
| **Multimodal AI** | **Google Gemini (1.5 Flash / 2.0 Flash)** | Visual scene analysis, menu OCR extraction, and resilient multi-model failover. |
| **Database & Spatial Backend** | **Supabase (PostgreSQL)** | RLS-secured geospatial catalog with TTL freshness tracking and public anonymous ping policies. |
| **Mapping Engine** | **Leaflet.js + OpenStreetMap** | Public OSM tiles with custom warm-charcoal CSS filter (zero API watermarks), custom SVG DivIcons & walking routes. |
| **Image Compression** | **HTML5 Canvas API** | In-browser downscaling reducing raw camera shots to `< 100KB` in <50ms. |
| **Audio Tour Guide** | **Web Speech API** | Zero-latency native text-to-speech narration with interactive soundwave feedback. |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/LocalLens.git
cd LocalLens
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your keys (or launch directly in offline fallback mode):
```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=AIzaSy...

# Supabase Project Credentials (Optional - built-in local store available)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Setup Supabase Spatial Schema (Optional)
Run `supabase/schema.sql` in your Supabase SQL Editor to initialize the `vendors` table with TTL and Proof-of-Presence fields.

### 5. Launch Development Server
```bash
npm run dev
```

### 6. Production Build
```bash
npm run build
npm run preview
```

---

## 📂 Project Directory Structure

```text
LocalLens/
├── public/
│   ├── favicon.svg            # Custom terracotta & amber lens emblem
│   └── manifest.json          # PWA web manifest
├── src/
│   ├── components/
│   │   ├── AiResponseCard.jsx # Cultural story & Web Speech API narration
│   │   ├── ApiKeyModal.jsx    # In-browser engine configuration modal
│   │   ├── ArtisanModal.jsx   # Partner Portal (dual snap stall & menu OCR)
│   │   ├── CameraCapture.jsx  # Optical camera input & canvas compressor
│   │   ├── Header.jsx         # Minimalist floating glass navbar with ambient location
│   │   ├── MapContext.jsx     # Leaflet map with dark OSM filter & amber pins
│   │   ├── ScannerOverlay.jsx # Multi-stage atmospheric scanning HUD (0–2000ms)
│   │   └── VendorCard.jsx     # Glassmorphic card with Fair Price, TTL & Ping Check
│   ├── data/
│   │   └── demoScene.js       # Calibrated binary image & coordinates
│   ├── utils/
│   │   ├── gemini.js          # Multimodal client, model failover & safe JSON parser
│   │   ├── haversine.js       # Spherical distance, 50m Proof-of-Presence & walking time
│   │   ├── imageCompressor.js # Canvas downscaler (<100KB, 800px, 0.7 JPEG)
│   │   ├── priceAuditor.js    # Grounded regional benchmark & Fair Price Index auditor
│   │   ├── speech.js          # Native Web Speech API audio controller
│   │   └── supabaseClient.js  # Supabase client with TTL ping checks & offline registry
│   ├── App.jsx                # Master orchestrator
│   ├── index.css              # Warm canvas, editorial map filter & typography
│   └── main.jsx               # Entry point
├── supabase/
│   └── schema.sql             # Spatial schema, RLS policies & seed data
├── tailwind.config.js         # Claude warm palette, glows & shadows
├── vite.config.js             # Vite configuration
└── README.md                  # Documentation
```

---

## 👥 Acknowledgments
Built with ❤️ for cultural heritage preservation and fair local commerce. Dedicated to the millions of street micro-entrepreneurs worldwide.
