'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { HeartHandshake, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdminMatchesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/matches`, {
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

  if (loading) return <div className="p-8">Loading match intelligence...</div>;
  if (!data) return <div className="p-8 text-red-400">Failed to load data</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-['Outfit']">Match Intelligence</h1>
        <p className="text-gray-400 mt-1">Analyze how the AI is matching users based on situations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Total Intros Sent</p>
          <h3 className="text-3xl font-bold mt-2">{data.total}</h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Accept Rate</p>
          <h3 className="text-3xl font-bold mt-2 text-emerald-400">{data.acceptRate}%</h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Declined</p>
          <h3 className="text-3xl font-bold mt-2 text-red-400">{data.declined}</h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <p className="text-gray-400 text-sm font-medium">Pending Response</p>
          <h3 className="text-3xl font-bold mt-2 text-amber-400">{data.pending}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Situations */}
        <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold font-['Outfit']">Top Matched Situations</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Situation</th>
                <th className="px-6 py-3 font-medium">Matches</th>
                <th className="px-6 py-3 font-medium">Accept Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.topSituations.map((s: any) => (
                <tr key={s.situation} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-rose-200">{s.situation.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">{s.matches}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/10 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${s.acceptRate}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-400">{s.acceptRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Matches */}
        <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold font-['Outfit']">Recent Intros</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {data.recentMatches.map((m: any) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                <div>
                  <div className="text-sm">
                    <span className="font-medium text-white">{m.fromUser || m.fromUserId}</span> 
                    <span className="text-gray-500 mx-2">→</span> 
                    <span className="font-medium text-white">{m.toUser || m.toUserId}</span>
                  </div>
                  <div className="text-xs text-rose-300 mt-1">{m.situation?.replace(/_/g, ' ') || 'AI Match'}</div>
                </div>
                <div>
                  {m.status === 'accepted' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {m.status === 'declined' && <XCircle className="w-5 h-5 text-red-400" />}
                  {(m.status === 'pending' || m.status === 'sent') && <Clock className="w-5 h-5 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
