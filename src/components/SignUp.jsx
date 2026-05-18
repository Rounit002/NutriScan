import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="nf-auth-page">
      <style>{`
        .nf-auth-page {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center;
          background: #ffffff !important; font-family: var(--font-main, 'Inter', sans-serif);
          padding: clamp(28px, 6vh, 46px) 28px 34px; box-sizing: border-box;
        }
        .nf-auth-page *, .nf-auth-page *::before, .nf-auth-page *::after { box-sizing: border-box; }
        .nf-auth-page input, .nf-auth-page select, .nf-auth-page textarea {
          background-color: #ffffff !important;
        }
        .nf-auth-inner { width: 100%; max-width: 340px; display: flex; flex-direction: column; align-items: center; }
        .nf-brand { align-self: flex-start; margin: 0 0 12px; font-family: Georgia, serif; font-size: 1.55rem; line-height: 1; letter-spacing: -0.055em; color: #5C6B3C; }
        .nf-brand-flow { color: #8A8275; font-weight: 700; }
        .nf-food-img { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 0 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .nf-auth-title { font-size: 1.72rem; font-weight: 850; color: #080808; text-align: center; margin: 0 0 34px; letter-spacing: -0.04em; }
        .nf-input-group { width: 100%; margin-bottom: 20px; }
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
        .nf-submit-btn {
          width: 100%; height: 45px; border-radius: 999px; border: none;
          background: #5C6B3C; color: #fff; font-size: 0.9rem; font-weight: 800;
          cursor: pointer; transition: all 0.2s; margin-top: clamp(28px, 6vh, 44px); letter-spacing: 0;
          box-shadow: 0 8px 18px rgba(92, 107, 60, 0.22);
        }
        .nf-submit-btn:hover { background: #4A5731; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(92, 107, 60, 0.28); }
        .nf-submit-btn:active { transform: translateY(0); }
        .nf-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .nf-switch-text { color: #161616; font-size: 0.78rem; text-align: center; font-weight: 650; margin: 16px 0 0; }
        .nf-switch-link { display: block; margin: 12px auto 0; background: none; border: none; color: #5C6B3C; font-weight: 800; cursor: pointer; font-size: 0.88rem; }
        .nf-error { width: 100%; background: #FFF0F0; color: #D32F2F; padding: 10px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; margin-bottom: 14px; text-align: center; }
        .nf-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: nfspin 0.6s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
        @keyframes nfspin { to { transform: rotate(360deg); } }
      `}</style>

      <main className="nf-auth-inner">
        <div className="nf-brand">Fit<span className="nf-brand-flow">Scan</span></div>
        <img src="/signup_food.png" alt="Healthy food bowl" className="nf-food-img" />

        <h1 className="nf-auth-title">Sign Up</h1>

        {error && <div className="nf-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} id="signup-form">
          <div className="nf-input-group">
            <input className="nf-input" type="text" placeholder="Name" value={form.name}
              onChange={update('name')} required id="signup-name" autoComplete="name" />
          </div>

          <div className="nf-input-group">
            <input className="nf-input" type="email" placeholder="Email" value={form.email}
              onChange={update('email')} required id="signup-email" autoComplete="email" />
          </div>

          <div className="nf-input-group">
            <div className="nf-input-wrapper">
              <input className="nf-input" type={showPassword ? 'text' : 'password'} placeholder="Password"
                value={form.password} onChange={update('password')} required
                id="signup-password" autoComplete="new-password" style={{ paddingRight: '34px' }} />
              <button type="button" className="nf-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="nf-input-group">
            <div className="nf-input-wrapper">
              <input className="nf-input" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password"
                value={form.confirmPassword} onChange={update('confirmPassword')} required
                id="signup-confirm-password" autoComplete="new-password" style={{ paddingRight: '34px' }} />
              <button type="button" className="nf-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="nf-submit-btn" disabled={isSubmitting} id="signup-submit">
            {isSubmitting ? <><span className="nf-spinner" /> Creating...</> : 'Sign Up'}
          </button>
        </form>

        <p className="nf-switch-text">
          Already have an account?
          <button className="nf-switch-link" onClick={onNavigateLogin} id="navigate-login">Sign in</button>
        </p>
      </main>
    </div>
  );
}
