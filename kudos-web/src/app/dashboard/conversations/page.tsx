'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ConvoType = 'ai' | 'human';

interface Convo {
  id: string;
  type: ConvoType;
  name: string;
  emoji: string;
  lastMessage: string;
  lastAt: number;
  unread: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'ai' | 'other';
  content: string;
  ts: number;
  senderName?: string;
}

const AI_CONVO: Convo = {
  id: '__ai__',
  type: 'ai',
  name: 'Your AI Companion',
  emoji: '🤖',
  lastMessage: 'What\'s on your mind today?',
  lastAt: Date.now(),
  unread: 0,
  isOnline: true,
};

const MODES = [
  { id: 'support', label: '🫂 Support' },
  { id: 'deep', label: '🧠 Deep Think' },
  { id: 'builder', label: '🚀 Builder' },
  { id: 'casual', label: '😄 Casual' },
];

export default function ConversationsPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const bottomRef = useRef<HTMLDivElement>(null);

  const [convos, setConvos] = useState<Convo[]>([AI_CONVO]);
  const [activeConvo, setActiveConvo] = useState<Convo>(AI_CONVO);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('support');
  const [loadingConvos, setLoadingConvos] = useState(true);

  // scroll to bottom when messages change
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // Load human DM conversations
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/dm`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(d => {
        const humanConvos: Convo[] = (d.conversations || []).map((c: any) => ({
          id: c.id,
          type: 'human' as ConvoType,
          name: c.participantName || 'Human',
          emoji: '👤',
          lastMessage: c.lastMessage || '',
          lastAt: c.lastMessageAt?._seconds ? c.lastMessageAt._seconds * 1000 : Date.now(),
          unread: c.unread || 0,
          isOnline: c.isOnline || false,
        }));
        setConvos([AI_CONVO, ...humanConvos]);
        setLoadingConvos(false);
      })
      .catch(() => setLoadingConvos(false));
  }, [user, API_URL]);

  // Load messages when active convo changes
  useEffect(() => {
    if (!user || !activeConvo) return;
    setMessages([]);

    if (activeConvo.type === 'ai') {
      fetch(`${API_URL}/api/chat/history`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.history?.length) {
            setMessages(d.history.map((h: any) => ({
              id: h.ts?.toString() || Math.random().toString(),
              role: h.role === 'assistant' ? 'ai' : 'user',
              content: h.content,
              ts: h.ts || Date.now(),
            })));
          } else {
            setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'}. I've been thinking about what you might need today. What's on your mind?`, ts: Date.now() }]);
          }
        })
        .catch(() => setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'}. What's on your mind?`, ts: Date.now() }]));
    } else {
      fetch(`${API_URL}/api/dm/${activeConvo.id}/messages`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(d => {
          setMessages((d.messages || []).map((m: any) => ({
            id: m.id || m.ts,
            role: m.senderId === user.uid ? 'user' : 'other',
            content: m.text || m.content || '',
            ts: m.createdAt?._seconds ? m.createdAt._seconds * 1000 : Date.now(),
            senderName: m.senderName || activeConvo.name,
          })));
        })
        .catch(() => setMessages([]));
    }
  }, [activeConvo, user, API_URL]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');

    if (activeConvo.type === 'ai') {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      try {
        const r = await fetch(`${API_URL}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ message: text, mode }),
        });
        const d = await r.json();
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: d.response || d.message || 'I heard you.', ts: Date.now() }]);
      } catch {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: "I'm here. Tell me more.", ts: Date.now() }]);
      } finally { setIsTyping(false); }
    } else {
      const tempMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: Date.now() };
      setMessages(prev => [...prev, tempMsg]);
      try {
        await fetch(`${API_URL}/api/dm/${activeConvo.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ text }),
        });
      } catch (e) { console.error('Failed to send:', e); }
    }
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#fff' }}>

      {/* ── LEFT: Convo List ── */}
      <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fafafa' }}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f0f0f', margin: 0 }}>Conversations</h2>
          <p style={{ fontSize: '0.75rem', color: '#a3a3a3', margin: '4px 0 0' }}>AI companion + human connections</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvos ? (
            <div style={{ padding: 20, color: '#a3a3a3', fontSize: '0.875rem' }}>Loading…</div>
          ) : convos.map(c => {
            const active = activeConvo?.id === c.id;
            return (
              <button key={c.id} onClick={() => setActiveConvo(c)} style={{
                width: '100%', textAlign: 'left', background: active ? '#fff' : 'transparent',
                border: 'none', borderRight: active ? '2px solid #f43f5e' : '2px solid transparent',
                padding: '14px 20px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                transition: 'background 0.15s',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.type === 'ai' ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {c.emoji}
                  </div>
                  {c.isOnline && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #fafafa' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#171717', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <span style={{ fontSize: '0.6875rem', color: '#a3a3a3', flexShrink: 0, marginLeft: 8 }}>{fmtTime(c.lastAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#737373', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</p>
                </div>
                {c.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.unread}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Chat Thread ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14, background: '#fff', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeConvo?.type === 'ai' ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {activeConvo?.emoji}
          </div>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#171717', margin: 0 }}>{activeConvo?.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#a3a3a3', margin: 0 }}>{activeConvo?.type === 'ai' ? 'Your private AI companion' : activeConvo?.isOnline ? '● Online' : 'Offline'}</p>
          </div>
          {/* Mode chips for AI */}
          {activeConvo?.type === 'ai' && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '6px 14px', borderRadius: 999, border: `1px solid ${mode === m.id ? '#f9a8d4' : '#e5e5e5'}`,
                  background: mode === m.id ? '#fff0f5' : 'transparent',
                  fontSize: '0.8125rem', fontWeight: 600, color: mode === m.id ? '#f43f5e' : '#737373',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{m.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, background: '#fafafa' }}>
          {messages.length === 0 && !isTyping && (
            <div style={{ textAlign: 'center', marginTop: '20%', color: '#a3a3a3' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>💬</span>
              <p style={{ fontSize: '0.9375rem' }}>Start the conversation</p>
            </div>
          )}
          {messages.map(m => {
            const isMe = m.role === 'user';
            const isAI = m.role === 'ai';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
                {!isMe && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isAI ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {isAI ? '🤖' : '👤'}
                  </div>
                )}
                <div style={{
                  maxWidth: '65%', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#fff',
                  border: isMe ? 'none' : '1px solid #f0f0f0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  {m.senderName && !isMe && <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f43f5e', marginBottom: 4, margin: '0 0 4px' }}>{m.senderName}</p>}
                  <p style={{ fontSize: '0.9375rem', color: isMe ? '#fff' : '#171717', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                  <p style={{ fontSize: '0.625rem', color: isMe ? 'rgba(255,255,255,0.7)' : '#a3a3a3', margin: '6px 0 0', textAlign: 'right' }}>{fmtTime(m.ts)}</p>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f9a8d4, #fda4af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
              <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 6 }}>
                {[0.2, 0.4, 0.6].map(d => <span key={d} style={{ width: 7, height: 7, background: '#f9a8d4', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s ${d}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={activeConvo?.type === 'ai' ? "What's on your mind…" : `Message ${activeConvo?.name}…`}
              style={{
                flex: 1, padding: '12px 18px', borderRadius: 999, border: '1px solid #f0f0f0',
                background: '#fafafa', fontSize: '0.9375rem', color: '#171717', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#f9a8d4')}
              onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
            />
            <button type="submit" disabled={!input.trim()} style={{
              width: 46, height: 46, borderRadius: '50%', border: 'none',
              background: input.trim() ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5',
              color: input.trim() ? '#fff' : '#a3a3a3',
              fontSize: '1.125rem', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            }}>↑</button>
          </form>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
