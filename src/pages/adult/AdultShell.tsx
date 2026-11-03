import type { ReactNode } from 'react';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { A11yButton, useAdultA11y } from '../../components/A11y';
import { Brand } from '../../components/ui';
import { logout, useStore } from '../../lib/db';
import type { Adult, Role } from '../../lib/types';

export const ROLE_NAMES: Record<Role, string> = { admin: 'Әкімші', parent: 'Ата-ана', teacher: 'Мұғалім' };

export function AdultShell({ role, children }: { role: Role; children: (adult: Adult) => ReactNode }) {
  const { db, session } = useStore();
  const navigate = useNavigate();
  const [a11y, setA11y] = useAdultA11y();
  const adult = session?.kind === 'adult' ? db.adults.find((a) => a.id === session.id) : undefined;
  if (!adult) return <Navigate to="/" replace />;
  if (adult.role !== role) return <Navigate to={'/' + adult.role} replace />;
  const exit = () => {
    logout();
    navigate('/');
  };
  const initials = adult.name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <div className="frame">
        <aside className="sidebar" aria-label="Мәзір">
          <Brand to={'/' + role} />
          <nav className="side-links">
            <NavLink to={'/' + role}>
              <span className="ni" aria-hidden="true">
                {role === 'admin' ? '🛠' : role === 'teacher' ? '📋' : '👨‍👩‍👧'}
              </span>
              {role === 'admin' ? 'Басқару' : role === 'teacher' ? 'Оқушыларым' : 'Балам'}
            </NavLink>
          </nav>
          <div className="side-foot">
            <div className="row" style={{ gap: 8 }}>
              <A11yButton value={a11y} onChange={setA11y} />
              <span className="muted small">Көрініс</span>
            </div>
            <div className="user-card">
              <span className="av" aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                {initials}
              </span>
              <span className="t">
                <span className="n">{adult.name}</span>
                <span className="m">{ROLE_NAMES[role]}</span>
              </span>
            </div>
            <div className="side-links">
              <button onClick={exit}>
                <span className="ni" aria-hidden="true">
                  🚪
                </span>
                Шығу
              </button>
            </div>
          </div>
        </aside>
        <div className="topbar">
          <Brand to={'/' + role} />
          <A11yButton value={a11y} onChange={setA11y} />
          <button className="btn secondary" onClick={exit}>
            Шығу
          </button>
        </div>
        <main id="main" className="content no-bottom-nav">
          {children(adult)}
        </main>
      </div>
    </div>
  );
}
