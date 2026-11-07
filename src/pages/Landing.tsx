import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { A11yButton, useAdultA11y } from '../components/A11y';
import { CountUp, Reveal, useTitle } from '../components/kit';
import { Brand } from '../components/ui';
import { LEVEL_NAMES, subjects } from '../content';
import { math } from '../content/math';
import { gameMeta as games } from '../games/meta';
import { getDB, useStore } from '../lib/db';

const Hero3D = lazy(() => import('../three/Hero3D').then((m) => ({ default: m.Hero3D })));

const NAV = [
  { id: 'top', label: 'Басты бет' },
  { id: 'features', label: 'Мүмкіндіктер' },
  { id: 'subjects', label: 'Пәндер' },
  { id: 'journey', label: 'Қадамдар' },
  { id: 'parents', label: 'Ата-аналарға' },
];

// Платформаның нақты мүмкіндіктері — мазмұннан есептеледі (ойдан шығарылған сан жоқ)
const topicCount = new Set(subjects.flatMap((s) => s.levels.flatMap((l) => l.topics.map((t) => `${s.id}:${t.id}`)))).size;
const STATS = [
  { v: subjects.length, l: 'пән' },
  { v: subjects.reduce((a, s) => a + s.levels.length, 0), l: 'деңгей' },
  { v: topicCount, l: 'тақырып' },
  { v: games.length, l: 'білім беретін ойын' },
];

const sampleHints = math.levels[1].topics[0].gen().hints;

export function Landing() {
  useTitle('');
  const { session } = useStore();
  const [a11y, setA11y] = useAdultA11y();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('top');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const adult = session?.kind === 'adult' ? getDB().adults.find((a) => a.id === session.id) : undefined;
  const cabinet = session?.kind === 'child' ? '/child' : adult ? '/' + adult.role : null;

  return (
    <div className="landing">
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <header className={`lnav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lnav-inner">
          <Brand to="/" />
          <nav aria-label="Негізгі мәзір" className="lnav-links">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'active' : ''} aria-current={active === n.id ? 'true' : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="lnav-actions">
            <A11yButton value={a11y} onChange={setA11y} />
            {cabinet ? (
              <Link to={cabinet} className="btn">
                Кабинет
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn secondary hide-sm">
                  Кіру
                </Link>
                <Link to="/child-login" className="btn hide-sm">
                  Оқуды бастау
                </Link>
              </>
            )}
            <button className="btn secondary icon show-sm" aria-expanded={menu} aria-controls="mmenu" aria-label="Мәзір" onClick={() => setMenu((m) => !m)}>
              <span aria-hidden="true">{menu ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
        {menu && (
          <div id="mmenu" className="mmenu">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setMenu(false)}>
                {n.label}
              </a>
            ))}
            {!cabinet && (
              <div className="row" style={{ marginTop: 8 }}>
                <Link to="/login" className="btn secondary" style={{ flex: 1 }}>
                  Кіру
                </Link>
                <Link to="/child-login" className="btn" style={{ flex: 1 }}>
                  Оқуды бастау
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main id="main">
        {/* HERO */}
        <section id="top" className="lhero">
          <div className="lhero-bg" aria-hidden="true" />
          <div className="lwrap lhero-grid">
            <div className="lhero-copy">
              <p className="eyebrow anim-in" style={{ ['--d' as string]: '0ms' }}>
                6–15 жастағы оқушыларға
              </p>
              <h1 className="anim-in" style={{ ['--d' as string]: '80ms' }}>
                Біліміңді дамыт.
                <br />
                <span className="grad-text">Мақсатыңа бір қадам жақында.</span>
              </h1>
              <p className="lead anim-in" style={{ ['--d' as string]: '160ms' }}>
                Оқудың жаңа жолы. Біліміңді тексер, қабілетіңді дамыт және әр күн сайын жаңа жетістікке жет — өз деңгейіңде, өз қарқыныңмен.
              </p>
              <div className="row anim-in" style={{ ['--d' as string]: '240ms' }}>
                <Link to={cabinet ?? '/child-login'} className="btn big">
                  Оқуды бастау <span className="arrow" aria-hidden="true">➜</span>
                </Link>
                <a href="#features" className="btn big secondary">
                  Мүмкіндіктерді көру
                </a>
              </div>
            </div>
            <div className="lhero-visual">
              <Suspense fallback={<div className="hero3d" />}>
                <Hero3D />
              </Suspense>
            </div>
          </div>
          <a href="#stats" className="scroll-hint" aria-label="Төменге айналдыру">
            <span />
          </a>
        </section>

        {/* НАҚТЫ МҮМКІНДІКТЕР */}
        <section id="stats" className="lwrap lsection" aria-labelledby="stats-h">
          <h2 id="stats-h" className="sr-only">
            Платформа мүмкіндіктері сандармен
          </h2>
          <div className="stat-band">
            {STATS.map((s, i) => (
              <Reveal key={s.l} delay={i * 80} className="stat-cell">
                <span className="stat-num">
                  <CountUp value={s.v} />
                </span>
                <span className="muted">{s.l}</span>
              </Reveal>
            ))}
          </div>
          <p className="muted small center" style={{ marginTop: 12 }}>
            Сандар — платформадағы нақты мазмұн көлемі. Тапсырмалар әр сабақта жаңадан құрастырылады.
          </p>
        </section>

        {/* ОҚУ ТӘСІЛДЕРІ */}
        <section id="features" className="lwrap lsection" aria-labelledby="feat-h">
          <Reveal>
            <p className="eyebrow">Оқу тәсілдері</p>
            <h2 id="feat-h" className="lh2">
              Тыңда, оқы, құрастыр, ойна
            </h2>
            <p className="lead muted">Әр тапсырма бірнеше сезім арқылы қабылданады — сондықтан жақсы есте қалады.</p>
          </Reveal>
          <div className="grid cols-4 skill-grid">
            {[
              { i: '🎧', t: 'Тыңдалым', d: 'Кез келген тапсырманы, кеңесті және мәтінді дауыстап тыңдауға болады.', c: '#38BDF8' },
              { i: '📖', t: 'Оқылым', d: 'Буыннан сөзге, сөзден сөйлемге, сөйлемнен мәтінге — қадам-қадаммен оқу.', c: '#243B80' },
              { i: '✍️', t: 'Жазылым', d: 'Әріптер мен буындардан сөз құрау, сөздерден сөйлем құрастыру.', c: '#6555E8' },
              { i: '🎮', t: 'Ойын', d: 'Жұбын тап, Әріп керуені, Киіз үй, Сауда базары — ойнай жүріп үйрен.', c: '#35C98A' },
            ].map((s, k) => (
              <Reveal key={s.t} delay={k * 90} className="card skill-card lift tilt" style={{ ['--c' as string]: s.c }}>
                <span className="skill-icon" aria-hidden="true">
                  {s.i}
                </span>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
                <Link to={cabinet ?? '/child-login'} className="btn secondary" style={{ marginTop: 'auto' }}>
                  Байқап көру
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ДЕҢГЕЙЛЕР */}
        <section className="lwrap lsection" aria-labelledby="lvl-h">
          <div className="split">
            <Reveal>
              <p className="eyebrow">Бейімделгіш деңгейлер</p>
              <h2 id="lvl-h" className="lh2">
                Өз деңгейіңді анықта.
              </h2>
              <p className="lead muted">
                Әр пәнде 5–7 деңгей бар. Жүйе бірінші тапсырмалардан-ақ сенің деңгейіңді байқайды: оңай болса — бірден жоғарылатады, қиын болса —
                кеңес пен көрнекі тірек қосады.
              </p>
              <ul className="check-list">
                <li>Соңғы 6 тапсырманың 5-еуін бірден тапсаң — келесі деңгей ашылады</li>
                <li>Әр сабақта алдыңғы деңгейден қайталау тапсырмасы бар</li>
                <li>Деңгей ешқашан жазаланбайды — тек алға жылжиды</li>
              </ul>
              <Link to={cabinet ?? '/child-login'} className="btn big" style={{ marginTop: 8 }}>
                Деңгейімді білу
              </Link>
            </Reveal>
            <Reveal delay={120} className="level-ladder">
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l} className="ladder-step" style={{ ['--l' as string]: l }}>
                  <span className="ladder-icon" aria-hidden="true">
                    {LEVEL_NAMES[l].icon}
                  </span>
                  <span>
                    <strong>
                      {l}-деңгей · {LEVEL_NAMES[l].name}
                    </strong>
                    <span className="muted small" style={{ display: 'block' }}>
                      {math.levels[l - 1].title}
                    </span>
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ПӘНДЕР */}
        <section id="subjects" className="lwrap lsection" aria-labelledby="subj-h">
          <Reveal>
            <p className="eyebrow">Пәндер</p>
            <h2 id="subj-h" className="lh2">
              Негізгі пәндер бір жерде
            </h2>
          </Reveal>
          <div className="grid cols-5">
            {subjects.map((s, i) => (
              <Reveal key={s.id} delay={i * 70} className="card subject-card lift" style={{ ['--subject' as string]: s.color }}>
                <span className="emoji" aria-hidden="true">
                  {s.emoji}
                </span>
                <strong style={{ fontSize: '1.1rem' }}>{s.title}</strong>
                <span className="muted small">{s.about}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* БОТА */}
        <section className="lwrap lsection" aria-labelledby="bota-h">
          <div className="split">
            <Reveal className="mentor-visual">
              <div className="mentor-card card">
                <div className="row" style={{ gap: 10 }}>
                  <span className="bota-face" aria-hidden="true">
                    🐪
                  </span>
                  <span>
                    <strong>Бота</strong>
                    <span className="muted small" style={{ display: 'block' }}>
                      Жетекші · кеңес мысалы
                    </span>
                  </span>
                </div>
                {sampleHints.map((h, i) => (
                  <div key={i} className="mentor-msg" style={{ ['--i' as string]: i }}>
                    <span className="mentor-step">{i + 1}</span> {h}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p className="eyebrow">Жетекші</p>
              <h2 id="bota-h" className="lh2">
                Бота әр қадамыңда көмектеседі.
              </h2>
              <p className="lead muted">Жауапты бірден айтпайды — ойлануға үйретеді. Кеңес үш сатыда беріледі: еске салу, жетелеу, көрсету.</p>
              <ul className="check-list">
                <li>Қиналсаң — тапсырманы жеңілдетіп, нұсқаларды азайтады</li>
                <li>Сабақ басында көңіл-күйіңді сұрайды</li>
                <li>Ұзақ отырсаң — үзіліс жасауды еске салады</li>
                <li>Кез келген мәтінді дауыстап оқып береді</li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ҚАДАМДАР ЖОЛЫ */}
        <section id="journey" className="lwrap lsection" aria-labelledby="jr-h">
          <Reveal className="center">
            <p className="eyebrow">Оқу жолы</p>
            <h2 id="jr-h" className="lh2">
              Әр сабақ — жаңа қадам
            </h2>
            <p className="lead muted" style={{ margin: '0 auto' }}>
              Жетістіктер нақты әрекеттен ғана ашылады: сабақ аяқтау, деңгей көтеру, күн сайын оқу.
            </p>
          </Reveal>
          <Journey />
        </section>

        {/* АТА-АНА МЕН МҰҒАЛІМ */}
        <section id="parents" className="lwrap lsection" aria-labelledby="par-h">
          <Reveal>
            <p className="eyebrow">Ата-аналар мен мұғалімдерге</p>
            <h2 id="par-h" className="lh2">
              Баланың жетістігі — бір қарағанда
            </h2>
          </Reveal>
          <div className="grid cols-3">
            {[
              { i: '📈', t: 'Түсінікті есеп', d: 'Оқу уақыты, дәлдік, жақсы меңгерілген және көбірек жаттығу керек тақырыптар — қарапайым тілмен.' },
              { i: '⏱️', t: 'Уақыт пен үзіліс', d: 'Күнделікті уақыт шегі мен үзіліс жиілігін ата-ана өзі белгілейді.' },
              { i: '📝', t: 'Мұғаліммен байланыс', d: 'Ортақ жазбалар, ұсынылған пән және деңгейді қолмен өзгерту мүмкіндігі.' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 90} className="card lift">
                <span className="skill-icon" aria-hidden="true" style={{ ['--c' as string]: '#6555E8' }}>
                  {f.i}
                </span>
                <h3>{f.t}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {f.d}
                </p>
              </Reveal>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 16 }}>
            Тіркелгіні мектеп әкімшісі ашады. Логин мен құпиясөзді әкімшіден алыңыз.
          </p>
        </section>

        {/* CTA */}
        <section className="lwrap lsection">
          <Reveal className="cta-band">
            <div className="cta-orbs" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2>Бүгін баста. Ертеңгі жетістігіңді жаса.</h2>
            <p>Бірінші сабақ 5 минуттан аспайды.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to={cabinet ?? '/child-login'} className="btn big cta-btn">
                QADAM-мен бастау <span className="arrow" aria-hidden="true">➜</span>
              </Link>
              {!cabinet && (
                <Link to="/login" className="btn big cta-outline">
                  Ата-ана / мұғалім кіруі
                </Link>
              )}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lfooter">
        <div className="lwrap row spread">
          <Brand to="/" />
          <span className="muted small">© {new Date().getFullYear()} QADAM · Әр балаға өз қадамы</span>
        </div>
      </footer>
    </div>
  );
}

const MILESTONES = [
  { t: 'Бірінші қадам', d: 'Алғашқы сабақты аяқта', i: '👣' },
  { t: 'Алғашқы жетістік', d: 'Бір сабақты қатесіз орында', i: '⭐' },
  { t: 'Жаңа деңгей', d: 'Кез келген пәнде деңгей көтер', i: '🌿' },
  { t: 'Күрделі тапсырмалар', d: '3-деңгейге жет', i: '🌳' },
  { t: 'Жеке мақсат', d: '7 күн қатарынан оқы', i: '🦅' },
];

function Journey() {
  return (
    <div className="journey">
      <svg className="journey-path" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="jg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#243B80" />
            <stop offset="0.5" stopColor="#6555E8" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <path d="M20 170 C 180 170, 180 60, 260 60 S 420 160, 500 150 S 650 50, 740 60 S 900 170, 980 120" fill="none" stroke="url(#jg)" strokeWidth="6" strokeLinecap="round" className="journey-line" />
      </svg>
      <ol className="journey-steps">
        {MILESTONES.map((m, i) => (
          <Reveal as="li" key={m.t} delay={i * 110} className="journey-step">
            <span className="journey-dot" aria-hidden="true">
              {m.i}
            </span>
            <strong>{m.t}</strong>
            <span className="muted small">{m.d}</span>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
