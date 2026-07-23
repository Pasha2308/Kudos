import { useEffect, useState } from 'react';
import { COMPANION_IDLE_GIF } from '../../../components/kudos/constants';
import { kudosApi, useKudosUser } from '../lib/kudosApi';

export default function ProfileView() {
  const user = useKudosUser();
  const [prefs, setPrefs] = useState<any>({ theme: 'dark', persona: 'companion', avatar: 'anime-glasses' });
  const [kyc, setKyc] = useState<any>({ status: 'none' });

  useEffect(() => {
    kudosApi.userPreferences().then((d) => d.preferences && setPrefs(d.preferences)).catch(() => {});
    kudosApi.kycStatus().then((d) => setKyc(d)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 className="h1" style={{ marginBottom: 8 }}>Profile</h1>
      <p className="body" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>{user.email}</p>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 className="h3" style={{ marginBottom: 16 }}>Companion preferences</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <img src={COMPANION_IDLE_GIF} alt="Companion" style={{ width: 64, height: 64, borderRadius: 12 }} />
          <div>
            <p className="label">Avatar</p>
            <select className="input" style={{ marginTop: 4, width: 200 }} value={prefs.avatar} onChange={(e) => setPrefs({ ...prefs, avatar: e.target.value })}>
              <option value="anime-glasses">Anime Glasses</option>
              <option value="ponyo-ci-v3">Ponyo CI</option>
            </select>
          </div>
        </div>
        <p className="label" style={{ marginBottom: 8 }}>Persona</p>
        <select className="input" value={prefs.persona} onChange={(e) => setPrefs({ ...prefs, persona: e.target.value })}>
          <option value="companion">Warm companion</option>
          <option value="coach">Accountability coach</option>
          <option value="friend">Casual friend</option>
        </select>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 className="h3" style={{ marginBottom: 8 }}>Identity verification (KYC)</h2>
        <p className="body" style={{ marginBottom: 12 }}>Status: <span className="badge badge-indigo">{kyc.status || 'not started'}</span></p>
        <p className="caption">Required for matchmaking queue and verified intros.</p>
        {kyc.status !== 'approved' && <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Submit verification</button>}
      </div>

      <div className="card" style={{ padding: 20, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
        <p className="label" style={{ color: 'var(--accent)', marginBottom: 8 }}>Unavailable in web preview</p>
        <ul className="body" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Desktop pet companion (Tauri) — floating pet, tray icon, Alt+Space shortcut</li>
          <li>Local Mode (Ollama + LanceDB) — offline AI and local vector memory</li>
          <li>Mobile push notifications (FCM)</li>
          <li>System active-window context for smart nudges</li>
        </ul>
      </div>
    </div>
  );
}
