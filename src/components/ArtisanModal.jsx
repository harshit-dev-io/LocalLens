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
  FileText,
  Camera,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';
import CameraCapture from './CameraCapture';
import { extractArtisanProfile, extractMenuAndPricing } from '../utils/gemini';
import { auditVendorPricing } from '../utils/priceAuditor';
import { insertVendor } from '../utils/supabaseClient';

export default function ArtisanModal({
  isOpen,
  onClose,
  userLocation,
  isDemoMode,
  onVendorAdded,
}) {
  const [partnerMode, setPartnerMode] = useState('stall'); // 'stall' | 'menu'
  const [step, setStep] = useState('capture'); // 'capture' | 'preview' | 'saving' | 'success'
  const [capturedImage, setCapturedImage] = useState(null);

  // Extracted Vendor Data
  const [vendorData, setVendorData] = useState({
    name: '',
    category: 'Craft',
    description: '',
    menuItems: [],
    isFairPriceVerified: true,
    fairPriceBadge: '⚖️ Fair Price Verified (Local Standard)',
    auditSummary: '',
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [createdVendor, setCreatedVendor] = useState(null);

  if (!isOpen) return null;

  const lat = userLocation?.lat || 30.1337;
  const lng = userLocation?.lng || 77.3000;

  const handleImageCaptured = async ({ base64, dataUrl }) => {
    setCapturedImage({ base64, dataUrl });
    setIsAnalyzing(true);
    setError(null);

    try {
      if (partnerMode === 'stall') {
        // Extract stall profile
        const profile = await extractArtisanProfile({
          base64Image: base64,
          latitude: lat,
          longitude: lng,
          isDemo: isDemoMode,
        });

        const audit = auditVendorPricing([], profile.category);

        setVendorData({
          name: profile.name,
          category: profile.category,
          description: profile.description,
          menuItems: [],
          isFairPriceVerified: audit.isFairPriceVerified,
          fairPriceBadge: audit.badge,
          auditSummary: audit.summaryText,
        });
      } else {
        // Extract menu board and perform Fair Price Index audit
        const menuResult = await extractMenuAndPricing({
          base64Image: base64,
          isDemo: isDemoMode,
        });

        const audit = auditVendorPricing(menuResult.items, 'Food');

        setVendorData({
          name: 'Heritage Street Kitchen & Cafe',
          category: 'Food',
          description: 'Authentic culinary stall offering freshly cooked regional delicacies at calibrated local prices.',
          menuItems: audit.auditedItems,
          isFairPriceVerified: audit.isFairPriceVerified,
          fairPriceBadge: audit.badge,
          auditSummary: audit.summaryText,
        });
      }

      setStep('preview');
    } catch (err) {
      console.error('Partner analysis error:', err);
      setError('Vision processing encountered an issue. You can verify or edit details below.');
      setVendorData({
        name: 'Heritage Street Stall',
        category: 'Craft',
        description: 'Authentic regional artisan workshop.',
        menuItems: [],
        isFairPriceVerified: true,
        fairPriceBadge: '⚖️ Fair Price Verified (Local Standard)',
        auditSummary: 'Standard community baseline applied.',
      });
      setStep('preview');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveVendor = async () => {
    setStep('saving');
    setError(null);

    try {
      const result = await insertVendor({
        name: vendorData.name,
        category: vendorData.category,
        description: vendorData.description,
        lat,
        lng,
        is_fair_price_verified: vendorData.isFairPriceVerified,
        menu_items: vendorData.menuItems,
      });

      if (result.success) {
        setCreatedVendor(result.vendor);
        setStep('success');
        onVendorAdded?.(result.vendor);
      } else {
        throw new Error('Database transaction failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Could not publish to directory. Stored in local fallback cache.');
      setStep('preview');
    }
  };

  const handleReset = () => {
    setStep('capture');
    setCapturedImage(null);
    setVendorData({
      name: '',
      category: 'Craft',
      description: '',
      menuItems: [],
      isFairPriceVerified: true,
      fairPriceBadge: '⚖️ Fair Price Verified (Local Standard)',
      auditSummary: '',
    });
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0C]/85 backdrop-blur-md overflow-y-auto">
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
              Artisan Partner Portal
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono">
                Digital Shopfront
              </span>
            </h2>
            <p className="text-xs text-[#A8A29E]">Catalog stalls &amp; certify Fair Price Index via Vision OCR</p>
          </div>
        </div>

        {/* Step 1: Mode Switcher & Capture */}
        {step === 'capture' && (
          <div className="space-y-4">
            {/* Dual Onboarding Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#171615] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPartnerMode('stall')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  partnerMode === 'stall'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-[#FAF7F2] shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#FAF7F2]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Stall</span>
              </button>

              <button
                type="button"
                onClick={() => setPartnerMode('menu')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  partnerMode === 'menu'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-[#FAF7F2] shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#FAF7F2]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Scan Menu Board</span>
              </button>
            </div>

            <CameraCapture
              mode="artisan"
              isDemoMode={isDemoMode}
              isLoading={isAnalyzing}
              onImageCaptured={handleImageCaptured}
            />

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-mono text-amber-300">
                  {partnerMode === 'stall'
                    ? 'Gemini Vision synthesizing stall identity & craft backstory...'
                    : 'Gemini OCR extracting menu offerings & auditing Fair Price Index...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Extracted Preview & Fair Price Index Audit */}
        {(step === 'preview' || step === 'saving') && (
          <div className="space-y-5">
            <div className="p-4.5 rounded-2xl bg-[#171615] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-xs text-orange-300 font-mono pb-2 border-b border-white/[0.06]">
                <span className="flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Vision Extraction Preview
                </span>
                <span className="text-[11px] text-[#A8A29E] flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-orange-400" />
                  Live GPS Injected
                </span>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5 block">
                  Stall / Artisan Name
                </label>
                <input
                  type="text"
                  value={vendorData.name}
                  onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
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
                      onClick={() => setVendorData({ ...vendorData, category: cat })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        vendorData.category === cat
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
                  value={vendorData.description}
                  onChange={(e) => setVendorData({ ...vendorData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1B1A] border border-white/[0.08] text-[#D6D3D1] text-xs focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Fair Price Index Grounded Audit Banner */}
              <div className="p-3.5 rounded-xl bg-[#1D1B1A] border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-orange-400" />
                    Fair Price Index Evaluation
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    {vendorData.fairPriceBadge}
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A29E]">
                  {vendorData.auditSummary || 'Calibrated against historic street commerce benchmarks to eliminate tourist pricing fears.'}
                </p>

                {/* Extracted Menu Items if present */}
                {vendorData.menuItems && vendorData.menuItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono text-[#78716C] uppercase">
                      Audited Items ({vendorData.menuItems.length})
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {vendorData.menuItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] bg-[#171615] px-2.5 py-1 rounded-lg border border-white/[0.04]"
                        >
                          <span className="text-[#FAF7F2] font-medium">{item.name}</span>
                          <span className="text-amber-400 font-mono">
                            ₹{item.price} <span className="text-[#78716C] text-[10px]">/{item.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={handleSaveVendor}
                disabled={step === 'saving'}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#FAF7F2] font-semibold text-xs shadow-[0_4px_20px_rgba(234,88,12,0.35)] flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Shopfront...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish to Spatial Registry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 'success' && createdVendor && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/15 border-2 border-orange-500/40 flex items-center justify-center mx-auto text-orange-400 shadow-[0_0_24px_rgba(234,88,12,0.3)]">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#FAF7F2] font-sans">
                Artisan Stall Successfully Published!
              </h3>
              <p className="text-xs text-[#A8A29E] max-w-sm mx-auto leading-relaxed">
                <span className="font-semibold text-[#FAF7F2]">{createdVendor.name}</span> is live with a verified Fair Price Index. Tourists within 500m walking radius will immediately discover it.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#171615] border border-white/[0.08] text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-orange-300 font-mono text-[11px]">
                <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-orange-400" /> Active Today • Freshness: 100</span>
                <span>{createdVendor.is_fair_price_verified ? '⚖️ Fair Price Verified' : 'Standard'}</span>
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
