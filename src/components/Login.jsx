import { useState } from 'react';
import { Eye, EyeOff, Sparkles, CheckCircle, Flame } from 'lucide-react';

export default function Login({ onLogin, onNavigateSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user, null, data.deletionCancelled);
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
          margin-bottom: 32px;
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
          margin-bottom: 32px;
        }

        .nf-input-group {
          width: 100%;
          margin-bottom: 20px;
        }

        .nf-input-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .nf-input {
          width: 100%;
          height: 48px;
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

        .nf-forgot {
          display: flex;
          justify-content: flex-end;
          width: 100%;
          margin-bottom: 24px;
        }

        .nf-forgot button {
          background: none;
          border: none;
          color: #10b981;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .nf-forgot button:hover {
          color: #059669;
          text-decoration: underline;
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

        .nf-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          margin: 32px 0 24px;
        }

        .nf-divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .nf-divider-text {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .nf-social-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .nf-google-wrap {
          border-radius: 12px;
          overflow: hidden;
          width: 54px;
          height: 40px;
          background: #f1f5f9;
          display: grid;
          place-items: center;
          position: relative;
          border: 1px solid #e2e8f0;
        }

        .nf-google-wrap:hover {
          background: #e2e8f0;
        }

        .nf-google-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          font-size: 1.2rem;
          font-weight: 800;
          pointer-events: none;
        }

        .nf-google-control {
          position: absolute;
          inset: 0;
          opacity: 0.01;
        }

        .nf-google-control > div {
          width: 100% !important;
          height: 100% !important;
        }

        .nf-social-btn {
          width: 54px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 800;
          color: #334155;
          background: #f1f5f9;
        }

        .nf-social-btn:hover {
          background: #e2e8f0;
        }

        .nf-switch-text {
          color: #64748b;
          font-size: 0.9rem;
          text-align: center;
          margin: 0;
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
          margin-bottom: 24px;
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
          <h2>Know exactly what you eat.</h2>
          
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

          <h1 className="nf-auth-title">Welcome back</h1>
          <p className="nf-auth-subtitle">Log in to your account to continue</p>

          {error && <div className="nf-error">{error}</div>}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="login-email">Email Address</label>
              <input 
                className="nf-input" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
                id="login-email" 
                autoComplete="email" 
              />
            </div>

            <div className="nf-input-group">
              <label className="nf-input-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input 
                  className="nf-input" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  id="login-password" 
                  autoComplete="current-password" 
                  style={{ paddingRight: '46px' }} 
                />
                <button type="button" className="nf-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="nf-forgot">
              <button type="button">Forgot your password?</button>
            </div>

            <button type="submit" className="nf-submit-btn" disabled={isSubmitting} id="login-submit">
              {isSubmitting ? <><span className="nf-spinner" /> Logging in...</> : 'Log In'}
            </button>
          </form>



          <p className="nf-switch-text">
            Don't have an account?
            <button className="nf-switch-link" onClick={onNavigateSignup} id="navigate-signup">Sign up for free</button>
          </p>
        </div>
      </main>
    </div>
  );
}
