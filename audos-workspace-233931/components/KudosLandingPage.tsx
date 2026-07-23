import { useEffect, useState, type ReactNode } from 'react';
import { KUDOS_CSS, LOGO_URL, type KudosView } from './kudos/constants';

const PERSONAS = [
  { emoji: '💞', label: 'A real partner', desc: 'Someone who actually gets you' },
  { emoji: '🤝', label: 'A cofounder', desc: 'Built on trust, not transaction' },
  { emoji: '🧠', label: 'An early employee', desc: 'Who gives a damn about the mission' },
  { emoji: '💰', label: 'Your first investor', desc: 'Who believes in you as a human' },
  { emoji: '🌍', label: 'Real friends', desc: 'Who stop your midnight loneliness' },
];

const TESTIMONIALS = [
  { quote: "I found my cofounder through Kudos. We didn't even know we were looking for each other.", name: 'Arjun K.', role: 'Founder, Lagos' },
  { quote: 'Every other app asked what I wanted. Kudos actually tried to understand who I am first.', name: 'Priya S.', role: 'Designer & Builder, Mumbai' },
  { quote: 'My companion introduced me to someone I now call my best friend. No swiping. No pressure.', name: 'Zara A.', role: 'Product Lead, Dubai' },
];

interface KudosLandingPageProps {
  page?: KudosView;
  onNavigate?: (page: KudosView) => void;
  onOpenLogin: () => void;
  isSignedIn?: boolean;
  onEnterApp?: () => void;
}

function NavLink({ label, page, current, onNavigate, onOpenLogin }: { label: string; page: KudosView; current: KudosView; onNavigate?: (p: KudosView) => void; onOpenLogin: () => void }) {
  const active = current === page;
  return (
    <button
      type="button"
      className="hidden-mobile"
      onClick={() => (page === '/login' || page === '/signup' ? onOpenLogin() : onNavigate?.(page))}
      style={{ color: active ? 'var(--text)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9375rem' }}
    >
      {label}
    </button>
  );
}

function MarketingNav({ current, onNavigate, onOpenLogin, isSignedIn, onEnterApp }: KudosLandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const root = document.querySelector('.kudos-landing-root');
    if (!root) return;
    const onScroll = () => setScrolled(root.scrollTop > 20);
    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 100,
      background: scrolled ? 'rgba(7,7,15,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => onNavigate?.('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src={LOGO_URL} alt="Kudos" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>Kudos</span>
        </button>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <NavLink label="About" page="/about" current={current} onNavigate={onNavigate} onOpenLogin={onOpenLogin} />
            <NavLink label="Features" page="/features" current={current} onNavigate={onNavigate} onOpenLogin={onOpenLogin} />
            <NavLink label="Pricing" page="/pricing" current={current} onNavigate={onNavigate} onOpenLogin={onOpenLogin} />
          </div>
          {isSignedIn ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={onEnterApp}>Dashboard →</button>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="button" onClick={onOpenLogin} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9375rem' }}>Log in</button>
              <button type="button" className="btn btn-pill" onClick={onOpenLogin}>Get Started</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomePage({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <>
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }} className="animate-fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-pill)', padding: '6px 16px', fontSize: '0.875rem', color: 'rgba(165,180,252,1)', marginBottom: 32 }}>
            <span>🔥</span> The anti-loneliness platform
          </div>
          <h1 className="display-xl" style={{ marginBottom: 16, lineHeight: 1.1 }}>
            You're not lonely.<br /><span className="gradient-text">You just haven't been understood yet.</span>
          </h1>
          <p className="body-lg" style={{ maxWidth: 560, margin: '0 auto 40px', color: 'var(--text-muted)' }}>
            Kudos connects you to real humans through trust — not commercial intent. Your AI companion understands you first. Then introduces you to someone real.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-pill btn-lg" onClick={onOpenLogin} style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>Start for Free →</button>
            <a href="#how-it-works" className="btn btn-pill-ghost btn-lg">See How It Works</a>
          </div>
          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
            <div className="companion-orb companion-orb-xl" />
          </div>
          <p className="caption" style={{ marginTop: 12 }}>Your companion. Always here.</p>
        </div>
      </section>

      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="display-lg" style={{ marginBottom: 12 }}>Every app tries to match you by what you <em>want</em>.<br /><span className="gradient-text">Not who you are.</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { name: 'YC Match / CoffeeSpace', problem: '"Tell us what you want first" — scam profiles, idea people, and form-first friction.' },
            { name: 'Bumble BFF / Dating Apps', problem: 'Swipe mechanics, 24hr timers, ghosting. Built for urgency, not depth.' },
            { name: 'Replika / Character.AI', problem: 'AI that never bridges you to real humans. Proven to increase loneliness long-term.' },
          ].map((item) => (
            <div key={item.name} className="card" style={{ padding: 28 }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>❌</div>
              <h3 className="h3" style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: '1rem' }}>{item.name}</h3>
              <p className="body" style={{ color: 'var(--text-muted)' }}>{item.problem}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ padding: '80px 24px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', marginBottom: 64 }}>
          <p className="label" style={{ color: 'var(--primary)', marginBottom: 12 }}>How Kudos Works</p>
          <h2 className="display-lg">Trust first. Everything else follows.</h2>
        </div>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          {[
            { step: '01', title: 'Meet your companion', body: 'Your AI companion learns who you are — not through forms, but through real conversation.', emoji: '🤝' },
            { step: '02', title: 'Build real trust', body: 'Daily connection challenges help you become the kind of real that makes other humans want to know you.', emoji: '🌱' },
            { step: '03', title: 'Get a warm intro', body: 'When the time is right, your companion introduces you to a real human — because you match as people.', emoji: '💫' },
          ].map((step) => (
            <div key={step.step} style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>Step {step.step}</p>
                <h3 className="h1" style={{ marginBottom: 12 }}>{step.title}</h3>
                <p className="body-lg">{step.body}</p>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', borderRadius: 'var(--radius-xl)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', border: '1px solid var(--border)' }}>{step.emoji}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 className="display-lg" style={{ textAlign: 'center', marginBottom: 48 }}>Whether you're looking for...</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {PERSONAS.map((p) => (
            <div key={p.label} className="card" style={{ padding: '20px 24px', textAlign: 'center', minWidth: 180, flex: '1 1 180px', maxWidth: 220 }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>{p.emoji}</div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>{p.label}</h4>
              <p className="caption">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 className="display-lg" style={{ textAlign: 'center', marginBottom: 48 }}>Built to fix loneliness</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card" style={{ padding: 28 }}>
                <p className="body" style={{ marginBottom: 20, lineHeight: 1.65 }}>{t.quote}</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</p>
                <p className="caption">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2 className="display-lg" style={{ marginBottom: 16 }}>Stop being lonely.<br /><span className="gradient-text">Start being real.</span></h2>
        <p className="body-lg" style={{ color: 'var(--text-muted)', marginBottom: 40 }}>No credit card. No commercial intent.</p>
        <button type="button" className="btn btn-pill btn-lg" onClick={onOpenLogin}>Start for Free — No card required</button>
      </section>
    </>
  );
}

function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
      <h1 className="display-lg" style={{ marginBottom: 24 }}>{title}</h1>
      <div className="body-lg" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </main>
  );
}

export default function KudosLandingPage(props: KudosLandingPageProps) {
  const page = props.page || '/';

  let content: ReactNode;
  if (page === '/about') {
    content = (
      <SimplePage title="The future of AI companionship.">
        <p>At Kudos, we believe that AI is more than just a productivity tool. It's an opportunity to create digital companions that understand you, remember your preferences, and proactively support your daily life.</p>
        <p>With the Kudos Matchmaking network, we are bridging the gap between digital companionship and human connection. By verifying our users with secure KYC, we've built a safe space for ambitious founders and creatives to meet, collaborate, and grow together.</p>
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <h2 className="h2" style={{ marginBottom: 8 }}>Our Mission</h2>
          <p>To build technology that feels warm, personal, and profoundly human.</p>
        </div>
        <p className="caption" style={{ marginTop: 24, padding: 16, background: 'rgba(245,158,11,0.1)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)' }}>
          Desktop pet (Tauri) and native mobile apps are not available in this web preview. Companion chat and the full dashboard remain available after sign-in.
        </p>
      </SimplePage>
    );
  } else if (page === '/features') {
    content = (
      <SimplePage title="Features built for real connection.">
        <p>Companion chat that learns who you are through conversation — not forms.</p>
        <p>Warm intros to real humans when trust is built, not swipe mechanics.</p>
        <p>Ephemeral group rooms, private kudos moments, and builder/cofounder discovery tools.</p>
        <p>Connection health scoring and daily challenges to fight loneliness with action.</p>
      </SimplePage>
    );
  } else if (page === '/pricing') {
    content = (
      <SimplePage title="Simple, transparent pricing.">
        <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ fontWeight: 500 }}>✨ Early Access Special: All paid plans are currently <strong>FREE</strong> during our beta phase!</p>
        </div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { name: 'Free', price: '$0/mo', badge: '', features: ['Unlimited AI Companion Chat', '5 connections / month', 'Standard Pet Skin (Glasses)'], cta: 'Current Plan' },
            { name: 'Pro', price: '$8/mo', badge: 'FREE', features: ['Unlimited AI Companion Chat', '15 connections / month', 'Advanced Companion Memory', '5 Custom Pet Skins'], cta: 'Upgrade for Free' },
            { name: 'Premium', price: '$12/mo', badge: 'FREE', features: ['Unlimited AI Companion Chat', '25 connections / month', 'Priority Matchmaking Status', 'Unlimited Pet Customization'], cta: 'Get Premium for Free' },
          ].map((tier) => (
            <div key={tier.name} className="card" style={{ padding: 24 }}>
              <h3 className="h2">{tier.name}</h3>
              <p className="display-lg" style={{ margin: '12px 0' }}>
                {tier.price}
                {tier.badge && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: '#fff', padding: '3px 8px', borderRadius: 6, marginLeft: 8, verticalAlign: 'middle' }}>{tier.badge}</span>}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tier.features.map((f) => (
                  <li key={f} className="body">✓ {f}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={props.onOpenLogin}>{tier.cta}</button>
            </div>
          ))}
        </div>
      </SimplePage>
    );
  } else if (page === '/contact') {
    content = (
      <SimplePage title="Reach out.">
        <p>Questions about Kudos, partnerships, or safety? Email hello@kudos.app — we read every message.</p>
        <button type="button" className="btn btn-pill" onClick={props.onOpenLogin}>Or sign in to message your companion</button>
      </SimplePage>
    );
  } else if (page === '/privacy') {
    content = (
      <SimplePage title="Privacy Policy">
        <p className="caption">Last Updated: July 22, 2026</p>
        <p><strong>Information we collect:</strong> your name, email address, and profile details; the messages you send to your AI companion; and personality traits generated by the AI to help match you with others.</p>
        <p><strong>How we store your data:</strong> your profile and chat history are stored securely, accessible only by you and the AI systems that power the platform.</p>
        <p><strong>AI processing:</strong> conversation data is processed by third-party Large Language Models solely to generate responses and maintain your companion's memory. We do not use your private conversations to train public models.</p>
        <p><strong>Matchmaking:</strong> when you opt in, a public version of your profile (name, role, tagline, bio, location, shared traits) becomes visible to potential matches. Your private chats with the AI are never shared with other users.</p>
        <p><strong>Your rights:</strong> you can access, update, or delete your personal data at any time. Questions? Email <strong>support@kudos.app</strong>.</p>
      </SimplePage>
    );
  } else if (page === '/terms') {
    content = (
      <SimplePage title="Terms of Service">
        <p className="caption">Last Updated: July 22, 2026</p>
        <p><strong>Acceptance:</strong> by using Kudos you agree to these terms. You must be at least 18 years old.</p>
        <p><strong>Service:</strong> Kudos provides an AI companion designed to facilitate self-reflection and connection with other humans. We do not guarantee specific matches, relationships, or business outcomes.</p>
        <p><strong>Conduct:</strong> do not harass, abuse, or harm another person; impersonate anyone; send spam; or use the AI to generate illegal or harmful content. Violations may result in immediate account termination.</p>
        <p><strong>AI disclaimer:</strong> companion responses are generated by Large Language Models and may sometimes be inaccurate. Do not rely on the AI for professional, legal, medical, or financial advice.</p>
        <p><strong>Liability:</strong> Kudos is provided "as is". These terms are governed by the laws of India.</p>
      </SimplePage>
    );
  } else if (page === '/refund') {
    content = (
      <SimplePage title="Refund Policy">
        <p className="caption">Last Updated: July 22, 2026</p>
        <p><strong>Early Access phase:</strong> all paid features (Pro and Premium plans) are currently provided completely free of charge. As no payments are collected, no refunds are applicable.</p>
        <p><strong>Future subscriptions:</strong> when paid plans launch, you may cancel any time (effective at the end of the billing cycle). If technical issues completely prevent you from using the service, or you were charged in error, contact support within 7 days for a full refund.</p>
        <p><strong>Support:</strong> for billing questions email <strong>support@kudos.app</strong> with your account email and a brief explanation.</p>
      </SimplePage>
    );
  } else if (page === '/safety') {
    content = (
      <SimplePage title="Trust & Safety Guidelines">
        <p className="caption">Last Updated: July 22, 2026</p>
        <p>Kudos is built on trust, authenticity, and real human connection. To protect our community, we enforce strict safety guidelines.</p>
        <p><strong>Be real:</strong> use your actual identity. No impersonation or fake profiles. <strong>Be respectful:</strong> harassment, hate speech, bullying, and predatory behavior are strictly forbidden. <strong>Keep it safe:</strong> don't share sensitive financial or private information immediately — take time to build trust.</p>
        <p><strong>Meeting people:</strong> keep opening messages respectful; no commercial spam. If you meet in real life, meet in public places and prioritize your personal safety.</p>
        <p><strong>Reporting:</strong> if someone makes you feel unsafe, email our Trust & Safety team at <strong>support@kudos.app</strong>. Verified reports of harassment result in a permanent ban.</p>
      </SimplePage>
    );
  } else {
    content = <HomePage onOpenLogin={props.onOpenLogin} />;
  }

  return (
    <>
      <link rel="stylesheet" href={KUDOS_CSS} />
      <div className="kudos-landing-root" data-audos-landing-shell="kudos" style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', height: '100dvh', overflowY: 'auto' }}>
        <MarketingNav {...props} current={page} />
        {content}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="companion-orb companion-orb-sm" />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Kudos</span>
              </div>
              <p className="caption">Built to fix the loneliness epidemic.</p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {([['Privacy', '/privacy'], ['Terms', '/terms'], ['Refund Policy', '/refund'], ['Safety', '/safety']] as [string, KudosView][]).map(([label, target]) => (
                <button key={target} type="button" onClick={() => props.onNavigate?.(target)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0 }}>{label}</button>
              ))}
            </div>
            <p className="caption">© 2026 Kudos. Stop Being Lonely. Start Being Real.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
