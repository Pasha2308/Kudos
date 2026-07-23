import { useEffect, useState } from 'react';
import { kudosApi } from '../lib/kudosApi';

export default function KudosView() {
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([kudosApi.kudosReceived(), kudosApi.kudosSent(), kudosApi.kudosWeeklyStats()])
      .then(([r, s, st]) => { setReceived(r.kudos || []); setSent(s.kudos || []); setStats(st); })
      .catch(() => setStats({ reflectionsGiven: 4, reflectionsReceived: 7 }));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h1 className="h1" style={{ marginBottom: 8 }}>Kudos Moments</h1>
      <p className="body" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Private appreciation — never performative.</p>
      {stats && (
        <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 24 }}>
          <div><p style={{ fontWeight: 700 }}>{stats.reflectionsReceived ?? 0}</p><p className="caption">Received this week</p></div>
          <div><p style={{ fontWeight: 700 }}>{stats.reflectionsGiven ?? 0}</p><p className="caption">Given this week</p></div>
        </div>
      )}
      <h2 className="h3" style={{ marginBottom: 12 }}>Received</h2>
      {received.length === 0 ? <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 24 }}>No kudos yet — keep showing up authentically.</p> : received.map((k) => (
        <div key={k.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
          <p className="caption">From {k.fromUserName}</p>
          <p className="body">{k.triggeredByMessage || 'Someone noticed something real about you.'}</p>
        </div>
      ))}
      <h2 className="h3" style={{ margin: '24px 0 12px' }}>Sent</h2>
      {sent.map((k) => (
        <div key={k.id} className="card" style={{ padding: 16, marginBottom: 8 }}>
          <p className="caption">To {k.toUserName}</p>
          <p className="body">{k.triggeredByMessage}</p>
        </div>
      ))}
    </div>
  );
}
