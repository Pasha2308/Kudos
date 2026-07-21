'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Message { id: string; role: 'user' | 'ai'; content: string; ts: number; introNudge?: IntroNudge; }
interface IntroNudge { name: string; reason: string; id: string; }
interface HealthScore { score: number; label: string; conversationStreak: number; nudgeMessage: string; totalHumansMet: number; kudosGiven: number; irlMeetups: number; weeklyConversations: number; }
interface DailyChallenge { challenge: { id: string; text: string; category: string; }; completedToday: boolean; completedThisWeek: number; weeklyGoal: number; }
interface WarmIntro { id: string; name: string; location: string; personalityTags: string[]; companionReason: string; isOnline: boolean; }

const MODES = [
  { id: 'support', label: '🫂 Support', desc: 'Gentle listening mode' },
  { id: 'deep', label: '🧠 Deep Think', desc: 'Philosophy & reflection' },
  { id: 'builder', label: '🚀 Builder', desc: 'Sharp and accountable' },
  { id: 'casual', label: '😄 Casual', desc: 'Just vibing' },
];

const QUICK_CHIPS = [
  "How am I doing?", "I need to talk.", "I'm feeling stuck.", "Tell me something real.", "Who might I meet today?",
];

export default function DashboardHome() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('support');
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [intros, setIntros] = useState<WarmIntro[]>([]);
  const [showModePanel, setShowModePanel] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };

    // Load chat history
    fetch(`${API_URL}/api/chat/history`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.history?.length) {
          setMessages(d.history.map((h: any) => ({ id: h.ts?.toString() || Math.random().toString(), role: h.role === 'assistant' ? 'ai' : h.role, content: h.content, ts: h.ts || Date.now() })));
        } else {
          // Welcome message
          setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'}. I've been thinking about what you might need today. What's on your mind?`, ts: Date.now() }]);
        }
      })
      .catch(() => {
        setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'}. I've been thinking about what you might need today. What's on your mind?`, ts: Date.now() }]);
      });

    // Load health score
    fetch(`${API_URL}/api/health/score`, { headers })
      .then(r => r.json())
      .then(d => d.score && setHealth(d.score))
      .catch(() => setHealth({ score: 74, label: 'Growing', conversationStreak: 12, nudgeMessage: "You're building something real.", totalHumansMet: 3, kudosGiven: 11, irlMeetups: 1, weeklyConversations: 18 }));

    // Load daily challenge
    fetch(`${API_URL}/api/health/challenge`, { headers })
      .then(r => r.json())
      .then(d => setChallenge(d))
      .catch(() => setChallenge({ challenge: { id: 'reach_out_first', text: 'Reach out to someone first today. Don\'t wait for them.', category: 'action' }, completedToday: false, completedThisWeek: 3, weeklyGoal: 5 }));

    // Load warm intros
    fetch(`${API_URL}/api/humans/intros`, { headers })
      .then(r => r.json())
      .then(d => setIntros(d.intros || []))
      .catch(() => setIntros([
        { id: 'mock_priya', name: 'Priya Sharma', location: 'Mumbai', personalityTags: ['Builder', 'Night owl'], companionReason: 'You both mentioned hating small talk. Priya also builds at night.', isOnline: true },
        { id: 'mock_arjun', name: 'Arjun Kapoor', location: 'Delhi', personalityTags: ['Overthinker', 'Technical'], companionReason: 'You both process life through long conversations.', isOnline: true },
      ]));
  }, [user, API_URL]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isTyping) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msgText, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ message: msgText, mode }),
      });
      const data = await res.json();
      if (data.reply) {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: data.reply, ts: Date.now() };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "I'm here. Even when my connection isn't. ❤️", ts: Date.now() }]);
    }
    setIsTyping(false);
  };

  const completeChallenge = async () => {
    if (!challenge || challenge.completedToday || !user) return;
    try {
      await fetch(`${API_URL}/api/health/challenge/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ challengeId: challenge.challenge.id }),
      });
      setChallenge(prev => prev ? { ...prev, completedToday: true, completedThisWeek: prev.completedThisWeek + 1 } : prev);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100vh', overflow: 'hidden' }}>
      {/* 🔮 LEFT: Companion Chat Panel 🔮 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid var(--border)' }}>
        {/* Chat Header */}
        <div className="backdrop-blur-xl bg-white/5" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="companion-orb" style={{ width: 40, height: 40, flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Companion</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                Always here
              </p>
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowModePanel(p => !p)}
              style={{ fontSize: '0.8125rem', gap: 6 }}
            >
              {MODES.find(m => m.id === mode)?.label} <span>▾</span>
            </button>
            {showModePanel && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 8, zIndex: 200, width: 220, boxShadow: 'var(--shadow-elevated)' }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setShowModePanel(false); }} style={{ width: '100%', background: mode === m.id ? 'rgba(99,102,241,0.12)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: mode === m.id ? 'var(--primary)' : 'var(--text-body)', cursor: 'pointer', padding: '10px 12px', textAlign: 'left', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-area" style={{ flex: 1, overflowY: 'auto' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user-row' : ''}`}>
              {msg.role === 'ai' && <div className="companion-orb" style={{ width: 32, height: 32, flexShrink: 0 }} />}
              <div>
                <div className={`message-bubble ${msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>{msg.content}</div>
                {msg.introNudge && (
                  <div className="intro-nudge">
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-body)' }}>
                      👤 <strong>{msg.introNudge.name}</strong> — {msg.introNudge.reason}
                    </p>
                    <div className="intro-nudge-actions">
                      <Link href="/dashboard/humans" className="btn btn-primary btn-sm">Connect</Link>
                      <button className="btn btn-ghost btn-sm">Maybe later</button>
                    </div>
                  </div>
                )}
              </div>
              {msg.role === 'user' && <div className="avatar avatar-sm">{(user?.name || 'U').slice(0, 1)}</div>}
            </div>
          ))}
          {isTyping && (
            <div className="message-row">
              <div className="companion-orb" style={{ width: 32, height: 32, flexShrink: 0 }} />
              <div className="bubble-ai typing-dots">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        <div className="quick-chips">
          {QUICK_CHIPS.map(chip => (
            <button key={chip} className="quick-chip" onClick={() => sendMessage(chip)}>{chip}</button>
          ))}
        </div>

        {/* Input */}
        <div className="backdrop-blur-xl bg-white/5" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Talk to your companion..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}
          />
          <button className="btn btn-primary btn-icon" onClick={() => sendMessage()} disabled={!input.trim() || isTyping} style={{ borderRadius: 'var(--radius-pill)', width: 48, height: 48 }}>
            →
          </button>
        </div>
      </div>

      {/* ─── RIGHT: Sidebar Widgets ─── */}
      <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats */}
        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: '🔥 Streak', value: `${health.conversationStreak}d` },
              { label: '👥 Met', value: health.totalHumansMet },
              { label: '💛 Kudos', value: health.kudosGiven },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{stat.value}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Daily Challenge */}
        {challenge && (
          <div className="card" style={{ padding: '16px', borderColor: challenge.completedToday ? 'rgba(34,197,94,0.3)' : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p className="label" style={{ color: 'var(--accent)' }}>Daily Challenge</p>
              {challenge.completedToday && <span className="badge badge-green">Done ✓</span>}
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5, marginBottom: 12, color: 'var(--text)' }}>
              {challenge.challenge.text}
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {Array.from({ length: challenge.weeklyGoal }).map((_, i) => (
                <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < challenge.completedThisWeek ? 'var(--primary)' : 'var(--surface-3)' }} />
              ))}
            </div>
            <p className="caption" style={{ marginBottom: 10 }}>{challenge.completedThisWeek}/{challenge.weeklyGoal} this week</p>
            {!challenge.completedToday && (
              <button className="btn btn-ghost btn-sm btn-full" onClick={completeChallenge}>
                Mark Done
              </button>
            )}
          </div>
        )}

        {/* Warm Intros */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="label" style={{ color: 'var(--text-muted)' }}>Warm Intros</p>
            <Link href="/dashboard/humans" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>See all →</Link>
          </div>
          {intros.slice(0, 2).map(intro => (
            <div key={intro.id} className="card" style={{ padding: '14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div className="avatar" style={{ flexShrink: 0 }}>
                  {intro.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{intro.name}</p>
                    {intro.isOnline && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    {intro.personalityTags.slice(0, 2).join(' · ')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-body)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{intro.companionReason}"
                  </p>
                </div>
              </div>
              <Link href={`/dashboard/humans?intro=${intro.id}`} className="btn btn-ghost btn-sm btn-full" style={{ fontSize: '0.8125rem' }}>
                Connect →
              </Link>
            </div>
          ))}
        </div>

        {/* Your Rooms */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="label" style={{ color: 'var(--text-muted)' }}>Your Rooms</p>
            <Link href="/dashboard/rooms" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>Explore →</Link>
          </div>
          {[
            { name: 'Midnight Builders', emoji: '🌙', active: 2 },
            { name: 'Overthinkers Club', emoji: '💭', active: 3 },
          ].map(room => (
            <Link key={room.name} href="/dashboard/rooms" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}>
                <span style={{ fontSize: '1.25rem' }}>{room.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{room.name}</p>
                  <p className="caption">{room.active} active now</p>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>Live</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
