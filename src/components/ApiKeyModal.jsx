import React, { useState } from 'react';
import { Key, Check, Database, X, Info } from 'lucide-react';
import { getGeminiApiKey } from '../utils/gemini';
import { isSupabaseConfigured } from '../utils/supabaseClient';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(getGeminiApiKey() || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('LOCAL_LENS_GEMINI_KEY', apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('LOCAL_LENS_GEMINI_KEY');
      setApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121110]/95 border border-white/[0.1] p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.05] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAF7F2] font-sans">Live Engine Configuration</h3>
            <p className="text-xs text-[#A8A29E]">Gemini 2.5 Flash &amp; Supabase RAG</p>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="p-3.5 rounded-xl bg-[#171615] border border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-[#FAF7F2]">Supabase Connection:</span>
          </div>
          <span
            className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${
              isSupabaseConfigured
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {isSupabaseConfigured ? 'Live PostgreSQL' : 'Fallback Demo Store'}
          </span>
        </div>

        {/* API Key Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#FAF7F2] block mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
              >
                Get Free Key &rarr;
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#171615] border border-white/[0.08] text-[#FAF7F2] font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
            <p className="text-[11px] text-[#A8A29E] mt-1.5 flex items-center">
              <Info className="w-3 h-3 mr-1.5 flex-shrink-0 text-amber-400" />
              Stored safely in local browser memory. Optional in Judge Demo Mode.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-1/3 py-2.5 rounded-xl bg-[#262422]/80 hover:bg-[#262422] text-[#D6D3D1] text-xs font-medium transition-all"
            >
              Clear
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#FAF7F2] font-semibold text-xs shadow-[0_4px_20px_rgba(234,88,12,0.35)] flex items-center justify-center space-x-1.5 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Config Saved!</span>
                </>
              ) : (
                <span>Save Key &amp; Enable Live AI</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
