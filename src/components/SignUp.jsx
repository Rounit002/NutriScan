import { useState } from 'react';
import { Eye, EyeOff, Sparkles, CheckCircle, Flame } from 'lucide-react';

export default function SignUp({ onNavigateLogin, onSignUpPending }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // Defer API call; pass credentials to the Onboarding flow
      onSignUpPending({ type: 'local', name: form.name, email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nf-auth-page page-transition">
      <style>{`
        .nf-auth-page {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
          font-family: var(--font-main, 'DM Sans', sans-serif);
        }
        
        .nf-auth-sidebar {
          display: none;
          flex: 1.2;
          background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
          color: #ffffff;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .nf-auth-sidebar::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          top: -100px;
          right: -100px;
        }

        .nf-auth-sidebar::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.02);
          bottom: -150px;
          left: -150px;
        }

        .nf-sidebar-brand {
          font-family: var(--font-headline, 'Sora', sans-serif);
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .nf-sidebar-brand span {
          color: #34d399;
        }

        .nf-sidebar-hero h2 {
          font-family: var(--font-headline, 'Sora', sans-serif);
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
          letter-spacing: -0.04em;
        }

        .nf-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.08);
          padding: 16px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nf-feature-icon {
          background: rgba(255, 255, 255, 0.15);
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nf-feature-title {
          font-weight: 700;
          font-size: 1.05rem;
          margin-bottom: 4px;
        }

        .nf-feature-desc {
          font-size: 0.88rem;
          opacity: 0.85;
          line-height: 1.4;
        }

        .nf-sidebar-footer {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .nf-auth-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 24px;
          background: #ffffff;
        }

        .nf-auth-inner {
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
        }

        .nf-mobile-brand {
          font-family: var(--font-headline, 'Sora', sans-serif);
          font-size: 1.5rem;
          font-weight: 800;
          color: #047857;
          margin-bottom: 24px;
          display: block;
        }

        .nf-mobile-brand span {
          color: #10b981;
        }

        .nf-auth-title {
          font-family: var(--font-headline, 'Sora', sans-serif);
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
        }

        .nf-auth-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin-bottom: 28px;
        }

        .nf-input-group {
          width: 100%;
          margin-bottom: 16px;
        }

        .nf-input-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .nf-input {
          width: 100%;
          height: 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px !important;
          padding: 0 16px;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          background-color: #ffffff !important;
          transition: all 0.2s;
        }

        .nf-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .nf-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .nf-eye-btn:hover {
          color: #475569;
        }

        .nf-submit-btn {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: #10b981;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          margin-top: 12px;
        }

        .nf-submit-btn:hover {
          background: #059669;
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
        }

        .nf-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .nf-switch-text {
          color: #64748b;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 20px;
        }

        .nf-switch-link {
          background: none;
          border: none;
          color: #10b981;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          margin-left: 6px;
        }

        .nf-switch-link:hover {
          color: #059669;
          text-decoration: underline;
        }

        .nf-error {
          width: 100%;
          background: #fef2f2;
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid #fee2e2;
          text-align: center;
        }

        .nf-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 1024px) {
          .nf-auth-sidebar {
            display: flex;
          }
          .nf-mobile-brand {
            display: none;
          }
        }
      `}</style>

      {/* Left Sidebar Panel - Desktop Only */}
      <aside className="nf-auth-sidebar">
        <div className="nf-sidebar-brand">
          Fit<span>Scan</span>
        </div>

        <div className="nf-sidebar-hero">
          <h2>Start eating cleaner today.</h2>
          
          <div className="nf-feature-item">
            <div className="nf-feature-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="nf-feature-title">AI Label Analysis</div>
              <div className="nf-feature-desc">Instantly decode ingredients and uncover harmful additives or hidden sugars.</div>
            </div>
          </div>

          <div className="nf-feature-item">
            <div className="nf-feature-icon">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="nf-feature-title">Healthier Alternatives</div>
              <div className="nf-feature-desc">Get tailored smart suggestions for better choices matching your lifestyle.</div>
            </div>
          </div>

          <div className="nf-feature-item">
            <div className="nf-feature-icon">
              <Flame size={20} />
            </div>
            <div>
              <div className="nf-feature-title">Streak & Habits</div>
              <div className="nf-feature-desc">Log your choices, maintain your streak, and earn badges along your wellness journey.</div>
            </div>
          </div>
        </div>

        <div className="nf-sidebar-footer">
          &copy; {new Date().getFullYear()} FitScan Inc. All rights reserved.
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="nf-auth-main">
        <div className="nf-auth-inner">
          <div className="nf-mobile-brand">
            Fit<span>Scan</span>
          </div>

          <h1 className="nf-auth-title">Create Account</h1>
          <p className="nf-auth-subtitle">Join us to start tracking and scanning cleaner</p>

          {error && <div className="nf-error">{error}</div>}

          <form onSubmit={handleSubmit} id="signup-form">
            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="signup-name">Full Name</label>
              <input 
                className="nf-input" 
                type="text" 
                placeholder="John Doe" 
                value={form.name}
                onChange={update('name')} 
                required 
                id="signup-name" 
                autoComplete="name" 
              />
            </div>

            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="signup-email">Email Address</label>
              <input 
                className="nf-input" 
                type="email" 
                placeholder="you@example.com" 
                value={form.email}
                onChange={update('email')} 
                required 
                id="signup-email" 
                autoComplete="email" 
              />
            </div>

            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input 
                  className="nf-input" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={form.password} 
                  onChange={update('password')} 
                  required
                  id="signup-password" 
                  autoComplete="new-password" 
                  style={{ paddingRight: '46px' }} 
                />
                <button type="button" className="nf-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="relative">
                <input 
                  className="nf-input" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={form.confirmPassword} 
                  onChange={update('confirmPassword')} 
                  required
                  id="signup-confirm-password" 
                  autoComplete="new-password" 
                  style={{ paddingRight: '46px' }} 
                />
                <button type="button" className="nf-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="nf-submit-btn" disabled={isSubmitting} id="signup-submit">
              {isSubmitting ? <><span className="nf-spinner" /> Creating account...</> : 'Sign Up'}
            </button>
          </form>

          <p className="nf-switch-text">
            Already have an account?
            <button className="nf-switch-link" onClick={onNavigateLogin} id="navigate-login">Sign in</button>
          </p>
        </div>
      </main>
    </div>
  );
}
