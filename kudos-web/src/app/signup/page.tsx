'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Join Kudos</h1>
          <p className="text-neutral-400 mt-2">Create your account to get started</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-300">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white"
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-6 text-neutral-400">
          Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
