import { useEffect, useState } from 'react';
import { kudosApi } from '../lib/kudosApi';

export default function HumansView() {
  const [intros, setIntros] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([kudosApi.humansIntros(), kudosApi.humansConversations()])
      .then(([introData, convData]) => {
        setIntros(introData.intros || []);
        setConversations(convData.conversations || []);
      })
      .catch(() => {
        setIntros([
          { id: 'mock_priya', name: 'Priya Sharma', location: 'Mumbai', companionReason: 'You both hate small talk.', personalityTags: ['Builder'] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading warm intros...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 className="h1" style={{ marginBottom: 8 }}>Humans</h1>
      <p className="body" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Warm intros from your companion — connect when it feels right.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {intros.map((intro) => (
          <div key={intro.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div className="avatar">{intro.name?.slice(0, 1)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{intro.name}</p>
                <p className="caption">{intro.location} · {(intro.personalityTags || []).join(' · ')}</p>
                <p className="body" style={{ marginTop: 8, fontStyle: 'italic' }}>"{intro.companionReason}"</p>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Send warm note</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {conversations.length > 0 && (
        <>
          <h2 className="h2" style={{ marginTop: 32, marginBottom: 12 }}>Your conversations</h2>
          {conversations.map((c) => (
            <div key={c.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
              <p style={{ fontWeight: 600 }}>{c.otherUserName}</p>
              <p className="caption">{c.lastMessage}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
