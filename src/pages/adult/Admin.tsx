import { useTitle } from '../../components/kit';
import { useState, type FormEvent } from 'react';
import { Modal, Seg } from '../../components/ui';
import { LEVEL_NAMES, subjectIds } from '../../content';
import { createAdult, createChild, deleteAdult, deleteChild, exportJSON, importJSON, resetPassword, updateChild, useStore } from '../../lib/db';
import type { Adult, Child, Role } from '../../lib/types';
import { PICS } from '../Auth';
import { makePassword, makePicPass, makeUsername, parseBulk } from '../../lib/bulk';
import { AdultShell, ROLE_NAMES } from './AdultShell';
import { ChildReport } from './ChildReport';

const AVATARS = ['🦊', '🐻', '🐰', '🐱', '🐶', '🦁', '🐼', '🐯', '🐨', '🦉', '🐢', '🦄'];

export function AdminPage() {
  return <AdultShell role="admin">{(a) => <AdminView me={a} />}</AdultShell>;
}

function AdminView({ me }: { me: Adult }) {
  useTitle('Әкімші панелі');
  const [tab, setTab] = useState<'adults' | 'children' | 'bulk' | 'reports' | 'backup'>('children');
  return (
    <div className="stack">
      <h1>Әкімші панелі</h1>
      <p className="notice small">
        Тек әкімші жаңа тіркелгі аша алады. Бұл нұсқада деректер осы браузерде сақталады — тұрақты сақтау үшін «Сақтық көшірме» бөлімін пайдаланыңыз.
      </p>
      <div className="tabs" role="tablist" aria-label="Әкімші бөлімдері">
        {(
          [
            ['children', 'Балалар'],
            ['bulk', 'Топпен тіркеу'],
            ['adults', 'Ата-ана мен мұғалімдер'],
            ['reports', 'Есептер'],
            ['backup', 'Сақтық көшірме'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'adults' && <Adults me={me} />}
      {tab === 'children' && <Children />}
      {tab === 'bulk' && <Bulk />}
      {tab === 'reports' && <Reports me={me} />}
      {tab === 'backup' && <Backup />}
    </div>
  );
}

/* ---------------- Ересектер ---------------- */

function Adults({ me }: { me: Adult }) {
  const { db } = useStore();
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [resetFor, setResetFor] = useState<Adult | null>(null);
  const [delFor, setDelFor] = useState<Adult | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMsg({ ok: false, t: 'Құпиясөз кемінде 6 таңба болуы керек.' });
    try {
      await createAdult({ role, name, username, password });
      setMsg({ ok: true, t: `${ROLE_NAMES[role]} тіркелгісі ашылды. Логин: ${username}` });
      setName('');
      setUsername('');
      setPassword('');
    } catch (ex) {
      setMsg({ ok: false, t: (ex as Error).message });
    }
  }

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <form className="card stack" onSubmit={submit}>
        <h2>Жаңа тіркелгі</h2>
        <Seg
          label="Рөлі"
          value={role}
          onChange={setRole}
          options={[
            { v: 'parent', l: 'Ата-ана' },
            { v: 'teacher', l: 'Мұғалім' },
            { v: 'admin', l: 'Әкімші' },
          ]}
        />
        <label className="field">
          <span>Аты-жөні</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Логин</span>
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} required autoComplete="off" />
        </label>
        <label className="field">
          <span>Бастапқы құпиясөз</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </label>
        {msg && (
          <p className={msg.ok ? 'notice' : 'error'} role="status">
            {msg.t}
          </p>
        )}
        <button className="btn">Тіркелгі ашу</button>
      </form>
      <div className="card table-wrap">
        <h2>Тіркелгілер</h2>
        <table className="list">
          <thead>
            <tr>
              <th scope="col">Аты</th>
              <th scope="col">Рөлі</th>
              <th scope="col">Логин</th>
              <th scope="col">
                <span className="sr-only">Әрекеттер</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {db.adults.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{ROLE_NAMES[a.role]}</td>
                <td>{a.username}</td>
                <td>
                  <div className="row">
                    <button className="btn secondary" onClick={() => setResetFor(a)} aria-label={`${a.name}: құпиясөзді өзгерту`}>
                      🔑
                    </button>
                    {a.id !== me.id && (
                      <button className="btn warn" onClick={() => setDelFor(a)} aria-label={`${a.name}: жою`}>
                        🗑
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resetFor && <ResetPassword adult={resetFor} onClose={() => setResetFor(null)} />}
      {delFor && (
        <Confirm
          title={`${delFor.name} тіркелгісін жою`}
          text="Тіркелгі жойылады, ал балалармен байланысы үзіледі. Балалардың деректері сақталады."
          onCancel={() => setDelFor(null)}
          onOk={() => {
            deleteAdult(delFor.id);
            setDelFor(null);
          }}
        />
      )}
    </div>
  );
}

function ResetPassword({ adult, onClose }: { adult: Adult; onClose: () => void }) {
  const [p, setP] = useState('');
  const [done, setDone] = useState(false);
  return (
    <Modal title={`${adult.name}: жаңа құпиясөз`} onClose={onClose}>
      {done ? (
        <p className="notice">Құпиясөз өзгертілді.</p>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (p.length < 6) return;
            await resetPassword(adult.id, p);
            setDone(true);
          }}
        >
          <label className="field">
            <span>Жаңа құпиясөз (кемінде 6 таңба)</span>
            <input value={p} onChange={(e) => setP(e.target.value)} minLength={6} required autoComplete="new-password" />
          </label>
          <button className="btn">Сақтау</button>
        </form>
      )}
      <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
        Жабу
      </button>
    </Modal>
  );
}

function Confirm({ title, text, onOk, onCancel }: { title: string; text: string; onOk: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{text}</p>
      <div className="row">
        <button className="btn warn" onClick={onOk}>
          Иә, жою
        </button>
        <button className="btn secondary" onClick={onCancel}>
          Бас тарту
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Балалар ---------------- */

function PicPassPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="stack">
      <div className="pic-dots" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <span key={i}>{value[i] ?? '⚪'}</span>
        ))}
      </div>
      <div className="pic-grid">
        {PICS.map((p) => (
          <button type="button" key={p} onClick={() => value.length < 3 && onChange([...value, p])} aria-label={`Сурет ${p} қосу`}>
            {p}
          </button>
        ))}
      </div>
      <button type="button" className="btn secondary" onClick={() => onChange([])}>
        Қайта таңдау
      </button>
    </div>
  );
}

function PeoplePicker({ list, value, onChange, label }: { list: Adult[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <fieldset className="card soft" style={{ padding: 12 }}>
      <legend style={{ fontWeight: 800 }}>{label}</legend>
      {list.length === 0 && <p className="muted small">Әзірге тіркелгі жоқ. Алдымен «Ата-ана мен мұғалімдер» бөлімінде ашыңыз.</p>}
      {list.map((a) => (
        <label key={a.id} className="check">
          <input type="checkbox" checked={value.includes(a.id)} onChange={(e) => onChange(e.target.checked ? [...value, a.id] : value.filter((x) => x !== a.id))} />
          {a.name} <span className="muted small">({a.username})</span>
        </label>
      ))}
    </fieldset>
  );
}

function Children() {
  const { db } = useStore();
  const parents = db.adults.filter((a) => a.role === 'parent');
  const teachers = db.adults.filter((a) => a.role === 'teacher');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 8);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [picPass, setPicPass] = useState<string[]>([]);
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [startLevel, setStartLevel] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [edit, setEdit] = useState<Child | null>(null);
  const [del, setDel] = useState<Child | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (picPass.length !== 3) return setMsg({ ok: false, t: 'Сурет-құпиясөз үшін 3 сурет таңдаңыз.' });
    createChild({ name: name.trim(), birthYear, avatar, picPass, parentIds, teacherIds, startLevel }, subjectIds);
    setMsg({ ok: true, t: `${name} тіркелді. Сурет-құпиясөзі: ${picPass.join(' ')}` });
    setName('');
    setPicPass([]);
    setParentIds([]);
    setTeacherIds([]);
  }

  const year = new Date().getFullYear();
  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <form className="card stack" onSubmit={submit}>
        <h2>Жаңа бала</h2>
        <label className="field">
          <span>Аты (немесе лақап аты)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Туған жылы</span>
          <select value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => year - 5 - i).map((y) => (
              <option key={y} value={y}>
                {y} ({year - y} жас)
              </option>
            ))}
          </select>
        </label>
        <div>
          <p style={{ fontWeight: 800, marginBottom: 6 }}>Аватар</p>
          <div className="seg" role="group" aria-label="Аватар">
            {AVATARS.map((a) => (
              <button type="button" key={a} aria-pressed={avatar === a} onClick={() => setAvatar(a)} style={{ fontSize: '1.6rem' }}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 800, marginBottom: 6 }}>Сурет-құпиясөз (3 суретті ретімен басыңыз)</p>
          <PicPassPicker value={picPass} onChange={setPicPass} />
        </div>
        <div>
          <p style={{ fontWeight: 800, marginBottom: 6 }}>Бастапқы деңгей (барлық пән)</p>
          <Seg label="Бастапқы деңгей" value={startLevel} onChange={setStartLevel} options={[1, 2, 3, 4, 5].map((l) => ({ v: l, l: `${LEVEL_NAMES[l].icon} ${l}` }))} />
          <p className="muted small" style={{ marginTop: 6 }}>
            Күмәнді болса, 1-деңгейден бастаңыз: бала алғашқы 6 тапсырманы қатесіз орындаса, жүйе оны келесі деңгейге өзі көтереді.
          </p>
        </div>
        <PeoplePicker list={parents} value={parentIds} onChange={setParentIds} label="Ата-анасы" />
        <PeoplePicker list={teachers} value={teacherIds} onChange={setTeacherIds} label="Мұғалімі" />
        {msg && (
          <p className={msg.ok ? 'notice' : 'error'} role="status">
            {msg.t}
          </p>
        )}
        <button className="btn big">Баланы тіркеу</button>
      </form>

      <div className="card stack">
        <h2>Балалар ({db.children.length})</h2>
        {db.children.length === 0 && <p className="muted">Әзірге бала тіркелмеген.</p>}
        {db.children.map((c) => (
          <div key={c.id} className="row spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <div>
              <strong>
                <span aria-hidden="true">{c.avatar}</span> {c.name}
              </strong>{' '}
              <span className="muted small">· {year - c.birthYear} жас</span>
              <div className="muted small">
                Ата-ана: {c.parentIds.map((id) => db.adults.find((a) => a.id === id)?.name).filter(Boolean).join(', ') || '—'} · Мұғалім:{' '}
                {c.teacherIds.map((id) => db.adults.find((a) => a.id === id)?.name).filter(Boolean).join(', ') || '—'}
              </div>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={() => setEdit(c)}>
                Өзгерту
              </button>
              <button className="btn warn" onClick={() => setDel(c)} aria-label={`${c.name}: жою`}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
      {edit && <EditChild child={edit} parents={parents} teachers={teachers} onClose={() => setEdit(null)} />}
      {del && (
        <Confirm
          title={`${del.name} тіркелгісін жою`}
          text="Баланың барлық прогресі мен жазбалары біржола жойылады."
          onCancel={() => setDel(null)}
          onOk={() => {
            deleteChild(del.id);
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

function EditChild({ child, parents, teachers, onClose }: { child: Child; parents: Adult[]; teachers: Adult[]; onClose: () => void }) {
  const [name, setName] = useState(child.name);
  const [parentIds, setParentIds] = useState(child.parentIds);
  const [teacherIds, setTeacherIds] = useState(child.teacherIds);
  const [picPass, setPicPass] = useState<string[]>([]);
  return (
    <Modal title={`${child.name}: өзгерту`} onClose={onClose}>
      <div className="stack">
        <label className="field">
          <span>Аты</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <PeoplePicker list={parents} value={parentIds} onChange={setParentIds} label="Ата-анасы" />
        <PeoplePicker list={teachers} value={teacherIds} onChange={setTeacherIds} label="Мұғалімі" />
        <div>
          <p style={{ fontWeight: 800, marginBottom: 6 }}>Жаңа сурет-құпиясөз (өзгертпесеңіз, бос қалдырыңыз)</p>
          <PicPassPicker value={picPass} onChange={setPicPass} />
        </div>
        <div className="row">
          <button
            className="btn"
            disabled={picPass.length > 0 && picPass.length < 3}
            onClick={() => {
              updateChild(child.id, (c) => {
                c.name = name.trim() || c.name;
                c.parentIds = parentIds;
                c.teacherIds = teacherIds;
                if (picPass.length === 3) c.picPass = picPass;
              });
              onClose();
            }}
          >
            Сақтау
          </button>
          <button className="btn secondary" onClick={onClose}>
            Бас тарту
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Есептер ---------------- */

function Reports({ me }: { me: Adult }) {
  const { db } = useStore();
  const [sel, setSel] = useState<string>(db.children[0]?.id ?? '');
  const child = db.children.find((c) => c.id === sel);
  if (!db.children.length) return <p className="muted">Әзірге бала тіркелмеген.</p>;
  return (
    <div className="stack">
      <label className="field" style={{ maxWidth: 360 }}>
        <span>Бала</span>
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {db.children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {child && <ChildReport child={child} viewer={me} />}
    </div>
  );
}

/* ---------------- Сақтық көшірме ---------------- */

function Backup() {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qadam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="grid cols-2">
      <div className="card stack">
        <h2>Көшірмені жүктеу</h2>
        <p>Барлық тіркелгі мен прогресті бір JSON файлына сақтайды. Файлды басқа құрылғыға көшіруге болады.</p>
        <p className="muted small">Ескерту: файлда құпиясөздердің хэші бар. Оны қауіпсіз жерде сақтаңыз.</p>
        <button className="btn" onClick={download}>
          Жүктеп алу
        </button>
      </div>
      <div className="card stack">
        <h2>Көшірмені қалпына келтіру</h2>
        <p>Осы құрылғыдағы деректер файлдағы деректермен толық ауыстырылады.</p>
        <label className="field">
          <span>JSON файлы</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                importJSON(await f.text());
                setMsg({ ok: true, t: 'Деректер қалпына келтірілді.' });
              } catch (ex) {
                setMsg({ ok: false, t: (ex as Error).message });
              }
            }}
          />
        </label>
        {msg && (
          <p className={msg.ok ? 'notice' : 'error'} role="status">
            {msg.t}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Топпен тіркеу (T15) ---------------- */

interface Created {
  child: string;
  avatar: string;
  picPass: string[];
  parent?: { name: string; username: string; password: string };
}

function Bulk() {
  const { db } = useStore();
  const teachers = db.adults.filter((a) => a.role === 'teacher');
  const [text, setText] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [startLevel, setStartLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Created[]>([]);
  const rows = parseBulk(text);
  const valid = rows.filter((r) => !r.error);

  async function run() {
    setBusy(true);
    const taken = new Set(db.adults.map((a) => a.username.toLowerCase()));
    const out: Created[] = [];
    for (const r of valid) {
      let parentIds: string[] = [];
      let parent: Created['parent'];
      if (r.parentName) {
        const username = makeUsername(r.parentName, taken);
        const password = makePassword();
        const a = await createAdult({ role: 'parent', name: r.parentName, username, password });
        parentIds = [a.id];
        parent = { name: r.parentName, username, password };
      }
      const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const picPass = makePicPass(PICS);
      createChild({ name: r.name, birthYear: r.birthYear, avatar, picPass, parentIds, teacherIds, startLevel }, subjectIds);
      out.push({ child: r.name, avatar, picPass, parent });
    }
    setDone(out);
    setText('');
    setBusy(false);
  }

  return (
    <div className="stack">
      {done.length === 0 ? (
        <div className="grid cols-2" style={{ alignItems: 'start' }}>
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Сыныпты бірден тіркеу</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Әр жолға бір оқушы: <code>Аты; туған жылы; ата-ананың аты-жөні</code>. Ата-ана бағаны міндетті емес. Кестеден (Excel) көшіріп қоюға да болады.
            </p>
            <label className="field">
              <span>Оқушылар тізімі</span>
              <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Ерлан; 2017; Гүлнар Ахметова\nДана; 2016; Асқар Сейітов'} />
            </label>
            <PeoplePicker list={teachers} value={teacherIds} onChange={setTeacherIds} label="Мұғалімі" />
            <div>
              <p style={{ fontWeight: 700, margin: '0 0 6px' }}>Бастапқы деңгей</p>
              <Seg label="Бастапқы деңгей" value={startLevel} onChange={setStartLevel} options={[1, 2, 3, 4, 5].map((l) => ({ v: l, l: `${LEVEL_NAMES[l].icon} ${l}` }))} />
            </div>
            <button className="btn big" disabled={!valid.length || busy} onClick={run}>
              {busy ? 'Тіркелуде…' : `${valid.length} оқушыны тіркеу`}
            </button>
          </div>
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Алдын ала қарау ({rows.length})</h3>
            {rows.length === 0 && <p className="muted">Тізім бос.</p>}
            <div className="table-wrap">
              <table className="list">
                <thead>
                  <tr>
                    <th scope="col">Аты</th>
                    <th scope="col">Туған жылы</th>
                    <th scope="col">Ата-анасы</th>
                    <th scope="col">Күйі</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name || '—'}</td>
                      <td>{r.birthYear || '—'}</td>
                      <td>{r.parentName || '—'}</td>
                      <td>{r.error ? <span className="chip weak">{r.error}</span> : <span className="chip good">✓</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="notice row spread">
            <span>
              {done.length} оқушы тіркелді. Кіру карточкаларын басып шығарып, оқушылар мен ата-аналарға таратыңыз. Құпиясөздер тек осы жерде көрсетіледі.
            </span>
            <div className="row">
              <button className="btn" onClick={() => window.print()}>
                🖨 Карточкаларды басып шығару
              </button>
              <button className="btn secondary" onClick={() => setDone([])}>
                Жаңа тізім
              </button>
            </div>
          </div>
          <div className="login-cards print-cards">
            {done.map((c, i) => (
              <div key={i} className="login-card">
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: '2rem' }}>{c.avatar}</span>
                  <strong style={{ fontSize: '1.1rem' }}>{c.child}</strong>
                </div>
                <p className="small" style={{ margin: '6px 0 2px' }}>
                  Оқушының сурет-құпиясөзі (ретімен):
                </p>
                <div style={{ fontSize: '1.8rem', letterSpacing: '0.2em' }}>{c.picPass.join(' ')}</div>
                {c.parent && (
                  <p className="small" style={{ margin: '8px 0 0' }}>
                    Ата-ана: {c.parent.name}
                    <br />
                    Логин: <code>{c.parent.username}</code> · Құпиясөз: <code>{c.parent.password}</code>
                  </p>
                )}
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  qadamda.vercel.app
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
