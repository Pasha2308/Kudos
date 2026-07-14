import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-20 bg-neutral-950/80 backdrop-blur-xl">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="text-white">Contact</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">Get in touch.</h1>
          <p className="text-xl text-neutral-400">Have a question? Our team is here to help.</p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">First Name</label>
              <input type="text" className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Last Name</label>
              <input type="text" className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Doe" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Email Address</label>
            <input type="email" className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Message</label>
            <textarea rows={6} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="How can we help you?" />
          </div>

          <button type="button" className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 active:scale-95 transition-all">
            Send Message
          </button>
        </form>
      </main>
    </div>
  );
}
