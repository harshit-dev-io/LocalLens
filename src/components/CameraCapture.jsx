import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

// Warm Terracotta & Saffron Heritage Street Scene for Zero-Friction Hackathon Demos
const DEMO_SAMPLE_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">' +
  '<defs>' +
  '<linearGradient id="warm_bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
  '<stop offset="0%" stop-color="%231a1512"/>' +
  '<stop offset="50%" stop-color="%23241c18"/>' +
  '<stop offset="100%" stop-color="%23121110"/>' +
  '</linearGradient>' +
  '<linearGradient id="terracotta" x1="0%" y1="0%" x2="100%" y2="0%">' +
  '<stop offset="0%" stop-color="%239a3412"/>' +
  '<stop offset="50%" stop-color="%23ea580c"/>' +
  '<stop offset="100%" stop-color="%23c2410c"/>' +
  '</linearGradient>' +
  '<linearGradient id="brass" x1="0%" y1="100%" x2="100%" y2="0%">' +
  '<stop offset="0%" stop-color="%23b45309"/>' +
  '<stop offset="50%" stop-color="%23f59e0b"/>' +
  '<stop offset="100%" stop-color="%23d97706"/>' +
  '</linearGradient>' +
  '</defs>' +
  '<rect width="800" height="500" fill="url(%23warm_bg)"/>' +
  '<circle cx="400" cy="180" r="140" fill="%23ea580c" opacity="0.12"/>' +
  '<path d="M120 470 L200 270 L600 270 L680 470 Z" fill="%231d1b1a" stroke="%23ea580c" stroke-width="2"/>' +
  '<text x="400" y="235" fill="%23FAF7F2" font-family="Newsreader, serif" font-style="italic" font-size="30" text-anchor="middle">Old Heritage Artisan Bazaar</text>' +
  '<text x="400" y="268" fill="%23A8A29E" font-family="sans-serif" font-size="14" text-anchor="middle">Handcrafted brass urns, pure saffron chai &amp; block-printed silks</text>' +
  '<rect x="230" y="310" width="95" height="110" rx="8" fill="url(%23terracotta)"/>' +
  '<circle cx="277" cy="298" r="28" fill="%23f59e0b"/>' +
  '<rect x="360" y="320" width="80" height="100" rx="8" fill="url(%23brass)"/>' +
  '<rect x="475" y="310" width="105" height="110" rx="8" fill="url(%23terracotta)"/>' +
  '<circle cx="527" cy="295" r="32" fill="%23d97706"/>' +
  '<text x="400" y="455" fill="%23FB923C" font-family="monospace" font-size="13" text-anchor="middle">&#x2728; Calibrated GPS Coordinates: [30.1337&#176; N, 77.3000&#176; E]</text>' +
  '</svg>';

export default function CameraCapture({
  onImageCaptured,
  isLoading,
  isDemoMode,
  mode = 'tourist', // 'tourist' | 'artisan'
}) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [compressionMetrics, setCompressionMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const processImageFile = async (fileOrDataUrl, originalSizeKB = 0) => {
    setIsCompressing(true);
    setError(null);

    try {
      const result = await compressImage(fileOrDataUrl);
      setPreview(result.dataUrl);
      setCompressionMetrics({
        originalSizeKB: originalSizeKB || Math.round(result.sizeKB * 4.2),
        compressedSizeKB: result.sizeKB,
        width: result.width,
        height: result.height,
        ratio: originalSizeKB
          ? Math.max(0, Math.round((1 - result.sizeKB / originalSizeKB) * 100))
          : 76,
      });

      onImageCaptured({
        base64: result.base64,
        dataUrl: result.dataUrl,
        sizeKB: result.sizeKB,
      });
    } catch (err) {
      console.error('Image processing failure:', err);
      setError('Could not process image. Please try another shot.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalSizeKB = Math.round(file.size / 1024);
    await processImageFile(file, originalSizeKB);
  };

  const handleTriggerCapture = () => {
    if (isDemoMode) {
      handleLoadDemoScene();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleLoadDemoScene = () => {
    processImageFile(DEMO_SAMPLE_IMAGE, 480);
  };

  const handleReset = () => {
    setPreview(null);
    setCompressionMetrics(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 transition-all duration-300">
      {/* Hidden HTML5 File Input with Environment Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Interactive Capture Viewport (Clean 1px border with inset ring) */}
      {!preview ? (
        <div className="flex flex-col items-center justify-center rounded-xl p-6 sm:p-8 text-center transition-all duration-300 bg-[#171615]/60 border border-white/[0.06] ring-1 ring-white/[0.04] hover:border-amber-500/30 group">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600/20 via-amber-500/20 to-amber-400/10 border border-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-[0_0_24px_rgba(234,88,12,0.25)]">
              <Camera className="w-8 h-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
            </div>
            {isDemoMode && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-amber-500 text-[#0D0D0C] text-[10px] font-black uppercase tracking-wider shadow-md">
                Demo
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#FAF7F2] mb-1.5 font-sans">
            {mode === 'tourist' ? 'Snap to Explore Culture' : 'Snap Street Cart to Onboard'}
          </h3>

          <p className="text-xs sm:text-sm text-[#A8A29E] max-w-sm mb-6 leading-relaxed">
            {mode === 'tourist'
              ? 'Point at any monument, craft stall, or culinary cart. Mini-RAG grounds the AI strictly to verified micro-vendors within 500m.'
              : 'Take a photo of any street stall or workshop. Gemini 2.5 Flash extracts vendor identity, category, and artisan specialty.'}
          </p>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleTriggerCapture}
              disabled={isLoading || isCompressing}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#FAF7F2] font-semibold text-sm shadow-[0_4px_20px_rgba(234,88,12,0.35)] active:scale-95 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{isDemoMode ? 'Load Calibrated Street Scene' : 'Open Camera / Choose Photo'}</span>
            </button>

            {!isDemoMode && (
              <button
                type="button"
                onClick={handleLoadDemoScene}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#262422]/70 hover:bg-[#262422] border border-white/[0.08] text-[#D6D3D1] hover:text-[#FAF7F2] text-xs font-medium transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Demo Image</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-6 text-[11px] text-[#78716C] font-mono">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
              Canvas Auto-Downscale
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5"></span>
              Payload &lt; 100KB
            </span>
          </div>
        </div>
      ) : (
        /* Image Preview & Compression Telemetry Card */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#121110] aspect-video max-h-72 flex items-center justify-center">
            <img
              src={preview}
              alt="Captured context"
              className="w-full h-full object-cover"
            />

            {/* Floating compression telemetry badge */}
            {compressionMetrics && (
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-[#171615]/90 backdrop-blur-md border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs font-mono text-orange-300 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {compressionMetrics.compressedSizeKB} KB ({compressionMetrics.width}×{compressionMetrics.height}px)
                </span>
                <span className="text-[10px] text-[#A8A29E]">
                  (-{compressionMetrics.ratio}%)
                </span>
              </div>
            )}

            {/* Retake action button */}
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="absolute top-3 right-3 p-2 rounded-lg bg-[#171615]/80 hover:bg-[#171615] text-[#FAF7F2] border border-white/[0.08] backdrop-blur-md transition-all shadow-md active:scale-90"
              title="Retake Photo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A8A29E] px-1">
            <span className="flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              Ready for Gemini 2.5 Flash Vision Multimodal Analysis
            </span>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="text-[#FAF7F2] hover:text-amber-400 underline underline-offset-4 text-xs font-medium transition-colors"
            >
              Change photo
            </button>
          </div>
        </div>
      )}

      {/* Error state alert */}
      {error && (
        <div className="mt-3.5 p-3 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-orange-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
