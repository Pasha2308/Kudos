'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Kudos AI
          </div>
          <div className="flex gap-6 items-center text-sm font-medium">
            <Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-all">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
          🚀 The first AI companion for founders
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
          Your proactive <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            business sounding board.
          </span>
        </h1>
        <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          Kudos sits on your desktop as a transparent overlay, learns your business context, and proactively taps you to maintain focus.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="#pricing" className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-lg transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)]">
            Get Started
          </Link>
          <a href="#demo" className="px-8 py-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-lg transition-all">
            Watch Demo
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Why Kudos is different</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-indigo-500/30 transition-colors">
            <div className="text-3xl mb-4">👁️</div>
            <h3 className="text-xl font-bold mb-3">Context Aware</h3>
            <p className="text-neutral-400">Kudos knows what window you're working on and tailors its advice to your current task.</p>
          </div>
          <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-3">Infinite Memory</h3>
            <p className="text-neutral-400">Powered by Vector databases, Kudos remembers your business goals, user feedback, and wins.</p>
          </div>
          <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-pink-500/30 transition-colors">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Proactive Nudges</h3>
            <p className="text-neutral-400">Idle for too long? Stressed? Kudos will initiate the conversation to get you back on track.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
        <p className="text-neutral-400 mb-12">Start for free, upgrade when you need infinite memory.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-neutral-900/50 border border-white/10 text-left">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-neutral-300">
              <li>✓ Desktop overlay</li>
              <li>✓ Basic chat (Groq)</li>
              <li>✓ Short-term session memory</li>
            </ul>
            <Link href="/dashboard" className="block w-full py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">
              Download Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/40 to-neutral-900 border border-indigo-500/30 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500 text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
            <h3 className="text-2xl font-bold mb-2">Founder Pro</h3>
            <div className="text-4xl font-bold mb-6">$20<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-neutral-300">
              <li>✓ Everything in Basic</li>
              <li>✓ Active Window Context Tracking</li>
              <li>✓ Infinite Vector DB Memory (RAG)</li>
              <li>✓ Claude 3.5 Sonnet Integration</li>
            </ul>
            <button 
              onClick={async () => {
                const res = await fetch('http://localhost:8080/api/billing/create-checkout-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: 'test_founder_1', planId: 'premium' })
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="block w-full py-3 text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
