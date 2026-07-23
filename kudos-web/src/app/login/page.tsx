'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 text-neutral-900 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-pink-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-400">Welcome back</h1>
          <p className="text-neutral-500 mt-2">Sign in to your Kudos account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-neutral-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-pink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all text-neutral-900 placeholder-neutral-400" 
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-neutral-700">Password</label>
              <button type="button" className="text-xs text-pink-500 font-medium hover:text-pink-600">Forgot password?</button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-pink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all text-neutral-900 placeholder-neutral-400"
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold transition-all shadow-[0_4px_14px_rgba(251,113,133,0.39)] hover:shadow-[0_6px_20px_rgba(251,113,133,0.23)] disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-8 text-neutral-500 text-sm">
          Don't have an account? <Link href="/signup" className="text-pink-500 font-bold hover:text-pink-600 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
