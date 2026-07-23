'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, use } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, BadgeCheck, Ban } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const { user } = useAuth();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTargetUser(data);
        }
      } catch (e) {
        console.error('Failed to fetch user', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user, userId]);

  const handleAction = async (action: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' })
      });
      if (res.ok) {
        alert(`${action} successful`);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      alert('Action failed');
    }
  };

  if (loading) return <div className="p-8">Loading user details...</div>;
  if (!targetUser) return <div className="p-8 text-red-400">User not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-3xl shadow-lg">
            {targetUser.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-['Outfit']">{targetUser.name || 'Anonymous User'}</h1>
            <p className="text-gray-400 text-lg mt-1">{targetUser.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider
                ${targetUser.plan === 'elite' ? 'bg-amber-500/10 text-amber-400' : 
                  targetUser.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' : 
                  'bg-gray-500/10 text-gray-400'}`}
              >
                {targetUser.plan || 'free'}
              </span>
              {targetUser.badges?.map((b: string) => (
                <span key={b} className="flex items-center gap-1 text-xs bg-white/5 px-2 py-1 rounded">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" /> {b}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {targetUser.kycStatus === 'pending' && (
            <button onClick={() => handleAction('approve-kyc')} className="btn btn-sm btn-primary bg-emerald-500 hover:bg-emerald-600">
              <ShieldCheck className="w-4 h-4" /> Approve KYC
            </button>
          )}
          <button onClick={() => handleAction(targetUser.banned ? 'unban' : 'ban')} className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20">
            <Ban className="w-4 h-4" /> {targetUser.banned ? 'Unban User' : 'Ban User'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Data */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold font-['Outfit'] border-b border-white/10 pb-4">Profile Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Role</p>
              <p className="font-medium">{targetUser.role || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Location</p>
              <p className="font-medium">{targetUser.location || 'Not set'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Bio / Tagline</p>
              <p className="font-medium">{targetUser.tagline || targetUser.bio || 'Not set'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Personality Tags</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {targetUser.personalityTags?.map((t: string) => (
                  <span key={t} className="px-2 py-1 bg-white/5 rounded text-xs">{t}</span>
                )) || <span className="text-gray-500">None</span>}
              </div>
            </div>
          </div>
        </div>

        {/* AI Situation Data */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl space-y-4 border-l-2 border-l-rose-500">
          <h2 className="text-xl font-bold font-['Outfit'] border-b border-white/10 pb-4">AI Intelligence</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Current Situation</p>
              <p className="font-medium text-rose-300 bg-rose-500/10 px-3 py-2 rounded-lg inline-block">
                {targetUser.situationProfile?.currentSituation || 'None detected'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Looking For (Need Type)</p>
              <p className="font-medium capitalize">{targetUser.situationProfile?.needType || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Has Been Through (Advisor Matches)</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {targetUser.situationProfile?.beenThrough?.map((t: string) => (
                  <span key={t} className="px-2 py-1 bg-amber-500/10 text-amber-200 rounded text-xs">{t}</span>
                )) || <span className="text-gray-500">None</span>}
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Extracted Topics</p>
              <p className="font-medium text-xs text-gray-400">{targetUser.situationProfile?.topics?.join(', ') || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
