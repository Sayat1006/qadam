import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { A11yButton, useAdultA11y } from '../components/A11y';
import { Bota, Brand, Hero } from '../components/ui';
import { createAdult, getDB, hasAdmin, loginAdult, loginChild, useStore } from '../lib/db';

export const PICS = ['🍎', '🐱', '⭐', '🌸', '🚗', '🐟', '☀️', '🏠', '⚽'];

function PublicFrame({ children }: { children: ReactNode }) {
  const [a11y, setA11y] = useAdultA11y();
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Негізгі мазмұнға өту
      </a>
      <div className="frame" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 5 }}>
          <A11yButton value={a11y} onChange={setA11y} />
        </div>
        <main id="main" className="content solo no-bottom-nav" style={{ maxWidth: 'none' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Landing() {
  const { session } = useStore();
  if (session?.kind === 'child') return <Navigate to="/child" replace />;
  if (session?.kind === 'adult') {
    const a = getDB().adults.find((x) => x.id === session.id);
    if (a) return <Navigate to={'/' + a.role} replace />;
  }
  const setup = !hasAdmin();
  return (
    <PublicFrame>
      <div className="auth">
        <Hero className="auth-hero" glow="center">
          <div className="hero-brand">
            <Brand />
          </div>
          <div className="spacer" />
          <p className="eyebrow">6–15 жастағы оқушыларға</p>
          <div className="chips">
            <span className="chip">Математика</span>
            <span className="chip">Қазақ тілі</span>
            <span className="chip">Дүниетану</span>
            <span className="chip">Ағылшын тілі</span>
          </div>
          <h1>Әр балаға — өз қадамы</h1>
          <p style={{ fontSize: '1.05rem', maxWidth: 520, margin: 0 }}>
            Сабақтар, ойындар және күнделікті кішкентай мақсаттар. Тапсырмалар баланың өз деңгейіне қарай бейімделеді, ал ата-ана мен мұғалім
            оның жетістігін бір жерден көреді.
          </p>
        </Hero>
        <div className="auth-side">
          {setup ? <SetupAdmin /> : <AdultLogin />}
          {!setup && (
            <Link to="/child-login" className="card auth-card row spread" style={{ textDecoration: 'none', color: 'inherit', flexWrap: 'nowrap' }}>
              <span className="row" style={{ gap: 14 }}>
                <span className="bota-face" aria-hidden="true">
                  🧒
                </span>
                <span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Мен оқушымын</strong>
                  <br />
                  <span className="muted small">Атыңды тап та, сурет-құпиясөзіңді бас</span>
                </span>
              </span>
              <span className="btn icon" aria-hidden="true">
                ➜
              </span>
            </Link>
          )}
          <p className="muted small center" style={{ margin: 0 }}>
            Тіркелгіні мектеп әкімшісі ашады.
          </p>
        </div>
      </div>
    </PublicFrame>
  );
}

function AdultLogin() {
  const navigate = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const a = await loginAdult(u, p);
    setBusy(false);
    if (!a) setErr('Логин немесе құпиясөз қате.');
    else navigate('/' + a.role);
  }
  return (
    <form className="card stack auth-card" onSubmit={submit} aria-labelledby="login-h">
      <div>
        <h2 id="login-h">Qadam-ға кіру</h2>
        <p className="muted" style={{ margin: '6px 0 0' }}>
          Ата-ана, мұғалім немесе әкімші
        </p>
      </div>
      <label className="field">
        <span>Логин</span>
        <input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
      </label>
      <label className="field">
        <span>Құпиясөз</span>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
      </label>
      {err && (
        <p className="error" role="alert">
          {err}
        </p>
      )}
      <button className="btn big full" disabled={busy}>
        Кіру
      </button>
    </form>
  );
}

function SetupAdmin() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [u, setU] = useState('admin');
  const [p, setP] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (p.length < 8) return setErr('Құпиясөз кемінде 8 таңбадан тұруы керек.');
    if (p !== p2) return setErr('Құпиясөздер сәйкес емес.');
    try {
      await createAdult({ role: 'admin', name: name || 'Әкімші', username: u, password: p });
      await loginAdult(u, p);
      navigate('/admin');
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  return (
    <form className="card stack auth-card" onSubmit={submit} aria-labelledby="setup-h">
      <h2 id="setup-h">Алғашқы баптау</h2>
      <Bota text="Сәлеметсіз бе! Алдымен әкімші тіркелгісін ашайық. Кейін әкімші ата-ана, мұғалім және бала тіркелгілерін қосады." />
      <label className="field">
        <span>Аты-жөні</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Мысалы: Мектеп әкімшісі" />
      </label>
      <label className="field">
        <span>Логин</span>
        <input value={u} onChange={(e) => setU(e.target.value)} required autoComplete="username" />
      </label>
      <label className="field">
        <span>Құпиясөз (кемінде 8 таңба)</span>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} required autoComplete="new-password" />
      </label>
      <label className="field">
        <span>Құпиясөзді қайталаңыз</span>
        <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} required autoComplete="new-password" />
      </label>
      {err && (
        <p className="error" role="alert">
          {err}
        </p>
      )}
      <button className="btn big full">Әкімшіні құру</button>
    </form>
  );
}

export function ChildLogin() {
  const { db } = useStore();
  const navigate = useNavigate();
  const [childId, setChildId] = useState<string | null>(null);
  const [seq, setSeq] = useState<string[]>([]);
  const [err, setErr] = useState(false);
  const child = db.children.find((c) => c.id === childId);

  function tap(p: string) {
    const next = [...seq, p];
    setErr(false);
    if (next.length < 3) return setSeq(next);
    if (childId && loginChild(childId, next)) navigate('/child');
    else {
      setErr(true);
      setSeq([]);
    }
  }

  return (
    <PublicFrame>
      <div className="stack" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="row">
          <Link className="btn secondary" to="/">
            <span aria-hidden="true">←</span> Артқа
          </Link>
        </div>
        {!child ? (
          <>
            <Bota text="Сәлем! Өз атыңды тап та, бас." />
            {db.children.length === 0 && <p className="notice">Әзірге бала тіркелмеген. Әкімші бала тіркелгісін қосуы керек.</p>}
            <div className="grid cols-4">
              {db.children.map((c) => (
                <button key={c.id} className="avatar-btn" onClick={() => setChildId(c.id)}>
                  <span className="a" aria-hidden="true">
                    {c.avatar}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="card stack center" style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: '3.5rem' }} aria-hidden="true">
              {child.avatar}
            </div>
            <h1 style={{ margin: 0 }}>{child.name}</h1>
            <p style={{ fontWeight: 700 }}>Өзіңнің 3 суретіңді ретімен бас.</p>
            <div className="pic-dots" aria-live="polite" aria-label={`${seq.length} сурет таңдалды`}>
              {[0, 1, 2].map((i) => (
                <span key={i} aria-hidden="true">
                  {seq[i] ? '🟢' : '⚪'}
                </span>
              ))}
            </div>
            {err && (
              <p className="error" role="alert">
                Қате болды, тағы бір рет көрейік!
              </p>
            )}
            <div className="pic-grid">
              {PICS.map((p) => (
                <button key={p} onClick={() => tap(p)} aria-label={`Сурет ${p}`}>
                  {p}
                </button>
              ))}
            </div>
            <button
              className="btn secondary"
              onClick={() => {
                setChildId(null);
                setSeq([]);
                setErr(false);
              }}
            >
              Бұл мен емеспін
            </button>
          </div>
        )}
      </div>
    </PublicFrame>
  );
}
