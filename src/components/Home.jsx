import React, { useRef } from 'react';
import { Camera, Upload, Barcode, ArrowLeft, Mic } from 'lucide-react';

export default function Home({ onImageSelected, onNavigateProfile, onBack, onNavigateBarcode, onNavigateNote }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxDim = 1200;
        if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } }
        else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        onImageSelected(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    if (fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }
  };
  const openGallery = () => {
    if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-24 animate-fade-in-up" style={{ background: 'var(--ns-surface)', fontFamily: 'var(--font-main)' }}>
      
      {/* Abstract Background Elements */}
      <div className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(35,172,241,0.05) 0%, transparent 70%)' }} />

      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      <div className="w-full max-w-md px-6 flex flex-col gap-6 pt-12 relative z-10">
        
        {/* Header */}
        <div className="relative flex items-center justify-center mb-2">
          <button onClick={onBack} className="absolute left-0 p-2 rounded-full transition-colors flex items-center justify-center bg-white/5 hover:bg-white/10" style={{ color: 'var(--ns-on-surface-var)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-widest uppercase" style={{ fontFamily: 'var(--font-headline)', color: 'var(--ns-on-surface)' }}>
            SCAN
          </h1>
        </div>

        {/* Large Camera Button */}
        <button 
          onClick={openCamera}
          className="w-full aspect-square rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all hover:scale-[0.98] active:scale-95 group relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(0,108,73,0.1), rgba(16,185,129,0.05))',
            border: '1.5px solid rgba(16,185,129,0.3)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.05)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg,#006c49,#10B981)', boxShadow: '0 8px 24px rgba(0,108,73,0.4)' }}>
            <Camera size={36} color="white" />
          </div>
          <span className="text-xl font-bold tracking-wide" style={{ color: 'var(--ns-primary)', fontFamily: 'var(--font-headline)' }}>Camera</span>
        </button>

        {/* Action Row: Barcode & Upload */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onNavigateBarcode}
            className="rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[0.98] active:scale-95 group relative overflow-hidden"
            style={{ 
              background: 'rgba(35,172,241,0.05)',
              border: '1.5px solid rgba(35,172,241,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'rgba(35,172,241,0.15)' }}>
              <Barcode size={24} style={{ color: 'var(--ns-tertiary-con)' }} />
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--ns-on-surface)' }}>Barcode</span>
          </button>

          <button 
            onClick={openGallery}
            className="rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[0.98] active:scale-95 group relative overflow-hidden"
            style={{ 
              background: 'rgba(253,118,26,0.05)',
              border: '1.5px solid rgba(253,118,26,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'rgba(253,118,26,0.15)' }}>
              <Upload size={24} style={{ color: 'var(--ns-secondary-con)' }} />
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--ns-on-surface)' }}>Upload</span>
          </button>
        </div>

        {/* Note Button */}
        <button 
          onClick={onNavigateNote}
          className="w-full rounded-[24px] p-5 flex items-center justify-center gap-3 transition-all hover:scale-[0.98] active:scale-95 group mt-2 relative overflow-hidden"
          style={{ 
            background: 'var(--ns-surface-low)',
            border: '1.5px solid var(--ns-outline-var)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Mic size={20} style={{ color: 'var(--ns-on-surface-var)' }} />
          <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--ns-on-surface)' }}>Note</span>
        </button>

      </div>
    </div>
  );
}
