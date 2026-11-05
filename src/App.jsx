import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CameraCapture from './components/CameraCapture';
import AiResponseCard from './components/AiResponseCard';
import MapContext from './components/MapContext';
import ArtisanModal from './components/ArtisanModal';
import ApiKeyModal from './components/ApiKeyModal';
import ScannerOverlay from './components/ScannerOverlay';
import VendorCard from './components/VendorCard';
import ShopDetailModal from './components/ShopDetailModal';
import { filterVendorsWithinRadius } from './utils/haversine';
import { generateCulturalContext } from './utils/gemini';
import {
  fetchVendors,
  confirmVendorPing,
  submitExperiencePulse,
} from './utils/supabaseClient';
import {
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Navigation,
  ArrowUpDown,
  Compass,
} from 'lucide-react';

const CALIBRATED_COORDINATES = {
  lat: 30.1337,
  lng: 77.3000,
};

export default function App() {
  // Navigation & Platform States
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'partner'
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Shop Detail Modal State
  const [detailVendor, setDetailVendor] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  // Geospatial & Vendor Data States
  const [userLocation, setUserLocation] = useState(CALIBRATED_COORDINATES);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [allVendors, setAllVendors] = useState([]);
  const [nearbyVendors, setNearbyVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Search & Filter UX States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'trust' | 'fairPrice'

  // Capture & AI Pipeline States
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);

  // AI Response Results
  const [aiResult, setAiResult] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // 1. Acquire Device Coordinates
  const resolveLocation = useCallback(() => {
    setIsCalibrating(true);
    if (!navigator.geolocation) {
      setUserLocation(CALIBRATED_COORDINATES);
      setIsCalibrating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsCalibrating(false);
      },
      (err) => {
        setUserLocation(CALIBRATED_COORDINATES);
        setIsCalibrating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  // 2. Fetch Stalls from Supabase / Resilient Data Layer
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

  // 3. Filter Stalls within 500m radius
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

    if (isCalibratedDemo) {
      setUserLocation(CALIBRATED_COORDINATES);
    }

    const lat = isCalibratedDemo ? CALIBRATED_COORDINATES.lat : (userLocation?.lat || CALIBRATED_COORDINATES.lat);
    const lng = isCalibratedDemo ? CALIBRATED_COORDINATES.lng : (userLocation?.lng || CALIBRATED_COORDINATES.lng);

    const currentNearby = filterVendorsWithinRadius(allVendors, lat, lng, 500);

    try {
      const result = await generateCulturalContext({
        base64Image: base64,
        latitude: lat,
        longitude: lng,
        nearbyVendors: currentNearby,
        isDemo: isCalibratedDemo,
      });

      const recommended = currentNearby.filter((v) =>
        result.vendor_ids?.includes(v.id)
      );

      const finalVendors = recommended.length > 0 ? recommended : currentNearby.slice(0, 2);

      setAiResult({
        context: result.context,
        recommendedVendors: finalVendors,
        groundedVendorsCount: currentNearby.length,
        isFallback: result.isFallback || result.is_fallback,
      });

      if (finalVendors.length > 0) {
        setSelectedVendor(finalVendors[0]);
      }
      showToast('✨ Cultural backstory synthesized! 2 stops recommended.');
    } catch (err) {
      console.error('Synthesis error:', err);
      setPipelineError('Exploration could not be completed. Please try another shot.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 5. Locate Stall on Map (Scroll + FlyTo)
  const handleLocateVendor = (vendor) => {
    setSelectedVendor(vendor);
    const mapElement = document.getElementById('map-viewport');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast(`📍 Focused on ${vendor.name} • Walking trail highlighted`);
  };

  // 6. Open Shop Detail Modal Popup
  const handleOpenVendorDetail = (vendor) => {
    setDetailVendor(vendor);
    setIsDetailModalOpen(true);
  };

  // 7. Crowdsourced Ping Check
  const handlePingConfirm = async (vendorId, isPresent) => {
    const res = await confirmVendorPing(vendorId, isPresent);
    if (res.success && res.vendor) {
      setAllVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, ...res.vendor } : v))
      );
      if (detailVendor?.id === vendorId) {
        setDetailVendor((prev) => ({ ...prev, ...res.vendor }));
      }
      showToast(
        isPresent
          ? '✓ Presence confirmed! +10 Freshness added to registry.'
          : 'Status reported to local community ledger.'
      );
    }
  };

  // 8. Proof-of-Presence Experience Pulse
  const handleAddPulse = async (vendorId, pulseTag) => {
    const res = await submitExperiencePulse(vendorId, pulseTag);
    if (res.success && res.vendor) {
      setAllVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, ...res.vendor } : v))
      );
      if (detailVendor?.id === vendorId) {
        setDetailVendor((prev) => ({ ...prev, ...res.vendor }));
      }
      showToast(`✓ Verified community pulse "+${pulseTag}" recorded!`);
    }
  };

  // 9. Handle New Artisan Onboarded
  const handleVendorAdded = (newVendor) => {
    setAllVendors((prev) => [newVendor, ...prev]);
    setSelectedVendor(newVendor);
    showToast(`🎉 "${newVendor.name}" successfully published to spatial registry!`);
  };

  // Search, Filter, and Sort logic
  const filteredAndSortedStalls = nearbyVendors
    .filter((v) => {
      // Category filter
      if (selectedCategory !== 'ALL' && v.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Search query filter (matches name, description, or menu item)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = v.name?.toLowerCase().includes(query);
        const matchesDesc = v.description?.toLowerCase().includes(query);
        const matchesMenu = v.menu_items?.some((item) => item.name?.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesMenu;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'trust') {
        return (b.community_trust_score || 0) - (a.community_trust_score || 0);
      }
      if (sortBy === 'fairPrice') {
        return (b.is_fair_price_verified ? 1 : 0) - (a.is_fair_price_verified ? 1 : 0);
      }
      // Default: nearest first
      return (a.distance_meters || 0) - (b.distance_meters || 0);
    });

  return (
    <div className="min-h-screen bg-[#0D0D0C] text-[#FAF7F2] flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-[#171615]/95 border border-orange-500/40 text-[#FAF7F2] px-4 py-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-bounce-subtle text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Floating Glass Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userLocation={userLocation}
        isCalibrating={isCalibrating}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Atmospheric Multi-Stage Scanning HUD */}
      <ScannerOverlay
        isOpen={isAnalyzing}
        imagePreview={capturedImage?.dataUrl}
        onCancel={() => setIsAnalyzing(false)}
      />

      {/* Shop Detail Modal Popup (Shows Menu, Ratings, Freshness & Ping Check) */}
      <ShopDetailModal
        vendor={detailVendor}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        userLocation={userLocation}
        onLocateOnMap={handleLocateVendor}
        onPingConfirm={handlePingConfirm}
        onAddPulse={handleAddPulse}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Camera Optical Scanner */}
            <CameraCapture
              mode={activeTab}
              isLoading={isAnalyzing}
              isDemoMode={false}
              onImageCaptured={handleImageCaptured}
            />

            {/* Error Notification */}
            {pipelineError && (
              <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs space-y-2">
                <p className="font-semibold text-orange-300">Exploration Interrupted</p>
                <p className="text-[#D6D3D1]">{pipelineError}</p>
                <button
                  onClick={() => handleImageCaptured(capturedImage)}
                  className="px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/40 text-orange-200 text-xs font-medium transition-colors"
                >
                  Retry Exploration
                </button>
              </div>
            )}

            {/* Cultural Narrative & Recommended Stops */}
            {aiResult && !isAnalyzing && (
              <AiResponseCard
                culturalStory={aiResult.context}
                recommendedVendors={aiResult.recommendedVendors}
                groundedVendorsCount={aiResult.groundedVendorsCount}
                userLocation={userLocation}
                selectedVendorId={selectedVendor?.id}
                onSelectVendor={(v) => setSelectedVendor(v)}
                onLocateVendor={handleLocateVendor}
                onOpenVendorDetail={handleOpenVendorDetail}
                onPingConfirm={handlePingConfirm}
                onAddPulse={handleAddPulse}
              />
            )}
          </div>

          {/* Right Column (7 Cols): Hyper-Local Interactive Map & Verified Directory */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Leaflet Map Context */}
            <MapContext
              userLocation={userLocation}
              vendors={filteredAndSortedStalls}
              highlightedVendorIds={aiResult?.recommendedVendors?.map((v) => v.id) || []}
              selectedVendor={selectedVendor}
              onSelectVendor={(v) => setSelectedVendor(v)}
              onOpenVendorDetail={handleOpenVendorDetail}
            />

            {/* Verified Artisan Directory Shelf */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 space-y-4">
              {/* Directory Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#FAF7F2] font-sans">
                      Verified Micro-Artisans Within 500m
                    </h3>
                    <p className="text-[11px] text-[#A8A29E]">
                      Tap any card to view digital shopfront, menu &amp; ratings
                    </p>
                  </div>
                </div>

                {/* Stalls Count */}
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#171615] border border-white/[0.08] text-amber-300 self-start sm:self-auto">
                  {filteredAndSortedStalls.length} Stalls Active
                </span>
              </div>

              {/* Enhanced Search & Sort Controls (Elevated UX) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, tea, jalebi, flute, silk..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#171615] border border-white/[0.08] text-[#FAF7F2] placeholder-[#78716C] text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[10px] text-[#A8A29E] hover:text-[#FAF7F2] absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex items-center space-x-1 bg-[#171615] p-1 rounded-xl border border-white/[0.06] text-xs">
                  {['ALL', 'Food', 'Craft', 'Heritage'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'text-[#A8A29E] hover:text-[#FAF7F2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort Filter Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-[#171615] border border-white/[0.08] text-[#D6D3D1] text-xs focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="nearest">Distance: Nearest</option>
                  <option value="trust">Trust Index: High</option>
                  <option value="fairPrice">Fair Price Certified</option>
                </select>
              </div>

              {/* Vendor Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 pt-1">
                {filteredAndSortedStalls.length === 0 ? (
                  <div className="col-span-2 py-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-[#FAF7F2]">No matching stalls found</p>
                    <p className="text-xs text-[#A8A29E]">
                      Try clearing your search term or switching category filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('ALL');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#262422] text-xs text-orange-300 hover:text-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredAndSortedStalls.map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      userLocation={userLocation}
                      isSelected={selectedVendor?.id === vendor.id}
                      onSelect={() => handleOpenVendorDetail(vendor)}
                      onLocate={handleLocateVendor}
                      onPingConfirm={handlePingConfirm}
                      onAddPulse={handleAddPulse}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Community Partner Portal Modal */}
      <ArtisanModal
        isOpen={activeTab === 'partner'}
        onClose={() => setActiveTab('explore')}
        userLocation={userLocation}
        isDemoMode={false}
        onVendorAdded={handleVendorAdded}
      />

      {/* Key / Credentials Config Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />

      {/* Editorial Footer */}
      <footer className="border-t border-white/[0.06] py-5 px-6 text-center text-xs text-[#78716C] backdrop-blur-md bg-[#121110]/50 relative z-10">
        <p>
          LocalLens &bull; Two-Sided Hyper-Local Context Engine &bull; Heritage Edition &bull; Grounded in Community Trust
        </p>
      </footer>
    </div>
  );
}
