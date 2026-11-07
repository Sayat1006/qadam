/*
 * Бастапқы диагностика: әр деңгейден 2 тапсырма. Екеуі де бірден дұрыс болса —
 * келесі деңгейге өтеміз; қиналса — сол деңгейде тоқтаймыз (бала сол деңгейден оқиды).
 */
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Confetti, ProgressRing, useTitle } from '../../components/kit';
import { TaskView, type TaskResult } from '../../components/TaskView';
import { Bota, Hero } from '../../components/ui';
import { getSubject, LEVEL_NAMES } from '../../content';
import type { Task } from '../../content/types';
import { pick } from '../../lib/random';
import { updateProgress } from '../../lib/db';
import { useChild } from './ChildShell';

const PER_LEVEL = 2;

export function Placement() {
  const { sid = '' } = useParams();
  const subject = getSubject(sid);
  useTitle(subject ? `${subject.title} · деңгейді анықтау` : 'Деңгейді анықтау');
  const { child, progress } = useChild();
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState(0); // осы деңгейдегі тапсырма нөмірі
  const [ok, setOk] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const task: Task | null = useMemo(() => {
    if (!subject) return null;
    const lvl = subject.levels.find((l) => l.level === level)!;
    return pick(lvl.topics).gen();
  }, [subject, level, step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!subject) return <Navigate to="/child" replace />;
  const max = subject.levels.length;

  function finish(final: number) {
    setResult(final);
    const hadAttempts = progress.attempts.some((a) => a.subject === sid && a.t < Date.now() - 1000 * 60 * 60);
    updateProgress(child.id, (p) => {
      p.placement = { ...(p.placement ?? {}), [sid]: { level: final, t: Date.now() } };
      const cur = p.levels[sid] ?? 1;
      // Бұрын оқыған пәнде деңгей тек жоғарылайды; жаңа пәнде нәтиже бірден қолданылады
      if (!hadAttempts || final > cur) {
        p.levels[sid] = final;
        p.levelHistory.push({ t: Date.now(), subject: sid, level: final, by: 'diagnostic' });
      }
    });
  }

  function onDone(r: TaskResult) {
    updateProgress(child.id, (p) => {
      p.attempts.push({ t: Date.now(), subject: sid, level, topic: task!.topic, correct: r.correct, firstTry: r.firstTry, hints: r.hints, ms: r.ms });
      p.stars += r.firstTry ? 2 : 1;
    });
    const nextOk = ok + (r.firstTry ? 1 : 0);
    if (!r.firstTry) return finish(level); // қиналды — осы деңгейден бастаймыз
    if (step + 1 < PER_LEVEL) {
      setOk(nextOk);
      setStep(step + 1);
      return;
    }
    if (level >= max) return finish(max);
    setLevel(level + 1);
    setStep(0);
    setOk(0);
  }

  if (result !== null) {
    const ln = LEVEL_NAMES[result];
    return (
      <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Confetti run={result >= 3} />
        <Hero glow="center" as="div">
          <div className="result-grid">
            <ProgressRing value={result} max={max} size={140} label={`Нәтиже: ${result}-деңгей, барлығы ${max}`}>
              <strong className="ring-num">{ln.icon}</strong>
              <span className="ring-sub">{result}-деңгей</span>
            </ProgressRing>
            <div>
              <p className="eyebrow">{subject.title} · деңгей анықталды</p>
              <h1 style={{ margin: '0 0 10px' }}>
                {result}-деңгей · {ln.name}
              </h1>
              <Bota text={`Жарайсың, ${child.name}! Енді «${subject.title}» пәнін ${result}-деңгейден бастаймыз. Бұл — сенің дәл өз деңгейің.`} />
            </div>
          </div>
        </Hero>
        <div className="row">
          <Link to={`/child/lesson/${sid}`} className="btn big">
            Сабақты бастау <span className="arrow" aria-hidden="true">➜</span>
          </Link>
          <Link to="/child" className="btn big secondary">
            Шолуға
          </Link>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Hero aria-labelledby="pl-h">
          <p className="eyebrow">{subject.emoji} {subject.title}</p>
          <h1 id="pl-h" style={{ margin: '0 0 12px' }}>
            Деңгейіңді анықтайық
          </h1>
          <Bota text="Бұл тест емес — ойын. Тапсырмалар біртіндеп қиындай береді. Қиын болса, ештеңе етпейді: сен дәл сол жерден бастайсың." />
        </Hero>
        <div className="card">
          <ul className="check-list">
            <li>Әр деңгейден 2 тапсырма, барлығы {max * PER_LEVEL} тапсырмадан аспайды</li>
            <li>Шамамен 5–10 минут</li>
            <li>Нәтиже бойынша сабақтар өз деңгейіңнен басталады</li>
          </ul>
          <button className="btn big" onClick={() => setStarted(true)}>
            Бастау <span className="arrow" aria-hidden="true">➜</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="lesson-top">
        <Link className="btn secondary icon" to={`/child/subject/${sid}`} aria-label="Шығу">
          ✕
        </Link>
        <div className="progress" role="progressbar" aria-label="Диагностика барысы" aria-valuemin={1} aria-valuemax={max} aria-valuenow={level}>
          <span style={{ width: `${((level - 1) / max) * 100}%` }} />
        </div>
        <span className="level-badge">
          {LEVEL_NAMES[level].icon} {level}-деңгей
        </span>
      </div>
      <p className="muted small" style={{ fontWeight: 600 }}>
        {subject.emoji} {subject.title} · деңгейді анықтау · {step + 1}/{PER_LEVEL}
      </p>
      {task && (
        <div className="task-swap" key={`${level}-${step}`}>
          <TaskView task={task} sound={child.a11y.sound} autoRead={child.a11y.autoRead} lang={subject.speechLang} onDone={onDone} />
        </div>
      )}
    </div>
  );
}
