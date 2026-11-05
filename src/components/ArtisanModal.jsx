import React, { useState } from 'react';
import {
  Store,
  Sparkles,
  CheckCircle,
  MapPin,
  Send,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import CameraCapture from './CameraCapture';
import { extractArtisanProfile } from '../utils/gemini';
import { insertVendor } from '../utils/supabaseClient';

export default function ArtisanModal({
  isOpen,
  onClose,
  userLocation,
  isDemoMode,
  onVendorAdded,
}) {
  const [step, setStep] = useState('capture'); // 'capture' | 'extracted' | 'saving' | 'success'
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState({
    name: '',
    category: 'Craft',
    description: '',
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [createdVendor, setCreatedVendor] = useState(null);

  if (!isOpen) return null;

  const handleImageCaptured = async ({ base64, dataUrl }) => {
    setCapturedImage({ base64, dataUrl });
    setIsExtracting(true);
    setError(null);

    const lat = userLocation?.lat || (isDemoMode ? 30.1337 : 28.6506);
    const lng = userLocation?.lng || (isDemoMode ? 77.3000 : 77.2309);

    try {
      const profile = await extractArtisanProfile({
        base64Image: base64,
        latitude: lat,
        longitude: lng,
        isDemo: isDemoMode,
      });

      setExtractedData({
        name: profile.name,
        category: profile.category,
        description: profile.description,
      });
      setStep('extracted');
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Gemini Vision could not extract details. You can enter them manually.');
      setExtractedData({
        name: 'Heritage Street Stall',
        category: 'Craft',
        description: 'Authentic local artisan cart.',
      });
      setStep('extracted');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveToSupabase = async () => {
    setStep('saving');
    setError(null);

    const lat = userLocation?.lat || (isDemoMode ? 30.1337 : 28.6506);
    const lng = userLocation?.lng || (isDemoMode ? 77.3000 : 77.2309);

    try {
      const result = await insertVendor({
        name: extractedData.name,
        category: extractedData.category,
        description: extractedData.description,
        lat,
        lng,
      });

      if (result.success) {
        setCreatedVendor(result.vendor);
        setStep('success');
        onVendorAdded?.(result.vendor);
      } else {
        throw new Error('Could not persist artisan to database');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Could not push to Supabase. Check database credentials or offline network.');
      setStep('extracted');
    }
  };

  const handleReset = () => {
    setStep('capture');
    setCapturedImage(null);
    setExtractedData({ name: '', category: 'Craft', description: '' });
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#121110]/95 border border-white/[0.1] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-white/[0.05] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(234,88,12,0.35)]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAF7F2] flex items-center font-sans">
              Artisan Onboard Engine <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">Formless</span>
            </h2>
            <p className="text-xs text-[#A8A29E]">Snap a cart &rarr; Gemini Vision extracts &rarr; Push to Supabase</p>
          </div>
        </div>

        {/* Step 1: Capture Photo */}
        {step === 'capture' && (
          <div className="space-y-4">
            <CameraCapture
              mode="artisan"
              isDemoMode={isDemoMode}
              isLoading={isExtracting}
              onImageCaptured={handleImageCaptured}
            />

            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-mono text-amber-300">
                  Gemini 2.5 Flash Vision extracting stall metadata...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Gemini Extracted Preview & Formless Confirmation */}
        {(step === 'extracted' || step === 'saving') && (
          <div className="space-y-5">
            <div className="p-4.5 rounded-2xl bg-[#171615] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-xs text-orange-300 font-mono pb-2 border-b border-white/[0.06]">
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Gemini Vision Auto-Extracted
                </span>
                <span className="text-[11px] text-[#A8A29E] flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-orange-400" />
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Demo Coords'}
                </span>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 block">
                  Stall / Artisan Name
                </label>
                <input
                  type="text"
                  value={extractedData.name}
                  onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1B1A] border border-white/[0.08] text-[#FAF7F2] font-semibold text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 block">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Food', 'Craft', 'Heritage'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExtractedData({ ...extractedData, category: cat })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        extractedData.category === cat
                          ? 'bg-orange-500/20 border-orange-500 text-orange-200 shadow-sm'
                          : 'bg-[#1D1B1A] border-white/[0.06] text-[#A8A29E] hover:text-[#FAF7F2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 block">
                  Artisanal Story &amp; Specialty
                </label>
                <textarea
                  rows={2}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1B1A] border border-white/[0.08] text-[#D6D3D1] text-xs focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-orange-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={step === 'saving'}
                className="w-1/3 py-3 rounded-xl bg-[#262422]/80 hover:bg-[#262422] text-[#D6D3D1] text-xs font-medium transition-all"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleSaveToSupabase}
                disabled={step === 'saving'}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#FAF7F2] font-semibold text-xs shadow-[0_4px_20px_rgba(234,88,12,0.35)] flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish to Map &amp; RAG Directory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Celebration State */}
        {step === 'success' && createdVendor && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/15 border-2 border-orange-500/40 flex items-center justify-center mx-auto text-orange-400 shadow-[0_0_24px_rgba(234,88,12,0.3)]">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#FAF7F2] font-sans">
                Artisan Stall Successfully Onboarded!
              </h3>
              <p className="text-xs text-[#A8A29E] max-w-sm mx-auto leading-relaxed">
                <span className="font-semibold text-[#FAF7F2]">{createdVendor.name}</span> is now published in the Supabase geospatial catalog. Tourists within 500m will now discover it via Mini-RAG.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#171615] border border-white/[0.08] text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-orange-300 font-mono text-[11px]">
                <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-orange-400" /> Verified Local Artisan</span>
                <span>Lat: {createdVendor.lat.toFixed(4)}, Lng: {createdVendor.lng.toFixed(4)}</span>
              </div>
              <p className="text-[#D6D3D1] italic">"{createdVendor.description}"</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#FAF7F2] font-semibold text-xs shadow-[0_4px_20px_rgba(234,88,12,0.35)] transition-all"
            >
              Back to Explorer Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
