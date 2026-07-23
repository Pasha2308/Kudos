import { useState } from 'react';
import { setView } from '../../../components/kudos/constants';
import { kudosApi } from '../lib/kudosApi';
import { useKudosUser } from '../lib/kudosApi';

const STEPS = ['Your name', 'Values pulse', 'First conversation', 'Preview people', 'Complete'];

export default function OnboardingView() {
  const user = useKudosUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name);
  const [done, setDone] = useState(false);

  const finish = async () => {
    await kudosApi.register().catch(() => {});
    // Persist completion so reloads don't loop the user back into onboarding.
    await kudosApi.onboardingComplete().catch(() => {});
    setDone(true);
    setView('/dashboard');
  };

  if (done) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ padding: 32, maxWidth: 520, width: '100%' }}>
        <p className="label" style={{ color: 'var(--primary)', marginBottom: 8 }}>Step {step + 1} of {STEPS.length}</p>
        <h1 className="h1" style={{ marginBottom: 16 }}>{STEPS[step]}</h1>
        {step === 0 && (
          <>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should your companion call you?" />
            <button type="button" className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={() => setStep(1)}>Continue</button>
          </>
        )}
        {step === 1 && (
          <>
            <p className="body" style={{ marginBottom: 16 }}>Pick the values that feel most like you right now.</p>
            {['Depth over small talk', 'Building in public', 'Showing up consistently', 'Radical honesty', 'Playfulness'].map((v) => (
              <button key={v} type="button" className="btn btn-ghost btn-full" style={{ marginBottom: 8 }} onClick={() => setStep(2)}>{v}</button>
            ))}
          </>
        )}
        {step >= 2 && step < 4 && (
          <>
            <p className="body-lg" style={{ marginBottom: 16 }}>Your companion's first question: "What's something you've been carrying alone lately?"</p>
            <button type="button" className="btn btn-primary btn-full" onClick={() => setStep(step + 1)}>I'm ready</button>
          </>
        )}
        {step === 4 && (
          <>
            <p className="body" style={{ marginBottom: 16 }}>You might meet builders, creatives, and humans who hate performative networking as much as you do.</p>
            <button type="button" className="btn btn-pill btn-full" onClick={finish}>Enter Kudos</button>
          </>
        )}
      </div>
    </div>
  );
}
