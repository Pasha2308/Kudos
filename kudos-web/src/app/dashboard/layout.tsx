'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/dashboard/messages', icon: '💬', label: 'Messages' },
  { href: '/dashboard/humans', icon: '👥', label: 'Humans' },
  { href: '/dashboard/rooms', icon: '🌐', label: 'Rooms', badgeKey: 'roomsBadge' },
  { href: '/dashboard/kudos', icon: '💛', label: 'Kudos Moments', badgeKey: 'kudosBadge' },
  { href: '/dashboard/builder', icon: '🎯', label: 'Builder Tools' },
  { href: '/dashboard/activity', icon: '⚡', label: 'Activity' },
  { href: '/dashboard/insights', icon: '📈', label: 'Insights' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
  { href: '/dashboard/profile', icon: '🪪', label: 'Profile' },
];

interface HealthScore {
  score: number;
  label: string;
  conversationStreak: number;
  nudgeMessage: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [health, setHealth] = useState<HealthScore>({ score: 0, label: 'Starting', conversationStreak: 0, nudgeMessage: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({ roomsBadge: 2, kudosBadge: 3 });

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/health/score`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.score) setHealth(d.score); })
      .catch(() => setHealth({ score: 74, label: 'Growing', conversationStreak: 12, nudgeMessage: 'You\'re building something real.' }));
  }, [user, API_URL]);

  if (!user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 0, left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="companion-orb companion-orb-sm" />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800 }}>Kudos</span>
        </div>

        {/* User */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="avatar">{initials}</div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hey, {user.name?.split(' ')[0] || 'Friend'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const badge = item.badgeKey ? badges[item.badgeKey as keyof typeof badges] : 0;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.dot && <span className="nav-dot" />}
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Connection Health */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Connection Health</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>{health.label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{health.score}%</span>
          </div>
          <div className="health-bar-track">
            <div className="health-bar-fill" style={{ width: `${health.score}%` }} />
          </div>
          {health.conversationStreak > 0 && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 6 }}>🔥 {health.conversationStreak} day streak</p>
          )}
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', width: '100%', textAlign: 'left', padding: '8px 0' }}>
            ← Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="h-16 border-b border-white/5 flex items-center justify-end px-8 gap-4 bg-neutral-950 sticky top-0 z-10">
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-neutral-900 border border-transparent overflow-hidden">
              <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} alt="avatar" />
            </div>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
        <CommandPalette />
      </main>
    </div>
  );
}
