import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppStateProvider } from '@/lib/app-state';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LiveProvider } from '@/lib/live-store';
import { AppShell } from '@/components/layout/AppShell';

import SignIn from '@/pages/SignIn';
import Overview from '@/pages/Overview';
import InventoryAnalytics from '@/pages/InventoryAnalytics';
import QueueAnalytics from '@/pages/QueueAnalytics';
import NotFound from '@/pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <div className="border-4 border-ink bg-lime px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-mega shadow-brutal">
          Checking session
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <LiveProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/sign-in" element={<SignIn />} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<Overview />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/inventory-analytics" element={<InventoryAnalytics />} />
                <Route path="/queue-analytics" element={<QueueAnalytics />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LiveProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}
