import { useEffect, useRef, useState } from 'react';
import { setView } from '../../../components/kudos/constants';
import { kudosApi, useKudosUser } from '../lib/kudosApi';

interface Message { id: string; role: 'user' | 'ai'; content: string; }

const MODES = [
  { id: 'support', label: '🫂 Support' },
  { id: 'deep', label: '🧠 Deep Think' },
  { id: 'builder', label: '🚀 Builder' },
  { id: 'casual', label: '😄 Casual' },
];
const QUICK_CHIPS = ['How am I doing?', "I need to talk.", "I'm feeling stuck.", 'Tell me something real.'];

export default function DashboardHome() {
  const user = useKudosUser();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('support');
  const [health, setHealth] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [intros, setIntros] = useState<any[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    kudosApi.chatHistory().then((d) => {
      if (d.history?.length) {
        setMessages(d.history.map((h: any, i: number) => ({ id: String(i), role: h.role === 'assistant' ? 'ai' : h.role, content: h.content })));
      } else {
        setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name.split(' ')[0]}. What's on your mind?` }]);
      }
    }).catch(() => setMessages([{ id: 'welcome', role: 'ai', content: `Hey ${user.name.split(' ')[0]}. What's on your mind?` }]));
    kudosApi.healthScore().then((d) => d.score && setHealth(d.score)).catch(() => setHealth({ score: 74, conversationStreak: 12, totalHumansMet: 3, kudosGiven: 11 }));
    kudosApi.healthChallenge().then(setChallenge).catch(() => setChallenge({ challenge: { id: 'reach_out_first', text: 'Reach out to someone first today.' }, completedToday: false, completedThisWeek: 3, weeklyGoal: 5 }));
    kudosApi.humansIntros().then((d) => setIntros(d.intros || [])).catch(() => setIntros([]));
  }, [user.name]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isTyping) return;
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: msgText }]);
    setIsTyping(true);
    try {
      const data = await kudosApi.chatSend(msgText, mode);
      if (data.reply) setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'ai', content: "I'm here. Even when my connection isn't. ❤️" }]);
    }
    setIsTyping(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="companion-orb" style={{ width: 40, height: 40 }} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Companion</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Always here</p>
            </div>
          </div>
          <select className="input" style={{ width: 160, padding: '8px 12px' }} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="chat-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user-row' : ''}`}>
              {msg.role === 'ai' && <div className="companion-orb" style={{ width: 32, height: 32 }} />}
              <div className={`message-bubble ${msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>{msg.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="message-row">
              <div className="companion-orb" style={{ width: 32, height: 32 }} />
              <div className="bubble-ai typing-dots"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="quick-chips">{QUICK_CHIPS.map((chip) => <button key={chip} type="button" className="quick-chip" onClick={() => sendMessage(chip)}>{chip}</button>)}</div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-1)' }}>
          <input className="input" placeholder="Talk to your companion..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} style={{ flex: 1, borderRadius: 'var(--radius-pill)' }} />
          <button type="button" className="btn btn-primary btn-icon" onClick={() => sendMessage()} disabled={!input.trim() || isTyping}>→</button>
        </div>
      </div>
      <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[{ label: '🔥 Streak', value: `${health.conversationStreak || 0}d` }, { label: '👥 Met', value: health.totalHumansMet || 0 }, { label: '💛 Kudos', value: health.kudosGiven || 0 }].map((s) => (
              <div key={s.label} className="card" style={{ padding: 12, textAlign: 'center' }}><p style={{ fontWeight: 700 }}>{s.value}</p><p className="caption">{s.label}</p></div>
            ))}
          </div>
        )}
        {challenge && (
          <div className="card" style={{ padding: 16 }}>
            <p className="label" style={{ color: 'var(--accent)', marginBottom: 8 }}>Daily Challenge</p>
            <p style={{ marginBottom: 12 }}>{challenge.challenge?.text}</p>
            {!challenge.completedToday && <button type="button" className="btn btn-ghost btn-sm btn-full" onClick={() => kudosApi.completeChallenge(challenge.challenge.id).then(() => setChallenge({ ...challenge, completedToday: true }))}>Mark Done</button>}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <p className="label" style={{ color: 'var(--text-muted)' }}>Warm Intros</p>
            <button type="button" onClick={() => setView('/dashboard/humans')} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>See all →</button>
          </div>
          {intros.slice(0, 2).map((intro: any) => (
            <div key={intro.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
              <p style={{ fontWeight: 600 }}>{intro.name}</p>
              <p className="caption" style={{ marginBottom: 8 }}>{intro.companionReason}</p>
              <button type="button" className="btn btn-ghost btn-sm btn-full" onClick={() => setView('/dashboard/humans')}>Connect →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
