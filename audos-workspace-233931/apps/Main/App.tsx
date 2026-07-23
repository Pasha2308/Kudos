import { useEffect, useState, type ReactNode } from 'react';
import KudosLandingPage from '../../components/KudosLandingPage';
import { KUDOS_CSS, parseViewFromSearch, setView, type KudosView } from '../../components/kudos/constants';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './views/DashboardHome';
import HumansView from './views/HumansView';
import RoomsView from './views/RoomsView';
import KudosView from './views/KudosView';
import BuilderView from './views/BuilderView';
import ProfileView from './views/ProfileView';
import OnboardingView from './views/OnboardingView';
import { kudosApi } from './lib/kudosApi';

function isDashboardView(view: KudosView) {
  return view.startsWith('/dashboard');
}

function isMarketingView(view: KudosView) {
  return ['/', '/about', '/features', '/pricing', '/contact', '/privacy', '/terms', '/refund', '/safety', '/login', '/signup'].includes(view);
}

export default function App() {
  const [view, setViewState] = useState<KudosView>(() => {
    const parsed = parseViewFromSearch();
    if (parsed.startsWith('/dashboard') || parsed === '/onboarding') return parsed;
    return '/dashboard';
  });

  const navigate = (next: KudosView) => {
    setView(next);
    setViewState(next);
  };

  useEffect(() => {
    kudosApi.register().catch(() => {});
    kudosApi.onboardingStatus().then((d) => {
      if (d && d.complete === false) {
        navigate('/onboarding');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => {
      const parsed = parseViewFromSearch();
      if (parsed.startsWith('/dashboard') || parsed === '/onboarding') {
        setViewState(parsed);
      }
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (view === '/onboarding') {
    return (
      <>
        <link rel="stylesheet" href={KUDOS_CSS} />
        <OnboardingView />
      </>
    );
  }

  if (isMarketingView(view)) {
    return (
      <KudosLandingPage
        page={view === '/login' || view === '/signup' ? '/' : view}
        onNavigate={navigate}
        onOpenLogin={() => navigate('/onboarding')}
        isSignedIn
        onEnterApp={() => navigate('/dashboard')}
      />
    );
  }

  const dashboardView = view === '/dashboard/chat' ? '/dashboard' : view;
  let page: ReactNode;
  switch (dashboardView) {
    case '/dashboard/humans': page = <HumansView />; break;
    case '/dashboard/rooms': page = <RoomsView />; break;
    case '/dashboard/kudos': page = <KudosView />; break;
    case '/dashboard/builder': page = <BuilderView />; break;
    case '/dashboard/profile': page = <ProfileView />; break;
    default: page = <DashboardHome />;
  }

  return (
    <DashboardLayout currentView={view === '/dashboard/chat' ? '/dashboard/chat' : dashboardView}>
      {page}
    </DashboardLayout>
  );
}
