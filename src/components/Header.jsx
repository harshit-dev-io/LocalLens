import React from 'react';
import { Sparkles, MapPin, Compass, Store, Key, ShieldCheck } from 'lucide-react';
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
  const hasGeminiKey = Boolean(getGeminiApiKey());

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#121110]/85 border-b border-white/[0.08] px-4 lg:px-8 py-3.5 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('tourist')}
          >
            {/* Claude-style Warm Terracotta Brand Mark */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(234,88,12,0.35)]">
              <div className="w-full h-full bg-[#171615] rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-400 transform -rotate-12 group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-[#FAF7F2] font-sans">
                  LocalLens <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono font-medium">V2</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/25">
                  <ShieldCheck className="w-3 h-3 mr-1 text-orange-400" /> Mini-RAG Grounded
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E] font-medium tracking-wide">
                Two-Sided Hyper-Local Context Engine
              </p>
            </div>
          </div>

          {/* Quick API Key Trigger on Mobile */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={onOpenKeyModal}
              title="Configure API Key"
              className={`p-2 rounded-xl border text-xs ${
                hasGeminiKey
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Mode Tabs (Claude Warm Pill Switcher) */}
        <div className="flex items-center bg-[#171615] border border-white/[0.08] p-1 rounded-xl shadow-inner w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('tourist')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'tourist'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-[#FAF7F2] shadow-[0_2px_12px_rgba(234,88,12,0.35)]'
                : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tourist Explore</span>
          </button>

          <button
            onClick={() => setActiveTab('artisan')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'artisan'
                ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-[#FAF7F2] shadow-[0_2px_12px_rgba(234,88,12,0.35)]'
                : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.04]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Artisan Onboard</span>
          </button>
        </div>

        {/* Right: Judge-Proof Demo Toggle & System Diagnostics */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* GPS Coordinates telemetry pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#171615] border border-white/[0.08] text-[11px] font-mono text-[#A8A29E]">
            <MapPin className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-400' : 'text-orange-400'}`} />
            <span>
              {userLocation
                ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : 'Calibrating GPS...'}
            </span>
          </div>

          {/* Judge Demo Mode Switch */}
          <div className="flex items-center space-x-2.5 bg-[#171615] border border-white/[0.08] px-3.5 py-1.5 rounded-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
                Judge Demo
              </span>
              <span className={`text-[10px] font-bold ${isDemoMode ? 'text-amber-400' : 'text-[#A8A29E]'}`}>
                {isDemoMode ? 'Simulated Coords' : 'Live Hardware'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isDemoMode}
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? 'bg-orange-600 shadow-[0_0_12px_rgba(234,88,12,0.4)]' : 'bg-[#262422]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#FAF7F2] shadow-md ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Settings / API Key Button on Desktop */}
          <button
            onClick={onOpenKeyModal}
            title="Configure Gemini & Supabase Settings"
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              hasGeminiKey
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
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
