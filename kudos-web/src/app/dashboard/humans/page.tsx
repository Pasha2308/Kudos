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
  photoURL?: string;
  role?: string;
  tagline?: string;
  badges?: string[];
  isSituationAdvisor?: boolean;
  situationLabel?: string;
}

interface Quota {
  used: number;
  max: number;
  plan: string;
}

const FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'advisors', label: '🧠 Advisors' },
  { id: 'cofounder_conflict', label: '⚔️ Cofounder Conflict' },
  { id: 'fundraising', label: '💰 Fundraising' },
  { id: 'loneliness', label: '😔 Loneliness' },
  { id: 'burnout', label: '🔥 Burnout' },
];

function HumansContent() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState('all');
  const [intros, setIntros] = useState<WarmIntro[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quota, setQuota] = useState<Quota | null>(null);
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
      fetch(`${API_URL}/api/humans/discover?filter=${filter}`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/humans/conversations`, { headers }).then(r => r.json()),
    ])
      .then(([discoverData, convData]) => {
        setIntros(discoverData.intros || []);
        if (discoverData.quota) setQuota(discoverData.quota);
        setConversations(convData.conversations || []);
      })
      .catch(() => {
        setIntros([
          { id: 'mock_priya', name: 'Priya Sharma', role: 'Founder', tagline: 'Building things that matter.', location: 'Mumbai, India', bio: 'Love honest conversations at 2am.', personalityTags: ['Builder', 'Design-minded', 'Night owl'], companionReason: 'You both mentioned hating small talk. Priya also stays up late building things. Sound familiar?', sharedTraits: ['Night owl', 'Builder'], isOnline: true, lastSeen: '2h ago', builderMode: true, photoURL: '' },
          { id: 'mock_arjun', name: 'Arjun Kapoor', role: 'Builder', tagline: 'Serial overthinker.', location: 'Delhi, India', bio: 'I process life through long conversations.', personalityTags: ['Cofounder-minded', 'Technical'], companionReason: 'You both process life through overthinking. Arjun is the midnight builder type.', sharedTraits: ['Overthinker', 'Builder'], isOnline: true, lastSeen: '10m ago', builderMode: true, photoURL: '' },
        ]);
        setQuota({ used: 1, max: 5, plan: 'free' });
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
      if (quota) setQuota({ ...quota, used: quota.used + 1 });
      setNoteTarget(null);
      setNoteText('');
      // Move to next card
      setCurrentIndex(prev => prev + 1);
    } catch (e) {
      // Mock success for local dev
      setNoteSent(prev => new Set([...prev, noteTarget.id]));
      if (quota) setQuota({ ...quota, used: quota.used + 1 });
      setNoteTarget(null);
      setNoteText('');
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const currentIntro = intros[currentIndex];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, background: 'var(--primary-glow)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(244,63,94,0.2)' }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Matches</h1>
        <p className="body" style={{ color: 'var(--text-body)' }}>
          <strong>How this works:</strong> Tell your AI companion what you're going through in chat. It will automatically find people who have been through the exact same situation to help you.
        </p>
      </div>


          {/* Filter chips & Quota */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => { setFilter(f.id); setCurrentIndex(0); }} className={`chip chip-clickable ${filter === f.id ? 'chip-active' : ''}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {quota && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '6px 12px', borderRadius: '20px' }}>
                <span style={{ color: quota.used >= quota.max ? 'var(--pink)' : 'var(--text)' }}>{quota.used}</span> / {quota.max} connects used this month
                {quota.used >= quota.max && (
                  <Link href="/pricing" style={{ color: 'var(--primary)', marginLeft: 8, textDecoration: 'none', fontWeight: 600 }}>Upgrade</Link>
                )}
              </div>
            )}
          </div>

          {/* Swipe Deck */}
          {loading ? (
            <div className="card" style={{ padding: 24, height: 400, opacity: 0.4, background: 'var(--surface-2)' }} />
          ) : !currentIntro ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌟</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>You're all caught up</h3>
              <p className="body" style={{ color: 'var(--text-muted)' }}>Come back later for more people.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="card" style={{ padding: 32, width: '100%', maxWidth: 500, position: 'relative', overflow: 'hidden', animation: 'fade-up 0.3s ease both' }}>
                
                {currentIntro.isOnline && (
                  <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                    <span className="caption">Online</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
                  <div className="avatar avatar-xl" style={{ marginBottom: 16, width: 96, height: 96, fontSize: '2rem' }}>
                    {currentIntro.photoURL ? (
                      <img src={currentIntro.photoURL} alt={currentIntro.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      currentIntro.name.slice(0, 1)
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                    <h2 className="h2" style={{ margin: 0 }}>{currentIntro.name}</h2>
                    {currentIntro.builderMode && <span className="badge badge-indigo">🎯 Builder</span>}
                  </div>
                  
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                    {currentIntro.badges?.includes('trusted') && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>✓ Trusted</span>
                    )}
                    {currentIntro.badges?.includes('advisor') && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>🧠 Advisor</span>
                    )}
                    {currentIntro.badges?.includes('verified_founder') && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>✦ Verified Founder</span>
                    )}
                  </div>
                  
                  <p style={{ fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {currentIntro.role} {currentIntro.tagline ? `· ${currentIntro.tagline}` : ''}
                  </p>
                  
                  <p className="caption" style={{ marginBottom: 16 }}>{currentIntro.location}</p>

                  {/* Shared traits */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
                    {currentIntro.sharedTraits.map(trait => (
                      <span key={trait} className="chip">{trait}</span>
                    ))}
                  </div>

                  {currentIntro.bio && (
                    <p className="body" style={{ color: 'var(--text-body)', marginBottom: 24, padding: '0 16px' }}>"{currentIntro.bio}"</p>
                  )}
                </div>

                {/* Companion's reason */}
                {currentIntro.isSituationAdvisor ? (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 24 }}>
                    <p className="label" style={{ color: '#f59e0b', marginBottom: 8 }}>⚡ SITUATION MATCH: {currentIntro.situationLabel?.toUpperCase()}</p>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.5, fontStyle: 'italic' }}>"{currentIntro.companionReason}"</p>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 24 }}>
                    <p className="label" style={{ color: 'var(--sky)', marginBottom: 8 }}>Your companion says:</p>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.5, fontStyle: 'italic' }}>"{currentIntro.companionReason}"</p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-xl)' }} onClick={handlePass}>
                    <span style={{ fontSize: '1.25rem' }}>✕</span> Pass
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-xl)' }} 
                    onClick={() => {
                      if (quota && quota.used >= quota.max) {
                        alert("You've used all your connections this month. Upgrade to get more!");
                      } else {
                        setNoteTarget(currentIntro);
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>👋</span> Connect
                  </button>
                </div>
              </div>
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
