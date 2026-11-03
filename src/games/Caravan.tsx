import { useMemo, useState } from 'react';
import { words } from '../content/kazakh';
import { playCue, speak } from '../lib/media';
import { sample, shuffle } from '../lib/random';
import { SpeakButton } from '../components/ui';
import type { GameProps } from './types';

const ROUNDS = 5;
const EXTRA = 'АҚОЕЫІНТЛ'.split('');

export function Caravan({ child, progress, onFinish }: GameProps) {
  const lvl = progress.levels.kazakh ?? 1;
  const maxLen = lvl <= 2 ? 3 : lvl === 3 ? 5 : 8;
  const [list, setList] = useState(() => sample(words.filter((w) => w.w.length <= maxLen && w.w.length >= 2), ROUNDS));
  const [round, setRound] = useState(0);
  const [filled, setFilled] = useState<number>(0);
  const [bad, setBad] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = list[round];
  const letters = word.w.toUpperCase().split('');

  const pool = useMemo(() => {
    const extra = lvl >= 3 ? sample(EXTRA.filter((x) => !letters.includes(x)), 2) : [];
    return shuffle([...letters, ...extra]).map((l, i) => ({ l, i }));
  }, [round, list]); // eslint-disable-line react-hooks/exhaustive-deps
  const [used, setUsed] = useState<number[]>([]);

  function tap(p: { l: string; i: number }) {
    if (finished) return;
    if (p.l === letters[filled]) {
      playCue('tap', child.a11y.sound);
      const nf = filled + 1;
      setFilled(nf);
      setUsed([...used, p.i]);
      setBad(null);
      if (nf === letters.length) {
        playCue('success', child.a11y.sound);
        if (child.a11y.autoRead) speak(word.w);
        window.setTimeout(() => {
          if (round + 1 >= ROUNDS) {
            setFinished(true);
            onFinish(ROUNDS + Math.max(0, 3 - mistakes));
          } else {
            setRound(round + 1);
            setFilled(0);
            setUsed([]);
          }
        }, 900);
      }
    } else {
      setBad(p.i);
      setMistakes((m) => m + 1);
      playCue('retry', child.a11y.sound);
    }
  }

  function restart() {
    setList(sample(words.filter((w) => w.w.length <= maxLen && w.w.length >= 2), ROUNDS));
    setRound(0);
    setFilled(0);
    setUsed([]);
    setMistakes(0);
    setFinished(false);
  }

  if (finished)
    return (
      <div className="feedback good" role="status">
        🌟 Керуен мақсатқа жетті! Барлық сөзді құрадың.
        <button className="btn" onClick={restart}>
          Қайта ойнау
        </button>
      </div>
    );

  return (
    <div className="stack center">
      <p className="muted" style={{ fontWeight: 700 }}>
        Сөз {round + 1} / {ROUNDS}
      </p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <span style={{ fontSize: '5rem' }} aria-hidden="true">
          {word.e}
        </span>
        <SpeakButton text={word.w} label="Сөзді тыңдау" />
      </div>
      <p className="sr-only">Суреттегі сөзді әріптермен құра. {letters.length} әріп.</p>
      <div className="caravan" aria-label="Түйе керуені">
        {letters.map((l, i) => (
          <div className="camel" key={i}>
            <div className={`load ${i < filled ? 'on' : ''}`}>{i < filled ? l : ''}</div>
            <span aria-hidden="true">🐫</span>
          </div>
        ))}
      </div>
      <div className="options" style={{ maxWidth: 560, margin: '0 auto' }}>
        {pool.map((p) => (
          <button key={p.i} className={`opt ${used.includes(p.i) ? 'used' : ''} ${bad === p.i ? 'wrong' : ''}`} onClick={() => tap(p)} disabled={used.includes(p.i)}>
            {p.l}
          </button>
        ))}
      </div>
      {mistakes > 2 && filled < letters.length && (
        <p className="feedback try">
          💡 Келесі әріп: <strong>{letters[filled]}</strong>
        </p>
      )}
    </div>
  );
}
