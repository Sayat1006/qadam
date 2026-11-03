import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  return (
    <>
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <header className="app-header">
        <div className="inner">
          <Brand to={'/' + role} />
          <div className="header-actions">
            <span className="muted small" style={{ fontWeight: 700 }}>
              {ROLE_NAMES[role]}: {adult.name}
            </span>
            <A11yButton value={a11y} onChange={setA11y} />
            <button
              className="btn secondary"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Шығу
            </button>
          </div>
        </div>
      </header>
      <main id="main">{children(adult)}</main>
    </>
  );
}
