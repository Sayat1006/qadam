import { useEffect, useMemo, useRef, useState } from 'react';
import type { Opt, Task } from '../content/types';
import { playCue, speak, stopSpeaking } from '../lib/media';
import { pick, shuffle } from '../lib/random';
import { SpeakButton } from './ui';
import { Visual } from './Visual';

export interface TaskResult {
  correct: boolean;
  firstTry: boolean;
  hints: number;
  ms: number;
}

const PRAISE = ['Керемет!', 'Жарайсың!', 'Тамаша, өзің таптың!', 'Өте жақсы!', 'Міне, нағыз шебер!'];
const PRAISE_AFTER_TRY = ['Табандылығың үшін жарайсың!', 'Тырыстың — таптың!', 'Қателесу — үйренудің бір бөлігі. Жарайсың!'];
const RETRY = ['Ештеңе етпейді, тағы көрейік.', 'Жақсы талпыныс! Кеңеске қара.', 'Асықпа, ойланып көр.'];

interface Props {
  task: Task;
  sound: boolean;
  autoRead: boolean;
  onDone: (r: TaskResult) => void;
}

/** Ескерту: жаңа тапсырма үшін ата-компонент `key` береді — күй толық жаңарады */
export function TaskView({ task, sound, autoRead, onDone }: Props) {
  const started = useRef(Date.now());
  const [wrong, setWrong] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [hintAsked, setHintAsked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'good' | 'try'; text: string } | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoRead) speak(task.prompt);
    return () => stopSpeaking();
  }, [task, autoRead]);

  useEffect(() => {
    if (solved) nextRef.current?.focus();
  }, [solved]);

  const reveal = wrong >= 3;

  function onWrong() {
    const w = wrong + 1;
    setWrong(w);
    const hi = Math.min(w, task.hints.length);
    setHintsShown((h) => Math.max(h, hi));
    playCue('retry', sound);
    const text = w >= 3 ? 'Көмектесейін: дұрыс жауап белгіленді. Соны таңда.' : pick(RETRY);
    setMsg({ kind: 'try', text });
  }

  function onRight() {
    setSolved(true);
    playCue('success', sound);
    const clean = wrong === 0 && !hintAsked;
    const text = (clean ? pick(PRAISE) : pick(PRAISE_AFTER_TRY)) + (task.explain ? ' ' + task.explain : '');
    setMsg({ kind: 'good', text });
    if (autoRead) speak(text);
  }

  function askHint() {
    setHintAsked(true);
    setHintsShown((h) => Math.min(task.hints.length, h + 1));
  }

  function finish() {
    onDone({ correct: true, firstTry: wrong === 0 && !hintAsked, hints: hintsShown, ms: Date.now() - started.current });
  }

  return (
    <div className="card task-card">
      <div className="task-prompt">
        <span className="text" id="task-prompt">
          {task.prompt}
        </span>
        <SpeakButton text={task.prompt} label="Тапсырманы тыңдау" />
      </div>
      <Visual v={task.visual} />

      <div aria-labelledby="task-prompt">
        {task.kind === 'choice' && <Choice task={task} solved={solved} reveal={reveal} wrongCount={wrong} onWrong={onWrong} onRight={onRight} sound={sound} />}
        {task.kind === 'numpad' && <Numpad task={task} solved={solved} reveal={reveal} onWrong={onWrong} onRight={onRight} />}
        {task.kind === 'order' && <Order task={task} solved={solved} reveal={reveal} onWrong={onWrong} onRight={onRight} sound={sound} />}
        {task.kind === 'sort' && <Sort task={task} solved={solved} reveal={reveal} onWrong={onWrong} onRight={onRight} sound={sound} />}
        {task.kind === 'match' && <Match task={task} solved={solved} reveal={reveal} onWrong={onWrong} onRight={onRight} sound={sound} />}
      </div>

      {hintsShown > 0 && !solved && (
        <div className="feedback try" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <span>{task.hints[hintsShown - 1]}</span>
          <SpeakButton text={task.hints[hintsShown - 1]} label="Кеңесті тыңдау" />
        </div>
      )}
      {msg && (
        <div className={`feedback ${msg.kind}`} role="status" aria-live="polite">
          <span aria-hidden="true">{msg.kind === 'good' ? '🌟' : '🐪'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        {!solved && hintsShown < task.hints.length && (
          <button className="btn secondary" onClick={askHint}>
            <span aria-hidden="true">💡</span> Кеңес
          </button>
        )}
        {solved && (
          <button className="btn big" ref={nextRef} onClick={finish}>
            Келесі <span aria-hidden="true">➜</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface PartProps<T> {
  task: T;
  solved: boolean;
  reveal: boolean;
  onWrong: () => void;
  onRight: () => void;
  sound?: boolean;
}

/* ---------- Бір жауапты таңдау ---------- */
function Choice({ task, solved, reveal, wrongCount, onWrong, onRight }: PartProps<Extract<Task, { kind: 'choice' }>> & { wrongCount: number }) {
  const [tried, setTried] = useState<string[]>([]);
  // 2 қатеден кейін бір алаңдатқыш нұсқа сөнеді (тапсырма жеңілдейді)
  const dimmed = useMemo(() => {
    if (wrongCount < 2) return new Set<string>();
    const rest = task.options.filter((o) => o.id !== task.answer && !tried.includes(o.id));
    return new Set(rest.slice(0, Math.max(0, rest.length - 1)).map((o) => o.id));
  }, [wrongCount, task, tried]);

  return (
    <div className={`options ${task.layout === 'big' ? 'big' : ''} ${task.layout === 'list' ? 'list' : ''}`}>
      {task.options.map((o) => {
        const isWrong = tried.includes(o.id);
        const cls = solved && o.id === task.answer ? 'correct' : isWrong ? 'wrong dim' : dimmed.has(o.id) ? 'dim' : reveal && o.id === task.answer ? 'selected' : '';
        return (
          <button
            key={o.id}
            className={`opt ${cls}`}
            disabled={solved || isWrong || dimmed.has(o.id)}
            onClick={() => {
              if (o.id === task.answer) onRight();
              else {
                setTried((t) => [...t, o.id]);
                onWrong();
              }
            }}
          >
            {o.emoji && <span className="oe" aria-hidden="true">{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Сан енгізу ---------- */
function Numpad({ task, solved, reveal, onWrong, onRight }: PartProps<Extract<Task, { kind: 'numpad' }>>) {
  const [val, setVal] = useState('');
  const press = (k: string) => {
    if (solved) return;
    if (k === '⌫') setVal((v) => v.slice(0, -1));
    else if (val.length < 5) setVal((v) => (v === '0' ? k : v + k));
  };
  const check = () => {
    if (solved || !val) return;
    if (Number(val) === task.answer) onRight();
    else {
      onWrong();
      setVal('');
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div>
      <div className="numpad-display" aria-live="polite" aria-label="Сенің жауабың">
        {val || (reveal && !solved ? <span className="muted">{task.answer}</span> : '?')}
        {task.unit && <span className="muted"> {task.unit}</span>}
      </div>
      <div className="numpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map((k) => (
          <button key={k} onClick={() => press(k)} disabled={solved} aria-label={k === '⌫' ? 'Өшіру' : k}>
            {k}
          </button>
        ))}
        <button onClick={check} disabled={solved || !val} style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }} aria-label="Тексеру">
          ✓
        </button>
      </div>
    </div>
  );
}

/* ---------- Ретімен қою ---------- */
function Order({ task, solved, reveal, onWrong, onRight, sound }: PartProps<Extract<Task, { kind: 'order' }>>) {
  const pool = useMemo(() => {
    let s = shuffle(task.items);
    // Араласпай қалса, қайта араластыру
    for (let i = 0; i < 5 && task.items.length > 1 && s.every((x, j) => x.label === task.items[j].label); i++) s = shuffle(task.items);
    return s;
  }, [task]);
  const [placed, setPlaced] = useState<Opt[]>([]);
  const [badId, setBadId] = useState<string | null>(null);
  const next = task.items[placed.length];
  return (
    <div>
      <div className="order-slots" aria-label="Құрастырылған қатар">
        {task.items.map((_, i) => (
          <div key={i} className={`slot ${placed[i] ? 'filled' : ''}`}>
            {placed[i] ? (
              <>
                {placed[i].emoji && <span aria-hidden="true">{placed[i].emoji}</span>}
                {placed[i].label}
              </>
            ) : (
              <span className="muted">{i + 1}</span>
            )}
          </div>
        ))}
      </div>
      <div className="options">
        {pool.map((o) => {
          const used = placed.some((p) => p.id === o.id);
          const hint = reveal && !solved && next && o.label === next.label && !used;
          return (
            <button
              key={o.id}
              className={`opt ${used ? 'used' : ''} ${badId === o.id ? 'wrong' : ''} ${hint ? 'selected' : ''}`}
              disabled={solved || used}
              aria-hidden={used || undefined}
              onClick={() => {
                // Бірдей жазылған элементтер (мыс. екі «А») — белгі бойынша салыстырылады
                if (next && o.label === next.label) {
                  setBadId(null);
                  playCue('tap', !!sound);
                  const np = [...placed, o];
                  setPlaced(np);
                  if (np.length === task.items.length) onRight();
                } else {
                  setBadId(o.id);
                  onWrong();
                }
              }}
            >
              {o.emoji && <span className="oe" aria-hidden="true">{o.emoji}</span>}
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Топқа бөлу ---------- */
function Sort({ task, solved, reveal, onWrong, onRight, sound }: PartProps<Extract<Task, { kind: 'sort' }>>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [bad, setBad] = useState<string | null>(null);
  const remaining = task.items.filter((i) => !placed[i.id]);
  const sel = task.items.find((i) => i.id === selected);

  function drop(groupId: string) {
    if (!sel || solved) return;
    if (sel.group === groupId) {
      playCue('tap', !!sound);
      const np = { ...placed, [sel.id]: groupId };
      setPlaced(np);
      setSelected(null);
      setBad(null);
      if (Object.keys(np).length === task.items.length) onRight();
    } else {
      setBad(groupId);
      onWrong();
    }
  }

  return (
    <div>
      <p className="muted small" style={{ fontWeight: 700 }}>
        1) Суретті таңда. 2) Оны салатын топты бас.
      </p>
      <div className="sort-groups">
        {task.groups.map((g) => (
          <button
            key={g.id}
            className={`sort-group ${sel ? 'target' : ''} ${bad === g.id ? 'wrong' : ''} ${reveal && sel && sel.group === g.id ? 'selected' : ''}`}
            onClick={() => drop(g.id)}
            disabled={solved}
            aria-label={`${g.label} тобы${sel ? `: «${sel.label}» салу` : ''}`}
          >
            <h4>
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </h4>
            <div className="placed">
              {task.items
                .filter((i) => placed[i.id] === g.id)
                .map((i) => (
                  <span key={i.id} title={i.label}>
                    {i.emoji}
                  </span>
                ))}
            </div>
          </button>
        ))}
      </div>
      <div className="options">
        {remaining.map((i) => (
          <button key={i.id} className={`opt ${selected === i.id ? 'selected' : ''}`} aria-pressed={selected === i.id} onClick={() => setSelected(i.id)} disabled={solved}>
            <span className="oe" aria-hidden="true">
              {i.emoji}
            </span>
            <span>{i.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Жұптастыру ---------- */
function Match({ task, solved, reveal, onWrong, onRight, sound }: PartProps<Extract<Task, { kind: 'match' }>>) {
  const left = useMemo(() => shuffle(task.pairs.map((p) => p[0])), [task]);
  const right = useMemo(() => shuffle(task.pairs.map((p) => p[1])), [task]);
  const [selL, setSelL] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<string | null>(null);
  const partner = (lid: string) => task.pairs.find((p) => p[0].id === lid)?.[1].id;

  function pickRight(rid: string) {
    if (!selL || solved) return;
    if (partner(selL) === rid) {
      playCue('tap', !!sound);
      const nd = [...done, selL];
      setDone(nd);
      setSelL(null);
      setBad(null);
      if (nd.length === task.pairs.length) onRight();
    } else {
      setBad(rid);
      onWrong();
    }
  }
  const doneRight = done.map((l) => partner(l));
  return (
    <div className="match-cols">
      <div className="stack">
        {left.map((o) => (
          <button
            key={o.id}
            className={`opt ${done.includes(o.id) ? 'correct' : selL === o.id ? 'selected' : ''}`}
            aria-pressed={selL === o.id}
            disabled={solved || done.includes(o.id)}
            onClick={() => setSelL(o.id)}
          >
            {o.emoji && <span className="oe" aria-hidden="true">{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      <div className="stack">
        {right.map((o) => (
          <button
            key={o.id}
            className={`opt ${doneRight.includes(o.id) ? 'correct' : bad === o.id ? 'wrong' : reveal && selL && partner(selL) === o.id ? 'selected' : ''}`}
            disabled={solved || doneRight.includes(o.id)}
            onClick={() => pickRight(o.id)}
          >
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
