'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type Step = 1 | 2 | 3 | 4;

const VALUES_CARDS = [
  { id: 'work_style', question: 'When something goes wrong, I tend to:', optionA: 'Fix it alone first', optionB: 'Talk it through with someone' },
  { id: 'risk', question: 'When a new opportunity appears, I:', optionA: 'Research carefully before deciding', optionB: 'Jump in and figure it out' },
  { id: 'communication', question: 'I prefer people who are:', optionA: 'Direct, even if it stings', optionB: 'Diplomatic — feelings matter' },
  { id: 'energy', question: 'After a long social day, I feel:', optionA: 'Drained — I need alone time', optionB: 'Energized — people fuel me' },
  { id: 'life_stage', question: "Right now I'm mostly focused on:", optionA: 'Exploring what I want', optionB: 'Executing on what I know' },
];

const PREVIEW_PEOPLE = [
  { name: 'Priya', trait: 'Midnight builder', emoji: '🌙' },
  { name: 'Arjun', trait: 'Overthinks everything', emoji: '🧠' },
  { name: 'Zara', trait: 'Creates before sunrise', emoji: '🎨' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [valuesAnswers, setValuesAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [cardIndex, setCardIndex] = useState(0);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const firstName = name.split(' ')[0];
      setTimeout(() => {
        setMessages([{
          role: 'ai',
          text: `Hey ${firstName}! Nice to meet you. One honest question — what's something you're really proud of that most people don't know about? 😊`
        }]);
      }, 600);
    }
  }, [step, name]);

  const handleStep1 = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (user) {
        await fetch(`${API_URL}/api/onboarding/step/1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
          body: JSON.stringify({ name: name.trim(), nickname: nickname.trim() || name.trim() }),
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
    setStep(2);
  };

  const handleValueAnswer = async (cardId: string, answer: 'A' | 'B') => {
    const updated = { ...valuesAnswers, [cardId]: answer };
    setValuesAnswers(updated);
    if (cardIndex < VALUES_CARDS.length - 1) {
      setCardIndex(c => c + 1);
    } else {
      // All answered — save and proceed
      setLoading(true);
      try {
        if (user) {
          const res = await fetch(`${API_URL}/api/onboarding/step/2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ answers: updated }),
          });
          const data = await res.json();
          if (data.personalityTags) setPersonalityTags(data.personalityTags);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
      setStep(3);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsTyping(true);
    try {
      if (user) {
        const res = await fetch(`${API_URL}/api/chat/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
          body: JSON.stringify({ message: msg, mode: 'support' }),
        });
        const data = await res.json();
        if (data.reply) {
          setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        }
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: "That's really beautiful. I'm glad you shared that with me. You ready to see who else might want to know?" }]);
        }, 1200);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "That means a lot. Tell me more when you're ready." }]);
    }
    setIsTyping(false);
  };

  const completeOnboarding = async () => {
    if (user) {
      try {
        await fetch(`${API_URL}/api/onboarding/complete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
      } catch (e) { console.error(e); }
    }
    router.push('/dashboard');
  };

  const cardData = VALUES_CARDS[cardIndex];
  const progress = (step - 1) / 4;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background radial glow */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Skip button */}
      {step < 4 && (
        <button onClick={() => router.push('/dashboard')} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9375rem' }}>
          Skip →
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Progress bar */}
        <div className="progress-track" style={{ marginBottom: 32 }}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* ── STEP 1: Name ── */}
        {step === 1 && (
          <div className="animate-fade-up" style={{ textAlign: 'center' }}>
            <div className="companion-orb companion-orb-xl" style={{ margin: '0 auto 24px' }} />
            <h2 className="h1" style={{ marginBottom: 8 }}>Hi. I'm your Kudos companion.</h2>
            <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
              Before I introduce you to anyone — I want to understand you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div>
                <label className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 6 }}>What should I call you?</label>
                <input className="input" type="text" placeholder="Your name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStep1()} autoFocus />
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nickname (optional)</label>
                <input className="input" type="text" placeholder="What your companion calls you..." value={nickname} onChange={e => setNickname(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleStep1} disabled={!name.trim() || loading}>
              {loading ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Values Pulse ── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="h1" style={{ textAlign: 'center', marginBottom: 6 }}>A few quick things about you</h2>
            <p className="body" style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32 }}>No right answers. Just be honest.</p>

            {/* Card */}
            <div className="card-elevated" style={{ padding: '28px', marginBottom: 20, borderRadius: 'var(--radius-xl)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>
                {cardIndex + 1} of {VALUES_CARDS.length}
              </p>
              <p style={{ fontSize: '1.0625rem', fontWeight: 500, lineHeight: 1.5, marginBottom: 24, color: 'var(--text)' }}>
                {cardData.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-ghost btn-full" style={{ justifyContent: 'flex-start', padding: '14px 20px', fontSize: '0.9375rem' }} onClick={() => handleValueAnswer(cardData.id, 'A')}>
                  {cardData.optionA}
                </button>
                <button className="btn btn-ghost btn-full" style={{ justifyContent: 'flex-start', padding: '14px 20px', fontSize: '0.9375rem' }} onClick={() => handleValueAnswer(cardData.id, 'B')}>
                  {cardData.optionB}
                </button>
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {VALUES_CARDS.map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === cardIndex ? 'var(--primary)' : 'var(--surface-3)', transition: 'background 0.2s' }} />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: First Conversation ── */}
        {step === 3 && (
          <div className="animate-fade-up" style={{ height: 500, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 className="h2" style={{ marginBottom: 4 }}>Your first conversation</h2>
              <p className="caption">Step 3 of 4</p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role === 'user' ? 'user-row' : ''}`}>
                  {msg.role === 'ai' && <div className="companion-orb companion-orb-sm" />}
                  <div className={`message-bubble ${msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="message-row">
                  <div className="companion-orb companion-orb-sm" />
                  <div className="bubble-ai typing-dots">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {messages.length >= 3 && (
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8, alignSelf: 'center' }} onClick={() => setStep(4)}>
                I'm ready to meet people →
              </button>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Say anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-icon" onClick={sendChatMessage}>→</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preview Who You'll Meet ── */}
        {step === 4 && (
          <div className="animate-fade-up" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
            <h2 className="h1" style={{ marginBottom: 8 }}>You're ready.</h2>
            <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
              Here's a preview of who your companion might introduce you to:
            </p>

            {personalityTags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
                {personalityTags.map(tag => (
                  <span key={tag} className="chip chip-active">{tag}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {PREVIEW_PEOPLE.map((p, i) => (
                <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <div style={{ fontSize: '1.75rem' }}>{p.emoji}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{p.name}</p>
                    <p className="caption">{p.trait}</p>
                  </div>
                  <div className="badge badge-indigo" style={{ marginLeft: 'auto' }}>Possible intro</div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={completeOnboarding} style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              Enter Kudos →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
