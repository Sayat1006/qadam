/*
 * Асық ату: күш пен бұрышты таңдап, асықты нысанаға лақтыру.
 * Ұшу қашықтығы физика заңымен есептеледі: L = v²·sin(2θ) / g.
 * Әр раундтан кейін құлатылған асықтарды санаймыз.
 */
import { useEffect, useRef, useState } from 'react';
import { Seg } from '../components/ui';
import { playCue } from '../lib/media';
import { rand } from '../lib/random';
import type { GameProps } from './types';

const ROUNDS = 5;
const W = 600;
const H = 260;
const G = 9.8;
const SCALE = 12; // 1 метр = 12 пиксель

function range(power: number, angleDeg: number) {
  const v = 4 + power * 1.6; // м/с
  return ((v * v * Math.sin((2 * angleDeg * Math.PI) / 180)) / G) * SCALE;
}

export function Asyq({ child, onFinish }: GameProps) {
  const [power, setPower] = useState(5);
  const [angle, setAngle] = useState(45);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(() => rand(220, 520));
  const [targetCount, setTargetCount] = useState(() => rand(3, 6));
  const [flying, setFlying] = useState<{ x: number; y: number } | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState('Күш пен бұрышты таңда да, «Ату» батырмасын бас.');
  const [finished, setFinished] = useState(false);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const x0 = 40;
  const y0 = H - 30;

  function shoot() {
    if (flying || finished) return;
    playCue('tap', child.a11y.sound);
    const v = 4 + power * 1.6;
    const th = (angle * Math.PI) / 180;
    const T = (2 * v * Math.sin(th)) / G;
    const start = performance.now();
    const reduce = child.a11y.reduceMotion;
    const step = (now: number) => {
      const t = reduce ? T : Math.min(T, ((now - start) / 1000) * 1.6);
      const x = x0 + v * Math.cos(th) * t * SCALE;
      const y = y0 - (v * Math.sin(th) * t - (G * t * t) / 2) * SCALE;
      setFlying({ x, y });
      if (t < T) raf.current = requestAnimationFrame(step);
      else land(x);
    };
    raf.current = requestAnimationFrame(step);
  }

  function land(x: number) {
    setFlying(null);
    setLanded(x);
    const dist = Math.abs(x - target);
    const hit = dist <= 34;
    if (hit) {
      playCue('success', child.a11y.sound);
      setHits((h) => h + 1);
      setTotal((t) => t + targetCount);
      setMsg(`Дәл тидің! ${targetCount} асық құлады. Барлығы: ${total + targetCount} асық.`);
    } else {
      playCue('retry', child.a11y.sound);
      setMsg(x < target ? 'Жетпей қалды — күшті арттыр немесе бұрышты 45°-қа жақындат.' : 'Асып кетті — күшті азайт.');
    }
    window.setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setFinished(true);
        onFinish(2 + (hit ? hits + 1 : hits) * 2);
        return;
      }
      setRound((r) => r + 1);
      setTarget(rand(220, 540));
      setTargetCount(rand(3, 6));
      setLanded(null);
    }, 1400);
  }

  const preview = Math.min(W - 10, x0 + range(power, angle));

  return (
    <div className="stack">
      <p className="muted" style={{ fontWeight: 600 }} aria-live="polite">
        Лақтыру {Math.min(round + 1, ROUNDS)} / {ROUNDS} · Дәл тигені: {hits} · Жинаған асық: {total}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="game-svg" role="img" aria-label={`Нысана ${Math.round((target - x0) / SCALE)} метр қашықтықта, ${targetCount} асық тұр`}>
        <rect width={W} height={H} fill="var(--sky-soft)" />
        <rect y={H - 30} width={W} height="30" fill="#c9a76b" />
        <circle cx={target} cy={H - 30} r="34" fill="#fff" opacity="0.35" />
        {Array.from({ length: targetCount }, (_, i) => (
          <g key={i} transform={`translate(${target - (targetCount - 1) * 9 + i * 18} ${H - 40})`}>
            <ellipse rx="7" ry="10" fill="#f4e2c1" stroke="#a4855a" strokeWidth="2" />
          </g>
        ))}
        <text x={x0 - 18} y={H - 36} fontSize="30" aria-hidden="true">
          🧒
        </text>
        {!flying && !finished && <line x1={x0} y1={y0} x2={x0 + Math.cos((angle * Math.PI) / 180) * 50} y2={y0 - Math.sin((angle * Math.PI) / 180) * 50} stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />}
        {round === 0 && !flying && landed === null && <circle cx={preview} cy={H - 30} r="5" fill="var(--primary)" opacity="0.5" />}
        {flying && <ellipse cx={flying.x} cy={flying.y} rx="6" ry="8" fill="#f4e2c1" stroke="#a4855a" strokeWidth="2" />}
        {landed !== null && <ellipse cx={landed} cy={H - 32} rx="6" ry="8" fill="#f4e2c1" stroke="#a4855a" strokeWidth="2" />}
        {[5, 10, 15, 20, 25, 30, 35, 40, 45].map((m) => (
          <text key={m} x={x0 + m * SCALE} y={H - 10} fontSize="11" textAnchor="middle" fill="#5a4320">
            {m}м
          </text>
        ))}
      </svg>
      <div className={`feedback ${msg.startsWith('Дәл') ? 'good' : 'try'}`} role="status">
        {msg}
      </div>
      {!finished ? (
        <div className="card stack">
          <label className="field">
            <span>Күш: {power}</span>
            <input type="range" min={1} max={10} value={power} onChange={(e) => setPower(Number(e.target.value))} disabled={!!flying} />
          </label>
          <div>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Бұрыш</p>
            <Seg label="Лақтыру бұрышы" value={angle} onChange={setAngle} options={[20, 30, 45, 60, 70].map((a) => ({ v: a, l: `${a}°` }))} />
          </div>
          <button className="btn big" onClick={shoot} disabled={!!flying || landed !== null}>
            Ату 🎯
          </button>
          <p className="muted small" style={{ margin: 0 }}>
            Білесің бе? Бір күшпен лақтырғанда 45° бұрыш ең алысқа ұшырады.
          </p>
        </div>
      ) : (
        <div className="feedback good" role="status">
          🌟 Ойын аяқталды! {hits} рет дәл тидің, барлығы {total} асық жинадың.
          <button
            className="btn"
            onClick={() => {
              setRound(0);
              setHits(0);
              setTotal(0);
              setFinished(false);
              setLanded(null);
              setMsg('Жаңа ойын! Күш пен бұрышты таңда.');
            }}
          >
            Қайта ойнау
          </button>
        </div>
      )}
    </div>
  );
}
