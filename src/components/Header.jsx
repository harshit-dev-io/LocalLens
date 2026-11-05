import React from 'react';
import { Compass, Store, Sparkles, Key, MapPin } from 'lucide-react';
import { getGeminiApiKey } from '../utils/gemini';

export default function Header({
  activeTab,
  setActiveTab,
  userLocation,
  isCalibrating = false,
  onOpenKeyModal,
}) {
  const hasGeminiKey = Boolean(getGeminiApiKey());

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#121110]/85 border-b border-white/[0.08] px-4 lg:px-8 py-3.5 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Mark with Editorial Heritage Edition chip */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab('explore')}
        >
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
                LocalLens
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 font-serif italic">
                Heritage Edition
              </span>
            </div>
            <p className="text-[11px] text-[#A8A29E] font-medium tracking-wide">
              Hyper-Local Context &amp; Verified Artisan Engine
            </p>
          </div>
        </div>

        {/* Ambient Location Status Pill (Clean Consumer UI) */}
        <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#171615] border border-white/[0.08] text-xs text-[#FAF7F2] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-medium">Historic Center</span>
          <span className="text-[#78716C]">•</span>
          <span className="text-[11px] text-[#A8A29E] font-mono">
            {isCalibrating ? 'Calibrating ±4m' : 'Active ±4m'}
          </span>
        </div>

        {/* Right Section: Mode Switcher & Portal */}
        <div className="flex items-center space-x-2.5">
          {/* Mode Switcher: "Explore" vs "Partner Portal" */}
          <div className="flex items-center bg-[#171615] border border-white/[0.08] p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-[#FAF7F2] shadow-[0_2px_12px_rgba(234,88,12,0.35)]'
                  : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveTab('partner')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'partner'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-[#FAF7F2] shadow-[0_2px_12px_rgba(234,88,12,0.35)]'
                  : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.04]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Partner Portal</span>
            </button>
          </div>

          {/* Quick Engine Credentials Modal Trigger */}
          <button
            onClick={onOpenKeyModal}
            title="Configure Engine Settings"
            className={`p-2 rounded-xl border text-xs transition-colors ${
              hasGeminiKey
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
