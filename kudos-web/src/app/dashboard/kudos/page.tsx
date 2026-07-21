'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface KudosMoment { id: string; fromUserName: string; toUserName: string; triggeredByMessage: string; createdAt: any; isRead: boolean; }
interface WeeklyStats { kudosSent: number; kudosReceived: number; humansIntroduced: number; roomsActive: number; conversationCount: number; }

const REFLECTION_MESSAGES = [
  "You're building something real.",
  "Connection is a practice. You're practicing.",
  "Every honest moment matters.",
  "Real friendships start with someone going first.",
];

export default function KudosPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [received, setReceived] = useState<KudosMoment[]>([]);
  const [sent, setSent] = useState<KudosMoment[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);

  const reflectionMsg = REFLECTION_MESSAGES[new Date().getDay() % REFLECTION_MESSAGES.length];

  useEffect(() => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/kudos/received`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/kudos/sent`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/kudos/weekly-stats`, { headers }).then(r => r.json()),
    ])
      .then(([r, s, st]) => {
        setReceived(r.kudos || []);
        setSent(s.kudos || []);
        setStats(st.stats || null);
      })
      .catch(() => {
        setReceived([
          { id: 'mock_1', fromUserName: 'Priya', toUserName: 'You', triggeredByMessage: "That I'm not always okay when I say I am.", createdAt: new Date(Date.now() - 7200000), isRead: false },
        ]);
        setSent([]);
        setStats({ kudosSent: 3, kudosReceived: 2, humansIntroduced: 1, roomsActive: 2, conversationCount: 18 });
      })
      .finally(() => setLoading(false));
  }, [user, API_URL]);

  const markRead = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/kudos/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      setReceived(prev => prev.map(k => k.id === id ? { ...k, isRead: true } : k));
    } catch (e) { console.error(e); }
  };

  const formatAgo = (ts: any) => {
    const ms = Date.now() - new Date(ts).getTime();
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Kudos Moments 💛</h1>
        <p className="body" style={{ color: 'var(--text-muted)' }}>Private appreciation. Not a like button.</p>
      </div>

      {/* Weekly Reflection Card */}
      {stats && (
        <div className="glow-border-amber" style={{ borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: 24 }}>
          <p className="label" style={{ color: 'var(--accent)', marginBottom: 12 }}>This Week</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Kudos sent', value: stats.kudosSent, icon: '💛' },
              { label: 'Received', value: stats.kudosReceived, icon: '🫶' },
              { label: 'Humans introduced', value: stats.humansIntroduced, icon: '👥' },
              { label: 'Conversations', value: stats.conversationCount, icon: '💬' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{s.value}</p>
                <p className="caption">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="gradient-text-warm" style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            "{reflectionMsg}"
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-1)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border)' }}>
        <button onClick={() => setActiveTab('received')} style={{ background: activeTab === 'received' ? 'var(--accent)' : 'none', color: activeTab === 'received' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s' }}>
          Received {received.filter(k => !k.isRead).length > 0 && <span style={{ marginLeft: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-pill)', padding: '1px 6px', fontSize: '0.75rem' }}>{received.filter(k => !k.isRead).length}</span>}
        </button>
        <button onClick={() => setActiveTab('sent')} style={{ background: activeTab === 'sent' ? 'var(--accent)' : 'none', color: activeTab === 'sent' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s' }}>
          Sent
        </button>
      </div>

      {/* Kudos List */}
      {activeTab === 'received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {received.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💛</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>No kudos yet</h3>
              <p className="body" style={{ color: 'var(--text-muted)' }}>When someone appreciates a moment you shared, it'll show up here.</p>
            </div>
          ) : (
            received.map((kudos, i) => (
              <div key={kudos.id} className="card" style={{ padding: '20px 24px', animation: `fade-up 0.4s ease ${i * 0.08}s both`, borderColor: kudos.isRead ? 'var(--border)' : 'rgba(245,158,11,0.3)', cursor: kudos.isRead ? 'default' : 'pointer' }} onClick={() => !kudos.isRead && markRead(kudos.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                    💛
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{kudos.fromUserName}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <p className="caption">{formatAgo(kudos.createdAt)}</p>
                        {!kudos.isRead && <span className="badge badge-amber">New</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>
                      Appreciated: "{kudos.triggeredByMessage}"
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sent.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💝</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>Send your first Kudos</h3>
              <p className="body" style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>When someone shares something real in a conversation or a room, you can give them a private Kudos. It's not a like. It's appreciation.</p>
            </div>
          ) : (
            sent.map((kudos, i) => (
              <div key={kudos.id} className="card" style={{ padding: '20px 24px', animation: `fade-up 0.4s ease ${i * 0.08}s both` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                    💝
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>You → {kudos.toUserName}</p>
                      <p className="caption">{formatAgo(kudos.createdAt)}</p>
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>
                      "{kudos.triggeredByMessage}"
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
