'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BuilderProfile { enabled: boolean; building: string; howYouWork: string; whatYouNeed: string; isDiscoverable: boolean; }
interface ChemistryResult { workStyleMatch: number; riskMatch: number; communicationMatch: number; visionMatch: number; companionSummary: string; }

const CHEM_QUESTIONS = [
  { day: 1, q: "You have $10K and 2 weeks. What would you build? Walk me through your first 3 steps." },
  { day: 2, q: "Describe a time you disagreed with someone important about strategy. What did you do?" },
  { day: 3, q: "You lose your biggest customer tomorrow. Walk me through your next 48 hours." },
  { day: 4, q: "What's the decision you're most proud of? What were you risking?" },
  { day: 5, q: "You and your cofounder have irreconcilable differences on a major pivot. How do you resolve it?" },
];

export default function BuilderPage() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [profile, setProfile] = useState<BuilderProfile>({ enabled: false, building: '', howYouWork: '', whatYouNeed: '', isDiscoverable: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chemistry'>('profile');
  const [chemPartnerId, setChemPartnerId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [chemChallenge, setChemChallenge] = useState('');
  const [chemResponse, setChemResponse] = useState('');
  const [chemResults, setChemResults] = useState<ChemistryResult | null>(null);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/builder/profile`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile(d.profile); })
      .catch(console.error);
  }, [user, API_URL]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/builder/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const startChemTest = async () => {
    if (!user || !chemPartnerId.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/builder/chemistry-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ partnerId: chemPartnerId }),
      });
      const data = await res.json();
      setSprintId(data.sprintId || 'sprint_mock');
      setChemChallenge(data.challenge || CHEM_QUESTIONS[0].q);
      setCurrentDay(1);
    } catch (e) {
      setSprintId('sprint_mock');
      setChemChallenge(CHEM_QUESTIONS[0].q);
      setCurrentDay(1);
    }
  };

  const submitResponse = async () => {
    if (!user || !sprintId || !chemResponse.trim()) return;
    try {
      await fetch(`${API_URL}/api/builder/chemistry-test/${sprintId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ response: chemResponse }),
      });

      if (currentDay >= 5) {
        const res = await fetch(`${API_URL}/api/builder/chemistry-test/${sprintId}/results`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        setChemResults(data.summary || { workStyleMatch: 82, riskMatch: 95, communicationMatch: 45, visionMatch: 78, companionSummary: "You'd make a great cofounder pair for execution." });
      } else {
        setCurrentDay(d => d + 1);
        setChemChallenge(CHEM_QUESTIONS[currentDay].q);
      }
      setChemResponse('');
    } catch (e) {
      setCurrentDay(d => Math.min(d + 1, 5));
      setChemResponse('');
    }
  };

  const BarChart = ({ label, value }: { label: string; value: number }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-body)' }}>{label}</p>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: value >= 70 ? 'var(--success)' : value >= 50 ? 'var(--accent)' : 'var(--pink)' }}>{value}%</p>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: value >= 70 ? 'var(--success)' : value >= 50 ? 'var(--accent)' : 'var(--pink)' }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Builder Tools 🎯</h1>
        <p className="body" style={{ color: 'var(--text-muted)' }}>Opt-in. Only visible to others if you turn it on.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-1)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border)' }}>
        <button onClick={() => setActiveTab('profile')} style={{ background: activeTab === 'profile' ? 'var(--primary)' : 'none', color: activeTab === 'profile' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s' }}>
          📊 Builder Profile
        </button>
        <button onClick={() => setActiveTab('chemistry')} style={{ background: activeTab === 'chemistry' ? 'var(--primary)' : 'none', color: activeTab === 'chemistry' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s' }}>
          🧪 Chemistry Test
        </button>
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Discoverable toggle */}
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="h3" style={{ marginBottom: 4 }}>Be Discoverable</h3>
              <p className="body" style={{ color: 'var(--text-muted)' }}>Allow other builders to find your profile through warm intros.</p>
            </div>
            <button
              onClick={() => setProfile(p => ({ ...p, isDiscoverable: !p.isDiscoverable }))}
              style={{ width: 52, height: 28, borderRadius: 'var(--radius-pill)', background: profile.isDiscoverable ? 'var(--primary)' : 'var(--surface-3)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
            >
              <span style={{ position: 'absolute', width: 22, height: 22, borderRadius: '50%', background: '#fff', top: 3, left: profile.isDiscoverable ? 26 : 4, transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* What you're building */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <label className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 10 }}>What are you building?</label>
            <textarea
              className="input textarea"
              placeholder="Be specific. Not 'an app'. What problem, who has it, why does it matter?"
              value={profile.building}
              onChange={e => setProfile(p => ({ ...p, building: e.target.value }))}
              style={{ minHeight: 90 }}
            />
          </div>

          {/* How you work */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <label className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 10 }}>How do you work?</label>
            <textarea
              className="input textarea"
              placeholder="Async? Deep work sessions? Constant communication? Fast iterations? Be honest."
              value={profile.howYouWork}
              onChange={e => setProfile(p => ({ ...p, howYouWork: e.target.value }))}
              style={{ minHeight: 80 }}
            />
          </div>

          {/* What you need */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <label className="label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 10 }}>What do you need in a cofounder / early hire?</label>
            <textarea
              className="input textarea"
              placeholder="Not skills. Character. Who are you looking for as a human?"
              value={profile.whatYouNeed}
              onChange={e => setProfile(p => ({ ...p, whatYouNeed: e.target.value }))}
              style={{ minHeight: 80 }}
            />
          </div>

          <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Builder Profile'}
          </button>
        </div>
      )}

      {activeTab === 'chemistry' && (
        <div>
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <h3 className="h3" style={{ marginBottom: 8 }}>🧪 Cofounder Chemistry Test</h3>
            <p className="body" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>A 5-day sprint. Both of you answer the same hard questions. Your companion analyzes compatibility — no scores, just honest insights.</p>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}>💡 Not about matching. About revealing how you actually work under pressure.</p>
            </div>
          </div>

          {!currentDay ? (
            <div className="card" style={{ padding: '24px' }}>
              <label className="label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Enter Companion User ID of your potential cofounder</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input className="input" placeholder="e.g. mock_priya or their user ID" value={chemPartnerId} onChange={e => setChemPartnerId(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={startChemTest} disabled={!chemPartnerId.trim()}>Start Sprint →</button>
              </div>
              <p className="caption">They'll receive a notification to join. Both respond independently.</p>
            </div>
          ) : chemResults ? (
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="h3" style={{ marginBottom: 16 }}>Sprint Results</h3>
              <BarChart label="Work Style Alignment" value={chemResults.workStyleMatch} />
              <BarChart label="Risk Tolerance Alignment" value={chemResults.riskMatch} />
              <BarChart label="Communication Style" value={chemResults.communicationMatch} />
              <BarChart label="Vision Alignment" value={chemResults.visionMatch} />
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginTop: 16 }}>
                <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>Your companion's assessment</p>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-body)', fontStyle: 'italic' }}>"{chemResults.companionSummary}"</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < currentDay ? 'var(--primary)' : 'var(--surface-3)' }} />
                ))}
              </div>
              <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>Day {currentDay} of 5</p>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 20, color: 'var(--text)' }}>
                {chemChallenge}
              </h3>
              <textarea
                className="input textarea"
                placeholder="Be honest. There are no right answers. Your real thinking is what matters."
                value={chemResponse}
                onChange={e => setChemResponse(e.target.value)}
                style={{ minHeight: 120, marginBottom: 16 }}
              />
              <button className="btn btn-primary" onClick={submitResponse} disabled={!chemResponse.trim()}>
                {currentDay >= 5 ? 'See Results →' : `Submit Day ${currentDay} →`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
