/* T8: мазмұн каталогы — маман әр тақырыптың мысалдарын көріп, қатесін белгілейді */
import { useMemo, useState } from 'react';
import { kkDate } from '../../components/kit';
import { getSubject, LEVEL_NAMES, subjects } from '../../content';
import type { Task } from '../../content/types';
import { addFlag, resolveFlag, useStore } from '../../lib/db';
import type { Adult } from '../../lib/types';

function describe(t: Task) {
  const v = t.visual;
  const vis = !v ? '' : v.type === 'text' || v.type === 'equation' || v.type === 'emoji' ? ` [${v.value}]` : v.type === 'count' ? ` [${v.emoji}×${v.n}]` : ` [${v.type}]`;
  let ans = '';
  if (t.kind === 'choice') ans = `Нұсқалар: ${t.options.map((o) => (o.id === t.answer ? `✔${o.label}` : o.label)).join(' · ')}`;
  if (t.kind === 'numpad') ans = `Жауабы: ${t.answer}${t.unit ? ' ' + t.unit : ''}`;
  if (t.kind === 'order') ans = `Дұрыс рет: ${t.items.map((i) => i.label).join(' → ')}`;
  if (t.kind === 'sort') ans = t.groups.map((g) => `${g.label}: ${t.items.filter((i) => i.group === g.id).map((i) => i.label).join(', ')}`).join(' | ');
  if (t.kind === 'match') ans = t.pairs.map((p) => `${p[0].label} — ${p[1].label}`).join('; ');
  return { text: t.prompt + vis, ans, hints: t.hints };
}

export function ContentCatalog({ viewer }: { viewer: Adult }) {
  const { db } = useStore();
  const [sid, setSid] = useState(subjects[0].id);
  const [round, setRound] = useState(0);
  const [flagFor, setFlagFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const subject = getSubject(sid)!;
  const flags = (db.contentFlags ?? []).slice().sort((a, b) => b.t - a.t);
  const samples = useMemo(
    () =>
      subject.levels.map((l) => ({
        level: l,
        topics: l.topics.map((t) => ({ topic: t, items: Array.from({ length: 5 }, () => describe(t.gen())) })),
      })),
    [subject, round],
  );

  return (
    <div className="stack">
      <div className="notice small">
        Мұғалім немесе әдіскер әр тақырыптан кездейсоқ 5 мысалды тексереді: грамматика, деңгейге сәйкестігі, суреттің мағынасы. Қате тапсаңыз — «Белгілеу» батырмасын басып, түзетуді жазыңыз.
      </div>
      <div className="row">
        <label className="field" style={{ minWidth: 220 }}>
          <span>Пән</span>
          <select value={sid} onChange={(e) => setSid(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <button className="btn secondary" style={{ alignSelf: 'flex-end' }} onClick={() => setRound((r) => r + 1)}>
          🔄 Жаңа мысалдар
        </button>
      </div>

      {samples.map(({ level, topics }) => (
        <section key={level.level} className="card stack" aria-labelledby={`lv-${level.level}`}>
          <h3 id={`lv-${level.level}`} style={{ margin: 0 }}>
            {LEVEL_NAMES[level.level]?.icon} {level.level}-деңгей · {level.title}
          </h3>
          <p className="muted small" style={{ margin: 0 }}>
            {level.goal}
          </p>
          {topics.map(({ topic, items }) => (
            <details key={topic.id} className="card soft" style={{ padding: 12 }}>
              <summary style={{ fontWeight: 700, cursor: 'pointer' }}>
                {topic.title} <span className="muted small">({topic.id})</span>
              </summary>
              <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
                {items.map((it, i) => {
                  const key = `${level.level}-${topic.id}-${i}`;
                  return (
                    <li key={i} style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 600 }}>{it.text}</div>
                      <div className="small">{it.ans}</div>
                      <div className="muted small">Кеңестер: {it.hints.join(' / ')}</div>
                      {flagFor === key ? (
                        <form
                          className="row"
                          style={{ marginTop: 6 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!note.trim()) return;
                            addFlag({ authorId: viewer.id, subject: sid, topic: topic.id, sample: it.text, note: note.trim() });
                            setFlagFor(null);
                            setNote('');
                          }}
                        >
                          <label className="field" style={{ flex: 1, minWidth: 200 }}>
                            <span className="sr-only">Ескерту</span>
                            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Не дұрыс емес? Қалай түзету керек?" autoFocus />
                          </label>
                          <button className="btn">Сақтау</button>
                          <button type="button" className="btn ghost" onClick={() => setFlagFor(null)}>
                            Бас тарту
                          </button>
                        </form>
                      ) : (
                        <button className="btn ghost" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => setFlagFor(key)}>
                          🚩 Белгілеу
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </section>
      ))}

      <section className="card stack" aria-labelledby="flags-h">
        <h3 id="flags-h" style={{ margin: 0 }}>
          Белгіленген ескертулер ({flags.filter((f) => !f.resolved).length})
        </h3>
        {flags.length === 0 && <p className="muted">Әзірге ескерту жоқ.</p>}
        {flags.map((f) => {
          const a = db.adults.find((x) => x.id === f.authorId);
          return (
            <div key={f.id} className="card soft" style={{ padding: 12, opacity: f.resolved ? 0.6 : 1 }}>
              <div className="small muted">
                {getSubject(f.subject)?.title} · {f.topic} · {a?.name ?? '—'} · {kkDate(new Date(f.t), false)}
              </div>
              <div style={{ fontWeight: 600 }}>{f.sample}</div>
              <div>💬 {f.note}</div>
              {viewer.role === 'admin' && (
                <button className="btn ghost" onClick={() => resolveFlag(f.id)}>
                  {f.resolved ? 'Қайта ашу' : '✓ Түзетілді деп белгілеу'}
                </button>
              )}
            </div>
          );
        })}
        {viewer.role === 'admin' && flags.length > 0 && (
          <p className="muted small" style={{ margin: 0 }}>
            Ескертулерді әзірлеушіге беру үшін «Сақтық көшірме» бөлімінен JSON жүктеп алыңыз — ескертулер файлда бар.
          </p>
        )}
      </section>
    </div>
  );
}
