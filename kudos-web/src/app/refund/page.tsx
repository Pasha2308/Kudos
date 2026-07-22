import Link from 'next/link';

export default function RefundPolicy() {
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
        <h1 className="text-5xl font-bold tracking-tight mb-8">Refund Policy</h1>
        <p className="text-neutral-400 mb-8">Last Updated: July 22, 2026</p>
        
        <div className="space-y-8 text-lg text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Current Early Access Phase</h2>
            <p>
              During our Early Access phase, all paid features (Pro and Premium plans) are provided completely <strong>free of charge</strong>. As no payments are currently being collected, no refunds are applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Future Paid Subscriptions</h2>
            <p className="mb-4">
              When paid subscriptions are officially launched and payment is collected, our policy will be as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Monthly Subscriptions:</strong> You may cancel your subscription at any time. Cancellations will take effect at the end of the current billing cycle. We do not offer prorated refunds for partially used months.</li>
              <li><strong>Exceptions:</strong> If you experience technical issues that completely prevent you from using the service, or if you were charged in error, you may contact support within 7 days of the charge for a full refund.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Account Termination</h2>
            <p>
              If your account is terminated or banned due to a violation of our Terms of Service or Community Safety Guidelines (such as harassment or spam), you will <strong>not</strong> be eligible for any refund for the remainder of your subscription period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Contacting Support</h2>
            <p>
              To request a refund (if applicable) or for any billing-related questions, please email us at: <strong>support@kudos.app</strong>. Please include your account email address and a brief explanation of the issue.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
