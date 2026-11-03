import { Link } from 'react-router-dom';
import { Bota } from '../../components/ui';
import { LEVEL_NAMES, subjects, upcoming } from '../../content';
import { today, updateProgress } from '../../lib/db';
import type { MoodId } from '../../lib/types';
import { useChild } from './ChildShell';

export const MOODS: { id: MoodId; e: string; l: string }[] = [
  { id: 'great', e: '😄', l: 'Тамаша' },
  { id: 'good', e: '🙂', l: 'Жақсы' },
  { id: 'ok', e: '😐', l: 'Орташа' },
  { id: 'sad', e: '😢', l: 'Мұңды' },
  { id: 'angry', e: '😠', l: 'Ашулы' },
];

export function ChildHome() {
  const { child, progress } = useChild();
  const d = today();
  const mood = progress.moods.find((m) => m.date === d);
  const todayAttempts = progress.attempts.filter((a) => today(new Date(a.t)) === d);
  const practiced = new Set(todayAttempts.map((a) => a.subject));
  const gamesToday = progress.gamesByDay[d] ?? 0;

  // Бүгінгі 3 қадам: мұғалім ұсынған пән → ең аз жаттыққан пән → ойын
  const focus = child.settings.focusSubject && subjects.find((s) => s.id === child.settings.focusSubject);
  const counts = subjects.map((s) => ({ s, n: progress.attempts.filter((a) => a.subject === s.id).length }));
  counts.sort((a, b) => a.n - b.n);
  const first = focus || counts[0].s;
  const second = counts.find((c) => c.s.id !== first.id)!.s;
  const steps = [
    { done: practiced.has(first.id), label: `${first.emoji} ${first.title}: бір сабақ`, to: `/child/lesson/${first.id}` },
    { done: practiced.has(second.id), label: `${second.emoji} ${second.title}: бір сабақ`, to: `/child/lesson/${second.id}` },
    { done: gamesToday > 0, label: '🎮 Бір ойын ойна', to: '/child/games' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  function setMood(m: MoodId) {
    updateProgress(child.id, (p) => {
      p.moods = p.moods.filter((x) => x.date !== d);
      p.moods.push({ date: d, mood: m });
    });
  }

  const greeting =
    !mood
      ? `Сәлем, ${child.name}! Мен — Ботамын. Бүгін көңіл-күйің қалай?`
      : mood.mood === 'sad' || mood.mood === 'angry'
        ? `Түсіндім, ${child.name}. Мұндай күн де болады. Қаласаң, алдымен «Тыныштық бұрышында» біраз демалайық.`
        : doneCount === 3
          ? `Жарайсың, ${child.name}! Бүгінгі үш қадамның бәрін жасадың! Қаласаң, тағы ойнауға болады.`
          : `Керемет! Бүгінгі жоспарымыз — үш кішкентай қадам. Бастайық па?`;

  return (
    <div className="stack">
      <Bota text={greeting} />

      {!mood && (
        <div className="card">
          <h2 id="mood-h">Көңіл-күйің қандай?</h2>
          <div className="row" role="group" aria-labelledby="mood-h">
            {MOODS.map((m) => (
              <button key={m.id} className="avatar-btn" onClick={() => setMood(m.id)}>
                <span className="a" aria-hidden="true">
                  {m.e}
                </span>
                {m.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {mood && (mood.mood === 'sad' || mood.mood === 'angry') && (
        <Link className="btn big secondary" to="/child/calm">
          <span aria-hidden="true">🌿</span> Тыныштық бұрышына бару
        </Link>
      )}

      <section className="card" aria-labelledby="plan-h">
        <div className="row spread">
          <h2 id="plan-h" style={{ margin: 0 }}>
            Бүгінгі 3 қадам
          </h2>
          <span className="level-badge">
            {doneCount} / 3
          </span>
        </div>
        <ol className="path" style={{ listStyle: 'none', padding: 0, marginTop: 14 }}>
          {steps.map((s, i) => (
            <li key={i} className={`path-step ${s.done ? 'done' : i === steps.findIndex((x) => !x.done) ? 'current' : ''}`}>
              <span className="node" aria-hidden="true">
                {s.done ? '✅' : i + 1}
              </span>
              <div className="row spread">
                <span style={{ fontWeight: 800 }}>
                  {s.label}
                  {s.done && <span className="sr-only"> — орындалды</span>}
                </span>
                {!s.done && (
                  <Link className="btn" to={s.to}>
                    Бастау
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="subj-h">
        <h2 id="subj-h">Пәндер</h2>
        <div className="grid cols-3">
          {subjects.map((s) => {
            const lvl = progress.levels[s.id] ?? 1;
            const ln = LEVEL_NAMES[lvl];
            return (
              <Link key={s.id} to={`/child/subject/${s.id}`} className="card subject-card" style={{ ['--subject' as string]: s.color }}>
                <span className="emoji" aria-hidden="true">
                  {s.emoji}
                </span>
                <strong style={{ fontSize: '1.2rem' }}>{s.title}</strong>
                <span className="level-badge" style={{ alignSelf: 'flex-start' }}>
                  <span aria-hidden="true">{ln.icon}</span> {lvl}-деңгей · {ln.name}
                </span>
                {child.settings.focusSubject === s.id && <span className="focus-tag">Мұғалім ұсынды</span>}
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="soon-h" className="decor">
        <h2 id="soon-h">Жақында қосылады</h2>
        <div className="chips">
          {upcoming.map((u) => (
            <span key={u.id} className="chip">
              <span aria-hidden="true">{u.emoji}</span> {u.title}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
