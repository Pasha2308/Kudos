'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
          <div className="flex gap-6 text-sm font-medium text-neutral-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium"
        >
          🚀 The AI companion that connects you to the world
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
        >
          Meet Kudos. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            On your desktop & in your pocket.
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto"
        >
          Kudos sits on your desktop as a transparent pet, and lives on your phone to match you with verified humans around the globe.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center gap-4"
        >
          <Link href="/pricing" className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-lg transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] active:scale-95">
            Get Started
          </Link>
          <a href="#demo" className="px-8 py-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-lg transition-all">
            Watch Demo
          </a>
        </motion.div>
      </main>

      {/* Decorative Blur Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Two Apps. One Ecosystem.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🖥️', title: 'Desktop Companion', desc: 'A floating, context-aware AI pet that observes your work and proactively chats with you.', color: 'indigo' },
            { icon: '🛡️', title: 'Verified KYC', desc: 'Secure identity verification ensures that when you connect with others, you know they are real humans.', color: 'purple' },
            { icon: '🤝', title: 'Human Matchmaking', desc: 'Use the Kudos Mobile app to find and chat with other verified humans in the network.', color: 'pink' }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-${feat.color}-500/30 transition-colors shadow-lg`}
            >
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-neutral-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Enterprise Brain & Privacy Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                The Enterprise Brain, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">100% Local.</span>
              </h2>
              <p className="text-xl text-neutral-400 mb-8">
                Kudos runs LanceDB locally on your machine, embedding and searching your entire workspace without sending a single byte to the cloud. Total privacy, total recall.
              </p>
              <ul className="space-y-4 text-neutral-300">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                  On-device Vector Database (LanceDB)
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                  Offline LLM Support via Ollama
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                  Zero-Cloud Privacy Mode
                </li>
              </ul>
            </motion.div>
          </div>
          
          <div className="flex-1 w-full max-w-md relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-square rounded-full border-[1px] border-dashed border-white/20 flex items-center justify-center relative"
            >
              <div className="w-3/4 h-3/4 rounded-full border border-white/10 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
                <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 blur-xl animate-pulse" />
              </div>
              
              <div className="absolute top-10 left-10 p-3 bg-neutral-900 border border-white/10 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Local Mode Active
              </div>
              <div className="absolute bottom-10 right-0 p-3 bg-neutral-900 border border-white/10 rounded-xl shadow-xl text-sm font-medium">
                Ollama • Llama 3
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
