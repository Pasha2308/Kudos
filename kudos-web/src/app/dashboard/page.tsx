'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [kycStatus, setKycStatus] = useState<string>('Loading...');
  const [memories, setMemories] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({ theme: 'dark', persona: 'cofounder', avatar: 'anime-glasses' });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Fetch KYC Status
    fetch(`${API_URL}/api/kyc/status`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => setKycStatus(data.status || 'unverified'))
      .catch(() => setKycStatus('unverified'));

    // Fetch Memories
    fetch(`${API_URL}/api/memory/summary`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => setMemories(data.memories || []))
      .catch(console.error);

    // Fetch Chat History
    fetch(`${API_URL}/api/chat/history`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.history || []))
      .catch(console.error);

    // Fetch Preferences
    fetch(`${API_URL}/api/user/preferences`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.preferences) setPreferences(data.preferences);
      })
      .catch(console.error);
  }, [user]);

  const handlePrefChange = async (key: string, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setSavingPrefs(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      await fetch(`${API_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(newPrefs)
      });
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
            <p className="text-neutral-400">{user.email}</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-indigo-400 hover:underline">Back to Home</Link>
            <button onClick={logout} className="px-4 py-2 bg-red-900/50 text-red-400 hover:bg-red-900/80 rounded-lg transition-colors">Logout</button>
          </div>
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
            <h2 className="text-xl font-bold mb-4">Identity Verification (KYC)</h2>
            <div className="text-neutral-400 mb-6">
              Status: <span className={`font-bold ${kycStatus === 'approved' ? 'text-green-400' : kycStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>{kycStatus.toUpperCase()}</span>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              KYC verification is required to use the Human Matchmaking features on the Kudos mobile app.
            </p>
            {kycStatus === 'unverified' && (
              <div className="px-4 py-2 bg-purple-600/50 rounded-lg text-purple-200 text-sm border border-purple-500/30">
                Please use the Mobile App to submit your ID for verification.
              </div>
            )}
          </div>

          <div className="p-6 bg-neutral-900 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Download Kudos</h2>
            <p className="text-neutral-400 mb-6">Get the desktop companion overlay for Windows.</p>
            <a href="/Kudos-Installer.msi" download className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium transition-colors inline-block text-center w-full">
              Download for Windows (x64)
            </a>
          </div>
        </div>

        {/* Companion Settings Panel */}
        <div className="mt-8 p-6 bg-neutral-900 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Companion Settings</h2>
              {savingPrefs && <span className="text-xs text-indigo-400 animate-pulse">Syncing to all devices...</span>}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-neutral-400 block font-medium">UI Theme</label>
                <select 
                  value={preferences.theme} 
                  onChange={e => handlePrefChange('theme', e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                  <option value="midnight">Midnight OLED</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400 block font-medium">AI Persona</label>
                <select 
                  value={preferences.persona} 
                  onChange={e => handlePrefChange('persona', e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="cofounder">Cofounder (Professional)</option>
                  <option value="mentor">Mentor (Guidance)</option>
                  <option value="friend">Friend (Casual)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400 block font-medium">Desktop Avatar</label>
                <select 
                  value={preferences.avatar} 
                  onChange={e => handlePrefChange('avatar', e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="anime-glasses">Anime (Glasses)</option>
                  <option value="robot">Robot</option>
                  <option value="minimalist">Minimalist Bubble</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-neutral-900 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">What Kudos Knows</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {memories.length > 0 ? memories.map(mem => (
                <div key={mem.id} className="p-3 bg-neutral-950 rounded-lg text-sm text-neutral-300 border border-white/5">
                  {mem.fact}
                </div>
              )) : (
                <p className="text-neutral-500 text-sm">No memories recorded yet.</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-neutral-900 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Recent Chat History</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {history.length > 0 ? history.slice(-10).map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm border border-white/5 ${msg.role === 'user' ? 'bg-indigo-900/30 ml-8' : 'bg-neutral-950 mr-8'}`}>
                  <div className="text-xs text-neutral-500 mb-1">{msg.role === 'user' ? 'You' : 'Kudos'}</div>
                  <div className="text-neutral-300">{msg.content}</div>
                </div>
              )) : (
                <p className="text-neutral-500 text-sm">No recent conversations.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-8">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
