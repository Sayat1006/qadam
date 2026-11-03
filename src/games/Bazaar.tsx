import { useState } from 'react';
import { Coin } from '../components/Visual';
import { playCue } from '../lib/media';
import { pick, rand } from '../lib/random';
import type { GameProps } from './types';

const ROUNDS = 5;
const ITEMS = [
  { w: 'Алма', e: '🍎' },
  { w: 'Нан', e: '🍞' },
  { w: 'Сүт', e: '🥛' },
  { w: 'Балмұздақ', e: '🍦' },
  { w: 'Дәптер', e: '📒' },
  { w: 'Шар', e: '🎈' },
  { w: 'Қарындаш', e: '✏️' },
  { w: 'Кітап', e: '📕' },
];

function setup(level: number) {
  if (level <= 1) return { coins: [1, 2, 5, 10], price: () => rand(3, 20) };
  if (level === 2) return { coins: [5, 10, 20, 50], price: () => rand(2, 18) * 5 };
  if (level === 3) return { coins: [10, 20, 50, 100], price: () => rand(3, 25) * 10 };
  return { coins: [10, 20, 50, 100, 200, 500], price: () => rand(10, 99) * 10 };
}

export function Bazaar({ child, progress, onFinish }: GameProps) {
  const level = Math.min(progress.levels.math ?? 1, progress.levels.life ?? 1);
  const cfg = setup(level);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(() => ({ ...pick(ITEMS), price: cfg.price() }));
  const [paid, setPaid] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const sum = paid.reduce((s, v) => s + v, 0);

  function add(c: number) {
    playCue('tap', child.a11y.sound);
    setPaid([...paid, c]);
    setMsg(null);
  }

  function pay() {
    if (sum === item.price) {
      playCue('success', child.a11y.sound);
      setMsg({ ok: true, t: `Дәл ${item.price} теңге! Сатушы рахмет айтты.` });
      window.setTimeout(() => {
        if (round + 1 >= ROUNDS) {
          setFinished(true);
          onFinish(ROUNDS * 2);
        } else {
          setRound(round + 1);
          setItem({ ...pick(ITEMS), price: cfg.price() });
          setPaid([]);
          setMsg(null);
        }
      }, 1100);
    } else if (sum > item.price) {
      playCue('retry', child.a11y.sound);
      setMsg({ ok: false, t: `Сен ${sum} теңге бердің — бұл ${sum - item.price} теңгеге көп. Бір тиынды алып тастап көр.` });
    } else {
      playCue('retry', child.a11y.sound);
      setMsg({ ok: false, t: `Әлі ${item.price - sum} теңге жетпейді.` });
    }
  }

  if (finished)
    return (
      <div className="feedback good" role="status">
        🌟 Базардан бәрін дұрыс сатып алдың! +{ROUNDS * 2} жұлдыз.
        <button
          className="btn"
          onClick={() => {
            setRound(0);
            setFinished(false);
            setPaid([]);
            setItem({ ...pick(ITEMS), price: cfg.price() });
          }}
        >
          Қайта ойнау
        </button>
      </div>
    );

  return (
    <div className="stack">
      <p className="muted" style={{ fontWeight: 700 }}>
        Сатып алу {round + 1} / {ROUNDS}
      </p>
      <div className="card soft center">
        <div style={{ fontSize: '4.5rem' }} aria-hidden="true">
          {item.e}
        </div>
        <h2 style={{ margin: 0 }}>
          {item.w} — {item.price} ₸
        </h2>
        <p className="muted">Тиындарды басып, дәл {item.price} теңге төле.</p>
      </div>
      <div className="coins" role="group" aria-label="Әмиянның ішіндегі ақша">
        {cfg.coins.map((c) => (
          <button key={c} onClick={() => add(c)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} aria-label={`${c} теңге қосу`}>
            <Coin v={c} big />
          </button>
        ))}
      </div>
      <div className="card">
        <div className="row spread">
          <strong aria-live="polite">Берілді: {sum} ₸</strong>
          <div className="row">
            <button className="btn secondary" onClick={() => setPaid(paid.slice(0, -1))} disabled={!paid.length}>
              Соңғысын алу
            </button>
            <button className="btn secondary" onClick={() => setPaid([])} disabled={!paid.length}>
              Тазалау
            </button>
            <button className="btn" onClick={pay} disabled={!paid.length}>
              Төлеу
            </button>
          </div>
        </div>
        <div className="coins" style={{ marginTop: 10, justifyContent: 'flex-start' }} aria-hidden="true">
          {paid.map((c, i) => (
            <Coin key={i} v={c} />
          ))}
        </div>
      </div>
      {msg && (
        <div className={`feedback ${msg.ok ? 'good' : 'try'}`} role="status">
          {msg.ok ? '🌟' : '💡'} {msg.t}
        </div>
      )}
    </div>
  );
}
