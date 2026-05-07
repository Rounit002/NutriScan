import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  AlertCircle,
  Calendar,
  Scale,
  Ruler
} from 'lucide-react';
import { MedicalProfilePage, HealthGoalsPage } from './Profile';

export default function Onboarding({ onComplete, initialProfile, userAuth, authToken, onBack }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  // Initialize profile state from initialProfile or defaults
  const [profile, setProfile] = useState(() => ({
    age: initialProfile?.age || '',
    height: initialProfile?.height || '',
    weight: initialProfile?.weight || '',
    dateOfBirth: initialProfile?.dateOfBirth || initialProfile?.dob || '',
    gender: initialProfile?.gender || 'Male',
    conditions: initialProfile?.conditions || [],
    goals: initialProfile?.goals || []
  }));

  const updateProfile = (fields) => {
    setProfile(prev => ({ ...prev, ...fields }));
  };

  const handleBasicsSubmit = async (e) => {
    e.preventDefault();
    if (!profile.age || !profile.height || !profile.weight || !profile.dateOfBirth) {
      setError('Please fill in all details to continue');
      return;
    }

    // Save basic details before moving to step 2
    try {
      if (authToken) {
        await fetch('http://localhost:5000/auth/details', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            profile: {
              age: profile.age,
              height: profile.height,
              weight: profile.weight,
              dateOfBirth: profile.dateOfBirth,
              gender: profile.gender
            }
          })
        });
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setError('Failed to save details. Please try again.');
    }
  };

  const handleMedicalSaved = (updatedUser) => {
    // When medical profile is saved, we move to step 3
    if (updatedUser?.profile) {
      updateProfile({ conditions: updatedUser.profile.conditions });
    }
    setStep(3);
  };

  const handleGoalsSaved = (updatedUser) => {
    // When goals are saved, we complete onboarding
    if (updatedUser?.profile) {
      onComplete(updatedUser.profile);
    } else {
      onComplete(profile);
    }
  };

  const handleStepBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const inputStyle = {
    background: 'var(--ns-surface-low)',
    border: '1.5px solid var(--ns-outline-var)',
    borderRadius: '16px',
    padding: '0.875rem 1rem 0.875rem 3.5rem',
    color: 'var(--ns-on-surface)',
    width: '100%',
    fontSize: '1rem',
    fontWeight: '700',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: 'var(--ns-on-surface)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '0.6rem',
    display: 'block',
    paddingLeft: '0.25rem',
    opacity: 0.8
  };

  return (
    <div className="onboarding-flow min-h-screen" style={{ background: 'var(--ns-surface)', color: 'var(--ns-on-surface)', fontFamily: 'var(--font-main)' }}>
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[120px]" 
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full blur-[120px]" 
          style={{ background: 'radial-gradient(circle, rgba(253, 118, 26, 0.08) 0%, transparent 70%)' }} />
      </div>

      {step === 1 && (
        <div className="relative z-10 px-6 py-10 flex flex-col min-h-screen animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={handleStepBack} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-var(--ns-outline-var) shadow-sm">
              <ArrowLeft size={20} color="var(--ns-on-surface)" />
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-[#10B981]' : 'w-2 bg-[#bbcabf]'}`} />
              ))}
            </div>
            <div className="w-10" />
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#10B981]/10 rounded-2xl border border-[#10B981]/20 mb-4">
              <Sparkles size={28} className="text-[#10B981]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--ns-on-surface)' }}>Personalize Your Journey</h1>
            <p className="text-var(--ns-on-surface-var) text-sm font-bold opacity-80">We'll use these to tailor your nutritional analysis.</p>
          </div>

          <form onSubmit={handleBasicsSubmit} className="flex-1 flex flex-col gap-6">
            <div className="ns-card !p-6 border-var(--ns-outline-var) bg-white space-y-5 shadow-lg">
              
              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Age</label>
                  <div className="relative">
                    <Activity size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] opacity-70" />
                    <input 
                      type="number" 
                      placeholder="24" 
                      value={profile.age}
                      onChange={e => updateProfile({ age: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] opacity-70" />
                    <select 
                      value={profile.gender}
                      onChange={e => updateProfile({ gender: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-var(--ns-outline) pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Height & Weight Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Height (cm)</label>
                  <div className="relative">
                    <Ruler size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] opacity-70" />
                    <input 
                      type="number" 
                      placeholder="175" 
                      value={profile.height}
                      onChange={e => updateProfile({ height: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Weight (kg)</label>
                  <div className="relative">
                    <Scale size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fd761a] opacity-70" />
                    <input 
                      type="number" 
                      placeholder="70" 
                      value={profile.weight}
                      onChange={e => updateProfile({ weight: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* DOB */}
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#23acf1] opacity-70" />
                  <input 
                    type="date" 
                    value={profile.dateOfBirth}
                    onChange={e => updateProfile({ dateOfBirth: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-black uppercase tracking-wider animate-shake px-1">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>

            <div className="mt-auto pt-6">
              <button 
                type="submit" 
                className="w-full btn-primary !h-16 text-lg rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #006c49 0%, #10B981 100%)', border: 'none', color: 'white' }}
              >
                Continue <ChevronRight size={20} />
              </button>
              
              <div className="flex items-center justify-center gap-3 mt-6 opacity-70">
                <ShieldCheck size={16} className="text-[#10B981]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-var(--ns-on-surface)">Secure & Confidential</p>
              </div>
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <MedicalProfilePage 
          userProfile={profile}
          authToken={authToken}
          isOnboarding={true}
          onBack={handleStepBack}
          onDetailsSaved={handleMedicalSaved}
        />
      )}

      {step === 3 && (
        <HealthGoalsPage 
          userProfile={profile}
          authToken={authToken}
          isOnboarding={true}
          onBack={handleStepBack}
          onDetailsSaved={handleGoalsSaved}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .medical-profile-page, .health-goals-page {
          background: var(--ns-surface) !important;
          color: var(--ns-on-surface) !important;
        }
        .medical-profile-shell, .health-goals-shell {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding-top: 20px !important;
        }
        .medical-profile-header h1, .health-goals-header h1 {
          color: var(--ns-on-surface) !important;
          font-weight: 900 !important;
          font-family: var(--font-headline) !important;
        }
        .medical-search-box, .health-goals-search-box {
          background: white !important;
          border-color: var(--ns-outline-var) !important;
          box-shadow: 0 4px 12px rgba(11, 28, 48, 0.06) !important;
        }
        .medical-search-box input, .health-goals-search-box input {
          color: var(--ns-on-surface) !important;
          font-weight: 700 !important;
        }
        .medical-issue-item, .health-goals-list button {
          background: white !important;
          border-color: var(--ns-outline-var) !important;
          color: var(--ns-on-surface) !important;
          box-shadow: 0 4px 12px rgba(11, 28, 48, 0.04) !important;
        }
        .medical-issue-item.is-selected, .health-goals-list button.is-selected {
          border-color: #10B981 !important;
          background: rgba(16, 185, 129, 0.08) !important;
          color: #006c49 !important;
        }
        .medical-save-button, .health-goals-save-button {
          height: 64px !important;
          border-radius: 16px !important;
          background: linear-gradient(135deg, #006c49 0%, #10B981 100%) !important;
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.25) !important;
          font-size: 1.1rem !important;
          font-weight: 900 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          color: white !important;
        }
        .medical-summary-card, .health-goals-summary-card {
          background: white !important;
          border-color: var(--ns-outline-var) !important;
          box-shadow: 0 8px 24px rgba(11, 28, 48, 0.08) !important;
        }
        .medical-summary-title, .health-goals-summary-title {
          color: var(--ns-on-surface) !important;
          font-weight: 900 !important;
        }
        .medical-selected-strip button, .health-goals-selected-strip button {
          background: rgba(16, 185, 129, 0.12) !important;
          color: #006c49 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          font-weight: 800 !important;
        }
        .medical-issue-item button span, .health-goals-list button span {
           font-weight: 800 !important;
           color: var(--ns-on-surface) !important;
        }
        .medical-issue-item button strong, .health-goals-list button strong {
           color: #10B981 !important;
           font-weight: 900 !important;
        }
        .personal-detail-row label {
          color: var(--ns-on-surface-var) !important;
          font-weight: 700 !important;
          opacity: 0.8 !important;
        }
        .personal-detail-row strong {
          color: var(--ns-on-surface) !important;
          font-weight: 900 !important;
        }
      `}} />
    </div>
  );
}
