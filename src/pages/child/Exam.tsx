/*
 * «Өзіңді тексер» — сынақ режимі.
 * Сұрақ навигаторы, жұмсақ кері санау, кез келген сұраққа өту, соңында нәтиже.
 * Деңгей мен жұлдыз ережелері өзгермейді: нәтиже тек examLog-қа жазылады.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { TaskView, type TaskResult } from '../../components/TaskView';
import { Confetti, ProgressRing, useTitle } from '../../components/kit';
import { Bar, Modal } from '../../components/ui';
import { getSubject } from '../../content';
import { buildLesson } from '../../lib/adaptive';
import { getDB, updateProgress } from '../../lib/db';
import { topicTitle } from '../../lib/plans';
import { useChild } from './ChildShell';

const SIZE = 10;
const MINUTES = 15;

function clock(sec: number) {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function Exam() {
  const { sid = '' } = useParams();
  const { child, progress } = useChild();
  const subject = getSubject(sid);
  const level = progress.levels[sid] ?? 1;
  const items = useMemo(
    () => (subject ? buildLesson(sid, level, getDB().progress[child.id]?.attempts ?? [], SIZE) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sid, level],
  );
  const [started] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<(TaskResult | undefined)[]>([]);
  const [left, setLeft] = useState(MINUTES * 60);
  const [finished, setFinished] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useTitle(subject ? `${subject.title} · өзіңді тексер` : 'Өзіңді тексер');

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  const done = res.filter(Boolean).length;
  const score = res.filter((r) => r?.firstTry).length;

  function finish() {
    if (finished) return;
    setFinished(true);
    setConfirm(false);
    const ms = Date.now() - started;
    updateProgress(child.id, (p) => {
      p.examLog = [...(p.examLog ?? []), { t: Date.now(), subject: sid, level, score, total: items.length, ms }].slice(-200);
    });
  }

  useEffect(() => {
    if (left <= 0 && !finished) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  if (!subject) return <Navigate to="/child" replace />;
  if (!items.length) return <Navigate to={`/child/subject/${sid}`} replace />;

  function onDone(r: TaskResult) {
    const next = [...res];
    next[idx] = r;
    setRes(next);
    const nextOpen = items.findIndex((_, i) => i > idx && !next[i]);
    const anyOpen = items.findIndex((_, i) => !next[i]);
    window.setTimeout(() => {
      if (nextOpen >= 0) setIdx(nextOpen);
      else if (anyOpen >= 0) setIdx(anyOpen);
    }, 700);
  }

  if (finished) {
    const pct = Math.round((score / items.length) * 100);
    const byTopic = new Map<string, { ok: number; n: number }>();
    items.forEach((it, i) => {
      const k = it.task.topic;
      const v = byTopic.get(k) ?? { ok: 0, n: 0 };
      v.n++;
      if (res[i]?.firstTry) v.ok++;
      byTopic.set(k, v);
    });
    const ms = Date.now() - started;
    return (
      <div className="exam-result">
        <Confetti run={pct >= 80} />
        <section className="card glass grad-border exam-hero">
          <ProgressRing value={pct} size={150} label={`Нәтиже: ${score} / ${items.length}`}>
            <strong style={{ fontSize: '1.8rem' }}>{pct}%</strong>
          </ProgressRing>
          <div>
            <p className="eyebrow">Өзіңді тексер · {subject.title}</p>
            <h1 style={{ margin: '4px 0 8px' }}>{pct >= 80 ? 'Керемет нәтиже!' : pct >= 50 ? 'Жақсы! Тағы аздап жаттығайық.' : 'Бастама жасалды — бірге жаттығамыз.'}</h1>
            <p className="muted">
              Бірінші әрекеттен дұрыс: <b>{score}</b> / {items.length} · Жауап берілді: {done} · Уақыт: {clock(Math.round(ms / 1000))}
            </p>
          </div>
        </section>
        <section className="card">
          <h2>Тақырыптар бойынша</h2>
          <ul className="topic-bars">
            {[...byTopic].map(([k, v]) => (
              <li key={k}>
                <span>{topicTitle(sid, k)}</span>
                <Bar value={Math.round((v.ok / v.n) * 100)} label={`${topicTitle(sid, k)}: ${v.ok}/${v.n}`} />
                <span className="muted small">
                  {v.ok}/{v.n}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Сұрақтар</h2>
          <ol className="exam-nav" aria-label="Сұрақтар нәтижесі">
            {items.map((_, i) => {
              const r = res[i];
              const st = !r ? 'skip' : r.firstTry ? 'ok' : 'retry';
              return (
                <li key={i} className={`qchip ${st}`}>
                  {i + 1}
                  <span className="sr-only">{st === 'ok' ? ' — дұрыс' : st === 'retry' ? ' — көмекпен' : ' — жауап жоқ'}</span>
                </li>
              );
            })}
          </ol>
          <p className="muted small">✓ бірінші әрекеттен · ↻ көмекпен немесе екінші әрекеттен · — жауап берілмеді</p>
        </section>
        <div className="row">
          <Link className="btn big" to={`/child/lesson/${sid}`}>
            Сабаққа өту
          </Link>
          <Link className="btn secondary" to={`/child/subject/${sid}`}>
            Пәнге оралу
          </Link>
        </div>
      </div>
    );
  }

  const item = items[idx];
  const low = left <= 60;
  return (
    <div className="exam">
      <div className="exam-bar card glass">
        <div className="exam-meta">
          <p className="eyebrow">
            {subject.emoji} {subject.title} · {level}-деңгей
          </p>
          <strong>Өзіңді тексер</strong>
        </div>
        <div className={`exam-timer ${low ? 'low' : ''}`} role="timer" aria-label={`Қалған уақыт ${clock(left)}`}>
          <span aria-hidden="true">⏱</span> {clock(left)}
        </div>
        <button className="btn secondary" onClick={() => setConfirm(true)}>
          Аяқтау
        </button>
      </div>
      <nav aria-label="Сұрақтар">
        <ol className="exam-nav">
          {items.map((_, i) => {
            const r = res[i];
            const st = i === idx ? 'cur' : !r ? 'todo' : r.firstTry ? 'ok' : 'retry';
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`qchip ${st}`}
                  aria-current={i === idx ? 'step' : undefined}
                  disabled={!!r}
                  onClick={() => setIdx(i)}
                  aria-label={`${i + 1}-сұрақ${r ? ', жауап берілді' : ''}`}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="progress" role="progressbar" aria-label="Сынақ барысы" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done}>
        <span style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      {res[idx] ? (
        <div className="card exam-wait" aria-live="polite">
          <p>Жауап қабылданды ✓</p>
          {done === items.length && (
            <button className="btn big" onClick={finish}>
              Нәтижені көру
            </button>
          )}
        </div>
      ) : (
        <div className="task-swap" key={idx}>
          <TaskView task={item.task} sound={child.a11y.sound} autoRead={child.a11y.autoRead} lang={subject.speechLang} onDone={onDone} />
        </div>
      )}
      <div className="row spread">
        <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          ← Алдыңғы
        </button>
        <button className="btn ghost" disabled={idx >= items.length - 1} onClick={() => setIdx(idx + 1)}>
          Келесі →
        </button>
      </div>
      {confirm && (
        <Modal title="Сынақты аяқтайсың ба?" onClose={() => setConfirm(false)}>
          <p>
            {done} / {items.length} сұраққа жауап бердің. {done < items.length ? 'Қалғандары жауапсыз есептеледі.' : ''}
          </p>
          <div className="row">
            <button className="btn" onClick={finish}>
              Аяқтау
            </button>
            <button className="btn secondary" onClick={() => setConfirm(false)}>
              Жалғастыру
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
