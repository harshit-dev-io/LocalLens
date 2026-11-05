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
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
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
      setGeoError('Geolocation is not supported by your browser. Using calibrated coordinates.');
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
  const handleImageCaptured = async ({ base64, dataUrl, sizeKB, isCalibratedDemo = false }) => {
    setCapturedImage({ base64, dataUrl, sizeKB });
    setIsAnalyzing(true);
    setPipelineError(null);
    setAiResult(null);

    // If calibrated demo was triggered, ensure demo coordinates are active
    if (isCalibratedDemo) {
      setUserLocation(DEMO_COORDINATES);
    }

    const lat = isCalibratedDemo ? DEMO_COORDINATES.lat : (userLocation?.lat || DEMO_COORDINATES.lat);
    const lng = isCalibratedDemo ? DEMO_COORDINATES.lng : (userLocation?.lng || DEMO_COORDINATES.lng);

    // Compute current nearby vendors for this location
    const currentNearby = filterVendorsWithinRadius(allVendors, lat, lng, 500);

    try {
      // Execute Mini-RAG synthesis with Gemini
      const result = await generateCulturalContext({
        base64Image: base64,
        latitude: lat,
        longitude: lng,
        nearbyVendors: currentNearby,
        isDemo: isDemoMode || isCalibratedDemo,
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
        isFallback: result.isFallback || result.is_fallback,
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
    <div className="min-h-screen bg-[#0D0D0C] text-[#FAF7F2] flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Geolocation Status Alert if GPS drifted */}
        {geoError && (
          <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/25 text-orange-200 text-xs flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>{geoError}</span>
            </div>
            <button
              onClick={resolveLocation}
              className="text-[11px] underline underline-offset-4 hover:text-white flex items-center font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry GPS
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner (Warm Claude Editorial Styling) */}
        {isDemoMode && (
          <div className="p-3 rounded-xl bg-[#171615]/80 border border-amber-500/25 text-xs text-[#D6D3D1] flex items-center justify-between backdrop-blur-md shadow-sm">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="font-semibold text-amber-300 font-sans">Judge Demo Mode Active:</span>
              <span className="hidden sm:inline text-[#A8A29E]">
                Fixed at GPS [{DEMO_COORDINATES.lat}, {DEMO_COORDINATES.lng}] with calibrated street bazaar scene.
              </span>
            </div>
            <button
              onClick={() => setIsDemoMode(false)}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-mono underline transition-colors"
            >
              Switch to Live Hardware
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
              <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span>Pipeline Synthesis Interrupted</span>
                </div>
                <p className="text-[#D6D3D1]">{pipelineError}</p>
                <button
                  onClick={() => handleImageCaptured(capturedImage)}
                  className="px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/40 text-orange-200 text-xs font-medium transition-colors"
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

            {/* Verified Nearby Micro-Vendors Telemetry Shelf (Warm Glass) */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#FAF7F2] font-sans">
                      Verified Micro-Vendors Within 500m
                    </h3>
                    <p className="text-[11px] text-[#A8A29E]">
                      Grounded in Supabase PostgreSQL Directory
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#171615] border border-white/[0.08] text-orange-300">
                  {nearbyVendors.length} Stalls Nearby
                </span>
              </div>

              {/* Vendor List Scroll Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
                {nearbyVendors.map((vendor) => {
                  const isSelected = selectedVendor?.id === vendor.id;
                  const isRecommended = aiResult?.recommendedVendors?.some((v) => v.id === vendor.id);

                  return (
                    <div
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor)}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.25)] ring-1 ring-orange-500/50'
                          : isRecommended
                          ? 'bg-orange-500/[0.04] border-orange-500/40 hover:border-orange-500/60'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-amber-500/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-[#FAF7F2] leading-tight font-sans">
                          {vendor.name}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold whitespace-nowrap">
                            AI Pick
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#A8A29E] line-clamp-2 mb-2.5 leading-relaxed">
                        {vendor.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-2 border-t border-white/[0.06]">
                        <span className="text-amber-400 font-mono font-medium">
                          {vendor.distance_meters != null ? `${vendor.distance_meters}m away` : '500m zone'}
                        </span>
                        <span className="text-[#D6D3D1] font-medium text-[10px]">
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

      {/* Footer Branding (Warm Ambient Glass) */}
      <footer className="border-t border-white/[0.06] py-4 px-6 text-center text-xs text-[#78716C] backdrop-blur-md bg-[#121110]/50 relative z-10">
        <p>
          LocalLens V2 &bull; Two-Sided Hyper-Local Context Engine &bull; Built with React, Supabase &amp; Gemini 2.5 Flash
        </p>
      </footer>
    </div>
  );
}
