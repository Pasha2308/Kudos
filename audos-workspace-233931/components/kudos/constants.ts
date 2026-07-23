export const CONFIG_ID = '233931';
export const KUDOS_CSS = `/site/${CONFIG_ID}/assets/kudos-globals.css`;
export const LOGO_URL = `/site/${CONFIG_ID}/assets/kudos-icon.png`;
export const FAVICON_URL = `/site/${CONFIG_ID}/assets/kudos-favicon.png`;
export const COMPANION_IDLE_GIF = `/site/${CONFIG_ID}/assets/gifs/anime-glasses-idle.gif`;

export type KudosView =
  | '/'
  | '/about'
  | '/features'
  | '/pricing'
  | '/contact'
  | '/privacy'
  | '/terms'
  | '/refund'
  | '/safety'
  | '/login'
  | '/signup'
  | '/onboarding'
  | '/dashboard'
  | '/dashboard/chat'
  | '/dashboard/humans'
  | '/dashboard/rooms'
  | '/dashboard/kudos'
  | '/dashboard/builder'
  | '/dashboard/profile';

export function parseViewFromSearch(): KudosView {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || '/';
  return view as KudosView;
}

export function setView(view: KudosView) {
  const url = new URL(window.location.href);
  if (view === '/') {
    url.searchParams.delete('view');
  } else {
    url.searchParams.set('view', view);
  }
  window.history.replaceState({}, '', url.toString());
  window.dispatchEvent(new PopStateEvent('popstate'));
}
