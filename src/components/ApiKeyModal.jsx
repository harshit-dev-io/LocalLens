import React, { useState } from 'react';
import { Key, ShieldCheck, Check, Database, Sparkles, X, Info } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-dark-800/95 border border-white/10 p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Engine Configuration</h3>
            <p className="text-xs text-slate-400">Gemini 2.5 Flash &amp; Supabase RAG</p>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-brand-accent" />
            <span className="text-slate-300">Supabase Connection:</span>
          </div>
          <span
            className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${
              isSupabaseConfigured
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isSupabaseConfigured ? 'Live PostgreSQL' : 'Fallback Demo Store'}
          </span>
        </div>

        {/* API Key Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Get Free Key &rarr;
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-brand-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              <Info className="w-3 h-3 mr-1 flex-shrink-0" />
              Stored safely in local browser memory. Optional in Judge Demo Mode.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-1/3 py-2.5 rounded-xl bg-dark-700/60 hover:bg-dark-700 text-slate-300 text-xs font-medium transition-all"
            >
              Clear
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-semibold text-xs shadow-glass-glow flex items-center justify-center space-x-1.5 transition-all"
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
