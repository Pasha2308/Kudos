import { useEffect, useState } from 'react';
import { kudosApi } from '../lib/kudosApi';

export default function RoomsView() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);

  useEffect(() => {
    kudosApi.roomsList().then((d) => {
      setRooms(d.rooms || []);
      setSuggested(d.suggested || []);
    }).catch(() => {
      setSuggested([
        { id: 'room_1', name: 'Midnight Builders', emoji: '🌙', memberCount: 12, daysRemaining: 18 },
        { id: 'room_2', name: 'Overthinkers Club', emoji: '💭', memberCount: 8, daysRemaining: 22 },
      ]);
    });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 className="h1" style={{ marginBottom: 8 }}>Rooms</h1>
      <p className="body" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Ephemeral group spaces — live for 30 days.</p>
      <button type="button" className="btn btn-primary" style={{ marginBottom: 24 }}>+ Create room</button>
      <h2 className="h3" style={{ marginBottom: 12 }}>Suggested</h2>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {[...rooms, ...suggested].map((room) => (
          <div key={room.id} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{room.emoji || '🌐'}</div>
            <p style={{ fontWeight: 600 }}>{room.name}</p>
            <p className="caption">{room.memberCount || 0} members · {room.daysRemaining ?? 30} days left</p>
            <button type="button" className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 12 }}>Join room</button>
          </div>
        ))}
      </div>
    </div>
  );
}
