import { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Plus,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Trash2,
  Sparkles,
  Target,
  MessageSquare,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { tw } from '../../lib/colors';

interface TrialSimulation {
  id: number;
  title: string;
  startup_idea: string;
  validated_progress: string;
  technical_skills: string;
  candidate_profile: string;
  equity_expectations: string;
  availability: string;
  chemistry_concerns: string;
  collaboration_goals: string;
  status: string;
  project_brief: string;
  scoped_task: string;
  success_criteria: string;
  communication_checkpoints: string;
  red_flag_probes: string;
  evaluation_report: string;
  match_score: number | null;
  created_at: string;
}

interface GeneratedTrial {
  title: string;
  match_score: number;
  project_brief: string;
  scoped_task: string;
  success_criteria: string[];
  communication_checkpoints: string[];
  red_flag_probes: string[];
  evaluation_report: string;
}

type View = 'list' | 'create' | 'detail';

const STEPS = [
  { id: 'idea', label: 'Startup', icon: Sparkles },
  { id: 'candidate', label: 'Candidate', icon: Target },
  { id: 'terms', label: 'Terms & fit', icon: MessageSquare },
  { id: 'goals', label: 'Goals', icon: ClipboardCheck },
] as const;

const EMPTY_FORM = {
  startup_idea: '',
  validated_progress: '',
  technical_skills: '',
  candidate_profile: '',
  equity_expectations: '',
  availability: '',
  chemistry_concerns: '',
  collaboration_goals: '',
};

async function generateTrialSimulation(form: typeof EMPTY_FORM): Promise<GeneratedTrial> {
  const systemPrompt = `You are Kudos, an expert at designing realistic co-founder trial projects for non-technical founders evaluating technical co-founder candidates.

Generate a practical 1-2 week trial simulation that tests real collaboration quality—not trivia or whiteboard puzzles.

Return ONLY valid JSON with this exact shape (no markdown, no code fences):
{
  "title": "short descriptive title for this trial",
  "match_score": number 0-100 (preliminary fit estimate based on inputs—not final verdict),
  "project_brief": "2-3 paragraph trial project brief",
  "scoped_task": "single concrete deliverable the candidate should ship during the trial",
  "success_criteria": ["3-5 measurable success criteria"],
  "communication_checkpoints": ["3-4 scheduled sync/async checkpoints with purpose"],
  "red_flag_probes": ["3-4 specific behaviors or signals to watch for"],
  "evaluation_report": "structured post-trial evaluation template the founder can fill in—sections with bullet prompts"
}`;

  const userPrompt = `Design a co-founder trial simulation from these inputs:

Startup idea: ${form.startup_idea}
Validated progress so far: ${form.validated_progress}
Desired technical skills: ${form.technical_skills}
Candidate profile: ${form.candidate_profile}
Equity expectations: ${form.equity_expectations}
Availability: ${form.availability}
Chemistry concerns: ${form.chemistry_concerns || 'None specified'}
Collaboration goals: ${form.collaboration_goals}`;

  const response = await fetch('/proxy/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2500,
      temperature: 0.65,
    }),
  });

  if (!response.ok) {
    throw new Error('AI generation failed. Please try again.');
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content?.trim() || '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response. Please try again.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedTrial;

  if (!parsed.project_brief || !parsed.scoped_task) {
    throw new Error('Incomplete simulation generated. Please try again.');
  }

  return {
    ...parsed,
    success_criteria: Array.isArray(parsed.success_criteria) ? parsed.success_criteria : [],
    communication_checkpoints: Array.isArray(parsed.communication_checkpoints)
      ? parsed.communication_checkpoints
      : [],
    red_flag_probes: Array.isArray(parsed.red_flag_probes) ? parsed.red_flag_probes : [],
    match_score: typeof parsed.match_score === 'number' ? Math.min(100, Math.max(0, parsed.match_score)) : 72,
    title: parsed.title || form.startup_idea.slice(0, 60),
  };
}

function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split('\n').filter(Boolean);
  }
}

function MatchScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--space-border-default)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--space-brand-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${tw.typography.color.primary}`}>{score}</span>
        <span className={`text-[10px] uppercase tracking-wider ${tw.typography.color.muted}`}>fit score</span>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = 'primary',
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
  accent?: 'primary' | 'highlight';
}) {
  return (
    <div className={`${tw.card.default} rounded-2xl p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            accent === 'highlight' ? tw.bg.accent : 'bg-[var(--space-brand-primary-100)]'
          }`}
        >
          <Icon className={`w-4 h-4 ${accent === 'highlight' ? tw.icon.accent : tw.icon.primary}`} />
        </div>
        <h3 className={`font-semibold ${tw.typography.color.primary}`}>{title}</h3>
      </div>
      <div className={`text-sm leading-relaxed ${tw.typography.color.secondary}`}>{children}</div>
    </div>
  );
}

export default function TrialSimulator() {
  const { data, loading, error, refresh } = window.useWorkspaceDB<TrialSimulation>(
    'trial_simulations',
    {
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 50,
    },
  );

  const [view, setView] = useState<View>('list');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [selected, setSelected] = useState<TrialSimulation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, step, selected?.id]);

  const updateField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = () => {
    if (step === 0) return form.startup_idea.trim().length > 10 && form.validated_progress.trim().length > 5;
    if (step === 1) return form.technical_skills.trim().length > 3 && form.candidate_profile.trim().length > 10;
    if (step === 2) return form.equity_expectations.trim().length > 3 && form.availability.trim().length > 3;
    if (step === 3) return form.collaboration_goals.trim().length > 5;
    return false;
  };

  const handleGenerate = async () => {
    if (!canAdvance()) return;
    setGenerating(true);
    setGenError('');

    try {
      const generated = await generateTrialSimulation(form);

      await window.__workspaceDb.from('trial_simulations').insert({
        title: generated.title,
        startup_idea: form.startup_idea,
        validated_progress: form.validated_progress,
        technical_skills: form.technical_skills,
        candidate_profile: form.candidate_profile,
        equity_expectations: form.equity_expectations,
        availability: form.availability,
        chemistry_concerns: form.chemistry_concerns || null,
        collaboration_goals: form.collaboration_goals,
        status: 'complete',
        project_brief: generated.project_brief,
        scoped_task: generated.scoped_task,
        success_criteria: JSON.stringify(generated.success_criteria),
        communication_checkpoints: JSON.stringify(generated.communication_checkpoints),
        red_flag_probes: JSON.stringify(generated.red_flag_probes),
        evaluation_report: generated.evaluation_report,
        match_score: generated.match_score,
      });

      await refresh();
      setForm(EMPTY_FORM);
      setStep(0);
      setView('list');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await window.__workspaceDb.from('trial_simulations').delete(id);
      await refresh();
      if (selected?.id === id) {
        setSelected(null);
        setView('list');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (sim: TrialSimulation) => {
    setSelected(sim);
    setView('detail');
  };

  const renderList = () => (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${tw.typography.color.muted}`}>
            Co-founder trials
          </p>
          <h2 className={`text-xl font-bold mt-1 ${tw.typography.color.primary}`}>
            Your trial simulations
          </h2>
          <p className={`text-sm mt-1 ${tw.typography.color.secondary}`}>
            Test technical co-founder fit with realistic project briefs before any equity commitment.
          </p>
        </div>
        <button
          onClick={() => {
            setView('create');
            setStep(0);
            setGenError('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 ${tw.button.primary}`}
        >
          <Plus className="w-4 h-4" />
          New trial
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className={`w-6 h-6 animate-spin ${tw.icon.primary}`} />
        </div>
      )}

      {error && (
        <div className={`${tw.card.flat} rounded-xl p-4 text-sm text-red-600`}>
          Could not load simulations. {error.message}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className={`${tw.card.glass} rounded-2xl p-10 text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--space-brand-primary-100)]">
            <FlaskConical className={`w-7 h-7 ${tw.icon.primary}`} />
          </div>
          <h3 className={`font-semibold text-lg ${tw.typography.color.primary}`}>No trials yet</h3>
          <p className={`text-sm mt-2 max-w-sm mx-auto ${tw.typography.color.secondary}`}>
            Describe your startup and a candidate profile. Kudos will generate a scoped trial project,
            success criteria, and a post-trial evaluation report.
          </p>
          <button
            onClick={() => setView('create')}
            className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${tw.button.primary}`}
          >
            <Sparkles className="w-4 h-4" />
            Create first simulation
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {data.map((sim) => (
          <button
            key={sim.id}
            onClick={() => openDetail(sim)}
            className={`group w-full text-left ${tw.card.default} rounded-2xl p-4 hover:shadow-md transition-all`}
          >
            <div className="flex items-center gap-4">
              {sim.match_score != null && <MatchScoreRing score={sim.match_score} />}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${tw.typography.color.primary}`}>{sim.title}</h3>
                <p className={`text-sm mt-1 line-clamp-2 ${tw.typography.color.secondary}`}>
                  {sim.scoped_task || sim.startup_idea}
                </p>
                <p className={`text-xs mt-2 ${tw.typography.color.muted}`}>
                  {new Date(sim.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <ChevronRight className={`w-5 h-5 shrink-0 opacity-40 group-hover:opacity-100 ${tw.icon.muted}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('list')}
          className={`p-2 rounded-xl ${tw.button.ghost}`}
          aria-label="Back to list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className={`font-bold text-lg ${tw.typography.color.primary}`}>New trial simulation</h2>
          <p className={`text-sm ${tw.typography.color.secondary}`}>
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? 'bg-[var(--space-brand-primary)] text-[var(--space-text-on-primary)]'
                  : i === step
                    ? 'bg-[var(--space-brand-highlight)] text-[var(--space-text-on-highlight)]'
                    : 'bg-[var(--space-surface-muted)] text-[var(--space-text-muted)]'
              }`}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full ${
                  i < step ? 'bg-[var(--space-brand-primary)]' : 'bg-[var(--space-border-default)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className={`${tw.card.default} rounded-2xl p-5 space-y-4`}>
        {step === 0 && (
          <>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Startup idea</span>
              <textarea
                value={form.startup_idea}
                onChange={(e) => updateField('startup_idea', e.target.value)}
                placeholder="What are you building? Who is it for?"
                rows={3}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Validated progress</span>
              <textarea
                value={form.validated_progress}
                onChange={(e) => updateField('validated_progress', e.target.value)}
                placeholder="Customers interviewed, MVP status, revenue, waitlist, etc."
                rows={3}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Desired technical skills</span>
              <textarea
                value={form.technical_skills}
                onChange={(e) => updateField('technical_skills', e.target.value)}
                placeholder="e.g. React, Node, ML pipelines, mobile, infra..."
                rows={2}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Candidate profile</span>
              <textarea
                value={form.candidate_profile}
                onChange={(e) => updateField('candidate_profile', e.target.value)}
                placeholder="Background, past startups, current role, why you're considering them..."
                rows={4}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Equity expectations</span>
              <textarea
                value={form.equity_expectations}
                onChange={(e) => updateField('equity_expectations', e.target.value)}
                placeholder="Split range, vesting, full-time vs part-time expectations..."
                rows={2}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Availability</span>
              <textarea
                value={form.availability}
                onChange={(e) => updateField('availability', e.target.value)}
                placeholder="Hours per week, timezone, trial duration you can commit to..."
                rows={2}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Chemistry concerns (optional)</span>
              <textarea
                value={form.chemistry_concerns}
                onChange={(e) => updateField('chemistry_concerns', e.target.value)}
                placeholder="Communication style mismatches, pace differences, past red flags..."
                rows={2}
                className={`${tw.input.base} ${tw.input.default} resize-none`}
              />
            </label>
          </>
        )}

        {step === 3 && (
          <label className="block space-y-1.5">
            <span className={`text-sm font-medium ${tw.typography.color.primary}`}>Collaboration goals</span>
            <textarea
              value={form.collaboration_goals}
              onChange={(e) => updateField('collaboration_goals', e.target.value)}
              placeholder="What must you learn from this trial? Ship a feature? Test decision-making? Validate ownership?"
              rows={5}
              className={`${tw.input.base} ${tw.input.default} resize-none`}
            />
          </label>
        )}
      </div>

      {genError && (
        <div className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700`}>
          {genError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : setView('list'))}
          disabled={generating}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${tw.button.secondary}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? 'Back' : 'Cancel'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
              canAdvance() ? tw.button.primary : `${tw.button.primary} ${tw.button.disabled}`
            }`}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canAdvance() || generating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
              canAdvance() && !generating ? tw.button.accent : `${tw.button.accent} ${tw.button.disabled}`
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating trial...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate simulation
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selected) return null;
    const criteria = parseJsonList(selected.success_criteria);
    const checkpoints = parseJsonList(selected.communication_checkpoints);
    const probes = parseJsonList(selected.red_flag_probes);

    return (
      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-xl shrink-0 ${tw.button.ghost}`}
              aria-label="Back to list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className={`font-bold text-lg truncate ${tw.typography.color.primary}`}>{selected.title}</h2>
              <p className={`text-sm ${tw.typography.color.secondary}`}>Trial simulation report</p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(selected.id)}
            disabled={deletingId === selected.id}
            className={`p-2 rounded-xl shrink-0 ${tw.button.ghost} hover:text-red-600`}
            aria-label="Delete simulation"
          >
            {deletingId === selected.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {selected.match_score != null && (
          <div className={`${tw.card.glass} rounded-2xl p-6 flex items-center gap-6`}>
            <MatchScoreRing score={selected.match_score} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${tw.typography.color.muted}`}>
                Preliminary fit score
              </p>
              <p className={`text-sm mt-1 ${tw.typography.color.secondary}`}>
                Based on your inputs—not a final verdict. Use the trial to validate chemistry and execution in practice.
              </p>
            </div>
          </div>
        )}

        <SectionCard icon={FileText} title="Trial project brief">
          <p className="whitespace-pre-wrap">{selected.project_brief}</p>
        </SectionCard>

        <SectionCard icon={Target} title="Scoped deliverable" accent="highlight">
          <p className="whitespace-pre-wrap font-medium">{selected.scoped_task}</p>
        </SectionCard>

        <SectionCard icon={CheckCircle2} title="Success criteria">
          <ul className="space-y-2">
            {criteria.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Circle className={`w-3 h-3 mt-1.5 shrink-0 fill-[var(--space-brand-primary)] text-[var(--space-brand-primary)]`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={MessageSquare} title="Communication checkpoints">
          <ul className="space-y-2">
            {checkpoints.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-xs font-bold mt-0.5 px-1.5 py-0.5 rounded ${tw.badge.primary}`}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={AlertTriangle} title="Red-flag probes" accent="highlight">
          <ul className="space-y-2">
            {probes.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${tw.icon.accent}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={ClipboardCheck} title="Post-trial evaluation template">
          <p className="whitespace-pre-wrap">{selected.evaluation_report}</p>
        </SectionCard>

        <details className={`${tw.card.flat} rounded-2xl p-4`}>
          <summary className={`cursor-pointer text-sm font-medium ${tw.typography.color.primary}`}>
            Original inputs
          </summary>
          <dl className={`mt-3 space-y-2 text-sm ${tw.typography.color.secondary}`}>
            {[
              ['Startup idea', selected.startup_idea],
              ['Progress', selected.validated_progress],
              ['Skills needed', selected.technical_skills],
              ['Candidate', selected.candidate_profile],
              ['Equity', selected.equity_expectations],
              ['Availability', selected.availability],
              ['Concerns', selected.chemistry_concerns],
              ['Goals', selected.collaboration_goals],
            ].map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className={`text-xs font-semibold uppercase ${tw.typography.color.muted}`}>{label}</dt>
                  <dd className="mt-0.5">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </details>
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="min-h-full flex flex-col w-full bg-transparent overflow-y-auto">
      <div className="border-b border-[var(--space-border-default)] bg-[var(--space-surface-card)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--space-brand-primary-100)]">
            <FlaskConical className={`w-5 h-5 ${tw.icon.primary}`} />
          </div>
          <div>
            <h1 className={`font-bold ${tw.typography.color.primary}`}>Trial Simulator</h1>
            <p className={`text-xs ${tw.typography.color.secondary}`}>
              Test co-founder fit before equity
            </p>
          </div>
        </div>
      </div>

      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'detail' && renderDetail()}
    </div>
  );
}
