'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Pricing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (planId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-20 bg-neutral-950/80 backdrop-blur-xl">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-white">Pricing</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
              <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Pricing Header */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Simple, transparent pricing.
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-6">
          Whether you want a casual desktop companion or need priority matchmaking and premium support, we have a plan for you.
        </p>
        
        <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-4 mb-16 inline-block">
          <p className="text-indigo-300 font-medium">✨ Early Access Special: All paid plans are currently <strong className="text-white">FREE</strong> during our beta phase!</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 relative flex flex-col hover:-translate-y-2 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-neutral-400 font-normal">/mo</span></div>
            <p className="text-neutral-400 mb-8 flex-1">Basic access to the Kudos companion and standard matchmaking.</p>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-center gap-3">✓ Unlimited AI Companion Chat</li>
              <li className="flex items-center gap-3">✓ 5 connections / month</li>
              <li className="flex items-center gap-3">✓ Standard Pet Skin (Glasses)</li>
            </ul>
            <button 
              onClick={() => handleCheckout('free')}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all font-medium disabled:opacity-50"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 relative flex flex-col transform md:-translate-y-4 shadow-[0_0_40px_rgba(79,70,229,0.15)] hover:-translate-y-6 transition-transform duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-xs font-bold tracking-wide">MOST POPULAR</div>
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">Pro</h3>
            <div className="text-4xl font-bold mb-6">$8<span className="text-lg text-neutral-400 font-normal">/mo</span> <span className="text-sm bg-indigo-500 text-white px-2 py-1 rounded ml-2">FREE</span></div>
            <p className="text-neutral-400 mb-8 flex-1">Premium companion features and faster matchmaking access.</p>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-center gap-3">✓ Unlimited AI Companion Chat</li>
              <li className="flex items-center gap-3 text-indigo-300">✓ 15 connections / month</li>
              <li className="flex items-center gap-3 text-indigo-300">✓ Advanced Companion Memory</li>
              <li className="flex items-center gap-3 text-indigo-300">✓ 5 Custom Pet Skins</li>
            </ul>
            <button 
              onClick={() => handleCheckout('pro')}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upgrade for Free'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 relative flex flex-col hover:-translate-y-2 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-2 text-pink-400">Premium</h3>
            <div className="text-4xl font-bold mb-6">$12<span className="text-lg text-neutral-400 font-normal">/mo</span> <span className="text-sm bg-pink-500 text-white px-2 py-1 rounded ml-2">FREE</span></div>
            <p className="text-neutral-400 mb-8 flex-1">The ultimate Kudos experience with priority matching and 24/7 support.</p>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-center gap-3">✓ Unlimited AI Companion Chat</li>
              <li className="flex items-center gap-3 text-pink-300">✓ 25 connections / month</li>
              <li className="flex items-center gap-3 text-pink-300">✓ Priority Matchmaking Status</li>
              <li className="flex items-center gap-3 text-pink-300">✓ Unlimited Pet Customization</li>
            </ul>
            <button 
              onClick={() => handleCheckout('premium')}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Get Premium for Free'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
