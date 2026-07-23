'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export default function AdminRevenuePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/revenue`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="p-8">Loading revenue data...</div>;
  if (!data) return <div className="p-8 text-red-400">Failed to load data</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-['Outfit']">Revenue</h1>
        <p className="text-gray-400 mt-1">Financial metrics and subscription breakdown.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16" /></div>
          <p className="text-gray-400 text-sm font-medium">Monthly Recurring Revenue</p>
          <h3 className="text-4xl font-bold mt-2 text-white">${data.mrr.toLocaleString()}</h3>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12% vs last month</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
          <p className="text-gray-400 text-sm font-medium">Annual Run Rate</p>
          <h3 className="text-4xl font-bold mt-2 text-white">${data.arr.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 mt-2">Projected yearly revenue</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Pro Subscribers ($4.99/mo)</p>
          <h3 className="text-3xl font-bold mt-2 text-blue-400">{data.proUsers}</h3>
          <p className="text-xs text-gray-500 mt-2">${data.proMRR.toLocaleString()} / mo</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Elite Subscribers ($12.99/mo)</p>
          <h3 className="text-3xl font-bold mt-2 text-rose-400">{data.eliteUsers}</h3>
          <p className="text-xs text-gray-500 mt-2">${data.eliteMRR.toLocaleString()} / mo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl min-h-[300px] flex flex-col">
          <h2 className="text-xl font-bold font-['Outfit'] mb-6">Revenue Growth</h2>
          <div className="flex-1 flex items-end gap-2 px-4 pb-4 border-b border-l border-white/10">
            {data.revenueHistory?.map((h: any) => {
              const height = (h.revenue / 5000) * 100; // rough scale
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-rose-500/50 hover:bg-rose-400 rounded-t-sm transition-all relative"
                    style={{ height: `${Math.max(10, height)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ${h.revenue}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{h.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stripe Health */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold font-['Outfit'] mb-6">Stripe Health</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Churn Rate</span>
                <span className="font-medium text-white">{data.churnRate}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${data.churnRate * 10}%` }}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <span className="text-sm text-gray-400">New Upgrades (7d)</span>
              <span className="font-bold text-emerald-400">+{data.newPayingThisWeek}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-sm text-red-200">Failed Payments</span>
              <span className="font-bold text-red-400">{data.failedPayments}</span>
            </div>
            
            <button className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm transition-colors mt-4">
              Open Stripe Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
