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

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✉️</div>
          <h2 className="text-2xl font-bold mb-4">Email Us Directly</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            For support, partnership inquiries, or just to say hello, the fastest way to reach us is via email. We usually respond within 24 hours.
          </p>
          <a href="mailto:support@kudos.app" className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 active:scale-95 transition-all">
            support@kudos.app
          </a>
          
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-sm font-medium text-neutral-500 mb-4">Or connect with us on socials</p>
            <div className="flex gap-4 justify-center">
              <a href="#" className="px-6 py-2 bg-neutral-950 border border-white/10 rounded-full text-sm font-medium hover:border-white/30 transition-colors">Twitter (X)</a>
              <a href="#" className="px-6 py-2 bg-neutral-950 border border-white/10 rounded-full text-sm font-medium hover:border-white/30 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
