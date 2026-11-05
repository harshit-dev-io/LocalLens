import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Navigation,
  ThumbsUp,
  Store,
  ChevronRight,
} from 'lucide-react';
import { formatDistance, formatWalkingTime, isWithinProofOfPresence } from '../utils/haversine';
import { getVendorFreshnessStatus } from '../utils/supabaseClient';

export default function VendorCard({
  vendor,
  userLocation,
  isSelected = false,
  onSelect,
  onLocate,
  onPingConfirm,
  onAddPulse,
}) {
  const [isSubmittingPing, setIsSubmittingPing] = useState(false);
  const [pingSubmitted, setPingSubmitted] = useState(false);

  // Proximity for Proof-of-Presence (< 50m)
  const isNearStall = isWithinProofOfPresence(
    userLocation?.lat,
    userLocation?.lng,
    vendor.lat,
    vendor.lng,
    50
  );

  const freshness = getVendorFreshnessStatus(vendor.last_seen_at);

  const handlePing = async (e, isPresent) => {
    e.stopPropagation();
    setIsSubmittingPing(true);
    try {
      await onPingConfirm?.(vendor.id, isPresent);
      setPingSubmitted(true);
    } catch (err) {
      console.error('Ping check error:', err);
    } finally {
      setIsSubmittingPing(false);
    }
  };

  const handleLocateClick = (e) => {
    e.stopPropagation();
    onLocate?.(vendor);
  };

  const getCategoryBadgeClass = (category) => {
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
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl p-5 transition-all duration-300 border text-left relative flex flex-col justify-between ${
        isSelected
          ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_24px_rgba(234,88,12,0.25)] ring-1 ring-orange-500/50'
          : 'bg-white/[0.025] hover:bg-white/[0.06] border-white/[0.08] hover:border-amber-500/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:translate-y-[-2px]'
      }`}
    >
      <div className="space-y-3">
        {/* Top Metadata Row: Category & Freshness */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border tracking-wide uppercase font-mono ${getCategoryBadgeClass(
              vendor.category
            )}`}
          >
            {vendor.category}
          </span>

          <div className="flex items-center space-x-1.5">
            {freshness.isFresh ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
                {freshness.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30">
                <AlertCircle className="w-3 h-3 mr-1 text-amber-400" />
                Unconfirmed
              </span>
            )}
          </div>
        </div>

        {/* Name and Description */}
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm sm:text-base font-bold text-[#FAF7F2] font-sans leading-tight group-hover:text-amber-300 transition-colors">
              {vendor.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-amber-400 transition-colors flex-shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-[#A8A29E] mt-1 line-clamp-2 leading-relaxed">
            {vendor.description}
          </p>
        </div>

        {/* Fair Price & Trust Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {vendor.is_fair_price_verified !== false && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <span>⚖️ Fair Price</span>
            </span>
          )}

          {vendor.community_trust_score && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono text-[#D6D3D1] bg-[#171615] border border-white/[0.06]">
              <ShieldCheck className="w-3 h-3 mr-1 text-orange-400" />
              {vendor.community_trust_score}% Trust
            </span>
          )}
        </div>
      </div>

      {/* Proximity Footer & Direct "Locate" Action Button */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-amber-400 font-mono">
          <MapPin className="w-3.5 h-3.5 text-orange-400" />
          <span>{formatDistance(vendor.distance_meters)}</span>
          <span className="text-[#57534E]">•</span>
          <span className="text-[#A8A29E] flex items-center font-sans text-[11px]">
            <Clock className="w-3 h-3 mr-1 text-[#78716C]" />
            {formatWalkingTime(vendor.distance_meters)}
          </span>
        </div>

        {/* Functional Locate Button */}
        <button
          type="button"
          onClick={handleLocateClick}
          className="px-2.5 py-1 rounded-lg bg-[#262422] hover:bg-orange-600 text-orange-300 hover:text-white border border-white/[0.06] hover:border-orange-500/40 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          title="Locate stall on map"
        >
          <Navigation className="w-3 h-3 text-orange-400 group-hover:text-white transition-colors" />
          <span>Locate</span>
        </button>
      </div>

      {/* 1-Tap Crowdsourced Ping Check (Triggered when tourist is within 50m) */}
      {isNearStall && !pingSubmitted && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3.5 p-3 rounded-xl bg-[#1A1512] border border-amber-500/30 text-xs space-y-2 cursor-default"
        >
          <div className="flex items-center justify-between text-amber-300">
            <span className="font-semibold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-400" />
              Proof-of-Presence (~{vendor.distance_meters || 20}m)
            </span>
            <span className="text-[10px] font-mono text-[#A8A29E]">GPS Verified</span>
          </div>

          <p className="text-[11px] text-[#FAF7F2]">
            Is this artisan actively present at this stall?
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={isSubmittingPing}
              onClick={(e) => handlePing(e, true)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-[11px] shadow-sm flex items-center justify-center space-x-1"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Yes (Confirm)</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingPing}
              onClick={(e) => handlePing(e, false)}
              className="py-1.5 px-3 rounded-lg bg-[#262422] hover:bg-[#3A3734] text-[#A8A29E] text-[11px] font-medium transition-colors"
            >
              Moved / Closed
            </button>
          </div>
        </div>
      )}

      {pingSubmitted && (
        <div className="mt-2 text-[11px] text-amber-300 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-orange-400" />
          <span>Stall verified! +10 Freshness added to registry.</span>
        </div>
      )}
    </div>
  );
}
