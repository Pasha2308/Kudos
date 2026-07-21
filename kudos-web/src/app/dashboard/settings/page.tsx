'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications' | 'privacy'>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'system',
    chatDensity: 'comfortable',
    fontSize: 'medium',
    accentColor: 'indigo',
    emailNotifications: true,
    pushNotifications: false,
    quietHours: false,
    privacySearchable: true,
    privacyOnlineStatus: true,
  });

  // Account tab states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');

    fetch(`${API_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setSettings(d.settings);
          applyTheme(d.settings.theme);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, API_URL]);

  const applyTheme = (theme: string) => {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (key === 'theme') applyTheme(value);

    setSaving(true);
    fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`
      },
      body: JSON.stringify({ settings: newSettings })
    })
      .then(() => setSaving(false))
      .catch(() => setSaving(false));
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await fetch(`${API_URL}/api/settings/account`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        logout();
      } catch (e) {
        alert("Failed to delete account");
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '24px 28px' }}>Loading settings...</div>;
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="h1">Settings</h1>
        {saving && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Saving...</span>}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar Nav for Settings */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 'account', label: 'Account & Profile' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy & Safety' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === tab.id ? 'var(--surface-2)' : 'none',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                border: 'none',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border)' }}>
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 className="h3">Account Details</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>Display Name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>Email Address</label>
                  <input className="input" value={email} disabled style={{ opacity: 0.7 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" disabled={name === user?.name}>Update Profile</button>
                  <button className="btn btn-ghost btn-sm">Change Password</button>
                </div>
              </div>

              <hr className="divider" />
              <h2 className="h3" style={{ color: 'var(--pink)' }}>Danger Zone</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Permanently delete your account and all data.</p>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pink)', borderColor: 'var(--pink)', alignSelf: 'flex-start' }} onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 className="h3">Appearance</h2>
              
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 12 }}>Theme</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['system', 'light', 'dark'].map(t => (
                    <button
                      key={t}
                      onClick={() => updateSetting('theme', t)}
                      className={`btn btn-sm ${settings.theme === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 12 }}>Chat Density</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['compact', 'comfortable', 'spacious'].map(t => (
                    <button
                      key={t}
                      onClick={() => updateSetting('chatDensity', t)}
                      className={`btn btn-sm ${settings.chatDensity === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 className="h3">Notifications</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>Email Digests</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Receive weekly recap emails of your stats.</p>
                </div>
                <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => updateSetting('emailNotifications', e.target.checked)} />
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>Push Notifications</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Get notified on your mobile device for new messages.</p>
                </div>
                <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => updateSetting('pushNotifications', e.target.checked)} />
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>Quiet Hours</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mute all notifications between 10 PM and 8 AM.</p>
                </div>
                <input type="checkbox" checked={settings.quietHours} onChange={(e) => updateSetting('quietHours', e.target.checked)} />
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 className="h3">Privacy & Safety</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>Discoverable</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Allow others to find you in Search and Warm Intros.</p>
                </div>
                <input type="checkbox" checked={settings.privacySearchable} onChange={(e) => updateSetting('privacySearchable', e.target.checked)} />
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>Show Online Status</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Let others see when you are active on Kudos.</p>
                </div>
                <input type="checkbox" checked={settings.privacyOnlineStatus} onChange={(e) => updateSetting('privacyOnlineStatus', e.target.checked)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
