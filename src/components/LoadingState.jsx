import React, { useState, useEffect } from 'react';
import { Search, BrainCircuit, Activity, Sparkles, CheckCircle, Leaf } from 'lucide-react';

export default function LoadingState() {
  const [step, setStep] = useState(0);

  const steps = [
    { text: 'OCR Extraction',        icon: Search,      color: 'var(--ns-tertiary)' },
    { text: 'Profile Matching',      icon: Activity,    color: 'var(--ns-secondary-con)' },
    { text: 'Health Impact Analysis',icon: BrainCircuit,color: 'var(--ns-primary)' },
    { text: 'Verdict Generation',    icon: Sparkles,    color: '#10B981' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = steps[step].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in-up gap-10"
      style={{ background: 'var(--ns-surface)', fontFamily: 'var(--font-main)' }}>

      {/* Background blobs */}
      <div className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(35,172,241,0.06) 0%, transparent 70%)' }} />

      {/* Animated icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'rgba(16,185,129,0.12)', filter: 'blur(40px)', transform: 'scale(1.5)' }} />
        <div className="w-28 h-28 rounded-3xl flex items-center justify-center relative z-10 animate-float"
          style={{
            background: 'linear-gradient(135deg,#006c49,#10B981)',
            boxShadow: '0 16px 48px rgba(0,108,73,0.3)',
          }}>
          <CurrentIcon size={52} color="white" />
        </div>
        {/* Spinning ring */}
        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#ffffff', boxShadow: 'var(--shadow-md)', border: '1px solid var(--ns-outline-var)' }}>
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2.5px solid var(--ns-surface-high)', borderTopColor: 'var(--ns-primary)' }} />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--ns-on-surface)', letterSpacing: '-0.01em' }}>
          Analyzing...
        </h2>
        <div className="flex items-center justify-center gap-1.5">
          <Leaf size={13} style={{ color: 'var(--ns-primary)' }} />
          <p className="text-xs font-semibold" style={{ color: 'var(--ns-outline)' }}>NutriScan AI Processing</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--ns-outline)', opacity: 0.6 }}>High demand may add a few seconds</p>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {steps.map((s, idx) => {
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div key={idx} className="flex items-center gap-3 transition-all duration-500"
              style={{ opacity: isActive || isDone ? 1 : 0.35, transform: isActive ? 'scale(1.03)' : 'scale(1)', transformOrigin: 'left' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: isDone ? 'rgba(16,185,129,0.12)' : isActive ? s.color + '18' : 'var(--ns-surface-con)',
                  border: `1.5px solid ${isDone ? 'rgba(16,185,129,0.3)' : isActive ? s.color + '55' : 'var(--ns-outline-var)'}`,
                }}>
                {isDone
                  ? <CheckCircle size={18} style={{ color: '#10B981' }} />
                  : <s.icon size={18} style={{ color: isActive ? s.color : 'var(--ns-outline)' }} className={isActive ? 'animate-pulse' : ''} />}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold" style={{ color: isActive ? 'var(--ns-on-surface)' : 'var(--ns-outline)', fontFamily: 'var(--font-main)' }}>
                  {s.text}
                </span>
                {isActive && (
                  <div className="h-1 w-full rounded-full mt-1 overflow-hidden" style={{ background: 'var(--ns-surface-high)' }}>
                    <div className="h-full rounded-full" style={{ background: s.color, animation: 'ns-loading 2.2s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ns-loading {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      ` }} />
    </div>
  );
}
