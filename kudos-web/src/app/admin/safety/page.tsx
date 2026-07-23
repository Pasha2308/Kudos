'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, MessageSquareWarning } from 'lucide-react';

export default function AdminSafetyPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/safety`, {
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

  const handleResolve = async (flagId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/admin/safety/${flagId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          flaggedContent: prev.flaggedContent.filter((f: any) => f.id !== flagId),
          resolvedToday: prev.resolvedToday + 1,
          totalPending: prev.totalPending - 1
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8">Loading safety queue...</div>;
  if (!data) return <div className="p-8 text-red-400">Failed to load data</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-['Outfit']">Safety & Trust</h1>
        <p className="text-gray-400 mt-1">Review flagged content, reports, and AI crisis signals.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Pending Reports</p>
            <h3 className="text-3xl font-bold mt-2 text-amber-400">{data.totalPending}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400"><MessageSquareWarning className="w-8 h-8"/></div>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Crisis Signals (AI)</p>
            <h3 className="text-3xl font-bold mt-2 text-red-400">{data.crisisSignals?.length || 0}</h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><ShieldAlert className="w-8 h-8"/></div>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Resolved Today</p>
            <h3 className="text-3xl font-bold mt-2 text-emerald-400">{data.resolvedToday}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle2 className="w-8 h-8"/></div>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold font-['Outfit']">Moderation Queue</h2>
        </div>
        
        {data.flaggedContent.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/50" />
            <p>Inbox zero! No pending reports.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.flaggedContent.map((item: any) => (
              <div key={item.id} className="p-6 hover:bg-white/[0.02] transition-colors flex gap-6">
                <div className="mt-1">
                  {item.type === 'crisis' ? (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <MessageSquareWarning className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white flex items-center gap-2">
                        {item.type === 'crisis' ? 'AI Crisis Detection' : 'User Report'}
                        <span className="text-xs text-gray-500 font-normal px-2 py-0.5 bg-white/5 rounded">
                          User: {item.userId}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">Reported {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm bg-white/5 hover:bg-white/10 text-white">Ban User</button>
                      <button onClick={() => handleResolve(item.id)} className="btn btn-sm btn-primary bg-emerald-500 hover:bg-emerald-600">Resolve</button>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5">
                    <p className="text-sm font-medium text-gray-300 mb-2">Flagged Content:</p>
                    <p className="text-white italic">"{item.content}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
