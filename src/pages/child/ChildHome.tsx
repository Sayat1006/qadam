import { Link } from 'react-router-dom';
import { EmptyState, kkDate, ProgressRing, Reveal, useTitle } from '../../components/kit';
import { Bar, Bota, Hero } from '../../components/ui';
import { getSubject, LEVEL_NAMES, subjects, upcoming } from '../../content';
import { summarize } from '../../lib/adaptive';
import { badges, levelProgress, streaks } from '../../lib/achievements';
import { today, updateProgress, useStore } from '../../lib/db';
import { assignmentStatus, topicTitle } from '../../lib/plans';
import type { MoodId } from '../../lib/types';
import { useChild } from './ChildShell';

export const MOODS: { id: MoodId; e: string; l: string }[] = [
  { id: 'great', e: '😄', l: 'Тамаша' },
  { id: 'good', e: '🙂', l: 'Жақсы' },
  { id: 'ok', e: '😐', l: 'Орташа' },
  { id: 'sad', e: '😢', l: 'Мұңды' },
  { id: 'angry', e: '😠', l: 'Ашулы' },
];

const WD = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'];


export function ChildHome() {
  useTitle('Шолу');
  const { child, progress } = useChild();
  const { db } = useStore();
  const d = today();
  const myTasks = (db.assignments ?? [])
    .filter((a) => a.childIds.includes(child.id))
    .map((a) => ({ a, st: assignmentStatus(a, progress) }))
    .filter((x) => !x.st.finished)
    .sort((x, y) => x.a.due.localeCompare(y.a.due));
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
    { done: practiced.has(first.id), label: `${first.title}: бір сабақ`, icon: first.emoji, to: `/child/lesson/${first.id}` },
    { done: practiced.has(second.id), label: `${second.title}: бір сабақ`, icon: second.emoji, to: `/child/lesson/${second.id}` },
    { done: gamesToday > 0, label: 'Бір ойын ойна', icon: '🎮', to: '/child/games' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  const st = streaks(progress);
  const starsLeft = progress.stars - progress.spentStars;

  // Апта
  const days = Array.from({ length: 7 }, (_, i) => {
    const x = new Date();
    x.setDate(x.getDate() - (6 - i));
    return today(x);
  });
  const weekMin = days.map((x) => Math.round((progress.seconds[x] ?? 0) / 60));
  const weekTasks = days.map((x) => progress.attempts.filter((a) => today(new Date(a.t)) === x).length);
  const maxMin = Math.max(5, ...weekMin);
  const activeCount = days.filter((_, i) => weekMin[i] > 0 || weekTasks[i] > 0).length;

  // Жалғастыру
  const last = progress.attempts[progress.attempts.length - 1];
  const lastSubject = last ? getSubject(last.subject) : undefined;
  const lastLp = last ? levelProgress(progress, last.subject) : undefined;

  // Ұсыныстар — нақты деректерден
  const recs: { icon: string; title: string; why: string; to: string; level: number }[] = [];
  subjects.forEach((s) => {
    const sum = summarize(progress.attempts, s.id, progress.levels[s.id] ?? 1);
    if (sum.weak.length) recs.push({ icon: s.emoji, title: `${s.title}: ${sum.weak[0]}`, why: 'Көбірек жаттығу керек тақырып', to: `/child/lesson/${s.id}`, level: sum.level });
  });
  counts
    .filter((c) => c.n === 0)
    .slice(0, 2)
    .forEach((c) => recs.push({ icon: c.s.emoji, title: c.s.title, why: 'Әлі байқап көрмеген пән', to: `/child/lesson/${c.s.id}`, level: progress.levels[c.s.id] ?? 1 }));
  if (recs.length < 3) {
    subjects
      .map((s) => ({ s, lp: levelProgress(progress, s.id) }))
      .filter((x) => x.lp.value >= 50 && x.lp.value < 100 && !x.lp.atMax)
      .forEach((x) => recs.push({ icon: x.s.emoji, title: x.s.title, why: `Келесі деңгейге ${100 - x.lp.value}% қалды`, to: `/child/lesson/${x.s.id}`, level: x.lp.level }));
  }

  const allBadges = badges(progress);
  const nextBadges = allBadges
    .filter((b) => !b.done)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);
  const unlocked = allBadges.filter((b) => b.done).length;

  function setMood(m: MoodId) {
    updateProgress(child.id, (p) => {
      p.moods = p.moods.filter((x) => x.date !== d);
      p.moods.push({ date: d, mood: m });
    });
  }

  const greeting = !mood
    ? `Мен — Ботамын. Бастамас бұрын айтшы, бүгін көңіл-күйің қалай?`
    : mood.mood === 'sad' || mood.mood === 'angry'
      ? `Түсіндім. Мұндай күн де болады. Қаласаң, алдымен «Тыныштық бұрышында» біраз демалайық.`
      : doneCount === 3
        ? `Бүгінгі үш қадамның бәрін жасадың! Қаласаң, тағы ойнауға немесе жаңа сабақ бастауға болады.`
        : `Бүгінгі мақсат — үш кішкентай қадам.${nextStep ? ` Келесісі: ${nextStep.label.toLowerCase()}.` : ''}`;

  return (
    <div className="stack dash">
      <Reveal>
        <p className="eyebrow" style={{ marginBottom: 2 }}>
          {kkDate()}
        </p>
        <h1 style={{ margin: 0 }}>Сәлем, {child.name}! Бүгін тағы бір қадам алға жылжимыз.</h1>
      </Reveal>

      {!mood && (
        <Reveal className="card">
          <Bota text={greeting} />
          <div className="mood-row" role="group" aria-label="Көңіл-күйді таңдау" style={{ marginTop: 16 }}>
            {MOODS.map((m) => (
              <button key={m.id} className="avatar-btn" onClick={() => setMood(m.id)}>
                <span className="a" aria-hidden="true">
                  {m.e}
                </span>
                {m.l}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {progress.attempts.length === 0 && !progress.placement && (
        <Reveal className="card row spread">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="eyebrow">Бастамас бұрын</p>
            <h2 style={{ margin: 0 }}>🧭 Деңгейіңді анықтайық</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Қысқа ойын-тест: сабақтар саған тым оңай да, тым қиын да болмайды.
            </p>
          </div>
          <div className="row">
            <Link to="/child/placement/math" className="btn">
              🔢 Математика
            </Link>
            <Link to="/child/placement/kazakh" className="btn secondary">
              🔤 Қазақ тілі
            </Link>
          </div>
        </Reveal>
      )}

      {myTasks.length > 0 && (
        <Reveal className="card stack" style={{ borderColor: 'var(--primary)' }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            Мұғалімнің тапсырмасы
          </p>
          {myTasks.map(({ a, st }) => {
            const s = getSubject(a.subject);
            return (
              <div key={a.id} className="row spread">
                <span className="row" style={{ gap: 12, flexWrap: 'nowrap', minWidth: 0, flex: 1 }}>
                  <span className="subject-chip sm" style={{ ['--subject' as string]: s?.color }} aria-hidden="true">
                    {s?.emoji}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block' }}>
                      {s?.title}: {topicTitle(a.subject, a.topic)}
                    </strong>
                    <Bar value={(100 * st.done) / a.count} label={`${st.done} / ${a.count} тапсырма`} />
                    <span className="muted small">
                      {st.done} / {a.count} тапсырма{st.overdue ? ' · мерзімі өтті' : ''}
                    </span>
                  </span>
                </span>
                <Link className="btn" to={`/child/lesson/${a.subject}${a.topic ? `?topic=${a.topic}` : ''}`}>
                  Орындау
                </Link>
              </div>
            );
          })}
        </Reveal>
      )}

      <div className="dash-top">
        <Hero aria-labelledby="goal-h" className="goal-hero">
          <div className="goal-grid">
            <ProgressRing value={doneCount} max={3} size={132} label={`Бүгінгі мақсат: ${doneCount} / 3 қадам орындалды`}>
              <strong className="ring-num">{doneCount}/3</strong>
              <span className="ring-sub">қадам</span>
            </ProgressRing>
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow">Бүгінгі мақсат</p>
              <h2 id="goal-h" style={{ margin: '0 0 6px' }}>
                {doneCount === 3 ? 'Мақсат орындалды!' : `Тағы ${3 - doneCount} қадам қалды`}
              </h2>
              {mood && <p style={{ margin: 0 }}>{greeting}</p>}
            </div>
          </div>
          <ol className="goal-steps">
            {steps.map((s, i) => (
              <li key={i} className={s.done ? 'done' : ''}>
                <span className="gs-icon" aria-hidden="true">
                  {s.done ? '✓' : s.icon}
                </span>
                <span className="gs-label">
                  {s.label}
                  {s.done && <span className="sr-only"> — орындалды</span>}
                </span>
                {!s.done && (
                  <Link className="btn" to={s.to}>
                    Бастау
                  </Link>
                )}
              </li>
            ))}
          </ol>
          {mood && (mood.mood === 'sad' || mood.mood === 'angry') && (
            <Link className="btn secondary" to="/child/calm" style={{ marginTop: 12 }}>
              🌿 Тыныштық бұрышы
            </Link>
          )}
        </Hero>

        <div className="dash-side">
          <Reveal className="card mini-stat">
            <span className="mini-icon" style={{ ['--c' as string]: '#FF8A4C' }} aria-hidden="true">
              🔥
            </span>
            <div>
              <span className="mini-v">{st.current} күн</span>
              <span className="mini-l">Қатарынан оқу{st.best > st.current ? ` · рекорд ${st.best}` : ''}</span>
            </div>
          </Reveal>
          <Reveal delay={60} className="card mini-stat">
            <span className="mini-icon" style={{ ['--c' as string]: '#FFCA70' }} aria-hidden="true">
              ⭐
            </span>
            <div>
              <span className="mini-v">{starsLeft}</span>
              <span className="mini-l">Жұлдыз · барлығы {progress.stars} жиналды</span>
            </div>
            <Link to="/child/village" className="btn secondary icon" aria-label="Жұлдызды ауылға жұмсау">
              ⛺
            </Link>
          </Reveal>
          <Reveal delay={120} className="card mini-stat">
            <span className="mini-icon" style={{ ['--c' as string]: '#9275FF' }} aria-hidden="true">
              🏅
            </span>
            <div>
              <span className="mini-v">
                {unlocked} / {allBadges.length}
              </span>
              <span className="mini-l">Ашылған белгі</span>
            </div>
            <Link to="/child/achievements" className="btn secondary icon" aria-label="Жетістіктерді көру">
              ➜
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'stretch' }}>
        <Reveal className="card continue-card">
          <p className="eyebrow">Жалғастыру</p>
          {last && lastSubject && lastLp ? (
            <>
              <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
                <span className="subject-chip" style={{ ['--subject' as string]: lastSubject.color }} aria-hidden="true">
                  {lastSubject.emoji}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{lastSubject.title}</h3>
                  <span className="muted small">
                    {LEVEL_NAMES[lastLp.level].icon} {lastLp.level}-деңгей · соңғы тақырып: {topicTitle(last.subject, last.topic)}
                  </span>
                </div>
              </div>
              <div>
                <div className="row spread small" style={{ marginBottom: 6 }}>
                  <span className="muted">Келесі деңгейге дейін</span>
                  <strong>{lastLp.atMax ? 'ең жоғары деңгей' : `${lastLp.value}%`}</strong>
                </div>
                <Bar value={lastLp.atMax ? 100 : lastLp.value} label={`${lastSubject.title}: келесі деңгейге ${lastLp.value}%`} />
              </div>
              <Link to={`/child/lesson/${last.subject}`} className="btn big" style={{ alignSelf: 'flex-start' }}>
                Жалғастыру <span className="arrow" aria-hidden="true">➜</span>
              </Link>
            </>
          ) : (
            <EmptyState
              icon="🚀"
              title="Алғашқы сабағыңды баста"
              text="Бір сабақ — бірнеше қысқа тапсырма. Қай пәннен бастағың келеді?"
              action={
                <Link to={`/child/lesson/${first.id}`} className="btn">
                  {first.emoji} {first.title}
                </Link>
              }
            />
          )}
        </Reveal>

        <Reveal delay={80} className="card">
          <div className="row spread">
            <div>
              <p className="eyebrow">Апта</p>
              <h3 style={{ margin: 0 }}>Оқу белсенділігі</h3>
            </div>
            <span className="level-badge">{activeCount} / 7 күн</span>
          </div>
          <div
            className="week"
            role="img"
            aria-label={days.map((x, i) => `${WD[new Date(x + 'T12:00').getDay()]}: ${weekMin[i]} мин, ${weekTasks[i]} тапсырма`).join('; ')}
            style={{ marginTop: 14 }}
          >
            {days.map((x, i) => (
              <div className="col" key={x}>
                <span>{weekMin[i] || ''}</span>
                <div className={`b ${x === d ? 'now' : ''}`} style={{ height: `${Math.max(3, (weekMin[i] / maxMin) * 100)}%` }} />
                <span>{WD[new Date(x + 'T12:00').getDay()]}</span>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ margin: '10px 0 0' }}>
            Бағандар — минут. Осы аптада {weekTasks.reduce((a, b) => a + b, 0)} тапсырма орындалды.
          </p>
        </Reveal>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'stretch' }}>
        <Reveal className="card">
          <div className="row spread" style={{ marginBottom: 12 }}>
            <div>
              <p className="eyebrow">Деңгейлер</p>
              <h3 style={{ margin: 0 }}>Пәндердегі орным</h3>
            </div>
            <Link to="/child/subjects" className="btn secondary">
              Барлық пән
            </Link>
          </div>
          <ul className="level-list">
            {subjects.map((s) => {
              const lp = levelProgress(progress, s.id);
              return (
                <li key={s.id}>
                  <Link to={`/child/subject/${s.id}`} className="level-row">
                    <span className="subject-chip sm" style={{ ['--subject' as string]: s.color }} aria-hidden="true">
                      {s.emoji}
                    </span>
                    <span className="lr-main">
                      <span className="row spread small">
                        <strong>{s.title}</strong>
                        <span className="muted">
                          {LEVEL_NAMES[lp.level].icon} {lp.level}-деңгей{lp.atMax ? '' : ` · ${lp.value}%`}
                        </span>
                      </span>
                      <Bar value={lp.atMax ? 100 : lp.value} label={`${s.title}: ${lp.level}-деңгей, келесісіне ${lp.value}%`} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={80} className="card">
          <p className="eyebrow">Саған ұсынамыз</p>
          <h3>Келесі не істеймін?</h3>
          {recs.length ? (
            <ul className="rec-list">
              {recs.slice(0, 4).map((r, i) => (
                <li key={i}>
                  <span className="subject-chip sm" aria-hidden="true">
                    {r.icon}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{r.title}</strong>
                    <span className="muted small">
                      {r.why} · {LEVEL_NAMES[r.level].icon} {r.level}-деңгей
                    </span>
                  </span>
                  <Link to={r.to} className="btn secondary">
                    Бастау
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="✨" title="Бәрі жақсы!" text="Қазір ерекше ұсыныс жоқ. Бүгінгі мақсатты орындап көр." />
          )}
        </Reveal>
      </div>

      <Reveal className="card">
        <div className="row spread" style={{ marginBottom: 12 }}>
          <div>
            <p className="eyebrow">Жетістіктер</p>
            <h3 style={{ margin: 0 }}>{nextBadges.length ? 'Келесі белгілер' : 'Барлық белгі ашылды!'}</h3>
          </div>
          <Link to="/child/achievements" className="btn secondary">
            Барлығы
          </Link>
        </div>
        <div className="grid cols-3">
          {nextBadges.map((b) => (
            <div key={b.id} className="badge-mini">
              <span className="badge3d sm locked" aria-hidden="true">
                <span>{b.icon}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block' }}>{b.title}</strong>
                <span className="muted small" style={{ display: 'block', marginBottom: 6 }}>
                  {b.desc}
                </span>
                <Bar value={b.progress * 100} label={`${b.title}: ${b.hint}`} />
                <span className="muted small">{b.hint}</span>
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export function SubjectsPage() {
  useTitle('Пәндер');
  const { child, progress } = useChild();
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Оқу</p>
        <h1 style={{ margin: 0 }}>Пәндер</h1>
      </div>
      <div className="grid cols-3">
        {subjects.map((s, i) => {
          const lp = levelProgress(progress, s.id);
          return (
            <Reveal key={s.id} delay={i * 60}>
              <Link to={`/child/subject/${s.id}`} className="card subject-card lift" style={{ ['--subject' as string]: s.color, height: '100%' }}>
                <span className="emoji" aria-hidden="true">
                  {s.emoji}
                </span>
                <strong style={{ fontSize: '1.15rem' }}>{s.title}</strong>
                <span className="muted small" style={{ flex: 1 }}>
                  {s.about}
                </span>
                <span className="row spread small">
                  <span className="level-badge">
                    {LEVEL_NAMES[lp.level].icon} {lp.level}-деңгей · {LEVEL_NAMES[lp.level].name}
                  </span>
                  {!lp.atMax && <span className="muted">{lp.value}%</span>}
                </span>
                <Bar value={lp.atMax ? 100 : lp.value} label={`${s.title}: келесі деңгейге ${lp.value}%`} />
                {child.settings.focusSubject === s.id && <span className="focus-tag">Мұғалім ұсынды</span>}
              </Link>
            </Reveal>
          );
        })}
      </div>
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
