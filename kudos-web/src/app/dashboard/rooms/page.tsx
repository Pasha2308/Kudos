'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Room { id: string; name: string; emoji: string; description: string; memberCount: number; activeCount: number; daysRemaining: number; tags: string[]; isEphemeral: boolean; }
interface Message { id: string; userId: string; userName: string; content: string; timestamp: any; }

export default function RoomsPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const bottomRef = useRef<HTMLDivElement>(null);

  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [suggestedRooms, setSuggestedRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', emoji: '🌙', description: '', tags: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };

    fetch(`${API_URL}/api/rooms`, { headers })
      .then(r => r.json())
      .then(d => {
        setUserRooms(d.userRooms || []);
        setSuggestedRooms(d.suggestedRooms || []);
        if (d.userRooms?.length > 0) setActiveRoom(d.userRooms[0]);
      })
      .catch(() => {
        // Fresh state — no fake data
        setUserRooms([]);
        setSuggestedRooms([]);
      })
      .finally(() => setLoading(false));
  }, [user, API_URL]);


  useEffect(() => {
    if (!activeRoom || !user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };

    fetch(`${API_URL}/api/rooms/${activeRoom.id}/messages`, { headers })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => setMessages([]));

  }, [activeRoom, user, API_URL]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeRoom || !user || sending) return;
    const msg = msgInput.trim();
    setMsgInput('');
    setSending(true);

    const optimistic: Message = { id: Date.now().toString(), userId: user.uid, userName: user.name || 'You', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, optimistic]);

    try {
      await fetch(`${API_URL}/api/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ content: msg }),
      });
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const joinRoom = async (room: Room) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      setUserRooms(prev => [...prev, room]);
      setSuggestedRooms(prev => prev.filter(r => r.id !== room.id));
      setActiveRoom(room);
    } catch (e) { console.error(e); }
  };

  const createRoom = async () => {
    if (!user || !newRoom.name.trim() || !newRoom.description.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ name: newRoom.name, emoji: newRoom.emoji, description: newRoom.description, tags: newRoom.tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (data.room) {
        setUserRooms(prev => [...prev, data.room]);
        setActiveRoom(data.room);
      }
    } catch (e) { console.error(e); }
    setShowCreate(false);
    setNewRoom({ name: '', emoji: '🌙', description: '', tags: '' });
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', overflow: 'hidden' }}>
      {/* ─── Left: Room List ─── */}
      <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="h2">Rooms</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New</button>
          </div>
          <p className="caption" style={{ marginTop: 4 }}>Small groups. 30-day windows.</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {userRooms.length > 0 && (
            <>
              <p className="label" style={{ color: 'var(--text-muted)', padding: '4px 8px 8px' }}>YOUR ROOMS</p>
              {userRooms.map(room => (
                <button key={room.id} onClick={() => setActiveRoom(room)} style={{ width: '100%', background: activeRoom?.id === room.id ? 'rgba(99,102,241,0.12)' : 'none', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px', cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'background 0.15s', borderLeft: activeRoom?.id === room.id ? '2px solid var(--primary)' : '2px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.25rem' }}>{room.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</p>
                      <p className="caption">{room.activeCount} active · {room.daysRemaining}d left</p>
                    </div>
                    {room.activeCount > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />}
                  </div>
                </button>
              ))}
            </>
          )}

          {suggestedRooms.length > 0 && (
            <>
              <p className="label" style={{ color: 'var(--text-muted)', padding: '12px 8px 8px' }}>SUGGESTED</p>
              {suggestedRooms.map(room => (
                <div key={room.id} style={{ padding: '12px', marginBottom: 4, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.25rem' }}>{room.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</p>
                      <p className="caption">{room.memberCount} members · {room.daysRemaining}d left</p>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-full" onClick={() => joinRoom(room)}>Join →</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ─── Right: Active Room Chat ─── */}
      {activeRoom ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* Room Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.75rem' }}>{activeRoom.emoji}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{activeRoom.name}</h2>
                  <span className="badge badge-amber">Closes in {activeRoom.daysRemaining}d</span>
                </div>
                <p className="caption">{activeRoom.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-area" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="card" style={{ padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
              <p className="caption">This room closes in <strong style={{ color: 'var(--accent)' }}>{activeRoom.daysRemaining} days</strong>. Build something real before it's gone.</p>
            </div>
            {messages.map(msg => {
              const isMe = msg.userId === user?.uid;
              return (
                <div key={msg.id} className={`message-row ${isMe ? 'user-row' : ''}`} style={{ marginBottom: 4 }}>
                  {!isMe && (
                    <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                      {msg.userName?.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    {!isMe && <p className="caption" style={{ marginBottom: 3, paddingLeft: 4 }}>{msg.userName}</p>}
                    <div className={`message-bubble ${isMe ? 'bubble-user' : 'bubble-ai'}`}>{msg.content}</div>
                    <p className="message-time" style={{ paddingLeft: isMe ? 0 : 4, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.timestamp)}</p>
                  </div>
                  {isMe && <div className="avatar avatar-sm">{user?.name?.slice(0, 1) || 'Y'}</div>}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)', display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder={`Message ${activeRoom.name}...`}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}
            />
            <button className="btn btn-primary btn-icon" onClick={sendMessage} disabled={!msgInput.trim() || sending} style={{ borderRadius: 'var(--radius-pill)', width: 48, height: 48 }}>→</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
          <div style={{ fontSize: '3rem' }}>🌐</div>
          <h2 className="h2">Find Your Room</h2>
          <p className="body" style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>Small group spaces that close in 30 days. Real conversations. Real humans.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create a Room</button>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowCreate(false)}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: 440, padding: 28, borderRadius: 'var(--radius-xl)', animation: 'fade-up 0.3s ease both' }} onClick={e => e.stopPropagation()}>
            <h3 className="h3" style={{ marginBottom: 4 }}>Create a Room</h3>
            <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 20 }}>It closes automatically in 30 days. Build something real.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <select value={newRoom.emoji} onChange={e => setNewRoom(p => ({ ...p, emoji: e.target.value }))} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', padding: '12px', fontSize: '1.25rem', cursor: 'pointer' }}>
                  {['🌙', '🔥', '💭', '🎯', '🌊', '⚡', '🌱', '✨', '🎨', '🧠', '💞', '🌍'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <input className="input" placeholder="Room name..." value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} />
            </div>
            <textarea className="input textarea" placeholder="What's this room about? Be specific." value={newRoom.description} onChange={e => setNewRoom(p => ({ ...p, description: e.target.value }))} style={{ marginBottom: 12, minHeight: 80 }} />
            <input className="input" placeholder="Tags (comma separated): builders, midnight, honest" value={newRoom.tags} onChange={e => setNewRoom(p => ({ ...p, tags: e.target.value }))} style={{ marginBottom: 16 }} />

            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>⏰ This room will automatically close in 30 days. Build something real before it's gone.</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={createRoom} disabled={!newRoom.name.trim() || !newRoom.description.trim()}>Create Room</button>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
