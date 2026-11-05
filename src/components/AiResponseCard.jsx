import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Sparkles,
  ShieldCheck,
  MapPin,
  Compass,
  Store,
  ExternalLink,
} from 'lucide-react';
import { speechService } from '../utils/speech';
import { formatDistance } from '../utils/haversine';

export default function AiResponseCard({
  culturalStory,
  recommendedVendors = [],
  groundedVendorsCount = 0,
  isFallback = false,
  onSelectVendor,
  selectedVendorId,
}) {
  const [speechState, setSpeechState] = useState({
    isPlaying: false,
    isPaused: false,
  });

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState({
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
      });
    });

    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    if (!culturalStory) return;
    speechService.toggle(culturalStory);
  };

  const handleStopAudio = () => {
    speechService.stop();
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
    <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 sm:p-7 space-y-6 transition-all duration-300 relative overflow-hidden">
      {/* Subtle Warm Amber Gradient Glow */}
      <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar: Engine Attribution & Mini-RAG Grounding Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FAF7F2] tracking-wide flex items-center font-sans">
              Gemini 2.5 Flash Synthesis
            </h3>
            <p className="text-[11px] text-[#A8A29E]">Hyper-Local Multimodal Mini-RAG</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-orange-500/15 text-orange-300 border border-orange-500/30 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            {groundedVendorsCount > 0
              ? `Grounded in ${groundedVendorsCount} Local Stalls`
              : 'Zero Hallucination Grounded'}
          </span>
          {isFallback && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#262422] text-amber-300 border border-white/[0.08] font-mono">
              Demo Safe Mode
            </span>
          )}
        </div>
      </div>

      {/* 2-Sentence Cultural Context Narrative (Editorial Warmth) */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] flex items-center">
          <Compass className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
          Cultural &amp; Historical Context
        </span>
        <blockquote className="text-base sm:text-[17px] text-[#FAF7F2] leading-relaxed font-serif italic border-l-2 border-orange-500/70 pl-4 py-1.5 bg-white/[0.015] rounded-r-xl">
          "{culturalStory}"
        </blockquote>
      </div>

      {/* Web Speech API Audio Narration Controller */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#171615]/80 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleToggleAudio}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md ${
              speechState.isPlaying && !speechState.isPaused
                ? 'bg-amber-500 text-[#0D0D0C] hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-[0_2px_12px_rgba(234,88,12,0.35)]'
            }`}
            title={speechState.isPlaying ? 'Pause Narration' : 'Play Audio Guide'}
          >
            {speechState.isPlaying && !speechState.isPaused ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div>
            <div className="text-xs font-semibold text-[#FAF7F2] flex items-center space-x-2">
              <span>{speechState.isPlaying ? 'Narrating Cultural Story' : 'Hands-Free Audio Guide'}</span>
              {speechState.isPlaying && !speechState.isPaused && (
                <div className="flex items-end space-x-1 h-3.5">
                  <span className="w-0.5 h-3 bg-amber-400 animate-soundwave"></span>
                  <span className="w-0.5 h-2 bg-orange-400 animate-soundwave delay-75"></span>
                  <span className="w-0.5 h-3.5 bg-amber-400 animate-soundwave delay-150"></span>
                  <span className="w-0.5 h-1.5 bg-orange-400 animate-soundwave delay-100"></span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#A8A29E]">
              Device-native Web Speech API audio synthesis
            </p>
          </div>
        </div>

        {speechState.isPlaying && (
          <button
            onClick={handleStopAudio}
            className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.05] transition-colors"
            title="Stop Narration"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recommended Verified Micro-Vendors */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] flex items-center">
            <Store className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            Complementary Verified Micro-Vendors ({recommendedVendors.length})
          </span>
          <span className="text-[10px] text-orange-300 font-mono">
            RAG Injected
          </span>
        </div>

        {recommendedVendors.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171615]/50 border border-white/[0.06] text-center text-xs text-[#A8A29E]">
            No nearby stalls registered in database within 500m. Switch to Artisan Mode to onboard one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recommendedVendors.map((vendor) => {
              const isSelected = selectedVendorId === vendor.id;
              return (
                <div
                  key={vendor.id}
                  onClick={() => onSelectVendor?.(vendor)}
                  className={`cursor-pointer rounded-xl p-4.5 transition-all duration-200 border text-left relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.25)] ring-1 ring-orange-500/50'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.08] hover:border-amber-500/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[#FAF7F2] leading-snug font-sans">
                        {vendor.name}
                      </h4>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${getCategoryBadgeClass(
                          vendor.category
                        )}`}
                      >
                        {vendor.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#D6D3D1] line-clamp-2 leading-relaxed">
                      {vendor.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] text-[11px]">
                    <span className="text-amber-400 font-mono font-medium flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-orange-400" />
                      {formatDistance(vendor.distance_meters)}
                    </span>

                    <button
                      type="button"
                      className="text-xs text-orange-300 hover:text-orange-200 font-medium flex items-center space-x-1 transition-colors"
                    >
                      <span>Locate</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
