const WORKSPACE_CONFIG_ID = '233931';

function getSessionEmail(): string | null {
  try {
    const spaceId = (window as any).__SPACE_ID__ || 'workspace-233931';
    const raw = localStorage.getItem(`space_session_${spaceId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.email || null;
  } catch {
    return null;
  }
}

function getAuthHeaders(): Record<string, string> {
  const email = getSessionEmail();
  return {
    'Content-Type': 'application/json',
    // The platform intercepts the standard Authorization header (401 before
    // the hook runs), so the session email travels in a custom header.
    ...(email ? { 'X-Kudos-Email': email } : {}),
  };
}

async function hookFetch(route: string, options: RequestInit = {}) {
  const res = await fetch(`/api/workspaces/${WORKSPACE_CONFIG_ID}/hooks/kudos-api/execute`, {
    ...options,
    // The hook expects the route in the JSON body, so every call must be a
    // POST — browsers reject GET requests that carry a body.
    method: 'POST',
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    body: options.body
      ? JSON.stringify({ route, ...(JSON.parse(options.body as string)) })
      : JSON.stringify({ route }),
  });
  const data = await res.json();
  if (!res.ok && data.error) throw new Error(data.error);
  return data;
}

export const kudosApi = {
  register: () => hookFetch('/api/auth/register', { method: 'POST' }),
  chatHistory: () => hookFetch('/api/chat/history'),
  chatSend: (message: string, mode: string) =>
    hookFetch('/api/chat/send', { method: 'POST', body: JSON.stringify({ message, mode }) }),
  healthScore: () => hookFetch('/api/health/score'),
  healthChallenge: () => hookFetch('/api/health/challenge'),
  completeChallenge: (challengeId: string) =>
    hookFetch('/api/health/challenge/complete', { method: 'POST', body: JSON.stringify({ challengeId }) }),
  humansIntros: () => hookFetch('/api/humans/intros'),
  humansConversations: () => hookFetch('/api/humans/conversations'),
  roomsList: () => hookFetch('/api/rooms'),
  kudosReceived: () => hookFetch('/api/kudos/received'),
  kudosSent: () => hookFetch('/api/kudos/sent'),
  kudosWeeklyStats: () => hookFetch('/api/kudos/weekly-stats'),
  builderProfile: () => hookFetch('/api/builder/profile'),
  onboardingStatus: () => hookFetch('/api/onboarding/status'),
  onboardingComplete: () => hookFetch('/api/onboarding/complete', { method: 'POST' }),
  userPreferences: () => hookFetch('/api/user/preferences'),
  kycStatus: () => hookFetch('/api/kyc/status'),
};

export function useKudosUser() {
  const email = getSessionEmail();
  const name = email ? email.split('@')[0].replace(/[._]/g, ' ') : 'Friend';
  return { email, name, token: email ? `mock:${email}` : '' };
}
