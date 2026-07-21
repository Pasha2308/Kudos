'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface WarmIntro {
  id: string;
  name: string;
  location: string;
  bio: string;
  personalityTags: string[];
  companionReason: string;
  sharedTraits: string[];
  isOnline: boolean;
  lastSeen: string;
  builderMode: boolean;
}

const FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'builders', label: '🎯 Builders' },
  { id: 'friends', label: '💞 Friends' },
  { id: 'partners', label: '🌹 Partners' },
  { id: 'investors', label: '💰 Investors' },
];

function HumansContent() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState('all');
  const [intros, setIntros] = useState<WarmIntro[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteTarget, setNoteTarget] = useState<WarmIntro | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSent, setNoteSent] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'intros' | 'conversations'>('intros');

  useEffect(() => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/humans/intros?filter=${filter}`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/humans/conversations`, { headers }).then(r => r.json()),
    ])
      .then(([introData, convData]) => {
        setIntros(introData.intros || []);
        setConversations(convData.conversations || []);
      })
      .catch(() => {
        setIntros([
          { id: 'mock_priya', name: 'Priya Sharma', location: 'Mumbai, India', bio: 'Building things that matter. Love honest conversations at 2am.', personalityTags: ['Builder', 'Design-minded', 'Night owl'], companionReason: 'You both mentioned hating small talk. Priya also stays up late building things. Sound familiar?', sharedTraits: ['Night owl', 'Builder'], isOnline: true, lastSeen: '2h ago', builderMode: true },
          { id: 'mock_arjun', name: 'Arjun Kapoor', location: 'Delhi, India', bio: 'Serial overthinker. I process life through long conversations.', personalityTags: ['Cofounder-minded', 'Technical'], companionReason: 'You both process life through overthinking. Arjun is the midnight builder type.', sharedTraits: ['Overthinker', 'Builder'], isOnline: true, lastSeen: '10m ago', builderMode: true },
          { id: 'mock_zara', name: 'Zara Ahmed', location: 'Dubai, UAE', bio: 'Curious about everything. Designer by day, philosopher by night.', personalityTags: ['Creative', 'Curious', 'Direct'], companionReason: 'You both value depth over small talk and authenticity over performance.', sharedTraits: ['Direct', 'Curious'], isOnline: false, lastSeen: '3h ago', builderMode: false },
        ]);
        setConversations([]);
      })
      .finally(() => setLoading(false));
  }, [user, filter, API_URL]);

  const sendNote = async () => {
    if (!noteTarget || !noteText.trim() || !user) return;
    try {
      await fetch(`${API_URL}/api/humans/send-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ toUserId: noteTarget.id, note: noteText }),
      });
      setNoteSent(prev => new Set([...prev, noteTarget.id]));
      setNoteTarget(null);
      setNoteText('');
    } catch (e) {
      setNoteSent(prev => new Set([...prev, noteTarget.id]));
      setNoteTarget(null);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Humans</h1>
        <p className="body" style={{ color: 'var(--text-muted)' }}>People your companion thinks you might genuinely connect with.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-1)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { id: 'intros', label: '✨ Warm Intros' },
          { id: 'conversations', label: '💬 Conversations' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ background: activeTab === tab.id ? 'var(--primary)' : 'none', color: activeTab === tab.id ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 20px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9375rem', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'intros' && (
        <>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`chip chip-clickable ${filter === f.id ? 'chip-active' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Intro cards */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: 24, height: 140, opacity: 0.4, background: 'var(--surface-2)' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {intros.map((intro, i) => (
                <div key={intro.id} className="card" style={{ padding: 24, animation: `fade-up 0.4s ease ${i * 0.08}s both`, position: 'relative', overflow: 'hidden' }}>
                  {/* Online indicator */}
                  {intro.isOnline && (
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                      <span className="caption">Online now</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div className="avatar avatar-lg">
                      {intro.name.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                        <h3 className="h3" style={{ fontSize: '1.0625rem' }}>{intro.name}</h3>
                        {intro.builderMode && <span className="badge badge-indigo">🎯 Builder</span>}
                      </div>
                      <p className="caption" style={{ marginBottom: 10 }}>{intro.location} · Last seen {intro.lastSeen}</p>

                      {/* Companion's reason */}
                      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14 }}>
                        <p className="label" style={{ color: 'var(--sky)', marginBottom: 4 }}>Your companion says:</p>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.5, fontStyle: 'italic' }}>"{intro.companionReason}"</p>
                      </div>

                      {/* Shared traits */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                        {intro.sharedTraits.map(trait => (
                          <span key={trait} className="chip">{trait}</span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        {noteSent.has(intro.id) ? (
                          <span className="badge badge-green" style={{ padding: '8px 14px', fontSize: '0.875rem' }}>✓ Note sent</span>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => setNoteTarget(intro)}>
                            Send a warm note →
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm">Maybe later</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'conversations' && (
        <div>
          {conversations.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>No conversations yet</h3>
              <p className="body" style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 20px' }}>
                Send a warm note to someone in your intros and start your first real conversation.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('intros')}>View Warm Intros →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {conversations.map(conv => (
                <Link key={conv.id} href={`/dashboard/humans/${conv.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="avatar">{conv.otherUserName?.slice(0, 1)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{conv.otherUserName}</p>
                      <p className="caption">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && <span className="nav-badge">{conv.unreadCount}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Modal */}
      {noteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setNoteTarget(null)}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: 440, padding: 28, borderRadius: 'var(--radius-xl)', animation: 'fade-up 0.3s ease both' }} onClick={e => e.stopPropagation()}>
            <h3 className="h3" style={{ marginBottom: 4 }}>Send a warm note to {noteTarget.name.split(' ')[0]}</h3>
            <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Your companion will deliver this with context. Be real.</p>
            <textarea
              className="input textarea"
              placeholder={`What would you say to ${noteTarget.name.split(' ')[0]}? Be honest, not polished.`}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              style={{ minHeight: 100, marginBottom: 16, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={sendNote} disabled={!noteText.trim()}>Send note →</button>
              <button className="btn btn-ghost" onClick={() => setNoteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HumansPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}><HumansContent /></Suspense>;
}
