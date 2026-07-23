import { useEffect, useState, type ReactNode } from 'react';
import { KUDOS_CSS, LOGO_URL, type KudosView, setView } from '../../components/kudos/constants';
import { kudosApi, useKudosUser } from './lib/kudosApi';

const NAV: { view: KudosView; icon: string; label: string; dot?: boolean; badge?: number }[] = [
  { view: '/dashboard', icon: '🏠', label: 'Home' },
  { view: '/dashboard/chat', icon: '💬', label: 'Companion Chat', dot: true },
  { view: '/dashboard/humans', icon: '👥', label: 'Humans' },
  { view: '/dashboard/rooms', icon: '🌐', label: 'Rooms', badge: 2 },
  { view: '/dashboard/kudos', icon: '💛', label: 'Kudos Moments', badge: 3 },
  { view: '/dashboard/builder', icon: '🎯', label: 'Builder Tools' },
  { view: '/dashboard/profile', icon: '🪪', label: 'Profile' },
];

interface DashboardLayoutProps {
  currentView: KudosView;
  children: ReactNode;
}

export default function DashboardLayout({ currentView, children }: DashboardLayoutProps) {
  const user = useKudosUser();
  const [health, setHealth] = useState({ score: 74, label: 'Growing', conversationStreak: 12 });

  useEffect(() => {
    kudosApi.healthScore().then((d) => d.score && setHealth(d.score)).catch(() => {});
  }, []);

  const initials = (user.name || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <link rel="stylesheet" href={KUDOS_CSS} />
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <aside className="sidebar">
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={LOGO_URL} alt="Kudos" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800 }}>Kudos</span>
          </div>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="avatar">{initials}</div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hey, {user.name.split(' ')[0]}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            {NAV.map((item) => {
              const active = currentView === item.view || (item.view !== '/dashboard' && currentView.startsWith(item.view));
              return (
                <button key={item.view} type="button" className={`nav-item ${active ? 'active' : ''}`} onClick={() => setView(item.view)}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.dot && <span className="nav-dot" />}
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
            <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Connection Health</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem' }}>
              <span>{health.label}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{health.score}%</span>
            </div>
            <div className="health-bar-track"><div className="health-bar-fill" style={{ width: `${health.score}%` }} /></div>
          </div>
        </aside>
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}
