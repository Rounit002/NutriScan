import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Field, Label, Input, Description } from '@headlessui/react';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Leaf } from 'lucide-react';

export default function Login({ onLogin, onNavigateSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
      setError('Google login failed');
    }
  };

  const inputStyle = (field) => ({
    background: focusedField === field ? '#ffffff' : 'var(--ns-surface-low)',
    borderColor: focusedField === field ? 'var(--ns-primary-con)' : 'var(--ns-outline-var)',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(75, 111, 68,0.12)' : 'none',
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

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: 'var(--ns-surface)', fontFamily: 'var(--font-main)' }}>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(75, 111, 68,0.08) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(35,172,241,0.07) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm animate-fade-in-up">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #4B6F44, #4B6F44)', boxShadow: '0 8px 24px rgba(75, 111, 68,0.3)' }}>
            <Leaf size={30} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-center" style={{ fontFamily: 'var(--font-headline)', color: 'var(--ns-on-surface)', letterSpacing: '-0.02em' }}>
            NutriScan AI
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ns-outline)' }}>
            Welcome back. Enter your details to continue.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold animate-streak-pop"
            style={{ background: 'var(--ns-error-con)', color: 'var(--ns-error)', borderRadius: '12px' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="login-form">

          {/* Email */}
          <Field>
            <Label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: focusedField === 'email' ? 'var(--ns-primary)' : 'var(--ns-on-surface-var)', fontFamily: 'var(--font-main)' }}>
              Email Address
            </Label>
            <Description className="sr-only">Enter your email</Description>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'email' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                id="login-email"
                autoComplete="email"
                style={inputStyle('email')}
              />
            </div>
          </Field>

          {/* Password */}
          <Field>
            <div className="flex justify-between items-center mb-2">
              <Label className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: focusedField === 'password' ? 'var(--ns-primary)' : 'var(--ns-on-surface-var)', fontFamily: 'var(--font-main)' }}>
                Password
              </Label>
              <button type="button" className="text-xs font-semibold"
                style={{ color: 'var(--ns-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>
            <Description className="sr-only">Enter your password</Description>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: focusedField === 'password' ? 'var(--ns-primary)' : 'var(--ns-outline)' }} />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                id="login-password"
                autoComplete="current-password"
                style={{ ...inputStyle('password'), paddingRight: '2.75rem' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ns-outline)', background: 'none', border: 'none', cursor: 'pointer' }}
                tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="login-submit"
            className="btn-primary w-full mt-1"
            style={{ fontSize: '1rem', borderRadius: '12px', minHeight: '52px' }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>Log In <ArrowRight size={18} /></>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--ns-outline-var)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ns-outline)' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: 'var(--ns-outline-var)' }} />
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="outline"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>
        </form>

        {/* Sign Up link */}
        <p className="text-center text-sm mt-8" style={{ color: 'var(--ns-outline)' }}>
          Don't have an account?{' '}
          <button onClick={onNavigateSignup} id="navigate-signup"
            className="font-semibold" style={{ color: 'var(--ns-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign Up
          </button>
        </p>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <ShieldCheck size={13} style={{ color: 'var(--ns-outline)' }} />
          <span className="text-xs" style={{ color: 'var(--ns-outline)' }}>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
