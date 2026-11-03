import { useEffect, useState } from 'react';
import { Seg } from '../components/ui';
import { words } from '../content/kazakh';
import { playCue, speak } from '../lib/media';
import { sample, shuffle } from '../lib/random';
import type { GameProps } from './types';

interface Card {
  id: string;
  pair: string;
  face: string;
  isWord: boolean;
}

function makeDeck(n: number, withWords: boolean): Card[] {
  const chosen = sample(words, n);
  return shuffle(
    chosen.flatMap((w) => [
      { id: w.w + '-a', pair: w.w, face: w.e, isWord: false },
      { id: w.w + '-b', pair: w.w, face: withWords ? w.w : w.e, isWord: withWords },
    ]),
  );
}

export function Memory({ child, progress, onFinish }: GameProps) {
  const [pairs, setPairs] = useState(progress.levels.kazakh >= 3 ? 6 : 4);
  const [withWords, setWithWords] = useState((progress.levels.kazakh ?? 1) >= 2);
  const [deck, setDeck] = useState(() => makeDeck(pairs, withWords));
  const [open, setOpen] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);

  function restart(p = pairs, w = withWords) {
    setDeck(makeDeck(p, w));
    setOpen([]);
    setDone([]);
    setMoves(0);
    setFinished(false);
  }

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => deck.find((c) => c.id === id)!);
    setMoves((m) => m + 1);
    if (a.pair === b.pair) {
      playCue('success', child.a11y.sound);
      const nd = [...done, a.pair];
      setDone(nd);
      setOpen([]);
      if (nd.length === pairs) {
        setFinished(true);
        onFinish(pairs);
      }
    } else {
      const t = window.setTimeout(() => setOpen([]), 1100);
      return () => window.clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function flip(c: Card) {
    if (open.length >= 2 || open.includes(c.id) || done.includes(c.pair)) return;
    playCue('tap', child.a11y.sound);
    if (child.a11y.autoRead) speak(c.pair);
    setOpen([...open, c.id]);
  }

  return (
    <div className="stack">
      <div className="row">
        <Seg
          label="Жұп саны"
          value={pairs}
          onChange={(v) => {
            setPairs(v);
            restart(v, withWords);
          }}
          options={[
            { v: 4, l: '4 жұп' },
            { v: 6, l: '6 жұп' },
            { v: 8, l: '8 жұп' },
          ]}
        />
        <Seg
          label="Карта түрі"
          value={withWords ? 'w' : 'p'}
          onChange={(v) => {
            setWithWords(v === 'w');
            restart(pairs, v === 'w');
          }}
          options={[
            { v: 'p', l: 'Сурет + сурет' },
            { v: 'w', l: 'Сурет + сөз' },
          ]}
        />
      </div>
      <p className="muted" style={{ fontWeight: 700 }} aria-live="polite">
        Табылған жұп: {done.length} / {pairs} · Жүріс: {moves}
      </p>
      <div className="memory-grid">
        {deck.map((c, i) => {
          const isOpen = open.includes(c.id) || done.includes(c.pair);
          return (
            <button
              key={c.id}
              className={`mem-card ${isOpen ? 'open' : ''} ${done.includes(c.pair) ? 'done' : ''}`}
              onClick={() => flip(c)}
              aria-label={isOpen ? `${i + 1}-карта: ${c.isWord ? c.face : c.pair + ' суреті'}` : `${i + 1}-карта, жабық`}
              disabled={done.includes(c.pair)}
            >
              {isOpen ? <span className={c.isWord ? '' : 'e'}>{c.face}</span> : <span aria-hidden="true">?</span>}
            </button>
          );
        })}
      </div>
      {finished && (
        <div className="feedback good" role="status">
          🌟 Барлық жұпты таптың! +{pairs} жұлдыз.
          <button className="btn" onClick={() => restart()}>
            Қайта ойнау
          </button>
        </div>
      )}
    </div>
  );
}
