'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PERSONAS = [
  { emoji: '💞', label: 'A real partner', desc: 'Someone who actually gets you' },
  { emoji: '🤝', label: 'A cofounder', desc: 'Built on trust, not transaction' },
  { emoji: '🧠', label: 'An early employee', desc: 'Who gives a damn about the mission' },
  { emoji: '💰', label: 'Your first investor', desc: 'Who believes in you as a human' },
  { emoji: '🌍', label: 'Real friends', desc: 'Who stop your midnight loneliness' },
];

const TESTIMONIALS = [
  {
    quote: "I found my cofounder through Kudos. We didn't even know we were looking for each other.",
    name: 'Arjun K.',
    role: 'Founder, Lagos',
  },
  {
    quote: "Every other app asked what I wanted. Kudos actually tried to understand who I am first.",
    name: 'Priya S.',
    role: 'Designer & Builder, Mumbai',
  },
  {
    quote: "My companion introduced me to someone I now call my best friend. No swiping. No pressure.",
    name: 'Zara A.',
    role: 'Product Lead, Dubai',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>

      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        background: scrolled ? 'rgba(7,7,15,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="companion-orb companion-orb-sm" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Kudos</span>
          </div>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div className="hidden-mobile" style={{ display: 'flex', gap: 24 }}>
              <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>About</Link>
              <Link href="/features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Features</Link>
              <Link href="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Pricing</Link>
            </div>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard →</Link>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9375rem' }}>Log in</Link>
                <Link href="/signup" className="btn btn-pill">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '20%', width: 400, height: 300, background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'fade-up 0.8s ease both' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 'var(--radius-pill)', padding: '6px 16px',
            fontSize: '0.875rem', color: 'rgba(165,180,252,1)', marginBottom: 32,
          }}>
            <span>🔥</span> The anti-loneliness platform
          </div>

          <h1 className="display-xl" style={{ marginBottom: 16, lineHeight: 1.1 }}>
            You're not lonely.
            <br />
            <span className="gradient-text">You just haven't been understood yet.</span>
          </h1>

          <p className="body-lg" style={{ maxWidth: 560, margin: '0 auto 40px', color: 'var(--text-muted)' }}>
            Kudos connects you to real humans through trust — not commercial intent.
            Your AI companion understands you first. Then introduces you to someone real.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-pill btn-lg" style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              Start for Free →
            </Link>
            <Link href="#how-it-works" className="btn btn-pill-ghost btn-lg">
              See How It Works
            </Link>
          </div>

          {/* Companion orb hero visual */}
          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
            <div className="companion-orb companion-orb-xl" style={{ margin: '0 auto' }} />
          </div>
          <p className="caption" style={{ marginTop: 12 }}>Your companion. Always here.</p>
        </div>
      </section>

      {/* ─── Problem Section ─── */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="display-lg" style={{ marginBottom: 12 }}>
            Every app tries to match you by what you <em>want</em>.
            <br />
            <span className="gradient-text">Not who you are.</span>
          </h2>
          <p className="body-lg" style={{ maxWidth: 520, margin: '0 auto', color: 'var(--text-muted)' }}>
            We researched every competitor. Here's what they all get wrong.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { name: 'YC Match / CoffeeSpace', icon: '❌', problem: '"Tell us what you want first" — scam profiles, idea people, and form-first friction.' },
            { name: 'Bumble BFF / Dating Apps', icon: '❌', problem: 'Swipe mechanics, 24hr timers, ghosting. Built for urgency, not depth.' },
            { name: 'Replika / Character.AI', icon: '❌', problem: 'AI that never bridges you to real humans. Proven to increase loneliness long-term.' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: 28, animation: `fade-up 0.5s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{item.icon}</div>
              <h3 className="h3" style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: '1rem' }}>{item.name}</h3>
              <p className="body" style={{ color: 'var(--text-muted)' }}>{item.problem}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p className="label" style={{ color: 'var(--primary)', marginBottom: 12 }}>How Kudos Works</p>
            <h2 className="display-lg">Trust first. Everything else follows.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {[
              {
                step: '01',
                title: 'Meet your companion',
                body: 'Your AI companion learns who you are — not through forms, but through real conversation. No questionnaires. No checkboxes.',
                emoji: '🤝',
                gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
              },
              {
                step: '02',
                title: 'Build real trust',
                body: 'Your companion nudges you toward daily connection challenges. You talk. You become real. The kind of real that makes other humans want to know you.',
                emoji: '🌱',
                gradient: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.1))',
              },
              {
                step: '03',
                title: 'Get a warm intro',
                body: 'When the time is right, your companion introduces you to a real human — not because you match on paper, but because you match as people.',
                emoji: '💫',
                gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(236,72,153,0.08))',
              },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
                {i % 2 === 1 && <div style={{ flex: 1, minWidth: 280, background: step.gradient, borderRadius: 'var(--radius-xl)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', border: '1px solid var(--border)' }}>{step.emoji}</div>}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>Step {step.step}</p>
                  <h3 className="h1" style={{ marginBottom: 12 }}>{step.title}</h3>
                  <p className="body-lg">{step.body}</p>
                </div>
                {i % 2 === 0 && <div style={{ flex: 1, minWidth: 280, background: step.gradient, borderRadius: 'var(--radius-xl)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', border: '1px solid var(--border)' }}>{step.emoji}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who It's For ─── */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="display-lg" style={{ marginBottom: 12 }}>Whether you're looking for...</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
          {PERSONAS.map((p, i) => (
            <div key={i} className="card" style={{ padding: '20px 24px', textAlign: 'center', minWidth: 180, flex: '1 1 180px', maxWidth: 220, animation: `fade-up 0.4s ease ${i * 0.08}s both` }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>{p.emoji}</div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>{p.label}</h4>
              <p className="caption">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="body-lg" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          ...Kudos finds them through <strong style={{ color: 'var(--text)' }}>trust</strong>, not transaction.
        </p>
      </section>

      {/* ─── Testimonials ─── */}
      <section style={{ padding: '80px 24px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p className="label" style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: 12 }}>Real Stories</p>
          <h2 className="display-lg" style={{ textAlign: 'center', marginBottom: 48 }}>Built to fix loneliness</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <div style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: 12, lineHeight: 1 }}>"</div>
                <p className="body" style={{ marginBottom: 20, lineHeight: 1.65, color: 'var(--text)' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</p>
                    <p className="caption">{t.role}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
                  {'★★★★★'.split('').map((s, j) => <span key={j} style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <h2 className="display-lg" style={{ marginBottom: 16 }}>
            Stop being lonely.
            <br />
            <span className="gradient-text">Start being real.</span>
          </h2>
          <p className="body-lg" style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
            No credit card. No commercial intent. Just you and a companion who actually gets it.
          </p>
          <Link href="/signup" className="btn btn-pill btn-lg" style={{ boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}>
            Start for Free — No card required
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="companion-orb companion-orb-sm" />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Kudos</span>
            </div>
            <p className="caption" style={{ maxWidth: 220 }}>Built to fix the loneliness epidemic.</p>
          </div>
          <div className="flex gap-12 flex-wrap sm:gap-24">
            <div>
              <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Product</p>
              <p style={{ marginBottom: 8 }}><Link href="/features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Features</Link></p>
              <p style={{ marginBottom: 8 }}><Link href="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Pricing</Link></p>
            </div>
            <div>
              <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Company</p>
              <p style={{ marginBottom: 8 }}><Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>About</Link></p>
              <p style={{ marginBottom: 8 }}><Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Contact</Link></p>
            </div>
            <div>
              <p className="label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Legal</p>
              <p style={{ marginBottom: 8 }}><Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy</Link></p>
              <p style={{ marginBottom: 8 }}><Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Terms</Link></p>
              <p style={{ marginBottom: 8 }}><Link href="/refund" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Refund Policy</Link></p>
              <p style={{ marginBottom: 8 }}><Link href="/safety" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Safety</Link></p>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '24px auto 0', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <p className="caption">© 2026 Kudos. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
