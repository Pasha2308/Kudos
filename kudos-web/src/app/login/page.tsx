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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Welcome back</h1>
          <p className="text-neutral-400 mt-2">Sign in to your Kudos account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white" 
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-neutral-300">Password</label>
              <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white"
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-6 text-neutral-400">
          Don't have an account? <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
