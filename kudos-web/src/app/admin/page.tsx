'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Users, HeartHandshake, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) return <div className="p-8">Loading stats...</div>;
  if (!stats) return <div className="p-8 text-red-400">Failed to load statistics</div>;

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers, change: '+12% this week', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Matches Made', value: stats.matchesMade, change: `${stats.matchAcceptRate}% accept rate`, icon: HeartHandshake, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Monthly Revenue (MRR)', value: `$${stats.mrr}`, change: '+5% this month', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Active Flags', value: stats.flaggedContent, change: `${stats.kycPending} KYC pending`, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-['Outfit']">Overview</h1>
        <p className="text-gray-400 mt-1">High-level metrics for Kudos.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{kpi.label}</p>
                <h3 className="text-2xl font-bold mt-2">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold font-['Outfit'] mb-6">Plan Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Free</span>
              <span className="font-bold">{stats.planBreakdown.free}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(stats.planBreakdown.free / stats.totalUsers) * 100}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-blue-400 font-medium">Pro</span>
              <span className="font-bold">{stats.planBreakdown.pro}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.planBreakdown.pro / stats.totalUsers) * 100}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-rose-400 font-medium">Elite</span>
              <span className="font-bold">{stats.planBreakdown.elite}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${(stats.planBreakdown.elite / stats.totalUsers) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold font-['Outfit'] mb-6">Action Needed</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-400 w-5 h-5" />
                <span className="text-amber-100">{stats.flaggedContent} Flagged Messages</span>
              </div>
              <button className="text-sm font-medium text-amber-400 hover:text-amber-300">Review</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <Users className="text-blue-400 w-5 h-5" />
                <span className="text-blue-100">{stats.kycPending} KYC Applications Pending</span>
              </div>
              <button className="text-sm font-medium text-blue-400 hover:text-blue-300">Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
