'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityPage() {
  const { user } = useAuth();
  
  // Mock data for MVP
  const activities = [
    { id: 1, type: 'login', message: 'Logged in from a new device (Windows)', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, type: 'settings', message: 'Updated privacy settings', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, type: 'chat', message: 'Started a new conversation with Priya Sharma', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 4, type: 'room', message: 'Joined the "Midnight Builders" room', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-2">Activity Feed</h1>
      <p className="text-neutral-400 mb-8">Recent events and security logs for your account.</p>

      <div className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="bg-neutral-900 border border-white/5 rounded-xl p-5 flex items-start gap-4 hover:bg-neutral-800 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              item.type === 'login' ? 'bg-blue-500/20 text-blue-400' :
              item.type === 'settings' ? 'bg-purple-500/20 text-purple-400' :
              item.type === 'chat' ? 'bg-indigo-500/20 text-indigo-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {item.type === 'login' ? '🔐' : item.type === 'settings' ? '⚙️' : item.type === 'chat' ? '💬' : '🌐'}
            </div>
            
            <div className="flex-1">
              <p className="text-neutral-200">{item.message}</p>
              <p className="text-sm text-neutral-500 mt-1">
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
