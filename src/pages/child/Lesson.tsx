import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TaskView, type TaskResult } from '../../components/TaskView';
import { Bota } from '../../components/ui';
import { getSubject, LEVEL_NAMES } from '../../content';
import { buildLesson, decideLevel } from '../../lib/adaptive';
import { getDB, updateProgress } from '../../lib/db';
import { playCue } from '../../lib/media';
import { useChild } from './ChildShell';

const LESSON_BONUS = 3;

export function Lesson() {
  const { sid = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { child, progress } = useChild();
  const subject = getSubject(sid);
  const current = progress.levels[sid] ?? 1;
  const reqLevel = Number(params.get('level'));
  const level = reqLevel && reqLevel <= current ? reqLevel : current;
  const [round, setRound] = useState(0);

  const items = useMemo(
    () => (subject ? buildLesson(sid, level, getDB().progress[child.id]?.attempts ?? [], child.settings.lessonSize) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sid, level, round],
  );
  const [idx, setIdx] = useState(0);
  const [earned, setEarned] = useState(0);
  const [clean, setClean] = useState(0);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  if (!subject) return <Navigate to="/child" replace />;

  function onDone(r: TaskResult) {
    const item = items[idx];
    const stars = r.firstTry ? 2 : 1;
    const isLast = idx + 1 >= items.length;
    let up: number | null = null;
    updateProgress(child.id, (p) => {
      p.attempts.push({
        t: Date.now(),
        subject: sid,
        level: item.level,
        topic: item.task.topic,
        correct: r.correct,
        firstTry: r.firstTry,
        hints: r.hints,
        ms: r.ms,
      });
      p.stars += stars + (isLast ? LESSON_BONUS : 0);
      if (isLast) {
        p.lessonsDone[sid] = (p.lessonsDone[sid] ?? 0) + 1;
        const cur = p.levels[sid] ?? 1;
        if (level === cur && decideLevel(p.attempts, sid, cur, subject!.levels.length) === 'up') {
          p.levels[sid] = cur + 1;
          p.levelHistory.push({ t: Date.now(), subject: sid, level: cur + 1, by: 'auto' });
          up = cur + 1;
        }
      }
    });
    setEarned((e) => e + stars + (isLast ? LESSON_BONUS : 0));
    if (r.firstTry) setClean((c) => c + 1);
    if (isLast) {
      setLevelUp(up);
      setFinished(true);
      playCue('celebrate', child.a11y.sound);
    } else setIdx(idx + 1);
  }

  function again() {
    setRound((r) => r + 1);
    setIdx(0);
    setEarned(0);
    setClean(0);
    setLevelUp(null);
    setFinished(false);
  }

  if (finished) {
    const ln = levelUp ? LEVEL_NAMES[levelUp] : null;
    return (
      <div className="card stack center" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: '4rem' }} aria-hidden="true">
          {levelUp ? ln!.icon : '🏆'}
        </div>
        <h1>{levelUp ? `Жаңа деңгей: ${levelUp} · ${ln!.name}!` : 'Сабақ аяқталды!'}</h1>
        <Bota
          text={
            levelUp
              ? `${child.name}, сен «${subject.title}» пәнінде келесі деңгейге көтерілдің! Бұл — сенің еңбегің.`
              : `Жарайсың, ${child.name}! ${items.length} тапсырманың ішінде ${clean} тапсырманы бірден таптың. Сен ${earned} жұлдыз жинадың!`
          }
        />
        <p style={{ fontSize: '1.6rem', fontWeight: 800 }} aria-label={`${earned} жұлдыз`}>
          ⭐ +{earned}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn big" onClick={again}>
            Тағы бір сабақ
          </button>
          <Link className="btn big secondary" to="/child/games">
            <span aria-hidden="true">🎮</span> Ойын
          </Link>
          <Link className="btn big secondary" to="/child/village">
            <span aria-hidden="true">⛺</span> Ауылыма
          </Link>
        </div>
      </div>
    );
  }

  const item = items[idx];
  if (!item) return null;
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="lesson-top">
        <button className="btn secondary" onClick={() => navigate(`/child/subject/${sid}`)} aria-label="Сабақтан шығу">
          ✕
        </button>
        <div className="progress" role="progressbar" aria-label="Сабақ барысы" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={idx}>
          <span style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <span className="level-badge">
          {idx + 1}/{items.length}
        </span>
      </div>
      <p className="muted small" style={{ fontWeight: 700 }}>
        {subject.emoji} {subject.title} · {item.level}-деңгей {item.review && '· 🔁 Қайталау'}
      </p>
      <TaskView key={`${round}-${idx}`} task={item.task} sound={child.a11y.sound} autoRead={child.a11y.autoRead} onDone={onDone} />
    </div>
  );
}
