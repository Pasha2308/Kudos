'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { BrainCircuit, Activity, Cpu, AlertCircle } from 'lucide-react';

export default function AdminAiHealthPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/api/admin/ai-health`, {
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

  if (loading) return <div className="p-8">Loading AI metrics...</div>;
  if (!data) return <div className="p-8 text-red-400">Failed to load data</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">AI Health</h1>
          <p className="text-gray-400 mt-1">Groq model performance and extraction analytics.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {data.groqStatus === 'operational' ? 'Groq API Operational' : 'Groq API Degraded'}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <Activity className="w-4 h-4" /> Avg Latency
          </div>
          <h3 className="text-3xl font-bold">{data.avgLatencyMs} <span className="text-lg text-gray-500 font-normal">ms</span></h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <Cpu className="w-4 h-4" /> API Calls (Today)
          </div>
          <h3 className="text-3xl font-bold">{data.totalCallsToday.toLocaleString()}</h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <BrainCircuit className="w-4 h-4" /> Model Version
          </div>
          <h3 className="text-xl font-bold mt-3 text-blue-400">{data.modelUsed}</h3>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <AlertCircle className="w-4 h-4" /> Errors (Today)
          </div>
          <h3 className={`text-3xl font-bold ${data.errorsToday > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {data.errorsToday}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Situation Extraction Stats */}
        <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold font-['Outfit']">Top Extracted Situations</h2>
            <p className="text-sm text-gray-400 mt-1">What users are talking to the AI about</p>
          </div>
          <div className="p-6 space-y-4">
            {data.topSituationsDetected.map((s: any, i: number) => {
              const max = data.topSituationsDetected[0].count;
              const width = (s.count / max) * 100;
              return (
                <div key={s.situation}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white capitalize">{s.situation.replace(/_/g, ' ')}</span>
                    <span className="text-gray-400">{s.count} mentions</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${width}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold font-['Outfit']">Global Sentiment Pulse</h2>
            <p className="text-sm text-gray-400 mt-1">Overall mood of the user base today</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center gap-4">
            {Object.entries(data.sentimentDistribution).sort((a: any, b: any) => b[1] - a[1]).map(([emotion, val]: any) => (
              <div key={emotion} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-400 capitalize text-right">{emotion}</div>
                <div className="flex-1 bg-white/5 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      emotion === 'happy' || emotion === 'excited' ? 'bg-emerald-400' :
                      emotion === 'stressed' || emotion === 'anxious' ? 'bg-amber-400' :
                      emotion === 'sad' || emotion === 'tired' ? 'bg-blue-400' : 'bg-gray-400'
                    }`} 
                    style={{ width: `${val}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm font-medium text-white">{val}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
