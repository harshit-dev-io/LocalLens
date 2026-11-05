import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, MapPin, Layers, CheckCircle2 } from 'lucide-react';

/**
 * Multi-Stage Atmospheric Scanning HUD
 * Renders an interactive frosted scanner overlay with an animated radar pulse
 * and progressive real-time pipeline feedback:
 *   - Stage 1 (0–300ms): Compressing optical contours (Canvas 800px)...
 *   - Stage 2 (300–800ms): Querying verified artisan registry (500m radius)...
 *   - Stage 3 (800–2000ms): Synthesizing cultural backstory & walking trail...
 */
export default function ScannerOverlay({ isOpen, imagePreview, onCancel }) {
  const [stage, setStage] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStage(1);
      setElapsed(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsed(diff);

      if (diff < 350) {
        setStage(1);
      } else if (diff < 850) {
        setStage(2);
      } else {
        setStage(3);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const STAGES = [
    {
      id: 1,
      title: 'Compressing optical contours',
      subtext: 'Offscreen canvas scaling to 800px, JPEG 0.7 under 100KB',
      icon: Layers,
    },
    {
      id: 2,
      title: 'Querying verified artisan registry',
      subtext: 'Haversine spherical filter across 500m hyper-local radius',
      icon: MapPin,
    },
    {
      id: 3,
      title: 'Synthesizing cultural backstory & trail',
      subtext: 'Gemini multimodal neural grounding to authentic micro-vendors',
      icon: Sparkles,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/85 backdrop-blur-2xl transition-all duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121110]/95 border border-white/[0.1] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col items-center text-center overflow-hidden">
        {/* Subtle Ambient Background Flare */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Circular Radar Scanner */}
        <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
          {/* Outer Pulsing Ping */}
          <span className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping opacity-60"></span>
          <span className="absolute inset-2 rounded-full border border-orange-500/30 animate-pulse"></span>

          {/* Rotating Scanner Radar Beam */}
          <div className="absolute inset-0 rounded-full border border-white/[0.08] flex items-center justify-center">
            <div className="w-full h-full rounded-full border-t-2 border-r-2 border-orange-500 animate-spin [animation-duration:2.2s]"></div>
          </div>

          {/* Captured Image Thumbnail or Center Optical Core */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.15] bg-[#171615] shadow-inner relative flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Optical capture"
                className="w-full h-full object-cover opacity-85 filter contrast-110"
              />
            ) : (
              <Compass className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/60 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Dynamic Status Title */}
        <div className="space-y-1.5 mb-6">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
            Stage {stage} of 3 • {(elapsed / 1000).toFixed(1)}s
          </div>
          <h3 className="text-base font-bold text-[#FAF7F2] font-sans">
            {STAGES[stage - 1]?.title}
          </h3>
          <p className="text-xs text-[#A8A29E] max-w-xs">
            {STAGES[stage - 1]?.subtext}
          </p>
        </div>

        {/* Progressive Stages Timeline */}
        <div className="w-full space-y-2.5 text-left mb-6 bg-[#171615]/70 border border-white/[0.06] rounded-2xl p-4">
          {STAGES.map((s) => {
            const isCompleted = stage > s.id;
            const isCurrent = stage === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center space-x-3 transition-opacity duration-200 ${
                  isCurrent ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-35'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono transition-colors ${
                    isCompleted
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : isCurrent
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm animate-pulse'
                      : 'bg-[#262422] text-[#78716C] border border-white/[0.04]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" /> : s.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#FAF7F2] truncate">
                    {s.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#262422] h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(96, Math.max(15, (elapsed / 1800) * 100))}%`,
            }}
          ></div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[11px] text-[#A8A29E] hover:text-[#FAF7F2] transition-colors"
          >
            Cancel Exploration
          </button>
        )}
      </div>
    </div>
  );
}
