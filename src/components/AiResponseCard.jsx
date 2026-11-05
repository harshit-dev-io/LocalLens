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
  Tag,
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
    // Subscribe to speech controller events
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

  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case 'food':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'craft':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'heritage':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-brand-500/10 text-brand-400 border-brand-500/30';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-dark-800/80 backdrop-blur-xl border border-white/10 p-5 sm:p-6 shadow-glass space-y-6 transition-all duration-300 relative overflow-hidden">
      {/* Decorative ambient gradient glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar: Status & Mini-RAG Grounding Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center">
              Gemini 2.5 Flash Synthesis
            </h3>
            <p className="text-[11px] text-slate-400">Hyper-Local Multimodal Mini-RAG</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-400" />
            {groundedVendorsCount > 0
              ? `Grounded in ${groundedVendorsCount} Stalls`
              : 'Zero Hallucination Grounded'}
          </span>
          {isFallback && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              Demo Safe Mode
            </span>
          )}
        </div>
      </div>

      {/* 2-Sentence Cultural Context Narrative */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
          <Compass className="w-3 h-3 mr-1.5 text-brand-400" />
          Cultural &amp; Historical Context
        </span>
        <blockquote className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans font-normal border-l-2 border-brand-500/60 pl-3.5 italic bg-white/[0.02] py-2 rounded-r-lg">
          "{culturalStory}"
        </blockquote>
      </div>

      {/* Web Speech API Audio Narration Controller */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/60 border border-white/10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleAudio}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow ${
              speechState.isPlaying && !speechState.isPaused
                ? 'bg-amber-500 text-dark-900 hover:bg-amber-400 shadow-amber-500/30'
                : 'bg-brand-500 text-white hover:bg-brand-400 shadow-glass-glow'
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
            <div className="text-xs font-semibold text-white flex items-center space-x-2">
              <span>{speechState.isPlaying ? 'Narrating Cultural Story' : 'Hands-Free Audio Guide'}</span>
              {speechState.isPlaying && !speechState.isPaused && (
                <div className="flex items-end space-x-0.5 h-3">
                  <span className="w-0.5 h-3 bg-brand-400 animate-soundwave"></span>
                  <span className="w-0.5 h-2 bg-brand-400 animate-soundwave delay-75"></span>
                  <span className="w-0.5 h-3.5 bg-brand-400 animate-soundwave delay-150"></span>
                  <span className="w-0.5 h-1.5 bg-brand-400 animate-soundwave delay-100"></span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Web Speech API native device text-to-speech
            </p>
          </div>
        </div>

        {speechState.isPlaying && (
          <button
            onClick={handleStopAudio}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Stop Narration"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Complementary Verified Micro-Vendors */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
            <Store className="w-3 h-3 mr-1.5 text-brand-accent" />
            Complementary Verified Micro-Vendors ({recommendedVendors.length})
          </span>
          <span className="text-[10px] text-brand-300 font-mono">
            RAG Injected
          </span>
        </div>

        {recommendedVendors.length === 0 ? (
          <div className="p-4 rounded-xl bg-dark-900/40 border border-white/5 text-center text-xs text-slate-400">
            No nearby stalls registered in database within 500m. Switch to Artisan Mode to onboard one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedVendors.map((vendor) => {
              const isSelected = selectedVendorId === vendor.id;
              return (
                <div
                  key={vendor.id}
                  onClick={() => onSelectVendor?.(vendor)}
                  className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border text-left relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500 shadow-card-glow ring-1 ring-brand-500'
                      : 'bg-dark-900/60 hover:bg-dark-900/90 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {vendor.name}
                      </h4>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${getCategoryTheme(
                          vendor.category
                        )}`}
                      >
                        {vendor.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {vendor.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px]">
                    <span className="text-brand-300 font-mono font-medium flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-brand-400" />
                      {formatDistance(vendor.distance_meters)}
                    </span>

                    <button
                      type="button"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
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
