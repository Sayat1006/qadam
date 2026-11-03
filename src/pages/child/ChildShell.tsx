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

  const links = [
    { to: '/child', end: true, icon: '🏠', label: 'Басты' },
    { to: '/child/games', icon: '🎮', label: 'Ойындар' },
    { to: '/child/village', icon: '⛺', label: 'Ауылым' },
    { to: '/child/calm', icon: '🌿', label: 'Тыныштық' },
  ];
  const a11y = <A11yButton value={child.a11y} onChange={(s) => updateChild(child.id, (c) => (c.a11y = s))} />;

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <div className="frame">
        <aside className="sidebar" aria-label="Бала мәзірі">
          <Brand to="/child" />
          <nav className="side-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                <span className="ni" aria-hidden="true">
                  {l.icon}
                </span>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="side-foot">
            <div className="row" style={{ gap: 8 }}>
              <span className="stars-pill" aria-label={`${starsLeft} жұлдыз`}>
                ⭐ {starsLeft}
              </span>
              {a11y}
            </div>
            <div className="user-card">
              <span className="av" aria-hidden="true">
                {child.avatar}
              </span>
              <span className="t">
                <span className="n">{child.name}</span>
                <span className="m">{new Date().getFullYear() - child.birthYear} жас</span>
              </span>
            </div>
            <div className="side-links">
              <button onClick={exit}>
                <span className="ni" aria-hidden="true">
                  {viaAdult ? '↩' : '🚪'}
                </span>
                {viaAdult ? 'Панельге оралу' : 'Шығу'}
              </button>
            </div>
          </div>
        </aside>

        <div className="topbar">
          <Brand to="/child" />
          <span className="stars-pill" aria-label={`${starsLeft} жұлдыз`}>
            ⭐ {starsLeft}
          </span>
          {a11y}
          <button className="btn secondary icon" onClick={exit} aria-label={viaAdult ? 'Панельге оралу' : 'Шығу'} title={viaAdult ? 'Панельге оралу' : 'Шығу'}>
            <span aria-hidden="true">{viaAdult ? '↩' : '🚪'}</span>
          </button>
        </div>

        <main id="main" className="content">
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

        <nav className="bottom-nav" aria-label="Бала мәзірі">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <span className="ni" aria-hidden="true">
                {l.icon}
              </span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {breakOpen && !limitReached && <BreakModal onClose={() => setBreakOpen(false)} />}
    </div>
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
