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
  Edit2,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-800/95 border border-white/10 p-6 sm:p-8 shadow-2xl transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-card-glow">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              Artisan Onboard Engine <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Formless</span>
            </h2>
            <p className="text-xs text-slate-400">Snap a cart &rarr; Gemini Vision extracts &rarr; Push to Supabase</p>
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
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs font-mono text-cyan-300">
                  Gemini 2.5 Flash Vision extracting stall metadata...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Gemini Extracted Preview & Formless Confirmation */}
        {(step === 'extracted' || step === 'saving') && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-mono pb-2 border-b border-white/5">
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Gemini Vision Auto-Extracted
                </span>
                <span className="text-[11px] text-slate-400 flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-brand-400" />
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Demo Coords'}
                </span>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  Stall / Artisan Name
                </label>
                <input
                  type="text"
                  value={extractedData.name}
                  onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white font-semibold text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
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
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow'
                          : 'bg-dark-800/80 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  Artisanal Story &amp; Specialty
                </label>
                <textarea
                  rows={2}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={step === 'saving'}
                className="w-1/3 py-3 rounded-xl bg-dark-700/60 hover:bg-dark-700 text-slate-300 text-xs font-medium transition-all"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleSaveToSupabase}
                disabled={step === 'saving'}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-card-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
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
            <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500/50 flex items-center justify-center mx-auto text-brand-400 shadow-glass-glow">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">
                Artisan Stall Successfully Onboarded!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                <span className="font-semibold text-white">{createdVendor.name}</span> is now published in the Supabase geospatial catalog. Tourists within 500m will now discover it via Mini-RAG.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/60 border border-white/5 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-brand-300 font-mono text-[11px]">
                <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Local Artisan</span>
                <span>Lat: {createdVendor.lat.toFixed(4)}, Lng: {createdVendor.lng.toFixed(4)}</span>
              </div>
              <p className="text-slate-300 italic">"{createdVendor.description}"</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-semibold text-xs shadow-glass-glow transition-all"
            >
              Back to Explorer Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
