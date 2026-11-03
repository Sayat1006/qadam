import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from './pages/adult/Admin';
import { ParentPage, TeacherPage } from './pages/adult/Dashboards';
import { ChildLogin, LoginPage } from './pages/Auth';
import { Landing } from './pages/Landing';
import { Achievements } from './pages/child/Achievements';
import { Calm } from './pages/child/Calm';
import { ChildHome, SubjectsPage } from './pages/child/ChildHome';
import { ChildShell } from './pages/child/ChildShell';
import { GamePage, GamesList } from './pages/child/Games';
import { Lesson } from './pages/child/Lesson';
import { SubjectPage } from './pages/child/SubjectPage';
import { Village } from './pages/child/Village';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/child-login" element={<ChildLogin />} />
        <Route path="/child" element={<ChildShell />}>
          <Route index element={<ChildHome />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="subject/:sid" element={<SubjectPage />} />
          <Route path="lesson/:sid" element={<Lesson />} />
          <Route path="games" element={<GamesList />} />
          <Route path="games/:gid" element={<GamePage />} />
          <Route path="village" element={<Village />} />
          <Route path="calm" element={<Calm />} />
        </Route>
        <Route path="/parent" element={<ParentPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
