import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-20 bg-neutral-950/80 backdrop-blur-xl">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link href="/about" className="text-white">About</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
        </div>
      </nav>

      {/* About Header */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-24">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          The future of AI companionship.
        </h1>
        
        <div className="space-y-8 text-lg text-neutral-300 leading-relaxed">
          <p>
            At Kudos, we believe that AI is more than just a productivity tool. It's an opportunity to create digital companions that understand you, remember your preferences, and proactively support your daily life.
          </p>
          <p>
            Our desktop pet runs silently on your machine, always there when you need it, powered by bleeding-edge LLM technology. But we didn't stop there.
          </p>
          <p>
            With the Kudos Matchmaking network, we are bridging the gap between digital companionship and human connection. We've built a safe space for ambitious founders, builders, and creatives to meet, collaborate, and grow together. Our AI doesn't just talk to you—it learns what makes you unique and introduces you to people who actually complement your personality.
          </p>
        </div>

        <div className="mt-16 p-8 bg-neutral-900 border border-white/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-neutral-400">
            To build technology that feels warm, personal, and profoundly human. Whether you're chatting with your AI pet or matching with a new friend across the globe, Kudos is built to foster genuine connection.
          </p>
        </div>
      </main>
    </div>
  );
}
