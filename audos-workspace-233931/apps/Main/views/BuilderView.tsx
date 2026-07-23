import { useEffect, useState } from 'react';
import { kudosApi } from '../lib/kudosApi';

export default function BuilderView() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    kudosApi.builderProfile().then((d) => setProfile(d.profile || d)).catch(() => setProfile({ enabled: false, building: '', howYouWork: '', whatYouNeed: '' }));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 className="h1" style={{ marginBottom: 8 }}>Builder Tools</h1>
      <p className="body" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Cofounder discovery and chemistry test sprints.</p>
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 className="h3" style={{ marginBottom: 12 }}>Discovery profile</h2>
        <label className="label" style={{ display: 'block', marginBottom: 8 }}>What you're building</label>
        <textarea className="input textarea" rows={3} defaultValue={profile?.building || ''} placeholder="Describe your startup or project..." />
        <label className="label" style={{ display: 'block', margin: '16px 0 8px' }}>How you work</label>
        <textarea className="input textarea" rows={2} defaultValue={profile?.howYouWork || ''} />
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }}>Save profile</button>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <h2 className="h3" style={{ marginBottom: 8 }}>Chemistry test sprint</h2>
        <p className="body" style={{ marginBottom: 16 }}>Run a 3-day async sprint with a potential cofounder to test working chemistry.</p>
        <button type="button" className="btn btn-pill">Start chemistry test</button>
      </div>
    </div>
  );
}
