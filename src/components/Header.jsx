import React, { useState } from 'react';
import { Sparkles, MapPin, Compass, Store, Key, ShieldCheck, HelpCircle } from 'lucide-react';
import { getGeminiApiKey } from '../utils/gemini';
import { isSupabaseConfigured } from '../utils/supabaseClient';

export default function Header({
  isDemoMode,
  setIsDemoMode,
  activeTab,
  setActiveTab,
  userLocation,
  onOpenKeyModal,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const hasGeminiKey = Boolean(getGeminiApiKey());

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-dark-900/85 border-b border-white/10 px-4 lg:px-8 py-3 transition-all duration-300 shadow-glass">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('tourist')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent via-brand-500 to-brand-300 p-0.5 shadow-glass-glow">
              <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-brand-400 transform -rotate-12 transition-transform hover:rotate-45" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
                  LocalLens <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 font-mono">V2</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Mini-RAG Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hyper-Local Two-Sided Context Engine</p>
            </div>
          </div>

          {/* Quick Info & Key Trigger on Mobile */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={onOpenKeyModal}
              title="Configure API Key"
              className={`p-1.5 rounded-lg border text-xs ${
                hasGeminiKey
                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Mode Tabs (Tourist vs Artisan) */}
        <div className="flex items-center bg-dark-800/90 border border-white/10 p-1 rounded-xl shadow-inner w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('tourist')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'tourist'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tourist Explore</span>
          </button>
          
          <button
            onClick={() => setActiveTab('artisan')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'artisan'
                ? 'bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Artisan Onboard</span>
          </button>
        </div>

        {/* Right: Judge-Proof Demo Toggle & System Diagnostics */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* GPS Coordinates telemetry pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-800/70 border border-white/5 text-[11px] font-mono text-slate-400">
            <MapPin className={`w-3 h-3 ${isDemoMode ? 'text-amber-400' : 'text-brand-400'}`} />
            <span>
              {userLocation
                ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : 'Acquiring GPS...'}
            </span>
          </div>

          {/* Judge Demo Mode Switch */}
          <div className="flex items-center space-x-2 bg-dark-800/80 border border-white/10 px-3 py-1.5 rounded-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Judge Mode
              </span>
              <span className={`text-[10px] font-bold ${isDemoMode ? 'text-amber-400' : 'text-slate-400'}`}>
                {isDemoMode ? 'Simulated Coords' : 'Live Camera/GPS'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isDemoMode}
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? 'bg-amber-500 shadow-glass-glow' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Settings / API Key Button on Desktop */}
          <button
            onClick={onOpenKeyModal}
            title="Configure Gemini & Supabase Settings"
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              hasGeminiKey
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasGeminiKey ? 'Gemini Ready' : 'Add API Key'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
