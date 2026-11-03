import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { A11yButton, applyA11y } from '../../components/A11y';
import { Bota, Brand, Modal } from '../../components/ui';
import { logout, setSession, today, updateChild, updateProgress, useStore } from '../../lib/db';
import type { Child, Progress } from '../../lib/types';

export interface ChildCtx {
  child: Child;
  progress: Progress;
}

export function useChild() {
  return useOutletContext<ChildCtx>();
}

const TICK = 15; // секунд

const STRETCHES = [
  'Орныңнан тұр. Қолыңды жоғары созып, 5-ке дейін сана.',
  'Көзіңді жұмып, терең тыныс ал. Сосын терезеден алысқа қара.',
  'Иығыңды 5 рет алға, 5 рет артқа айналдыр.',
  'Орныңда 10 рет секір немесе жүр.',
];

export function ChildShell() {
  const { db, session } = useStore();
  const navigate = useNavigate();
  const child = session?.kind === 'child' ? db.children.find((c) => c.id === session.id) : undefined;
  const progress = child ? db.progress[child.id] : undefined;
  const [activeSec, setActiveSec] = useState(0);
  const [breakOpen, setBreakOpen] = useState(false);
  const lastBreak = useRef(0);

  useEffect(() => {
    if (child) applyA11y(child.a11y);
  }, [child]);

  // Уақытты есепке алу — тек бет көрініп тұрғанда
  useEffect(() => {
    if (!child) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      updateProgress(child.id, (p) => {
        const d = today();
        p.seconds[d] = (p.seconds[d] ?? 0) + TICK;
      });
      setActiveSec((s) => s + TICK);
    }, TICK * 1000);
    return () => window.clearInterval(id);
  }, [child?.id]);

  useEffect(() => {
    if (!child) return;
    const every = child.settings.breakEveryMin * 60;
    if (every > 0 && activeSec - lastBreak.current >= every) {
      lastBreak.current = activeSec;
      setBreakOpen(true);
    }
  }, [activeSec, child]);

  if (!child || !progress) return <Navigate to="/" replace />;

  const usedToday = progress.seconds[today()] ?? 0;
  const limitReached = child.settings.dailyLimitMin > 0 && usedToday >= child.settings.dailyLimitMin * 60;
  const starsLeft = progress.stars - progress.spentStars;
  const viaAdult = session?.kind === 'child' ? session.via : undefined;

  function exit() {
    const adult = viaAdult ? db.adults.find((a) => a.id === viaAdult) : undefined;
    if (adult) {
      setSession({ kind: 'adult', id: adult.id });
      navigate('/' + adult.role);
      return;
    }
    logout();
    navigate('/');
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <header className="app-header">
        <div className="inner">
          <Brand to="/child" />
          <nav aria-label="Бала мәзірі" className="header-actions">
            <NavLink className="btn ghost" to="/child" end>
              <span aria-hidden="true">🏠</span> Басты
            </NavLink>
            <NavLink className="btn ghost" to="/child/games">
              <span aria-hidden="true">🎮</span> Ойындар
            </NavLink>
            <NavLink className="btn ghost" to="/child/village">
              <span aria-hidden="true">⛺</span> Ауылым
            </NavLink>
            <NavLink className="btn ghost" to="/child/calm">
              <span aria-hidden="true">🌿</span> Тыныштық
            </NavLink>
          </nav>
          <div className="header-actions">
            <span className="stars-pill" aria-label={`${starsLeft} жұлдыз`}>
              ⭐ {starsLeft}
            </span>
            <A11yButton value={child.a11y} onChange={(s) => updateChild(child.id, (c) => (c.a11y = s))} />
            <button className="btn secondary" onClick={exit}>
              {viaAdult ? 'Панельге оралу' : 'Шығу'}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        {limitReached ? (
          <div className="card center stack" style={{ maxWidth: 560, margin: '40px auto' }}>
            <div style={{ fontSize: '4rem' }} aria-hidden="true">
              🌙
            </div>
            <h1>Бүгінге жеткілікті!</h1>
            <Bota text={`${child.name}, бүгін көп еңбек еттің. Енді демал, ойна, ертең тағы кездесеміз!`} />
            <p className="muted">Бүгінгі уақыт шегі аяқталды. Оны ата-ана өз панелінен өзгерте алады.</p>
            <button className="btn big" onClick={exit}>
              Жарайды
            </button>
          </div>
        ) : (
          <Outlet context={{ child, progress } satisfies ChildCtx} />
        )}
      </main>
      {breakOpen && !limitReached && <BreakModal onClose={() => setBreakOpen(false)} />}
    </>
  );
}

function BreakModal({ onClose }: { onClose: () => void }) {
  const [tip] = useState(() => STRETCHES[Math.floor(Math.random() * STRETCHES.length)]);
  return (
    <Modal title="Үзіліс уақыты!" onClose={onClose}>
      <Bota text={`Кішкене демалайық. ${tip}`} mood="🐪" />
      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn big" onClick={onClose}>
          Дайынмын, жалғастырамыз!
        </button>
      </div>
    </Modal>
  );
}
