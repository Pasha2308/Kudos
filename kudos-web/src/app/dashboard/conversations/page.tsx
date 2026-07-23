'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ConvoType = 'ai' | 'human';

interface Convo { id: string; type: ConvoType; name: string; emoji: string; lastMessage: string; lastAt: number; unread: number; isOnline?: boolean; }
interface Message { id: string; role: 'user' | 'ai' | 'other'; content: string; ts: number; senderName?: string; }
interface AISettings { name: string; emoji: string; style: string; }
interface UserMemory { builderType: string; coreNeed: string; currentFocus: string; struggles: string; }

const DEFAULT_AI_SETTINGS: AISettings = { name: 'Kudos', emoji: '✦', style: 'support' };

const MODES = [
  { id: 'support', label: '🫂 Support' },
  { id: 'deep', label: '🧠 Deep Think' },
  { id: 'builder', label: '🚀 Builder' },
  { id: 'casual', label: '😄 Casual' },
];

const STYLE_OPTIONS = [
  { id: 'support', label: 'Empathetic & Warm', desc: 'Gentle listener, no judgement' },
  { id: 'deep', label: 'Reflective & Deep', desc: 'Philosophy and slow thinking' },
  { id: 'builder', label: 'Sharp & Direct', desc: 'Accountability, cut the noise' },
  { id: 'casual', label: 'Casual & Easy', desc: 'Just vibing, no pressure' },
];

export default function ConversationsPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const bottomRef = useRef<HTMLDivElement>(null);

  // Convo list
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeConvo, setActiveConvo] = useState<Convo | null>(null);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('support');

  // AI settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [tempSettings, setTempSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  // Memory panel
  const [showMemory, setShowMemory] = useState(false);
  const [memory, setMemory] = useState<UserMemory>({ builderType: '', coreNeed: '', currentFocus: '', struggles: '' });
  const [tempMemory, setTempMemory] = useState<UserMemory>({ builderType: '', coreNeed: '', currentFocus: '', struggles: '' });

  const aiConvo: Convo = {
    id: '__ai__',
    type: 'ai',
    name: aiSettings.name,
    emoji: aiSettings.emoji,
    lastMessage: "What's on your mind?",
    lastAt: Date.now(),
    unread: 0,
    isOnline: true,
  };

  // Scroll on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // Load AI settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kudos_ai_settings');
    if (saved) { const p = JSON.parse(saved); setAiSettings(p); setTempSettings(p); }
    const savedMem = localStorage.getItem('kudos_memory');
    if (savedMem) { const m = JSON.parse(savedMem); setMemory(m); setTempMemory(m); }
  }, []);

  // Load human DM conversations
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/dm`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(d => {
        const humanConvos: Convo[] = (d.conversations || []).map((c: any) => ({
          id: c.id, type: 'human' as ConvoType, name: c.participantName || 'Human', emoji: '👤',
          lastMessage: c.lastMessage || 'Sent you a warm intro', lastAt: c.lastMessageAt?._seconds ? c.lastMessageAt._seconds * 1000 : Date.now(),
          unread: c.unread || 0, isOnline: c.isOnline || false,
        }));
        setConvos(humanConvos);
        setLoadingConvos(false);
      })
      .catch(() => { setConvos([]); setLoadingConvos(false); });
  }, [user, API_URL]);

  // Set initial active convo to AI
  useEffect(() => { if (!activeConvo) setActiveConvo(aiConvo); }, [aiSettings]);

  // Load messages when active convo changes
  useEffect(() => {
    if (!user || !activeConvo) return;
    setMessages([]);
    if (activeConvo.type === 'ai') {
      fetch(`${API_URL}/api/chat/history`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.history?.length) {
            setMessages(d.history.map((h: any) => ({ id: h.ts?.toString() || Math.random().toString(), role: h.role === 'assistant' ? 'ai' : 'user', content: h.content, ts: h.ts || Date.now() })));
          } else {
            setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'} 👋 I'm ${aiSettings.name}. What's on your mind today?`, ts: Date.now() }]);
          }
        })
        .catch(() => setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name?.split(' ')[0] || 'friend'} 👋 I'm ${aiSettings.name}. What's on your mind today?`, ts: Date.now() }]));
    } else {
      fetch(`${API_URL}/api/dm/${activeConvo.id}/messages`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(d => {
          setMessages((d.messages || []).map((m: any) => ({
            id: m.id || m.ts, role: m.senderId === user.uid ? 'user' : 'other',
            content: m.text || m.content || '', ts: m.createdAt?._seconds ? m.createdAt._seconds * 1000 : Date.now(),
            senderName: m.senderName || activeConvo.name,
          })));
        })
        .catch(() => setMessages([]));
    }
  }, [activeConvo?.id, user, API_URL]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvo) return;
    const text = input;
    setInput('');

    if (activeConvo.type === 'ai') {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      try {
        // FIXED: correct endpoint is /api/chat/send, response field is "reply"
        const r = await fetch(`${API_URL}/api/chat/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ message: text, mode }),
        });
        const d = await r.json();
        const replyText = d.reply || d.response || d.message;
        if (replyText) {
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: replyText, ts: Date.now() }]);
        } else {
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `(${aiSettings.name}): Something went wrong — ${JSON.stringify(d)}`, ts: Date.now() }]);
        }
      } catch (err) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `${aiSettings.name} couldn't reach the server. Check the API is running.`, ts: Date.now() }]);
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

  const saveAISettings = () => {
    setAiSettings(tempSettings);
    localStorage.setItem('kudos_ai_settings', JSON.stringify(tempSettings));
    setShowSettings(false);
    setActiveConvo(prev => prev ? { ...prev, name: tempSettings.name, emoji: tempSettings.emoji } : prev);
  };

  const saveMemory = () => {
    setMemory(tempMemory);
    localStorage.setItem('kudos_memory', JSON.stringify(tempMemory));
    setShowMemory(false);
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const allConvos = [aiConvo, ...convos];
  const isAI = activeConvo?.type === 'ai';

  const inputCss: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e5e5',
    background: '#fafafa', fontSize: '0.9rem', color: '#171717', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9f9fb' }}>

      {/* ── LEFT: Convo List ── */}
      <div style={{ width: 288, borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fff' }}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #ebebeb' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111', margin: '0 0 3px' }}>Conversations</h2>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>AI companion + human connections</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {allConvos.map(c => {
            const active = activeConvo?.id === c.id;
            return (
              <button key={c.id} onClick={() => setActiveConvo(c)} style={{
                width: '100%', textAlign: 'left', background: active ? '#fff5f7' : 'transparent',
                border: 'none', borderRight: active ? '2.5px solid #f43f5e' : '2.5px solid transparent',
                padding: '13px 18px', cursor: 'pointer', display: 'flex', gap: 11, alignItems: 'center', transition: 'background 0.12s',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: c.type === 'ai' ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: c.type === 'ai' ? 18 : 20, fontWeight: 700, color: '#fff' }}>
                    {c.emoji}
                  </div>
                  {c.isOnline && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <span style={{ fontSize: '0.6875rem', color: '#aaa', flexShrink: 0, marginLeft: 6 }}>{fmtTime(c.lastAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</p>
                </div>
                {c.unread > 0 && <div style={{ width: 19, height: 19, borderRadius: '50%', background: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.unread}</div>}
              </button>
            );
          })}
          {!loadingConvos && convos.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>👥</span>
              <p style={{ fontSize: '0.8125rem', color: '#888', lineHeight: 1.5 }}>Human conversations will appear here after someone accepts your warm intro.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat Thread ── */}
      {activeConvo ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>
          {/* Header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: isAI ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
              {activeConvo.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111', margin: 0 }}>{activeConvo.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>{isAI ? 'Your private AI companion' : activeConvo.isOnline ? '● Online' : 'Offline'}</p>
            </div>

            {/* Mode chips for AI only */}
            {isAI && (
              <div style={{ display: 'flex', gap: 6 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${mode === m.id ? '#f9a8d4' : '#e5e5e5'}`,
                    background: mode === m.id ? '#fff5f7' : 'transparent', fontSize: '0.8125rem', fontWeight: 600,
                    color: mode === m.id ? '#f43f5e' : '#888', cursor: 'pointer', transition: 'all 0.12s',
                  }}>{m.label}</button>
                ))}
              </div>
            )}

            {/* Settings + Memory icons for AI */}
            {isAI && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                <button onClick={() => { setTempMemory(memory); setShowMemory(true); setShowSettings(false); }} title="Memory" style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #ebebeb', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧠</button>
                <button onClick={() => { setTempSettings(aiSettings); setShowSettings(true); setShowMemory(false); }} title="AI Settings" style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #ebebeb', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, background: '#fafafa' }}>
              {messages.length === 0 && !isTyping && (
                <div style={{ textAlign: 'center', marginTop: '18%', color: '#bbb' }}>
                  <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>💬</span>
                  <p style={{ fontSize: '0.9375rem' }}>Start the conversation</p>
                </div>
              )}
              {messages.map(m => {
                const isMe = m.role === 'user';
                const isAIMsg = m.role === 'ai';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                    {!isMe && (
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAIMsg ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 700 }}>
                        {isAIMsg ? activeConvo.emoji : '👤'}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '62%', padding: '11px 15px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#fff',
                      border: isMe ? 'none' : '1px solid #ebebeb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                      {m.senderName && !isMe && <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f43f5e', marginBottom: 3, margin: '0 0 3px' }}>{m.senderName}</p>}
                      <p style={{ fontSize: '0.9375rem', color: isMe ? '#fff' : '#111', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                      <p style={{ fontSize: '0.625rem', color: isMe ? 'rgba(255,255,255,0.65)' : '#bbb', margin: '5px 0 0', textAlign: 'right' }}>{fmtTime(m.ts)}</p>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #f9a8d4, #fda4af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{activeConvo.emoji}</div>
                  <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
                    {[0, 0.2, 0.4].map(d => <span key={d} style={{ width: 7, height: 7, background: '#f9a8d4', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s ${d}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Settings Panel ── */}
            {showSettings && (
              <div style={{ width: 300, borderLeft: '1px solid #ebebeb', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #ebebeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', margin: 0 }}>AI Settings</p>
                  <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>✕</button>
                </div>
                <div style={{ padding: 18, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 8 }}>Companion Name</label>
                    <input value={tempSettings.name} onChange={e => setTempSettings(p => ({ ...p, name: e.target.value }))} style={inputCss} placeholder="e.g. Kudos, Sage, River…" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 8 }}>Companion Icon</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['✦', '🤖', '💭', '🌙', '🎯', '🌊', '🔥', '⚡', '🌱', '💡'].map(e => (
                        <button key={e} onClick={() => setTempSettings(p => ({ ...p, emoji: e }))} style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${tempSettings.emoji === e ? '#f43f5e' : '#e5e5e5'}`, background: tempSettings.emoji === e ? '#fff5f7' : '#fafafa', cursor: 'pointer', fontSize: 20 }}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 8 }}>Default Talking Style</label>
                    {STYLE_OPTIONS.map(s => (
                      <button key={s.id} onClick={() => setTempSettings(p => ({ ...p, style: s.id }))} style={{
                        width: '100%', textAlign: 'left', padding: '11px 14px', borderRadius: 10, marginBottom: 8,
                        border: `1.5px solid ${tempSettings.style === s.id ? '#f9a8d4' : '#e5e5e5'}`,
                        background: tempSettings.style === s.id ? '#fff5f7' : '#fafafa', cursor: 'pointer',
                      }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111', margin: '0 0 2px' }}>{s.label}</p>
                        <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{s.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={saveAISettings} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f9a8d4, #fda4af)', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>Save Settings</button>
                </div>
              </div>
            )}

            {/* ── Memory Panel ── */}
            {showMemory && (
              <div style={{ width: 300, borderLeft: '1px solid #ebebeb', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #ebebeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem', margin: 0 }}>🧠 My Info</p>
                  <button onClick={() => setShowMemory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>✕</button>
                </div>
                <div style={{ padding: 18, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: '0.8125rem', color: '#888', lineHeight: 1.5, margin: 0 }}>This info helps your AI companion understand you better. You can update it anytime.</p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>What kind of builder are you?</label>
                    <input value={tempMemory.builderType} onChange={e => setTempMemory(p => ({ ...p, builderType: e.target.value }))} style={inputCss} placeholder="e.g. Solo founder, Operator, Creator…" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>What do you need most right now?</label>
                    <input value={tempMemory.coreNeed} onChange={e => setTempMemory(p => ({ ...p, coreNeed: e.target.value }))} style={inputCss} placeholder="e.g. Accountability, Someone to talk to…" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>What are you currently working on?</label>
                    <textarea value={tempMemory.currentFocus} onChange={e => setTempMemory(p => ({ ...p, currentFocus: e.target.value }))} rows={3} style={{ ...inputCss, resize: 'vertical' as const }} placeholder="Your startup, side project, job search…" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>Biggest struggle right now?</label>
                    <textarea value={tempMemory.struggles} onChange={e => setTempMemory(p => ({ ...p, struggles: e.target.value }))} rows={3} style={{ ...inputCss, resize: 'vertical' as const }} placeholder="Loneliness, motivation, direction…" />
                  </div>
                  <button onClick={saveMemory} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f9a8d4, #fda4af)', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>Save Info</button>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid #ebebeb', background: '#fff', flexShrink: 0 }}>
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isAI ? `Message ${activeConvo.name}…` : `Message ${activeConvo.name}…`}
                style={{ flex: 1, padding: '11px 16px', borderRadius: 999, border: '1.5px solid #ebebeb', background: '#fafafa', fontSize: '0.9375rem', color: '#111', outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#f9a8d4')}
                onBlur={e => (e.target.style.borderColor = '#ebebeb')}
              />
              <button type="submit" disabled={!input.trim()} style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: input.trim() ? 'linear-gradient(135deg, #f9a8d4, #fda4af)' : '#f0f0f0',
                color: input.trim() ? '#fff' : '#bbb', fontSize: '1.125rem', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
              }}>↑</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>Select a conversation</div>
      )}

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-7px)} }`}</style>
    </div>
  );
}
