import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Leaf, ShieldCheck } from 'lucide-react';

export default function SignUp({ onLogin, onNavigateLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user, data.token);
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
      onLogin(data.user, data.token);
    } catch (err) {
      setError('Google sign-up failed');
    }
  };

  const inputStyle = (field) => ({
    background: focusedField === field ? '#ffffff' : 'var(--ns-surface-low)',
    borderColor: focusedField === field ? 'var(--ns-primary-con)' : 'var(--ns-outline-var)',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(16,185,129,0.12)' : 'none',
    color: 'var(--ns-on-surface)',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    fontFamily: 'var(--font-main)',
    fontSize: '0.9375rem',
    width: '100%',
    outline: 'none',
    transition: 'all 0.2s ease',
  });

  const label = (field, text) => (
    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
      style={{ color: focusedField === field ? 'var(--ns-primary)' : 'var(--ns-on-surface-var)', fontFamily: 'var(--font-main)' }}>
      {text}
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: 'var(--ns-surface)', fontFamily: 'var(--font-main)' }}>

      <div className="fixed top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(253,118,26,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm animate-fade-in-up">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #006c49, #10B981)', boxShadow: '0 8px 24px rgba(0,108,73,0.3)' }}>
            <Leaf size={30} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-center"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--ns-on-surface)', letterSpacing: '-0.02em' }}>
            NutriScan AI
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ns-outline)' }}>
            Create your account to start scanning.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold animate-streak-pop"
            style={{ background: 'var(--ns-error-con)', color: 'var(--ns-error)', borderRadius: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="signup-form">

          {/* Full Name */}
          <div>
            {label('name', 'Full Name')}
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'name' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <input type="text" placeholder="Alex Mercer" value={form.name}
                onChange={update('name')}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required id="signup-name" autoComplete="name"
                style={inputStyle('name')} />
            </div>
          </div>

          {/* Email */}
          <div>
            {label('email', 'Email Address')}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'email' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={update('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required id="signup-email" autoComplete="email"
                style={inputStyle('email')} />
            </div>
          </div>

          {/* Password */}
          <div>
            {label('password', 'Password')}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'password' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={update('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required id="signup-password" autoComplete="new-password"
                style={{ ...inputStyle('password'), paddingRight: '2.75rem' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ns-outline)', background: 'none', border: 'none', cursor: 'pointer' }} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            {label('confirm', 'Confirm Password')}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'confirm' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirm}
                onChange={update('confirm')}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                required id="signup-confirm"
                style={{ ...inputStyle('confirm'), paddingRight: '2.75rem' }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ns-outline)', background: 'none', border: 'none', cursor: 'pointer' }} tabIndex={-1}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* T&C note */}
          <p className="text-xs text-center" style={{ color: 'var(--ns-outline)' }}>
            By creating an account you agree to our{' '}
            <span className="font-semibold" style={{ color: 'var(--ns-primary)' }}>Terms</span>{' '}and{' '}
            <span className="font-semibold" style={{ color: 'var(--ns-primary)' }}>Privacy Policy</span>.
          </p>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting} id="signup-submit"
            className="btn-primary w-full"
            style={{ fontSize: '1rem', borderRadius: '12px', minHeight: '52px' }}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <>Create Account <ArrowRight size={18} /></>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--ns-outline-var)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ns-outline)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--ns-outline-var)' }} />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Sign Up Failed')}
              theme="outline" shape="rectangular" size="large" width="100%" />
          </div>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--ns-outline)' }}>
          Already have an account?{' '}
          <button onClick={onNavigateLogin} id="navigate-login"
            className="font-semibold" style={{ color: 'var(--ns-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Log In
          </button>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <ShieldCheck size={13} style={{ color: 'var(--ns-outline)' }} />
          <span className="text-xs" style={{ color: 'var(--ns-outline)' }}>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
