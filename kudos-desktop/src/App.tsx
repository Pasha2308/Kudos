import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWindow, Window, currentMonitor, PhysicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { enable, disable } from '@tauri-apps/plugin-autostart';
import './App.css';

// -- Custom Hooks for Sync ---------------------------------------------
function useSyncedState<T = string>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(
    (localStorage.getItem(key) as unknown as T) || defaultValue
  );
  
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      listen<T>(`${key}-changed`, (e) => {
        setValue(e.payload);
        localStorage.setItem(key, e.payload as unknown as string);
      }).then(f => { unlistenFn = f; }).catch(() => {});
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) setValue(e.newValue as T);
    };
    window.addEventListener('storage', handleStorage);
    return () => { 
      if (unlistenFn) unlistenFn();
      window.removeEventListener('storage', handleStorage);
    };
  }, [key]);

  const setSyncedValue = (newVal: T) => {
    setValue(newVal);
    localStorage.setItem(key, newVal as unknown as string);
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      emit(`${key}-changed`, newVal).catch(() => {});
    }
  };

  return [value, setSyncedValue] as const;
}

// -- Emotion ? asset mapping ------------------------------------------
const getAsset = (character: string, emotion: string) => {
  const prefix = `/assets/gifs/${character}`;
  switch (emotion) {
    case 'happy':
    case 'excited':  return `${prefix}-jumping.gif`;
    case 'focused':
    case 'thinking': return `${prefix}-waiting.gif`;
    case 'tired':
    case 'stressed':
    case 'sad':      return `${prefix}-failed.gif`;
    case 'reviewing':return `${prefix}-review.gif`;
    case 'typing':   return `${prefix}-running.gif`;
    case 'waving':   return `${prefix}-waving.gif`;
    default:         return `${prefix}-idle.gif`;
  }
};

const getGlowColor = (emotion: string): string => {
  switch (emotion) {
    case 'happy':
    case 'excited':  return 'rgba(255, 180, 100, 0.55)';
    case 'focused':
    case 'thinking': return 'rgba(100, 180, 255, 0.55)';
    case 'tired':
    case 'sad':      return 'rgba(150, 120, 200, 0.4)';
    default:         return 'rgba(220, 130, 220, 0.45)';
  }
};

type NudgeState = { text: string; visible: boolean };
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

// -----------------------------------------------------------------------
//  PET WINDOW
// -----------------------------------------------------------------------
function PetWindow({ onChatToggle }: { onChatToggle?: () => void }) {
  const [emotion, setEmotion]   = useState('neutral');
  const [nudge, setNudge]       = useState<NudgeState>({ text: '', visible: false });
  const [popped, setPopped]     = useState(false);
  const [isMini, setIsMini]     = useState(true); // Mini Mode state
  const nudgeTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [character] = useSyncedState('kudos-character', 'anime-glasses');
  const [position]  = useSyncedState<Position>('kudos-position', 'bottom-right');

  // Position Native Window
  const updateWindowPosition = useCallback(async (mini: boolean) => {
    try {
      const windowApi = getCurrentWindow();
      if (windowApi.label !== 'kudos-pet') return;
      
      const width = mini ? 100 : 200; // Increased mini width slightly so it doesn't clip
      const height = mini ? 120 : 250;
      await windowApi.setSize(new LogicalSize(width, height));

      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor;
        const winSize = await windowApi.outerSize();
        let x = 0;
        let y = 0;
        
        // Calculate based on selected corner with appropriate padding for taskbars
        if (position.includes('right')) {
          x = monitor.position.x + monitor.size.width - winSize.width - (20 * scale);
        } else {
          x = monitor.position.x + (20 * scale);
        }

        if (position.includes('bottom')) {
          y = monitor.position.y + monitor.size.height - winSize.height - (60 * scale);
        } else {
          y = monitor.position.y + (20 * scale);
        }
        
        await windowApi.setPosition(new PhysicalPosition(x, y));
      }
    } catch {}
  }, [position]);

  // Effect to apply position when settings or mode change
  useEffect(() => { updateWindowPosition(isMini); }, [isMini, position, updateWindowPosition]);

  // Listen for Chat window closing to shrink back, and shortcut to expand
  useEffect(() => {
    let unlistenClose: (() => void) | null = null;
    let unlistenShortcut: (() => void) | null = null;
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      listen('chat-closed', () => setIsMini(true))
        .then(f => { unlistenClose = f; }).catch(() => {});
      
      listen('shortcut-triggered', async () => {
        setIsMini(false);
        try {
          const chatWin = await Window.getByLabel('kudos-chat');
          if (chatWin) { await chatWin.show(); await chatWin.setFocus(); }
        } catch {}
      }).then(f => { unlistenShortcut = f; }).catch(() => {});
    }
    return () => { 
      if (unlistenClose) unlistenClose(); 
      if (unlistenShortcut) unlistenShortcut();
    };
  }, []);

  // SSE stream
  useEffect(() => {
    const es = new EventSource('http://localhost:8080/api/stream');

    es.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'emotion') {
          setEmotion(data.message);
        } else if (data.type === 'nudge') {
          setEmotion('waving');
          setNudge({ text: data.message, visible: true });
          if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
          nudgeTimer.current = setTimeout(() => {
            setNudge(n => ({ ...n, visible: false }));
            setEmotion('neutral');
          }, 8000);

          if (onChatToggle) {
            onChatToggle();
          } else {
            setIsMini(false); // Expand when nudging
            const chatWin = await Window.getByLabel('kudos-chat');
            if (chatWin) { await chatWin.show(); await chatWin.setFocus(); }
          }
        }
      } catch { /* ignore parse errors */ }
    };

    return () => { es.close(); if (nudgeTimer.current) clearTimeout(nudgeTimer.current); };
  }, [onChatToggle]);

  const handleClick = async () => {
    const popChat = async () => {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (!isTauri) {
        if (onChatToggle) onChatToggle();
        return;
      }
      setPopped(true);
      setEmotion('excited');
      
      // Add small delay to let emotion set and CSS register before window opens
      setTimeout(async () => {
        try {
          const chatWin = await Window.getByLabel('kudos-chat');
          if (chatWin) {
            await chatWin.show();
            await chatWin.setFocus();
          }
        } catch (err) {
          console.error(err);
        }
        setTimeout(() => {
          setPopped(false);
          setEmotion('neutral');
        }, 800);
      }, 150);
    };
    
    await popChat();
  };

  const glowColor = getGlowColor(emotion);

  return (
    <div className={`drag-region pet-window ${isMini ? 'mini-mode' : 'expanded-mode'}`}>
      <div className={`speech-bubble ${nudge.visible ? 'speech-visible' : ''}`}>
        <span className="speech-tail" />
        {nudge.text}
      </div>

      <div
        className={`pet-container anim-float ${popped ? 'pet-pop' : ''}`}
        onClick={handleClick}
        style={{ '--glow-color': glowColor } as React.CSSProperties}
      >
        <div className="pet-glow" style={{ boxShadow: `0 0 ${isMini ? 20 : 40}px ${isMini ? 10 : 20}px ${glowColor}` }} />
        <img
          key={character + emotion}
          src={getAsset(character, emotion)}
          className="pet-img"
          alt="Kudos"
          draggable={false}
        />
        {!isMini && (emotion === 'happy' || emotion === 'excited') && (
          <div className="sparkle-ring" aria-hidden>
            {[...Array(6)].map((_, i) => (
              <span key={i} className="sparkle" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>

      <div className="emotion-badge">{EMOTION_EMOJI[emotion] ?? '??'}</div>
    </div>
  );
}

const EMOTION_EMOJI: Record<string, string> = {
  neutral: '??', happy: '?', excited: '?', focused: '??', thinking: '??', tired: '??', stressed: '??', sad: '??',
};

// -----------------------------------------------------------------------
//  CHAT WINDOW
// -----------------------------------------------------------------------
type Message = { role: 'user' | 'assistant'; content: string; ts?: number };
const MODES = ['cofounder', 'mentor', 'friend'] as const;

function ChatWindow({ onClose }: { onClose?: () => void }) {
  const [input, setInput]       = useState('');
  const [history, setHistory]   = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const [userToken, setUserToken] = useSyncedState<string>('kudos-token', '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [mode, setMode]         = useState<typeof MODES[number]>('cofounder');
  const [emotion, setEmotion]   = useState('neutral');
  const [slideIn, setSlideIn]   = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [character, setCharacter] = useSyncedState<string>('kudos-character', 'anime-glasses');
  const [position, setPosition]   = useSyncedState<Position>('kudos-position', 'bottom-right');
  const [theme, setTheme]         = useSyncedState<string>('kudos-theme', 'dark');
  const [autostart, setAutostart] = useSyncedState<string>('kudos-autostart', 'false');
  const [localMode, setLocalMode] = useSyncedState<string>('kudos-local-mode', 'false');
  
  const [showSettings, setShowSettings] = useState(false);
  
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => setSlideIn(true), 30); }, []);

  // Fetch History
  useEffect(() => {
    if (!userToken) return;
    fetch('http://localhost:8080/api/chat/history', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.history) {
          const formatted = data.history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            ts: msg.ts || Date.now()
          }));
          if (formatted.length > 0) setHistory(formatted);
        }
      })
      .catch(() => {});
  }, [userToken]);

  useEffect(() => {
    const es = new EventSource('http://localhost:8080/api/stream');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'emotion') setEmotion(data.message);
        if (data.type === 'nudge') addMsg({ role: 'assistant', content: data.message });
        if (data.type === 'chat-message') {
          const msg = data.message;
          setHistory(prev => {
            if (prev.some(m => m.content === msg.content && m.role === msg.role)) return prev;
            return [...prev, { role: msg.role, content: msg.content, ts: msg.ts }];
          });
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  const addMsg = (msg: Message) => setHistory(h => [...h, { ...msg, ts: Date.now() }]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    addMsg({ role: 'user', content: text });
    setLoading(true);
    setEmotion('typing'); // Switch to active typing state

    let activeWindow = "";
    if (!privacyMode) {
      try { activeWindow = await invoke<string>('get_active_window_title'); } catch {}
    }

    try {
      const res = await fetch('http://localhost:8080/api/chat/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ message: text, mode, activeWindow, localMode: localMode === 'true' }),
      });
      const data = await res.json();
      addMsg({ role: 'assistant', content: data.reply ?? "Something went wrong ??" });
      setEmotion('neutral');
    } catch {
      addMsg({ role: 'assistant', content: "Can't reach my brain right now (API offline) ??" });
      setEmotion('tired');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, mode, privacyMode]);

  const close = async () => {
    setSlideIn(false);
    
    // Broadcast close to pet window
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try { await emit('chat-closed'); } catch {}
    }
    
    setTimeout(async () => {
      if (onClose) { onClose(); return; }
      try { await getCurrentWindow().hide(); } catch { /* ignore */ }
    }, 280);
  };

  return (
    <div className={`chat-container ${slideIn ? 'chat-slide-in' : 'chat-slide-out'}`}>
      <div className="chat-blur-bg" />
      
      <div className="chat-header drag-region">
        <div className="chat-header-left">
          <div className="chat-avatar anim-float">
            <img src={getAsset(character, emotion)} alt="Kudos" className="chat-avatar-img" />
          </div>
          <div className="chat-title-block">
            <span className="chat-title">Kudos</span>
            <span className="chat-status">
              <span className="status-dot" />
              {emotion}
            </span>
          </div>
        </div>

        <div className="chat-header-right" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙️</button>
          <button 
            className={`privacy-btn ${privacyMode ? 'active' : ''}`}
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Privacy Mode On (Screen Hidden)" : "Privacy Mode Off (Screen Shared)"}
          >
            {privacyMode ? '🙈' : '👁️'}
          </button>
          
          <button className="min-btn" onClick={async () => {
            try { await getCurrentWindow().minimize(); } catch { /* ignore for web preview */ }
          }} aria-label="Minimize">_</button>
          <button className="close-btn" onClick={close} aria-label="Close">✕</button>
        </div>
      </div>

      {!userToken ? (
        <div className="login-container" style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Welcome to Kudos</h2>
          <p style={{ color: '#a3a3a3', marginBottom: 32 }}>Sign in to your AI companion</p>
          <div style={{ background: '#171717', padding: 24, borderRadius: 16, width: '100%', maxWidth: 300, border: '1px solid #262626' }}>
            <input 
              type="text" 
              placeholder="Email address" 
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: '#0a0a0a', border: '1px solid #262626', color: 'white', marginBottom: 16 }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: '#0a0a0a', border: '1px solid #262626', color: 'white', marginBottom: 24 }}
            />
            <button 
              onClick={async () => {
                if (!loginEmail || !loginPassword) return;
                setLoginLoading(true);
                try {
                  const uid = loginEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                  const token = `mock_token_${uid}`;
                  const res = await fetch('http://localhost:8080/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ email: loginEmail, name: uid })
                  });
                  if (res.ok) setUserToken(token);
                } catch { } finally { setLoginLoading(false); }
              }}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: 'linear-gradient(45deg, #10b981, #0ea5e9)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loginLoading ? 'Loading...' : 'Continue'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chat-messages">
            {history.map((msg, i) => (
              <div key={i} className={`msg-wrap ${msg.role === 'user' ? 'msg-wrap-user' : 'msg-wrap-ai'}`}>
                <div className={`msg-bubble ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg-wrap msg-wrap-ai">
                <div className="msg-bubble msg-ai loading-dots">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>

          <div className="chat-input-area drag-region">
            <div className="chat-input-wrapper" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Message Kudos..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
              />
              <button className="send-btn" onClick={send} disabled={!input.trim() || loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="mode-selector" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              {MODES.map(m => (
                <button key={m} className={`mode-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

        {showSettings && (
          <div className="settings-overlay">
            <div className="settings-modal">
              <div className="settings-modal-header">
                <h3>Preferences</h3>
                <button className="close-btn" onClick={() => setShowSettings(false)}>?</button>
              </div>
              <div className="settings-content">
                <div className="settings-row">
                  <label>Character:</label>
                  <select className="character-select" value={character} onChange={e => setCharacter(e.target.value)}>
                    <option value="anime-glasses">Glasses</option>
                    <option value="ponyo-ci-v3">Ponyo</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Position:</label>
                  <select className="character-select" value={position} onChange={e => setPosition(e.target.value as Position)}>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Theme:</label>
                  <select className="character-select" value={theme} onChange={e => setTheme(e.target.value)}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="synthwave">Synthwave</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Autostart:</label>
                  <select className="character-select" value={autostart} onChange={async e => {
                    const val = e.target.value;
                    setAutostart(val);
                    if (val === 'true') {
                      try { await enable(); } catch {}
                    } else {
                      try { await disable(); } catch {}
                    }
                  }}>
                    <option value="false">Off</option>
                    <option value="true">On</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Privacy:</label>
                  <select className="character-select" value={localMode} onChange={e => setLocalMode(e.target.value)}>
                    <option value="false">Cloud AI (Fast)</option>
                    <option value="true">Local Mode (Ollama)</option>
                  </select>
                </div>
                <div className="settings-row" style={{ marginTop: 16 }}>
                  <button onClick={() => { setUserToken(''); setShowSettings(false); }} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="chat-messages">
        {history.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar-mini">
                <img src={getAsset(character, 'neutral')} alt="" />
              </div>
            )}
            <div className={`msg-bubble ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-row assistant">
            <div className="msg-avatar-mini">
              <img src={getAsset(character, 'typing')} alt="" />
            </div>
            <div className="msg-bubble assistant typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Tell me anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          autoFocus
        />
        <button className={`send-btn ${loading ? 'loading' : ''}`} onClick={send} disabled={!input.trim() || loading}>
          ➤
        </button>
        </div>
        <div className="resize-handle" onMouseDown={async (e) => {
          if (e.buttons === 1) {
            try {
              const { getCurrentWindow } = await import('@tauri-apps/api/window');
              getCurrentWindow().startDragging(); // Start dragging isn't perfectly for resizing, but tauri handles resize via decorations. We will just use the visual indicator as native Tauri resizes borderless correctly on edges if resizable: true
            } catch {}
          }
        }} />
      </div>
    );
  }

// -----------------------------------------------------------------------
//  ROOT
// -----------------------------------------------------------------------
function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const [isTauri, setIsTauri]         = useState(true);
  const [chatOpen, setChatOpen]       = useState(false);

  const [theme, setTheme] = useSyncedState<string>('kudos-theme', 'dark');
  const [localMode] = useSyncedState<string>('kudos-local-mode', 'false');
  const [userToken] = useSyncedState<string>('kudos-token', '');
  const [, setCharacter] = useSyncedState<string>('kudos-character', 'anime-glasses');

  const lastActiveWindowRef = useRef<string>('');
  const lastIsIdleRef = useRef<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // -- SSE Sync --
  useEffect(() => {
    if (!userToken) return;
    
    const es = new EventSource(`http://localhost:8080/api/stream?token=${userToken}`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'preferences-updated' && data.message) {
          if (data.message.theme) setTheme(data.message.theme);
          if (data.message.avatar) setCharacter(data.message.avatar);
          // persona maps to mode in desktop but desktop doesn't use it globally, just in ChatWindow
        }
      } catch (e) {
        console.error('SSE Error:', e);
      }
    };

    return () => {
      es.close();
    };
  }, [userToken]);

  useEffect(() => {
    try {
      setWindowLabel(getCurrentWindow().label);
      setIsTauri(true);

      const interval = setInterval(async () => {
        try {
          const title = await invoke<string>('get_active_window_title');
          const idleMs = await invoke<number>('get_idle_time_ms');
          const isIdle = idleMs > 60000; 

          if (title !== lastActiveWindowRef.current || isIdle !== lastIsIdleRef.current) {
            lastActiveWindowRef.current = title;
            lastIsIdleRef.current = isIdle;

            await fetch('http://localhost:8080/api/chat/sync', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken || 'mock_token'}`
              },
              body: JSON.stringify({ activeWindow: title, isIdle, localMode: localMode === 'true' }),
            });
          }
        } catch { /* ignore */ }
      }, 15000);

      return () => clearInterval(interval);
    } catch {
      setIsTauri(false);
    }
  }, []);

  if (isTauri) {
    if (windowLabel === 'kudos-chat') return <ChatWindow />;
    return <PetWindow />;
  }

  return (
    <div className="browser-preview-root">
      <div className="fake-desktop">
        <div className="fake-window">
          <div className="fake-titlebar"><span /><span /><span /></div>
          <div className="fake-content">
            <div className="fake-line" style={{width:'60%'}} />
            <div className="fake-line" style={{width:'80%'}} />
            <div className="fake-line" style={{width:'45%'}} />
            <div className="fake-line" style={{width:'70%'}} />
          </div>
        </div>
      </div>
      <div className="desktop-pet-overlay">
        <PetWindow onChatToggle={() => setChatOpen(o => !o)} />
      </div>
      {chatOpen && (
        <div className="browser-chat-panel">
          <ChatWindow onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
