import React from 'react';

/**
 * Claude Warm Glass Skeleton Loader with shimmer effect
 * Adheres strictly to rules.md: "Zero Hallucination UI - show skeletal loader with a shimmer effect (animate-pulse)"
 */
export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'map') {
    return (
      <div className="w-full h-80 sm:h-96 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-5 flex flex-col justify-between animate-pulse shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-[#262422] rounded-lg"></div>
          <div className="h-6 w-20 bg-orange-500/15 rounded-full border border-orange-500/30"></div>
        </div>
        <div className="flex items-center justify-center space-x-2 text-[#A8A29E]">
          <div className="w-3 h-3 rounded-full bg-orange-500/50 animate-ping"></div>
          <span className="text-xs font-mono">Calibrating Hyper-Local Map...</span>
        </div>
        <div className="h-3 w-48 bg-[#262422] rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 sm:p-7 space-y-5 animate-pulse">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#262422]"></div>
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-[#262422] rounded"></div>
            <div className="h-2.5 w-28 bg-[#1D1B1A] rounded"></div>
          </div>
        </div>
        <div className="h-6 w-28 bg-orange-500/15 rounded-full border border-orange-500/30"></div>
      </div>

      {/* Cultural context 2-sentence story skeleton */}
      <div className="space-y-2.5 pt-1">
        <div className="h-3.5 bg-[#262422] rounded w-full"></div>
        <div className="h-3.5 bg-[#262422] rounded w-11/12"></div>
        <div className="h-3.5 bg-[#1D1B1A] rounded w-4/5"></div>
      </div>

      {/* Audio narration bar skeleton */}
      <div className="h-12 rounded-xl bg-[#171615] border border-white/[0.08] flex items-center px-4 space-x-3.5">
        <div className="w-8 h-8 rounded-xl bg-orange-500/20"></div>
        <div className="flex-1 h-2 bg-[#262422] rounded"></div>
        <div className="w-14 h-3 bg-[#262422] rounded"></div>
      </div>

      {/* Recommended vendor cards skeleton */}
      <div className="pt-2 space-y-3">
        <div className="h-3 w-40 bg-[#262422] rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
            <div className="h-4 w-32 bg-[#262422] rounded"></div>
            <div className="h-3 w-full bg-[#1D1B1A] rounded"></div>
            <div className="h-3 w-2/3 bg-[#1D1B1A] rounded"></div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
            <div className="h-4 w-36 bg-[#262422] rounded"></div>
            <div className="h-3 w-full bg-[#1D1B1A] rounded"></div>
            <div className="h-3 w-3/4 bg-[#1D1B1A] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
