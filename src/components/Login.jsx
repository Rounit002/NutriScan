import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Eye, EyeOff } from 'lucide-react';

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
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user, data.token, data.deletionCancelled);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await fetch('http://localhost:5000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decoded.email, name: decoded.name, googleId: decoded.sub })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user, data.token, data.deletionCancelled);
    } catch {
      setError('Google login failed');
    }
  };

  return (
    <div className="nf-auth-page">
      <style>{`
        .nf-auth-page {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center;
          background: #ffffff !important; font-family: var(--font-main, 'Inter', sans-serif);
          padding: clamp(34px, 8vh, 70px) 28px 34px; box-sizing: border-box;
        }
        .nf-auth-page *, .nf-auth-page *::before, .nf-auth-page *::after { box-sizing: border-box; }
        .nf-auth-page input, .nf-auth-page select, .nf-auth-page textarea {
          background-color: #ffffff !important;
        }
        .nf-auth-inner { width: 100%; max-width: 340px; display: flex; flex-direction: column; align-items: center; }
        .nf-brand { align-self: flex-start; margin: 0 0 clamp(34px, 9vh, 62px); font-family: Georgia, serif; font-size: 1.55rem; line-height: 1; letter-spacing: -0.055em; color: #5C6B3C; }
        .nf-brand-flow { color: #8A8275; font-weight: 700; }
        .nf-auth-title { font-size: 1.72rem; font-weight: 850; color: #080808; text-align: center; margin: 0 0 36px; letter-spacing: -0.04em; }
        .nf-input-group { width: 100%; margin-bottom: 18px; }
        .nf-input {
          width: 100%; height: 32px; border: 1.4px solid #d9e1da; border-radius: 6px !important; padding: 0 10px;
          font-size: 0.86rem; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit; box-sizing: border-box;
        }
        .nf-input::placeholder { color: #aeb5af; font-weight: 500; }
        .nf-input:focus { border-color: #5C6B3C; box-shadow: 0 0 0 3px rgba(92, 107, 60, 0.1); }
        .nf-input-wrapper { position: relative; }
        .nf-eye-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #bbb; cursor: pointer; padding: 4px;
        }
        .nf-forgot { text-align: right; width: 100%; margin-top: -4px; margin-bottom: clamp(34px, 8vh, 52px); }
        .nf-forgot button { background: none; border: none; color: #111; font-size: 0.82rem; font-weight: 800; cursor: pointer; padding: 0; }
        .nf-submit-btn {
          width: 100%; height: 45px; border-radius: 999px; border: none;
          background: #5C6B3C; color: #fff; font-size: 0.9rem; font-weight: 800;
          cursor: pointer; transition: all 0.2s; margin-top: 0; letter-spacing: 0;
          box-shadow: 0 8px 18px rgba(92, 107, 60, 0.22);
        }
        .nf-submit-btn:hover { background: #4A5731; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(92, 107, 60, 0.28); }
        .nf-submit-btn:active { transform: translateY(0); }
        .nf-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .nf-divider { display: flex; align-items: center; gap: 12px; width: 100%; margin: clamp(48px, 10vh, 64px) 0 22px; }
        .nf-divider-line { flex: 1; height: 1px; background: #dfe3df; }
        .nf-divider-text { color: #777; font-size: 0.72rem; font-weight: 700; }
        .nf-social-row { display: flex; gap: 10px; justify-content: center; margin-bottom: clamp(42px, 10vh, 58px); }
        .nf-social-btn {
          width: 48px; height: 34px; border-radius: 8px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 1.15rem;
          font-weight: 800; color: #fff; transition: transform 0.15s; background: #5C6B3C;
        }
        .nf-social-btn:hover { transform: scale(1.05); }
        .nf-google-wrap {
          border-radius: 8px; overflow: hidden; width: 48px; height: 34px; background: #5C6B3C;
          display: grid; place-items: center; position: relative; transition: transform 0.15s;
        }
        .nf-google-wrap:hover { transform: scale(1.05); }
        .nf-google-face {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 1.12rem; font-weight: 900; line-height: 1; pointer-events: none;
        }
        .nf-google-control { position: absolute; inset: 0; opacity: 0.01; }
        .nf-google-control > div { width: 100% !important; height: 100% !important; }
        .nf-switch-text { color: #161616; font-size: 0.78rem; text-align: center; font-weight: 650; margin: 0; }
        .nf-switch-link { display: block; margin: 12px auto 0; background: none; border: none; color: #5C6B3C; font-weight: 800; cursor: pointer; font-size: 0.88rem; }
        .nf-error { width: 100%; background: #FFF0F0; color: #D32F2F; padding: 10px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; margin-bottom: 14px; text-align: center; }
        .nf-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <main className="nf-auth-inner">
        <div className="nf-brand">Fit<span className="nf-brand-flow">Scan</span></div>

        <h1 className="nf-auth-title">Log In</h1>

        {error && <div className="nf-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} id="login-form">
          <div className="nf-input-group">
            <input className="nf-input" type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required id="login-email" autoComplete="email" />
          </div>

          <div className="nf-input-group">
            <div className="nf-input-wrapper">
              <input className="nf-input" type={showPassword ? 'text' : 'password'} placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
                id="login-password" autoComplete="current-password" style={{ paddingRight: '34px' }} />
              <button type="button" className="nf-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="nf-forgot">
            <button type="button">Forgot your password?</button>
          </div>

          <button type="submit" className="nf-submit-btn" disabled={isSubmitting} id="login-submit">
            {isSubmitting ? <><span className="nf-spinner" /> Signing in...</> : 'Log In'}
          </button>
        </form>

        <div className="nf-divider">
          <div className="nf-divider-line" />
          <span className="nf-divider-text">or</span>
          <div className="nf-divider-line" />
        </div>

        <div className="nf-social-row">
          <div className="nf-google-wrap">
            <span className="nf-google-face" aria-hidden="true">G</span>
            <div className="nf-google-control">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                type="icon"
                shape="rectangular"
                size="large"
              />
            </div>
          </div>
          <button className="nf-social-btn" title="Facebook">f</button>
          <button className="nf-social-btn" title="Apple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
          </button>
        </div>

        <p className="nf-switch-text">
          Don't have account yet?
          <button className="nf-switch-link" onClick={onNavigateSignup} id="navigate-signup">Sign up</button>
        </p>
      </main>
    </div>
  );
}
