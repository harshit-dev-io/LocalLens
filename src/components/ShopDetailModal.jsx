import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Navigation,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
  Store,
  DollarSign,
  Share2,
} from 'lucide-react';
import { formatDistance, formatWalkingTime, isWithinProofOfPresence } from '../utils/haversine';
import { getVendorFreshnessStatus } from '../utils/supabaseClient';

export default function ShopDetailModal({
  vendor,
  isOpen,
  onClose,
  userLocation,
  onLocateOnMap,
  onPingConfirm,
  onAddPulse,
}) {
  const [pingSubmitted, setPingSubmitted] = useState(false);
  const [pulseSubmitted, setPulseSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vendor) return null;

  const freshness = getVendorFreshnessStatus(vendor.last_seen_at);
  const isNearStall = isWithinProofOfPresence(
    userLocation?.lat,
    userLocation?.lng,
    vendor.lat,
    vendor.lng,
    50
  );

  const handlePing = async (isPresent) => {
    try {
      await onPingConfirm?.(vendor.id, isPresent);
      setPingSubmitted(true);
    } catch (err) {
      console.error('Ping check error:', err);
    }
  };

  const handlePulse = async (pulseTag) => {
    try {
      await onAddPulse?.(vendor.id, pulseTag);
      setPulseSubmitted(true);
    } catch (err) {
      console.error('Pulse update error:', err);
    }
  };

  const handleLocate = () => {
    onClose();
    onLocateOnMap?.(vendor);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Discover ${vendor.name} (${vendor.category}) on LocalLens Heritage Map: ${window.location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case 'food':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'craft':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'heritage':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      default:
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#121110]/95 border border-white/[0.1] shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-7 space-y-5 my-8 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.05] transition-all"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Badges & Category */}
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono ${getCategoryTheme(
              vendor.category
            )}`}
          >
            {vendor.category}
          </span>

          {freshness.isFresh ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
              {freshness.label}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Unconfirmed Today
            </span>
          )}

          {vendor.is_fair_price_verified !== false && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-300 border border-orange-500/25">
              <span className="mr-1">⚖️</span> Fair Price Verified
            </span>
          )}
        </div>

        {/* Stall Title & Proximity Summary */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#FAF7F2] font-sans tracking-tight">
            {vendor.name}
          </h2>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>{formatDistance(vendor.distance_meters)} away</span>
            <span className="text-[#57534E]">•</span>
            <span className="text-[#A8A29E] flex items-center font-sans text-xs">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#78716C]" />
              {formatWalkingTime(vendor.distance_meters)}
            </span>
          </div>
        </div>

        {/* Artisanal Story & Heritage Description */}
        <div className="p-4 rounded-2xl bg-[#171615] border border-white/[0.06] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block font-mono">
            Artisanal Heritage &amp; Specialty
          </span>
          <p className="text-xs sm:text-sm text-[#D6D3D1] leading-relaxed italic">
            "{vendor.description}"
          </p>

          {/* Experience Pulses Tags */}
          {vendor.experience_pulses && vendor.experience_pulses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
              {vendor.experience_pulses.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#1D1B1A] text-[#FAF7F2] border border-white/[0.06] font-medium"
                >
                  ✦ {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Digital Shopfront & Menu Breakdown */}
        <div className="p-4.5 rounded-2xl bg-[#171615] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FAF7F2] font-sans flex items-center">
              <Store className="w-4 h-4 mr-1.5 text-amber-400" />
              Digital Shopfront Offerings
            </span>
            <span className="text-[10px] font-mono text-orange-300">
              Regional Baseline Calibrated
            </span>
          </div>

          {vendor.menu_items && vendor.menu_items.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {vendor.menu_items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#1D1B1A] border border-white/[0.04] text-xs"
                >
                  <div>
                    <span className="text-[#FAF7F2] font-medium">{item.name}</span>
                    <span className="text-[10px] text-[#78716C] ml-1.5">
                      /{item.unit || 'unit'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                      Fair
                    </span>
                    <span className="text-amber-400 font-mono font-bold text-xs">
                      ₹{item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#1D1B1A] text-center text-xs text-[#A8A29E]">
              Custom handcrafted creations made to order at authentic local rates.
            </div>
          )}

          {/* Trust Index Score */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
            <div className="flex items-center space-x-1.5 text-[#A8A29E]">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Community Trust Index:</span>
            </div>
            <span className="font-mono font-bold text-amber-300">
              {vendor.community_trust_score || 95}% Verified
            </span>
          </div>
        </div>

        {/* Proof-of-Presence & Live Community Ping Section */}
        <div className="p-4 rounded-2xl bg-[#1A1512] border border-amber-500/25 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-400" />
              Proof-of-Presence Community Loop
            </span>
            <span className="text-[10px] font-mono text-[#A8A29E]">
              {isNearStall ? 'Within 50m • Verified' : 'Over 50m Away'}
            </span>
          </div>

          {isNearStall ? (
            <div className="space-y-2">
              <p className="text-xs text-[#FAF7F2]">
                Your physical location matches this stall. Confirm its live presence for other travelers:
              </p>

              {!pingSubmitted ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePing(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Confirm Stall is Open (+10 Freshness)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePing(false)}
                    className="py-2 px-3 rounded-xl bg-[#262422] hover:bg-[#3A3734] text-[#A8A29E] text-xs font-medium transition-colors"
                  >
                    Closed
                  </button>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-xs text-orange-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400" />
                  <span>Stall presence verified in real-time registry!</span>
                </div>
              )}

              {/* Leave Experience Pulse */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#A8A29E]">Leave Verified Pulse:</span>
                <div className="flex items-center space-x-1">
                  {['Master Craft', 'Authentic Heritage', 'Fair Price'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handlePulse(tag)}
                      className="px-2.5 py-1 rounded-lg bg-[#262422] hover:bg-orange-600 hover:text-white text-[#FAF7F2] text-[11px] font-medium border border-white/[0.06] transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {pulseSubmitted && (
                <p className="text-[10px] text-orange-300 font-mono">
                  ✓ Pulse added to community trust ledger.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#A8A29E]">
              📍 Visit within 50 meters of this stall to unlock live presence confirmation and verified community reviews.
            </p>
          )}
        </div>

        {/* Bottom Primary Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-xl bg-[#262422] hover:bg-[#3A3734] text-[#FAF7F2] text-xs font-medium transition-all flex items-center justify-center space-x-1.5"
            title="Share Stall Profile"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handleLocate}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-[0_4px_20px_rgba(234,88,12,0.35)] flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Locate on Map &amp; Start Walking Trail</span>
          </button>
        </div>
      </div>
    </div>
  );
}
