import { kkDate, Reveal, useTitle } from '../../components/kit';
import { Bar, Hero } from '../../components/ui';
import { LEVEL_NAMES, subjects } from '../../content';
import { badges, streaks } from '../../lib/achievements';
import { useChild } from './ChildShell';

export function Achievements() {
  useTitle('Жетістіктер');
  const { progress } = useChild();
  const list = badges(progress);
  const st = streaks(progress);
  const unlocked = list.filter((b) => b.done).length;
  const lessons = Object.values(progress.lessonsDone).reduce((a, b) => a + b, 0);
  const history = [...progress.levelHistory].reverse().slice(0, 6);

  return (
    <div className="stack">
      <Hero aria-labelledby="ach-h">
        <p className="eyebrow">Жетістіктер</p>
        <h1 id="ach-h" style={{ margin: '0 0 16px' }}>
          {unlocked ? `${unlocked} белгі ашылды!` : 'Алғашқы белгің жақын'}
        </h1>
        <div className="hero-stats">
          <div>
            <span className="hs-v">⭐ {progress.stars}</span>
            <span className="hs-l">жиналған жұлдыз</span>
          </div>
          <div>
            <span className="hs-v">🔥 {st.current}</span>
            <span className="hs-l">күн қатарынан · рекорд {st.best}</span>
          </div>
          <div>
            <span className="hs-v">📚 {lessons}</span>
            <span className="hs-l">аяқталған сабақ</span>
          </div>
          <div>
            <span className="hs-v">✅ {progress.attempts.length}</span>
            <span className="hs-l">орындалған тапсырма</span>
          </div>
        </div>
      </Hero>

      <section aria-labelledby="badges-h">
        <h2 id="badges-h">Белгілер</h2>
        <div className="grid cols-4">
          {list.map((b, i) => (
            <Reveal key={b.id} delay={(i % 4) * 60} className={`card badge-card ${b.done ? 'done' : ''}`}>
              <span className={`badge3d ${b.done ? '' : 'locked'}`} aria-hidden="true">
                <span>{b.icon}</span>
              </span>
              <strong>{b.title}</strong>
              <span className="muted small">{b.desc}</span>
              {!b.done && <Bar value={b.progress * 100} label={`${b.title}: ${b.hint}`} />}
              <span className={`small ${b.done ? 'badge-ok' : 'muted'}`}>{b.done ? '✓ Ашылды' : b.hint}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="lvl-h">
        <h2 id="lvl-h">Деңгей тарихы</h2>
        {history.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Әзірге деңгей өзгерген жоқ. Сабақтарды қатесіз орындасаң, жаңа деңгей ашылады.
          </p>
        ) : (
          <ul className="rec-list">
            {history.map((h, i) => {
              const s = subjects.find((x) => x.id === h.subject);
              return (
                <li key={i}>
                  <span className="subject-chip sm" aria-hidden="true">
                    {LEVEL_NAMES[h.level]?.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block' }}>
                      {s?.title}: {h.level}-деңгей · {LEVEL_NAMES[h.level]?.name}
                    </strong>
                    <span className="muted small">
                      {kkDate(new Date(h.t), false)} · {h.by === 'auto' ? 'өз еңбегіңмен' : 'мұғалім белгіледі'}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
