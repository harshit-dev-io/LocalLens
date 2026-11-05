import React from 'react';

/**
 * Polished Glassmorphic Skeleton Loader with shimmer effect
 * Adheres strictly to rules.md: "Zero Hallucination UI - show skeletal loader with a shimmer effect (animate-pulse)"
 */
export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'map') {
    return (
      <div className="w-full h-72 rounded-2xl bg-dark-800/60 backdrop-blur-md border border-white/10 p-4 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-slate-700/60 rounded"></div>
          <div className="h-6 w-16 bg-slate-700/60 rounded-full"></div>
        </div>
        <div className="flex items-center justify-center space-x-2 text-slate-500">
          <div className="w-3 h-3 rounded-full bg-brand-500/40 animate-ping"></div>
          <span className="text-xs font-mono">Calibrating Hyper-Local Map...</span>
        </div>
        <div className="h-3 w-48 bg-slate-700/40 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-dark-800/70 backdrop-blur-xl border border-white/10 p-6 space-y-5 animate-pulse shadow-glass">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-700/70"></div>
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-700/70 rounded"></div>
            <div className="h-2.5 w-24 bg-slate-700/40 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-24 bg-brand-500/20 rounded-full border border-brand-500/30"></div>
      </div>

      {/* Cultural context 2-sentence story skeleton */}
      <div className="space-y-2.5 pt-2">
        <div className="h-3.5 bg-slate-700/60 rounded w-full"></div>
        <div className="h-3.5 bg-slate-700/60 rounded w-11/12"></div>
        <div className="h-3.5 bg-slate-700/50 rounded w-4/5"></div>
      </div>

      {/* Audio narration bar skeleton */}
      <div className="h-11 rounded-xl bg-slate-800/80 border border-white/5 flex items-center px-4 space-x-3">
        <div className="w-7 h-7 rounded-full bg-brand-500/30"></div>
        <div className="flex-1 h-2 bg-slate-700/50 rounded"></div>
        <div className="w-12 h-3 bg-slate-700/40 rounded"></div>
      </div>

      {/* Recommended vendor cards skeleton */}
      <div className="pt-2 space-y-3">
        <div className="h-3 w-36 bg-slate-700/50 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="h-4 w-28 bg-slate-700/60 rounded"></div>
            <div className="h-3 w-full bg-slate-700/40 rounded"></div>
            <div className="h-3 w-2/3 bg-slate-700/40 rounded"></div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="h-4 w-32 bg-slate-700/60 rounded"></div>
            <div className="h-3 w-full bg-slate-700/40 rounded"></div>
            <div className="h-3 w-3/4 bg-slate-700/40 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
