import { Bar } from '../../components/ui';
import { WEEK_REWARD_STARS, weeklyChallenges } from '../../lib/challenges';
import { updateProgress } from '../../lib/db';
import { playCue } from '../../lib/media';
import type { Child, Progress } from '../../lib/types';

/** Апталық сын-тегеурін карточкасы: үшеуі орындалса — жүлде (жұлдыз + алғаш рет Бәйтерек) */
export function WeeklyCard({ child, progress }: { child: Child; progress: Progress }) {
  const w = weeklyChallenges(progress);
  const firstEver = !(progress.claimedWeeks ?? []).length;
  function claim() {
    if (!w.allDone || w.claimed) return;
    playCue('celebrate', child.a11y.sound);
    updateProgress(child.id, (p) => {
      p.claimedWeeks = [...(p.claimedWeeks ?? []), w.week];
      p.stars += WEEK_REWARD_STARS;
      if (!p.village.includes('tower')) p.village.push('tower');
    });
  }
  return (
    <div className="card stack weekly">
      <div className="row spread">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            Апталық сын-тегеурін
          </p>
          <h3 style={{ margin: 0 }}>{w.claimed ? 'Осы аптаның жүлдесі алынды! 🏆' : 'Осы аптаның 3 мақсаты'}</h3>
        </div>
        <span className="level-badge">{w.list.filter((c) => c.done).length} / 3</span>
      </div>
      <ul className="level-list">
        {w.list.map((c) => (
          <li key={c.id}>
            <div className="row spread small" style={{ marginBottom: 4 }}>
              <span>
                <span aria-hidden="true">{c.done ? '✅' : c.icon}</span> {c.title}
              </span>
              <strong>
                {c.cur} / {c.goal}
              </strong>
            </div>
            <Bar value={(100 * c.cur) / c.goal} label={`${c.title}: ${c.cur} / ${c.goal}`} />
          </li>
        ))}
      </ul>
      {!w.claimed && (
        <button className="btn" disabled={!w.allDone} onClick={claim} style={{ alignSelf: 'flex-start' }}>
          {w.allDone ? `🎁 Жүлдені алу: ⭐ ${WEEK_REWARD_STARS}${firstEver ? ' + Бәйтерек ауылыңа' : ''}` : `Жүлде: ⭐ ${WEEK_REWARD_STARS}${firstEver ? ' + Бәйтерек' : ''}`}
        </button>
      )}
    </div>
  );
}
