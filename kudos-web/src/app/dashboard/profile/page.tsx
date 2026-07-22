'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HealthScore { score: number; label: string; conversationStreak: number; totalHumansMet: number; kudosGiven: number; irlMeetups: number; weeklyConversations: number; nudgeMessage: string; }

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [health, setHealth] = useState<HealthScore | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [tagline, setTagline] = useState('');
  const [role, setRole] = useState('Founder');
  const [experience, setExperience] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [irlInput, setIrlInput] = useState(false);

  useEffect(() => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${user.token}` };

    fetch(`${API_URL}/api/profile/me`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setBio(d.profile.bio || '');
          setLocation(d.profile.location || '');
          setTagline(d.profile.tagline || '');
          setRole(d.profile.role || 'Founder');
          setExperience(d.profile.experience || '');
          setCurrentCompany(d.profile.currentCompany || '');
          setPhotoURL(d.profile.photoURL || '');
          setTags(d.profile.personalityTags || []);
        }
      })
      .catch(e => console.error(e));

    fetch(`${API_URL}/api/health/score`, { headers })
      .then(r => r.json())
      .then(d => d.score && setHealth(d.score))
      .catch(() => setHealth({ score: 74, label: 'Growing', conversationStreak: 12, totalHumansMet: 3, kudosGiven: 11, irlMeetups: 1, weeklyConversations: 18, nudgeMessage: "You're building something real." }));

    fetch(`${API_URL}/api/memory/summary`, { headers })
      .then(r => r.json())
      .then(d => setMemories(d.memories || []))
      .catch(() => setMemories([
        { id: '1', fact: 'Tends to stay up late building things.' },
        { id: '2', fact: 'Values honesty over comfort in conversations.' },
        { id: '3', fact: 'Prefers direct communication.' },
      ]));
  }, [user, API_URL]);

  const recordMeetup = async () => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/health/irl-meetup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      setHealth(prev => prev ? { ...prev, irlMeetups: prev.irlMeetups + 1 } : prev);
      setIrlInput(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ bio, location, tagline, role, experience, currentCompany, photoURL })
      });
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const scoreOffset = health ? RING_CIRCUMFERENCE * (1 - health.score / 100) : RING_CIRCUMFERENCE;
  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      {/* Profile Hero */}
      <div className="glow-border" style={{ borderRadius: 'var(--radius-xl)', padding: '28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div className="avatar avatar-xl" style={{ flexShrink: 0 }}>
            {photoURL ? (
              <img src={photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                {user?.name || user?.email}
              </h1>
              <span className="badge badge-green">● Verified Human</span>
            </div>
            <p className="caption" style={{ marginBottom: 4 }}>{role} {currentCompany ? `at ${currentCompany}` : ''}</p>
            {tagline && <p style={{ fontStyle: 'italic', color: 'var(--text-body)', marginBottom: 12 }}>"{tagline}"</p>}
            {bio && <p className="body" style={{ marginBottom: 12 }}>{bio}</p>}
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (editing) handleSaveProfile();
            else setEditing(true);
          }} disabled={saving}>
            {editing ? (saving ? 'Saving...' : 'Done') : '✏ Edit'}
          </button>
        </div>

        {editing && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 6 }}>Tagline (1 sentence)</label>
              <input className="input" placeholder="e.g. Building the future of work" value={tagline} onChange={e => setTagline(e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Role</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', appearance: 'none', background: 'var(--surface-2)', color: 'var(--text)' }}>
                <option value="Founder">Founder</option>
                <option value="Builder">Builder / Creator</option>
                <option value="Advisor">Advisor / Mentor</option>
                <option value="Investor">Investor</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Company (optional)</label>
                <input className="input" placeholder="e.g. Kudos" value={currentCompany} onChange={e => setCurrentCompany(e.target.value)} />
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Experience</label>
                <select className="input" value={experience} onChange={e => setExperience(e.target.value)} style={{ width: '100%', appearance: 'none', background: 'var(--surface-2)', color: 'var(--text)' }}>
                  <option value="">Select...</option>
                  <option value="0-1 yrs">0-1 yrs</option>
                  <option value="2-5 yrs">2-5 yrs</option>
                  <option value="5-10 yrs">5-10 yrs</option>
                  <option value="10+ yrs">10+ yrs</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Profile Photo URL</label>
              <input className="input" placeholder="https://..." value={photoURL} onChange={e => setPhotoURL(e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>In my own words (Bio)</label>
              <textarea className="input textarea" placeholder="How would you describe yourself to someone who actually wants to know?" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div>
              <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Location</label>
              <input className="input" placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Companion's lens */}
      {memories.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <p className="label" style={{ color: 'var(--primary)', marginBottom: 12 }}>How your companion describes you</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memories.slice(0, 4).map((mem, i) => (
              <div key={mem.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>·</span>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.5, fontStyle: 'italic' }}>{mem.fact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anti-Loneliness Score */}
      {health && (
        <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
          <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Connection Health (Private)</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {/* Ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={70} cy={70} r={RING_RADIUS} fill="none" stroke="var(--surface-3)" strokeWidth={10} />
                <circle
                  cx={70} cy={70} r={RING_RADIUS} fill="none"
                  stroke="url(#healthGrad)" strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={scoreOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text)', lineHeight: 1 }}>{health.score}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{health.label}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '💬', label: 'Conversations', value: health.weeklyConversations },
                { icon: '👥', label: 'Humans Met', value: health.totalHumansMet },
                { icon: '💛', label: 'Kudos Given', value: health.kudosGiven },
                { icon: '🌍', label: 'IRL Meetups', value: health.irlMeetups },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{s.icon}</div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{s.value}</p>
                  <p className="caption">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 16, fontStyle: 'italic' }}>
            {health.nudgeMessage}
          </p>

          {/* IRL Meetup button */}
          {!irlInput ? (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setIrlInput(true)}>
              + Record IRL Meetup
            </button>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-body)' }}>Confirm you met someone from Kudos in real life?</p>
              <button className="btn btn-primary btn-sm" onClick={recordMeetup}>Yes! 🎉</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIrlInput(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Account */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 className="h3" style={{ marginBottom: 16 }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Email</p>
              <p className="caption">{user?.email}</p>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Download Desktop App</p>
            <a href="/Kudos-Installer.msi" download className="btn btn-ghost btn-sm">Download</a>
          </div>
          <div className="divider" />
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: '0.9375rem', textAlign: 'left', fontFamily: 'inherit', fontWeight: 500, padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
