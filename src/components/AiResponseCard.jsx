import React, { useEffect, useState } from 'react';
import {
  Pause,
  Play,
  Sparkles,
  ShieldCheck,
  Compass,
  Store,
  VolumeX,
} from 'lucide-react';
import { speechService } from '../utils/speech';
import VendorCard from './VendorCard';

export default function AiResponseCard({
  culturalStory,
  recommendedVendors = [],
  groundedVendorsCount = 0,
  userLocation,
  selectedVendorId,
  onSelectVendor,
  onLocateVendor,
  onOpenVendorDetail,
  onPingConfirm,
  onAddPulse,
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

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 sm:p-7 space-y-6 transition-all duration-300 relative overflow-hidden">
      {/* Subtle Warm Amber Flare */}
      <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FAF7F2] tracking-wide font-sans">
              Cultural Synthesis &amp; Trail
            </h3>
            <p className="text-[11px] text-[#A8A29E]">Hyper-Local Visual Ethnography</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-mono">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            {groundedVendorsCount > 0 ? `Grounded in ${groundedVendorsCount} Stalls` : 'Verified Grounding'}
          </span>
        </div>
      </div>

      {/* 2-Sentence Cultural Context Narrative (Editorial Warmth) */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] flex items-center">
          <Compass className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
          Living Cultural Context
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
              Native speech synthesizer with natural cadence
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
            Complementary Verified Stops ({recommendedVendors.length})
          </span>
          <span className="text-[10px] text-amber-300 font-mono">
            Tap Card for Menu &amp; Ratings
          </span>
        </div>

        {recommendedVendors.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171615]/50 border border-white/[0.06] text-center text-xs text-[#A8A29E]">
            No verified stalls detected within immediate proximity.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recommendedVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                userLocation={userLocation}
                isSelected={selectedVendorId === vendor.id}
                onSelect={() => onOpenVendorDetail?.(vendor)}
                onLocate={onLocateVendor}
                onPingConfirm={onPingConfirm}
                onAddPulse={onAddPulse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
