import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWindow, Window, currentMonitor, PhysicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import './App.css';

// -- Custom Hooks for Sync ---------------------------------------------
function useSyncedState<T extends string>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(
    (localStorage.getItem(key) as T) || defaultValue
  );
  
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      listen<T>(`${key}-changed`, (e) => {
        setValue(e.payload);
        localStorage.setItem(key, e.payload);
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

  const updateValue = async (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new Event('storage'));
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try { await emit(`${key}-changed`, newValue); } catch {}
    }
  };
  return [value, updateValue] as const;
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
    setPopped(true);
    setEmotion('happy');
    setIsMini(false); // Expand on click
    
    setTimeout(() => {
      setPopped(false);
      setEmotion('neutral');
    }, 1000);

    if (onChatToggle) { onChatToggle(); return; }
    try {
      const chatWin = await Window.getByLabel('kudos-chat');
      if (chatWin) {
        const vis = await chatWin.isVisible();
        if (vis) {
          await chatWin.hide();
          setIsMini(true);
        } else { 
          await chatWin.show(); 
          await chatWin.setFocus(); 
        }
      }
    } catch { /* ignore */ }
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
  const [history, setHistory]   = useState<Message[]>([
    { role: 'assistant', content: "Hey ?? I'm Kudos — your companion, vibe-checker, and hype person. What's on your mind?", ts: Date.now() }
  ]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<typeof MODES[number]>('cofounder');
  const [emotion, setEmotion]   = useState('neutral');
  const [slideIn, setSlideIn]   = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [character, setCharacter] = useSyncedState('kudos-character', 'anime-glasses');
  const [position, setPosition]   = useSyncedState<Position>('kudos-position', 'bottom-right');
  const [theme, setTheme]         = useSyncedState('kudos-theme', 'dark');
  const [autostart, setAutostart] = useSyncedState('kudos-autostart', 'false');
  
  const [showSettings, setShowSettings] = useState(false);
  
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => setSlideIn(true), 30); }, []);

  useEffect(() => {
    const es = new EventSource('http://localhost:8080/api/stream');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'emotion') setEmotion(data.message);
        if (data.type === 'nudge') addMsg({ role: 'assistant', content: data.message });
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
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({ message: text, userId: 'test_founder_1', mode, activeWindow }),
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
          
          <div className="settings-dropdown">
            <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}>??</button>
            {showSettings && (
              <div className="settings-menu">
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
              </div>
            )}
          </div>

          <button 
            className={`privacy-btn ${privacyMode ? 'active' : ''}`}
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Privacy Mode On (Screen Hidden)" : "Privacy Mode Off (Screen Shared)"}
          >
            {privacyMode ? '??' : '???'}
          </button>
          
          <button className="close-btn" onClick={close} aria-label="Close">?</button>
        </div>
      </div>

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
        <button
          className={`send-btn ${loading ? 'loading' : ''}`}
          onClick={send}
          disabled={loading}
          aria-label="Send"
        >
          {loading ? '...' : '?'}
        </button>
      </div>
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

  const [theme] = useSyncedState('kudos-theme', 'dark');

  const lastActiveWindowRef = useRef<string>('');
  const lastIsIdleRef = useRef<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
                'Authorization': 'Bearer mock_token'
              },
              body: JSON.stringify({ activeWindow: title, isIdle }),
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
