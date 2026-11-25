import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './stores/sessionStore';
import { PageShell } from './components/layout/PageShell';

// Route-level code splitting ensures heavy 3D worlds and datasets load on demand
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tutor = lazy(() => import('./pages/Tutor').then((m) => ({ default: m.Tutor })));
const Practice = lazy(() => import('./pages/Practice').then((m) => ({ default: m.Practice })));
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })));
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })));

function RouteFallback() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#05130D]">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#52B788]/20 animate-ping" />
        <div className="w-8 h-8 rounded-full border-2 border-[#E8C97A]/30 border-t-[#E8C97A] animate-spin" />
      </div>
      <span className="mt-4 text-xs font-mono uppercase tracking-widest text-[#E8C97A]/80">
        Loading Atelier...
      </span>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <PageShell>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/library" element={<Library />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageShell>
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
