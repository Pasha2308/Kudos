import Link from 'next/link';

export default function Safety() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-20 bg-neutral-950/80 backdrop-blur-xl">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-indigo-400 transition-colors">Kudos</Link>
        <div className="flex gap-6 text-sm font-medium text-neutral-400">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">Log In</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-24">
        <h1 className="text-5xl font-bold tracking-tight mb-8">Trust & Safety Guidelines</h1>
        <p className="text-neutral-400 mb-8">Last Updated: July 22, 2026</p>
        
        <div className="space-y-8 text-lg text-neutral-300 leading-relaxed">
          <p className="text-xl text-white font-medium">
            Kudos is built on trust, authenticity, and real human connection. To protect our community, we enforce strict safety guidelines.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Core Principles</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Be Real:</strong> Use your actual identity and represent yourself honestly. We do not tolerate impersonation or fake profiles.</li>
              <li><strong>Be Respectful:</strong> Treat every connection with human dignity. Harassment, hate speech, bullying, and predatory behavior are strictly forbidden.</li>
              <li><strong>Keep it Safe:</strong> Do not share highly sensitive financial or private information immediately. Take time to build trust.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Matchmaking & Interactions</h2>
            <p className="mb-4">
              When your AI companion introduces you to another human:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ensure your opening messages are respectful and relevant to the shared traits highlighted by the AI.</li>
              <li>Unsolicited commercial spam or pitching immediately upon connecting is heavily discouraged and may lead to account suspension.</li>
              <li>If you meet up in real life (IRL), meet in public places and always prioritize your personal safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Reporting Violations</h2>
            <p>
              If another user makes you feel unsafe, sends inappropriate content, or violates these guidelines, you can report them directly from their profile or chat interface.
            </p>
            <p className="mt-4">
              You can also email our Trust & Safety team directly at: <strong>support@kudos.app</strong>. Please include screenshots and details of the interaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Enforcement</h2>
            <p>
              We maintain a zero-tolerance policy for harassment and abuse. Verified reports will result in an immediate, permanent ban from the Kudos platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
