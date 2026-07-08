'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <Link href="/" className="text-indigo-400 hover:underline">Back to Home</Link>
        </header>

        {success && (
          <div className="mb-8 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
            🎉 Subscription successful! Welcome to Founder Pro.
          </div>
        )}

        {canceled && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            Subscription canceled. You have not been charged.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-neutral-900 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
            <div className="text-neutral-400 mb-6">
              Current Plan: <span className="text-white font-medium">{success ? 'Founder Pro' : 'Free Basic'}</span>
            </div>
            {!success && (
              <Link href="/#pricing" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors">
                Upgrade to Pro
              </Link>
            )}
          </div>

          <div className="p-6 bg-neutral-900 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Download Kudos</h2>
            <p className="text-neutral-400 mb-6">Get the desktop companion overlay for Windows.</p>
            <a href="/Kudos-Installer.msi" download className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium transition-colors inline-block text-center">
              Download for Windows (x64)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
