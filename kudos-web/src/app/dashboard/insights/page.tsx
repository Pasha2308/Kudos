'use client';
import { useAuth } from '@/contexts/AuthContext';

export default function InsightsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
      <p className="text-neutral-400 mb-8">Understand your communication patterns and network health.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
          <div className="text-neutral-500 mb-2">Total Connections</div>
          <div className="text-4xl font-bold text-white">12</div>
          <div className="text-emerald-500 text-sm mt-2">↑ 2 from last week</div>
        </div>
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
          <div className="text-neutral-500 mb-2">Messages Sent</div>
          <div className="text-4xl font-bold text-white">348</div>
          <div className="text-emerald-500 text-sm mt-2">↑ 15% from last week</div>
        </div>
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
          <div className="text-neutral-500 mb-2">Longest Streak</div>
          <div className="text-4xl font-bold text-white">5 days</div>
          <div className="text-neutral-400 text-sm mt-2">Keep it up! 🔥</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl h-80 flex flex-col">
          <h3 className="font-semibold mb-4 text-lg">Communication Style</h3>
          <div className="flex-1 flex items-center justify-center border-t border-white/5 relative">
            <div className="text-neutral-500 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Radar chart generating...</p>
              <p className="text-xs mt-2">Requires more data</p>
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl h-80 flex flex-col">
          <h3 className="font-semibold mb-4 text-lg">Top Interests</h3>
          <div className="flex-1 flex flex-col justify-center gap-4 border-t border-white/5 pt-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Startups</span>
                <span>85%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Coding</span>
                <span>70%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Design</span>
                <span>45%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
