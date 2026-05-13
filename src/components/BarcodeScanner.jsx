import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Barcode, ShieldCheck, Zap } from 'lucide-react';

export default function BarcodeScanner({ onScan, onBack }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (err) => {
        // Silently handle scan errors
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
    };
  }, [onScan]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up px-6 py-10 pb-32 min-h-screen">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center relative z-10 mb-8 w-full">
        <div className="flex justify-start">
          <button onClick={onBack} className="w-10 h-10 glass-card flex items-center justify-center !p-0 border-none hover:bg-white/10">
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest text-center">Scanner</h1>
        <div className="flex justify-end w-10"></div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white leading-tight">Barcode Scan</h2>
        <p className="text-secondary text-xs font-bold opacity-60">Align the code within the frame</p>
      </div>

      <div className="glass-card !p-2 overflow-hidden bg-white group relative shadow-2xl" style={{ borderRadius: '24px' }}>
        <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div id="reader" className="w-full text-black font-bold"></div>
      </div>

      <div className="glass-card !p-5 border-none flex items-center gap-4 bg-white/[0.02]" style={{ borderRadius: '24px' }}>
        <div className="w-10 h-10 shrink-0 bg-accent-secondary/10 rounded-full flex items-center justify-center">
          <Barcode size={20} className="text-accent-secondary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.2em] mb-0.5">Instant Fetch</span>
          <p className="text-[11px] text-secondary font-bold leading-tight">
            We sync with <span className="text-white">Open Food Facts</span> to pull real-time data.
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-2 opacity-30">
        <ShieldCheck size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">Powered by FitScan AI</span>
      </div>
    </div>
  );
}
