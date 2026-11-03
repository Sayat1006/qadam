import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { A11yButton, useAdultA11y } from '../components/A11y';
import { Bota, Brand } from '../components/ui';
import { createAdult, getDB, hasAdmin, loginAdult, loginChild, useStore } from '../lib/db';

export const PICS = ['🍎', '🐱', '⭐', '🌸', '🚗', '🐟', '☀️', '🏠', '⚽'];

function PublicHeader() {
  const [a11y, setA11y] = useAdultA11y();
  return (
    <header className="app-header">
      <div className="inner">
        <Brand />
        <div className="header-actions">
          <A11yButton value={a11y} onChange={setA11y} />
        </div>
      </div>
    </header>
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
    <>
      <PublicHeader />
      <main id="main">
        <section className="hero">
          <div>
            <h1>Әр балаға — өз қадамы</h1>
            <div className="ornament decor" aria-hidden="true" />
            <p style={{ fontSize: '1.15rem' }}>
              <strong>Qadam</strong> — 6–15 жастағы балаларға арналған білім беру платформасы. Әр бала өз қарқынымен оқиды: тапсырмалар баланың өз деңгейіне қарай
              бейімделеді, ал ойындар оқуды қызықты етеді.
            </p>
            <div className="chips">
              <span className="chip">🌱→🦅 5 деңгей</span>
              <span className="chip">💡 3 сатылы кеңес</span>
              <span className="chip">🎮 Білім беретін ойындар</span>
              <span className="chip">👨‍👩‍👧 Ата-ана мен мұғалім панелі</span>
              <span className="chip">🔊 Дауыстап оқу</span>
            </div>
          </div>
          <div>{setup ? <SetupAdmin /> : <AdultLogin />}</div>
        </section>
        {!setup && (
          <section className="card soft">
            <div className="row spread">
              <div>
                <h2 style={{ margin: 0 }}>
                  <span aria-hidden="true">🧒</span> Мен баламын
                </h2>
                <p className="muted" style={{ margin: 0 }}>
                  Атыңды тауып, сурет-құпиясөзіңді бас.
                </p>
              </div>
              <Link to="/child-login" className="btn big">
                Кіру <span aria-hidden="true">➜</span>
              </Link>
            </div>
          </section>
        )}
        <p className="muted small center" style={{ marginTop: 24 }}>
          Тіркелгіні тек әкімші ашады. Бұл нұсқада деректер осы құрылғының браузерінде сақталады.
        </p>
      </main>
    </>
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
    <form className="card stack" onSubmit={submit} aria-labelledby="login-h">
      <h2 id="login-h">Ересектерге кіру</h2>
      <p className="muted small">Ата-ана, мұғалім немесе әкімші</p>
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
      <button className="btn big" disabled={busy}>
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
    <form className="card stack" onSubmit={submit} aria-labelledby="setup-h">
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
      <button className="btn big">Әкімшіні құру</button>
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
    <>
      <PublicHeader />
      <main id="main" className="stack">
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
      </main>
    </>
  );
}
