'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Save, ToggleRight, ToggleLeft } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFlags = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/feature-flags`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFlags(data.flags || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, [user]);

  const handleToggle = (key: string) => {
    setFlags((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${API_URL}/api/admin/feature-flags`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags })
      });
      alert('Settings saved successfully');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;
  if (!flags) return <div className="p-8 text-red-400">Failed to load settings</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Settings</h1>
          <p className="text-gray-400 mt-1">Manage global app configuration and feature flags.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn btn-primary"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-['Outfit']">Feature Flags</h2>
          <p className="text-sm text-gray-400 mt-1">Toggle core features on or off in real-time.</p>
        </div>
        <div className="divide-y divide-white/5">
          {Object.entries(flags).map(([key, value]) => {
            if (typeof value !== 'boolean') return null;
            return (
              <div key={key} className="p-6 flex items-center justify-between hover:bg-white/[0.02]">
                <div>
                  <h4 className="font-medium text-white">{key}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {key === 'aiMatchEnabled' && 'Enables the AI matching engine in the Match tab.'}
                    {key === 'situationExtractorEnabled' && 'Allows the AI to passively extract situations from chat.'}
                    {key === 'advisorModeEnabled' && 'Prioritizes people who have "been there" in matchmaking.'}
                    {key === 'anonymousFirstEnabled' && 'Hides names/photos until an intro is accepted.'}
                    {key === 'maintenanceMode' && 'Blocks all non-admin users from logging in.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleToggle(key)}
                  className={`p-1 rounded transition-colors ${value ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  {value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-['Outfit']">Global Announcement</h2>
          <p className="text-sm text-gray-400 mt-1">Display a banner at the top of the app for all users.</p>
        </div>
        <div className="p-6">
          <textarea 
            value={flags.announcementBanner || ''}
            onChange={(e) => setFlags((prev: any) => ({ ...prev, announcementBanner: e.target.value }))}
            placeholder="Type announcement here... (leave blank to hide)"
            className="input textarea bg-black/40 border-white/10"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
