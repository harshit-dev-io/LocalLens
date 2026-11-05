import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CameraCapture from './components/CameraCapture';
import AiResponseCard from './components/AiResponseCard';
import MapContext from './components/MapContext';
import ArtisanModal from './components/ArtisanModal';
import ApiKeyModal from './components/ApiKeyModal';
import SkeletonLoader from './components/SkeletonLoader';
import { filterVendorsWithinRadius } from './utils/haversine';
import { generateCulturalContext } from './utils/gemini';
import { fetchVendors } from './utils/supabaseClient';
import {
  Sparkles,
  MapPin,
  Compass,
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle,
  HelpCircle,
  Store,
} from 'lucide-react';

// Hardcoded coordinates mandated by rules.md for indoor hackathon demo resilience
const DEMO_COORDINATES = {
  lat: 30.1337,
  lng: 77.3000,
};

export default function App() {
  // Navigation & Mode States
  const [activeTab, setActiveTab] = useState('tourist'); // 'tourist' | 'artisan'
  const [isDemoMode, setIsDemoMode] = useState(true); // Default to true so judges experience instant success
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Geospatial & Vendor Data States
  const [userLocation, setUserLocation] = useState(DEMO_COORDINATES);
  const [geoError, setGeoError] = useState(null);
  const [allVendors, setAllVendors] = useState([]);
  const [nearbyVendors, setNearbyVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Capture & AI Pipeline States
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);

  // AI Response Results
  const [aiResult, setAiResult] = useState(null);

  // 1. Acquire User Coordinates (Geolocation API or Demo Mode Bypass)
  const resolveLocation = useCallback(() => {
    if (isDemoMode) {
      setUserLocation(DEMO_COORDINATES);
      setGeoError(null);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Using demo coordinates.');
      setUserLocation(DEMO_COORDINATES);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        console.warn('Geolocation acquisition failed:', err.message);
        setGeoError(`GPS drift or permission denied (${err.message}). Using calibrated demo coordinates.`);
        setUserLocation(DEMO_COORDINATES);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, [isDemoMode]);

  // Synchronize location whenever Demo Mode is toggled
  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  // 2. Fetch Vendors from Supabase (or fallback mock layer)
  const loadVendors = useCallback(async () => {
    try {
      const records = await fetchVendors();
      setAllVendors(records);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // 3. Mini-RAG Retrieval: Filter vendors strictly within 500m using Haversine formula
  useEffect(() => {
    if (userLocation && allVendors.length > 0) {
      const filtered = filterVendorsWithinRadius(allVendors, userLocation.lat, userLocation.lng, 500);
      setNearbyVendors(filtered);
    }
  }, [userLocation, allVendors]);

  // 4. Tourist Mode Pipeline: Handle image capture & run Gemini Mini-RAG synthesis
  const handleImageCaptured = async ({ base64, dataUrl, sizeKB }) => {
    setCapturedImage({ base64, dataUrl, sizeKB });
    setIsAnalyzing(true);
    setPipelineError(null);
    setAiResult(null);

    const lat = userLocation?.lat || DEMO_COORDINATES.lat;
    const lng = userLocation?.lng || DEMO_COORDINATES.lng;

    // Ensure we compute current nearby vendors for this location
    const currentNearby = filterVendorsWithinRadius(allVendors, lat, lng, 500);

    try {
      // Execute Mini-RAG synthesis with Gemini 2.5 Flash
      const result = await generateCulturalContext({
        base64Image: base64,
        latitude: lat,
        longitude: lng,
        nearbyVendors: currentNearby,
        isDemo: isDemoMode,
      });

      // Match returned vendor IDs with actual vendor objects from our grounded database
      const recommended = currentNearby.filter((v) =>
        result.vendor_ids?.includes(v.id)
      );

      // If Gemini returned an ID not in current pool, fall back to first 2 nearby
      const finalVendors = recommended.length > 0 ? recommended : currentNearby.slice(0, 2);

      setAiResult({
        context: result.context,
        recommendedVendors: finalVendors,
        groundedVendorsCount: currentNearby.length,
        isFallback: result.is_fallback,
      });

      // Automatically focus first recommended vendor on map
      if (finalVendors.length > 0) {
        setSelectedVendor(finalVendors[0]);
      }
    } catch (err) {
      console.error('Mini-RAG synthesis pipeline error:', err);
      setPipelineError(err.message || 'AI synthesis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 5. Handle New Artisan Onboarded
  const handleVendorAdded = (newVendor) => {
    setAllVendors((prev) => [newVendor, ...prev]);
    setSelectedVendor(newVendor);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col antialiased selection:bg-brand-500/30 selection:text-brand-300">
      {/* Top Glassmorphic Navigation Bar */}
      <Header
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userLocation={userLocation}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Geolocation Status Alert if GPS drifted */}
        {geoError && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between shadow-glass">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>{geoError}</span>
            </div>
            <button
              onClick={resolveLocation}
              className="text-[11px] underline underline-offset-4 hover:text-white flex items-center font-medium"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry GPS
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="p-3 rounded-xl bg-dark-800/80 border border-amber-500/30 text-xs text-slate-300 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="font-semibold text-amber-300">Judge-Proof Demo Mode Active:</span>
              <span className="hidden sm:inline text-slate-400">
                Fixed at GPS [{DEMO_COORDINATES.lat}, {DEMO_COORDINATES.lng}] with preloaded street bazaar scene.
              </span>
            </div>
            <button
              onClick={() => setIsDemoMode(false)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-mono underline"
            >
              Switch to Live GPS
            </button>
          </div>
        )}

        {/* Grid Layout: Left Column (Capture & AI Card) | Right Column (Interactive Leaflet Map & Telemetry) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols on Large Screens) */}
          <div className="lg:col-span-5 space-y-6">
            {/* HTML5 Camera Capture & Compression Component */}
            <CameraCapture
              mode={activeTab}
              isLoading={isAnalyzing}
              isDemoMode={isDemoMode}
              onImageCaptured={handleImageCaptured}
            />

            {/* Zero Hallucination UI: Shimmer Skeleton Loader while fetching */}
            {isAnalyzing && <SkeletonLoader type="card" />}

            {/* Error Banner */}
            {pipelineError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Pipeline Synthesis Interrupted</span>
                </div>
                <p className="text-slate-400">{pipelineError}</p>
                <button
                  onClick={() => handleImageCaptured(capturedImage)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium"
                >
                  Retry Synthesis
                </button>
              </div>
            )}

            {/* Mini-RAG Cultural Story Card & Recommended Vendors */}
            {aiResult && !isAnalyzing && (
              <AiResponseCard
                culturalStory={aiResult.context}
                recommendedVendors={aiResult.recommendedVendors}
                groundedVendorsCount={aiResult.groundedVendorsCount}
                isFallback={aiResult.isFallback}
                selectedVendorId={selectedVendor?.id}
                onSelectVendor={(v) => setSelectedVendor(v)}
              />
            )}
          </div>

          {/* Right Column (7 Cols on Large Screens): Hyper-Local Map & Stalls Directory */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Leaflet Map Context */}
            <MapContext
              userLocation={userLocation}
              vendors={nearbyVendors}
              highlightedVendorIds={aiResult?.recommendedVendors?.map((v) => v.id) || []}
              selectedVendor={selectedVendor}
              onSelectVendor={(v) => setSelectedVendor(v)}
            />

            {/* Verified Nearby Micro-Vendors Telemetry Shelf */}
            <div className="rounded-2xl bg-dark-800/80 backdrop-blur-xl border border-white/10 p-5 shadow-glass space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Verified Micro-Vendors Within 500m
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Grounded in Supabase PostgreSQL Directory
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-dark-900 border border-white/10 text-brand-300">
                  {nearbyVendors.length} Stalls Nearby
                </span>
              </div>

              {/* Vendor List Scroll Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {nearbyVendors.map((vendor) => {
                  const isSelected = selectedVendor?.id === vendor.id;
                  const isRecommended = aiResult?.recommendedVendors?.some((v) => v.id === vendor.id);

                  return (
                    <div
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor)}
                      className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500 shadow-card-glow'
                          : isRecommended
                          ? 'bg-brand-500/5 border-brand-500/40 hover:border-brand-500/60'
                          : 'bg-dark-900/40 hover:bg-dark-900/80 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white leading-tight">
                          {vendor.name}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold whitespace-nowrap">
                            AI Pick
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                        {vendor.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-white/5">
                        <span className="text-cyan-400 font-mono">
                          {vendor.distance_meters != null ? `${vendor.distance_meters}m away` : '500m zone'}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {vendor.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Artisan Snap-to-Onboard Modal */}
      <ArtisanModal
        isOpen={activeTab === 'artisan'}
        onClose={() => setActiveTab('tourist')}
        userLocation={userLocation}
        isDemoMode={isDemoMode}
        onVendorAdded={handleVendorAdded}
      />

      {/* Gemini & Supabase Settings Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />

      {/* Footer Branding & Hackathon Attribution */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 backdrop-blur-md bg-dark-900/50">
        <p>
          LocalLens V2 &bull; Two-Sided Hyper-Local Context Engine &bull; Built with React, Supabase &amp; Gemini 2.5 Flash
        </p>
      </footer>
    </div>
  );
}
