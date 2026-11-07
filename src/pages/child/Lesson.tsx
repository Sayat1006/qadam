import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TaskView, type TaskResult } from '../../components/TaskView';
import { Confetti, ProgressRing, useTitle } from '../../components/kit';
import { Bar, Bota, Hero, Modal } from '../../components/ui';
import { levelProgress } from '../../lib/achievements';
import { topicLevel } from '../../lib/plans';
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
  const topicId = params.get('topic') ?? undefined;
  const level = topicId ? topicLevel(sid, topicId, current) : reqLevel && reqLevel <= current ? reqLevel : current;
  const [round, setRound] = useState(0);

  const items = useMemo(
    () => (subject ? buildLesson(sid, level, getDB().progress[child.id]?.attempts ?? [], child.settings.lessonSize, topicId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sid, level, round, topicId],
  );
  const [idx, setIdx] = useState(0);
  const [earned, setEarned] = useState(0);
  const [clean, setClean] = useState(0);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{ topic: string; firstTry: boolean; hints: number; ms: number; review: boolean }[]>([]);
  const [confirmExit, setConfirmExit] = useState(false);
  useTitle(subject ? `${subject.title} · сабақ` : 'Сабақ');

  if (!subject) return <Navigate to="/child" replace />;

  function onDone(r: TaskResult) {
    const item = items[idx];
    const stars = r.firstTry ? 2 : 1;
    const isLast = idx + 1 >= items.length;
    const nextResults = [...results, { topic: item.task.topic, firstTry: r.firstTry, hints: r.hints, ms: r.ms, review: item.review }];
    const perfect = isLast && nextResults.every((x) => x.firstTry);
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
        if (perfect) p.perfectLessons = (p.perfectLessons ?? 0) + 1;
        p.lastLesson = { subject: sid, level, t: Date.now(), score: nextResults.filter((x) => x.firstTry).length, total: nextResults.length };
        const cur = p.levels[sid] ?? 1;
        if (level === cur && decideLevel(p.attempts, sid, cur, subject!.levels.length) === 'up') {
          p.levels[sid] = cur + 1;
          p.levelHistory.push({ t: Date.now(), subject: sid, level: cur + 1, by: 'auto' });
          up = cur + 1;
        }
      }
    });
    setResults(nextResults);
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
    setResults([]);
  }

  if (finished) {
    const ln = levelUp ? LEVEL_NAMES[levelUp] : null;
    const total = results.length;
    const pct = total ? Math.round((100 * clean) / total) : 0;
    const withHelp = results.filter((x) => !x.firstTry).length;
    const timeSec = Math.round(results.reduce((a, x) => a + x.ms, 0) / 1000);
    const byTopic = new Map<string, { ok: number; n: number }>();
    results.forEach((x) => {
      const v = byTopic.get(x.topic) ?? { ok: 0, n: 0 };
      v.n++;
      if (x.firstTry) v.ok++;
      byTopic.set(x.topic, v);
    });
    const titleOf = (t: string) => subject.levels.flatMap((l) => l.topics).find((x) => x.id === t)?.title ?? t;
    const weakTopics = [...new Set([...byTopic.entries()].filter(([, v]) => v.ok < v.n).map(([t]) => titleOf(t)))];
    const lp = levelProgress(progress, sid);
    const perfect = total > 0 && clean === total;
    return (
      <div className="stack" style={{ maxWidth: 960, margin: '0 auto' }}>
        <Confetti run={!!levelUp || perfect} />
        <Hero glow="center" as="div" className="result-hero">
          <div className="result-grid">
            <ProgressRing value={clean} max={total} size={156} stroke={14} label={`Нәтиже: ${total} тапсырманың ${clean} тапсырмасы бірден дұрыс, ${pct}%`}>
              <strong className="ring-num">{pct}%</strong>
              <span className="ring-sub">бірден дұрыс</span>
            </ProgressRing>
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow">
                {subject.title} · {level}-деңгей
              </p>
              <h1 style={{ margin: '0 0 12px' }}>
                {levelUp ? `Жаңа деңгей: ${levelUp} · ${ln!.name} ${ln!.icon}` : perfect ? 'Қатесіз сабақ! 🌟' : 'Сабақ аяқталды!'}
              </h1>
              <Bota
                text={
                  levelUp
                    ? `${child.name}, сен «${subject.title}» пәнінде келесі деңгейге көтерілдің! Бұл — сенің еңбегің.`
                    : perfect
                      ? `Керемет, ${child.name}! Барлық тапсырманы бірінші әрекеттен таптың.`
                      : `Жарайсың, ${child.name}! Барлық тапсырманы соңына дейін орындадың — бұл табандылық.`
                }
              />
            </div>
          </div>
        </Hero>

        <div className="grid cols-4">
          <div className="card stat">
            <span className="v" style={{ color: 'var(--ok)' }}>
              {clean}
            </span>
            <span className="l">Бірден дұрыс</span>
          </div>
          <div className="card stat">
            <span className="v" style={{ color: 'var(--accent)' }}>
              {withHelp}
            </span>
            <span className="l">Кеңеспен немесе қайта әрекетпен</span>
          </div>
          <div className="card stat">
            <span className="v">{timeSec >= 60 ? `${Math.floor(timeSec / 60)} мин ${timeSec % 60} с` : `${timeSec} с`}</span>
            <span className="l">Жұмсалған уақыт</span>
          </div>
          <div className="card stat">
            <span className="v">⭐ +{earned}</span>
            <span className="l">Жиналған жұлдыз</span>
          </div>
        </div>

        <div className="grid cols-2" style={{ alignItems: 'stretch' }}>
          <div className="card">
            <p className="eyebrow">Тақырыптар</p>
            <h3>Қалай орындадың</h3>
            <ul className="level-list">
              {[...byTopic.entries()].map(([t, v]) => (
                <li key={t}>
                  <div className="row spread small" style={{ marginBottom: 6 }}>
                    <strong>{titleOf(t)}</strong>
                    <span className="muted">
                      {v.ok} / {v.n} бірден
                    </span>
                  </div>
                  <Bar value={(100 * v.ok) / v.n} label={`${titleOf(t)}: ${v.ok} / ${v.n}`} />
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <p className="eyebrow">Келесі қадам</p>
            <h3>Не істейміз?</h3>
            <ul className="check-list">
              {weakTopics.length > 0 ? <li>Тағы жаттығу керек: {weakTopics.join(', ')}</li> : <li>Барлық тақырып жақсы орындалды</li>}
              {!lp.atMax ? <li>Келесі деңгейге дейін: {lp.value}%</li> : <li>Сен бұл пәннің ең жоғары деңгейіндесің</li>}
              <li>Демалғың келсе — ойын ойна немесе ауылыңды безендір</li>
            </ul>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn big" onClick={again}>
                Тағы бір сабақ
              </button>
              <Link className="btn big secondary" to="/child/games">
                🎮 Ойын
              </Link>
              <Link className="btn big secondary" to="/child">
                Шолуға
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx];
  if (!item) return null;
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="lesson-top">
        <button className="btn secondary icon" onClick={() => (idx > 0 ? setConfirmExit(true) : navigate(`/child/subject/${sid}`))} aria-label="Сабақтан шығу">
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
      <div className="task-swap" key={`${round}-${idx}`}>
        <TaskView task={item.task} sound={child.a11y.sound} autoRead={child.a11y.autoRead} lang={subject.speechLang} onDone={onDone} />
      </div>
      {confirmExit && (
        <Modal title="Сабақтан шығасың ба?" onClose={() => setConfirmExit(false)}>
          <p>Орындалған {idx} тапсырма сақталды. Сабақты кейін жаңадан бастауға болады.</p>
          <div className="row">
            <button className="btn" onClick={() => setConfirmExit(false)}>
              Жалғастыру
            </button>
            <button className="btn secondary" onClick={() => navigate(`/child/subject/${sid}`)}>
              Шығу
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
