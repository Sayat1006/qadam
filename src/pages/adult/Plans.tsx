/* Мұғалімнің тапсырмалары, ЖДБ мақсаттары және басып шығаруға арналған есеп */
import { useMemo, useState, type FormEvent } from 'react';
import { kkDate } from '../../components/kit';
import { Bar } from '../../components/ui';
import { getSubject, LEVEL_NAMES, subjects } from '../../content';
import { summarize } from '../../lib/adaptive';
import { addAssignment, addGoal, removeAssignment, removeGoal, today, useStore } from '../../lib/db';
import { assignmentStatus, goalStatus, topicTitle } from '../../lib/plans';
import type { Adult, Child } from '../../lib/types';

function topicsOf(subject: string) {
  const seen = new Set<string>();
  const out: { id: string; title: string; level: number }[] = [];
  getSubject(subject)?.levels.forEach((l) =>
    l.topics.forEach((t) => {
      if (seen.has(t.id)) return;
      seen.add(t.id);
      out.push({ id: t.id, title: t.title, level: l.level });
    }),
  );
  return out;
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return today(d);
}

/* ---------------- T12: тапсырмалар ---------------- */

export function AssignmentsPanel({ teacher, students }: { teacher: Adult; students: Child[] }) {
  const { db } = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [subject, setSubject] = useState(subjects[0].id);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [due, setDue] = useState(inDays(7));
  const [msg, setMsg] = useState('');
  const mine = (db.assignments ?? []).filter((a) => a.authorId === teacher.id).sort((a, b) => b.createdAt - a.createdAt);
  const topics = useMemo(() => topicsOf(subject), [subject]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!picked.length) return setMsg('Кемінде бір оқушыны таңдаңыз.');
    addAssignment({ authorId: teacher.id, childIds: picked, subject, topic: topic || null, count, due });
    setMsg(`Тапсырма ${picked.length} оқушыға берілді.`);
    setPicked([]);
  }

  return (
    <section className="grid cols-2" style={{ alignItems: 'start' }} aria-labelledby="as-h">
      <form className="card stack" onSubmit={submit}>
        <h2 id="as-h" style={{ margin: 0 }}>
          Жаңа тапсырма
        </h2>
        <fieldset className="card soft" style={{ padding: 12 }}>
          <legend style={{ fontWeight: 700 }}>Оқушылар</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={picked.length === students.length && students.length > 0}
              onChange={(e) => setPicked(e.target.checked ? students.map((s) => s.id) : [])}
            />
            Барлығы
          </label>
          {students.map((s) => (
            <label key={s.id} className="check">
              <input type="checkbox" checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
              {s.avatar} {s.name}
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>Пән</span>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic('');
            }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Тақырып</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Кез келген (баланың деңгейі бойынша)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.level}-деңгей · {t.title}
              </option>
            ))}
          </select>
        </label>
        <div className="grid cols-2" style={{ gap: 12 }}>
          <label className="field">
            <span>Тапсырма саны</span>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Мерзімі</span>
            <input type="date" value={due} min={today()} onChange={(e) => setDue(e.target.value)} required />
          </label>
        </div>
        {msg && (
          <p className="notice small" role="status">
            {msg}
          </p>
        )}
        <button className="btn">Тапсырма беру</button>
      </form>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Берілген тапсырмалар</h2>
        {mine.length === 0 && <p className="muted">Әзірге тапсырма жоқ.</p>}
        {mine.map((a) => {
          const s = getSubject(a.subject);
          return (
            <div key={a.id} className="card soft stack" style={{ padding: 14 }}>
              <div className="row spread">
                <strong>
                  {s?.emoji} {s?.title}: {topicTitle(a.subject, a.topic)}
                </strong>
                <button className="btn ghost" onClick={() => removeAssignment(a.id)} aria-label="Тапсырманы өшіру">
                  🗑
                </button>
              </div>
              <span className="muted small">
                {a.count} тапсырма · мерзімі {kkDate(new Date(a.due + 'T12:00'), false)}
              </span>
              <div className="chips">
                {a.childIds.map((id) => {
                  const c = db.children.find((x) => x.id === id);
                  if (!c) return null;
                  const st = assignmentStatus(a, db.progress[id]);
                  return (
                    <span key={id} className={`chip ${st.finished ? 'good' : st.overdue ? 'weak' : ''}`}>
                      {c.name}: {st.finished ? '✓ орындады' : `${st.done}/${a.count}${st.overdue ? ' · мерзімі өтті' : ''}`}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- T13: ЖДБ мақсаттары ---------------- */

export function GoalsTab({ child, viewer }: { child: Child; viewer: Adult }) {
  const { db } = useStore();
  const p = db.progress[child.id];
  const goals = (db.goals ?? []).filter((g) => g.childId === child.id);
  const tasks = (db.assignments ?? []).filter((a) => a.childIds.includes(child.id));
  const canEdit = viewer.role !== 'parent';
  const [subject, setSubject] = useState(subjects[0].id);
  const topics = useMemo(() => topicsOf(subject), [subject]);
  const [topic, setTopic] = useState(topics[0]?.id ?? '');
  const [target, setTarget] = useState(80);
  const [due, setDue] = useState(inDays(30));

  return (
    <div className="stack">
      <div className="card stack">
        <h3 style={{ margin: 0 }}>Жеке дамыту мақсаттары (ЖДБ)</h3>
        <p className="muted small" style={{ margin: 0 }}>
          Мақсат орындалды деп саналады: тақырып бойынша соңғы 10 тапсырманың (кемінде 8) берілген пайызы бірінші реттен дұрыс болса.
        </p>
        {goals.length === 0 && <p className="muted">Әзірге мақсат қойылмаған.</p>}
        {goals.map((g) => {
          const st = goalStatus(g, p);
          const s = getSubject(g.subject);
          return (
            <div key={g.id} className="card soft stack" style={{ padding: 14 }}>
              <div className="row spread">
                <strong>
                  {s?.emoji} {s?.title}: {topicTitle(g.subject, g.topic)} — {g.targetPct}%
                </strong>
                <span className={`chip ${st.achieved ? 'good' : st.overdue ? 'weak' : ''}`}>
                  {st.achieved ? '✓ Орындалды' : st.overdue ? 'Мерзімі өтті' : `мерзімі ${kkDate(new Date(g.due + 'T12:00'), false)}`}
                </span>
              </div>
              <div>
                <div className="row spread small" style={{ marginBottom: 4 }}>
                  <span className="muted">Соңғы {st.n} тапсырма</span>
                  <strong>
                    {st.pct}% / {g.targetPct}%
                  </strong>
                </div>
                <Bar value={Math.min(100, (100 * st.pct) / g.targetPct)} label={`${st.pct}% / ${g.targetPct}%`} />
              </div>
              {canEdit && (
                <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => removeGoal(g.id)}>
                  Мақсатты өшіру
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!topic) return;
            addGoal({ authorId: viewer.id, childId: child.id, subject, topic, targetPct: target, due });
          }}
        >
          <h3 style={{ margin: 0 }}>Жаңа мақсат</h3>
          <div className="grid cols-2" style={{ gap: 12 }}>
            <label className="field">
              <span>Пән</span>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setTopic(topicsOf(e.target.value)[0]?.id ?? '');
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Тақырып</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.level}-деңгей · {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Мақсатты дәлдік</span>
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                {[60, 70, 80, 90].map((n) => (
                  <option key={n} value={n}>
                    {n}%
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Мерзімі</span>
              <input type="date" value={due} min={today()} onChange={(e) => setDue(e.target.value)} required />
            </label>
          </div>
          <button className="btn" style={{ alignSelf: 'flex-start' }}>
            Мақсат қою
          </button>
        </form>
      )}

      <div className="card stack">
        <h3 style={{ margin: 0 }}>Мұғалімнің тапсырмалары</h3>
        {tasks.length === 0 && <p className="muted">Тапсырма берілмеген.</p>}
        {tasks.map((a) => {
          const st = assignmentStatus(a, p);
          const s = getSubject(a.subject);
          return (
            <div key={a.id} className="row spread">
              <span>
                {s?.emoji} {s?.title}: {topicTitle(a.subject, a.topic)} · {a.count} тапсырма
              </span>
              <span className={`chip ${st.finished ? 'good' : st.overdue ? 'weak' : ''}`}>{st.finished ? '✓ орындалды' : `${st.done}/${a.count}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- T14: басып шығаруға арналған есеп ---------------- */

export function PrintReport({ child }: { child: Child }) {
  const { db } = useStore();
  const p = db.progress[child.id];
  if (!p) return null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return today(d);
  });
  const weekMin = Math.round(days.reduce((a, d) => a + (p.seconds[d] ?? 0), 0) / 60);
  const weekAtt = p.attempts.filter((a) => days.includes(today(new Date(a.t))));
  const acc = weekAtt.length ? Math.round((100 * weekAtt.filter((a) => a.firstTry).length) / weekAtt.length) : null;
  const goals = (db.goals ?? []).filter((g) => g.childId === child.id);
  return (
    <section className="print-only" aria-hidden="true">
      <h1>QADAM · {child.name} — оқу есебі</h1>
      <p>
        Күні: {kkDate(new Date(), false)} · Жасы: {new Date().getFullYear() - child.birthYear} · Апталық оқу уақыты: {weekMin} мин · Аптадағы тапсырма: {weekAtt.length}
        {acc !== null ? ` · бірден дұрыс: ${acc}%` : ''}
      </p>
      <table>
        <thead>
          <tr>
            <th>Пән</th>
            <th>Деңгей</th>
            <th>Дәлдік (соңғы 20)</th>
            <th>Жақсы меңгерген</th>
            <th>Жаттығу керек</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const sum = summarize(p.attempts, s.id, p.levels[s.id] ?? 1);
            return (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>
                  {sum.level} · {LEVEL_NAMES[sum.level]?.name}
                </td>
                <td>{sum.recentAccuracy === null ? '—' : sum.recentAccuracy + '%'}</td>
                <td>{sum.strong.join(', ') || '—'}</td>
                <td>{sum.weak.join(', ') || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {goals.length > 0 && (
        <>
          <h2>ЖДБ мақсаттары</h2>
          <ul>
            {goals.map((g) => {
              const st = goalStatus(g, p);
              return (
                <li key={g.id}>
                  {getSubject(g.subject)?.title}: {topicTitle(g.subject, g.topic)} — мақсат {g.targetPct}%, қазір {st.pct}% {st.achieved ? '(орындалды)' : ''}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="print-foot">qadamda.vercel.app</p>
    </section>
  );
}
