'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await signup(email, password, name);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    border: '1.5px solid #f0f0f0',
    background: '#fafafa',
    fontSize: '0.9375rem',
    color: '#171717',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>

      {/* Left: Branding Panel */}
      <div style={{ width: '45%', background: 'linear-gradient(160deg, #fff0f5 0%, #fce7f3 50%, #fdf2f8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(249,168,212,0.2)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(253,164,175,0.15)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f0f0f', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 20 }}>
            You're not lonely.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#737373', lineHeight: 1.7, marginBottom: 40 }}>
            You just haven't been found yet. Kudos connects founders and operators who build in the quiet hours.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { emoji: '🤝', text: 'Find your co-founder or accountability partner' },
              { emoji: '🌐', text: 'Join small, private rooms of real builders' },
              { emoji: '💛', text: 'Give and receive genuine appreciation' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
                <span style={{ fontSize: 18, lineHeight: 1.5, flexShrink: 0 }}>{item.emoji}</span>
                <span style={{ fontSize: '0.875rem', color: '#404040', lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 48px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f0f0f', letterSpacing: '-0.02em', marginBottom: 8 }}>Create your account</h2>
            <p style={{ fontSize: '0.9375rem', color: '#737373' }}>Start your journey on Kudos</p>
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 12, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#404040', marginBottom: 8 }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#f9a8d4'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fafafa'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#404040', marginBottom: 8 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#f9a8d4'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fafafa'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#404040', marginBottom: 8 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#f9a8d4'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fafafa'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#404040', marginBottom: 8 }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#f9a8d4'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fafafa'; }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
              <input type="checkbox" id="terms" required style={{ marginTop: 3, accentColor: '#f43f5e' }} />
              <label htmlFor="terms" style={{ fontSize: '0.8125rem', color: '#737373', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" style={{ color: '#f43f5e', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
              </label>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%',
              padding: '14px',
              marginTop: 8,
              borderRadius: 14,
              border: 'none',
              background: loading ? '#f4f4f5' : 'linear-gradient(135deg, #f9a8d4, #fda4af)',
              color: loading ? '#a3a3a3' : '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(249,168,212,0.4)',
              transition: 'all 0.2s',
            }}>
              {loading ? 'Creating account…' : 'Join Kudos →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.875rem', color: '#737373' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
