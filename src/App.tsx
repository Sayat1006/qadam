import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Skeleton } from './components/kit';

// Сирек ашылатын немесе ауыр беттер — бөлек жүктеледі
const named = <T extends Record<string, unknown>>(p: Promise<T>, k: keyof T) => p.then((m) => ({ default: m[k] as React.ComponentType }));
const Landing = lazy(() => named(import('./pages/Landing'), 'Landing'));
const LoginPage = lazy(() => named(import('./pages/Auth'), 'LoginPage'));
const ChildLogin = lazy(() => named(import('./pages/Auth'), 'ChildLogin'));
const ChildShell = lazy(() => named(import('./pages/child/ChildShell'), 'ChildShell'));
const ChildHome = lazy(() => named(import('./pages/child/ChildHome'), 'ChildHome'));
const SubjectsPage = lazy(() => named(import('./pages/child/ChildHome'), 'SubjectsPage'));
const SubjectPage = lazy(() => named(import('./pages/child/SubjectPage'), 'SubjectPage'));
const Lesson = lazy(() => named(import('./pages/child/Lesson'), 'Lesson'));
const Placement = lazy(() => named(import('./pages/child/Placement'), 'Placement'));
const AdminPage = lazy(() => named(import('./pages/adult/Admin'), 'AdminPage'));
const ParentPage = lazy(() => named(import('./pages/adult/Dashboards'), 'ParentPage'));
const TeacherPage = lazy(() => named(import('./pages/adult/Dashboards'), 'TeacherPage'));
const Achievements = lazy(() => named(import('./pages/child/Achievements'), 'Achievements'));
const Calm = lazy(() => named(import('./pages/child/Calm'), 'Calm'));
const GamesList = lazy(() => named(import('./pages/child/Games'), 'GamesList'));
const GamePage = lazy(() => named(import('./pages/child/Games'), 'GamePage'));
const Village = lazy(() => named(import('./pages/child/Village'), 'Village'));

function PageLoading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Жүктелуде" style={{ padding: 16 }}>
      <Skeleton height={36} width="40%" />
      <Skeleton height={180} radius={24} />
      <Skeleton height={120} radius={24} />
    </div>
  );
}
const L = ({ children }: { children: ReactNode }) => <Suspense fallback={<PageLoading />}>{children}</Suspense>;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<L><Landing /></L>} />
        <Route path="/login" element={<L><LoginPage /></L>} />
        <Route path="/child-login" element={<L><ChildLogin /></L>} />
        <Route path="/child" element={<L><ChildShell /></L>}>
          <Route index element={<L><ChildHome /></L>} />
          <Route path="subjects" element={<L><SubjectsPage /></L>} />
          <Route path="achievements" element={<L><Achievements /></L>} />
          <Route path="subject/:sid" element={<L><SubjectPage /></L>} />
          <Route path="lesson/:sid" element={<L><Lesson /></L>} />
          <Route path="placement/:sid" element={<L><Placement /></L>} />
          <Route path="games" element={<L><GamesList /></L>} />
          <Route path="games/:gid" element={<L><GamePage /></L>} />
          <Route path="village" element={<L><Village /></L>} />
          <Route path="calm" element={<L><Calm /></L>} />
        </Route>
        <Route path="/parent" element={<L><ParentPage /></L>} />
        <Route path="/teacher" element={<L><TeacherPage /></L>} />
        <Route path="/admin" element={<L><AdminPage /></L>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
