'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface FeedItem { id: string; type: 'event' | 'update' | 'notification' | 'campaign'; title: string; body: string; cta?: string; ctaHref?: string; emoji: string; time: string; }

const DISCOVERY_CARDS = [
  {
    emoji: '🤝',
    title: 'Find a Co-Founder',
    subtitle: 'Connect with builders who share your vision and work style.',
    cta: 'Discover Humans',
    href: '/dashboard/humans',
    gradient: 'from-pink-100 to-rose-50',
    borderColor: '#fda4af',
    accentColor: '#f43f5e',
  },
  {
    emoji: '🏆',
    title: 'Future Grants & Mentorship',
    subtitle: 'Access resources to help you build and scale your startup.',
    cta: 'Explore Builder Tools',
    href: '/dashboard/builder',
    gradient: 'from-orange-50 to-amber-50',
    borderColor: '#fdba74',
    accentColor: '#f97316',
  },
  {
    emoji: '🌐',
    title: 'Join a Small Room',
    subtitle: 'Find your tribe — real founders solving real problems, together.',
    cta: 'Explore Rooms',
    href: '/dashboard/rooms',
    gradient: 'from-sky-50 to-blue-50',
    borderColor: '#7dd3fc',
    accentColor: '#0ea5e9',
  },
  {
    emoji: '💛',
    title: 'Give Kudos',
    subtitle: 'Acknowledge someone who helped you think better, build harder.',
    cta: 'Go to Kudos',
    href: '/dashboard/kudos',
    gradient: 'from-yellow-50 to-lime-50',
    borderColor: '#d9f99d',
    accentColor: '#84cc16',
  },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'friend';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(d => { setFeed(d.notifications || []); setLoadingFeed(false); })
      .catch(() => {
        // Show empty feed — this is a fresh account
        setFeed([]);
        setLoadingFeed(false);
      });
  }, [user, API_URL]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 32px' }}>

      {/* ── Tagline Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 700, marginBottom: 16 }}>
          {greeting}, {firstName}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#0f0f0f',
          letterSpacing: '-0.03em',
          marginBottom: 20,
        }}>
          You are not lonely.<br />
          <span style={{ background: 'linear-gradient(135deg, #f43f5e, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            You just haven't been found yet.
          </span>
        </h1>
        <p style={{ fontSize: '1.0625rem', color: '#737373', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
          Kudos connects founders and operators who think deeply, build alone, and need someone who actually gets it.
        </p>
      </div>

      {/* ── Discovery Cards ── */}
      <div style={{ marginBottom: 56 }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a3a3a3', fontWeight: 700, marginBottom: 20 }}>
          Explore Kudos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {DISCOVERY_CARDS.map(card => (
            <Link key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff',
                border: `1px solid ${card.borderColor}`,
                borderRadius: 20,
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'transform 0.18s, box-shadow 0.18s',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
                <span style={{ fontSize: 32 }}>{card.emoji}</span>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#171717', marginBottom: 6 }}>{card.title}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#737373', lineHeight: 1.5 }}>{card.subtitle}</p>
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: card.accentColor,
                  marginTop: 4,
                }}>
                  {card.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <div>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a3a3a3', fontWeight: 700, marginBottom: 20 }}>
          What's New
        </p>
        {loadingFeed ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#a3a3a3', fontSize: '0.9375rem' }}>Loading updates…</div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 32px', background: '#fafafa', borderRadius: 20, border: '1px dashed #e5e5e5' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🌱</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#404040', marginBottom: 8 }}>Nothing here yet</p>
            <p style={{ fontSize: '0.875rem', color: '#a3a3a3', maxWidth: 320, margin: '0 auto' }}>
              As you connect with humans, join rooms, and grow your network — updates, events and campaigns will appear here.
            </p>
            <Link href="/dashboard/humans" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', background: 'linear-gradient(135deg, #f9a8d4, #fda4af)', borderRadius: 999, fontSize: '0.875rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
              Meet Someone New →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {feed.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', marginBottom: 4 }}>{item.title}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#737373', lineHeight: 1.5 }}>{item.body}</p>
                  {item.cta && item.ctaHref && (
                    <Link href={item.ctaHref} style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f43f5e', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
                      {item.cta} →
                    </Link>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#a3a3a3', whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
