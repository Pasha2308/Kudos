import Link from 'next/link';

export default function Features() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-20 bg-neutral-950/80 backdrop-blur-xl">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/features" className="text-white">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Everything you need.
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            A seamless ecosystem spanning your desktop and your phone, designed to keep you connected and productive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="p-10 bg-neutral-900 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-colors">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 text-3xl">💻</div>
            <h3 className="text-2xl font-bold mb-4">Desktop Pet</h3>
            <p className="text-neutral-400 leading-relaxed">
              A transparent, floating window that lives on your desktop. Built with Tauri and Rust for native performance and zero bloat. Your AI companion is always one click away, ready to chat.
            </p>
          </div>

          <div className="p-10 bg-neutral-900 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-colors">
            <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 text-3xl">📱</div>
            <h3 className="text-2xl font-bold mb-4">Mobile Matchmaking</h3>
            <p className="text-neutral-400 leading-relaxed">
              Take the network with you. Our Expo React Native app lets you chat with your AI and enter the matchmaking queue from anywhere. Connect with other founders on the go.
            </p>
          </div>

          <div className="p-10 bg-neutral-900 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-colors">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 text-3xl">🛡️</div>
            <h3 className="text-2xl font-bold mb-4">KYC Identity Verification</h3>
            <p className="text-neutral-400 leading-relaxed">
              Safety is our top priority. Before joining the matchmaking pool, every user must pass a strict Know-Your-Customer check. No bots, no spam, just real people.
            </p>
          </div>

          <div className="p-10 bg-neutral-900 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-colors">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 text-3xl">⚡</div>
            <h3 className="text-2xl font-bold mb-4">Real-Time Sync</h3>
            <p className="text-neutral-400 leading-relaxed">
              Powered by Server-Sent Events (SSE) and Firebase. When you chat with your AI on desktop, the memory instantly syncs to your mobile app. A truly unified experience.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
