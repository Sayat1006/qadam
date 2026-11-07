/* Қазақстан картасы: қаланы картадан табу (схемалық карта, координаттар — нақты) */
import { useMemo, useState } from 'react';
import { playCue } from '../lib/media';
import { sample, shuffle } from '../lib/random';
import type { GameProps } from './types';

// [бойлық, ендік] — шамамен шекара сызығы (схема)
const BORDER: [number, number][] = [
  [46.5, 48.5], [48.5, 50.5], [51, 51.6], [55, 50.6], [57, 51.1], [61, 50.8], [61.5, 52], [60.5, 53.5], [61.5, 54], [65, 54.7],
  [69, 55.4], [71, 54.2], [73.5, 54], [76, 54.3], [77.5, 53.3], [80, 50.8], [83.5, 51], [85.5, 49.2], [87.3, 49.1], [85, 47],
  [82.5, 45.5], [80.2, 45], [80, 42.8], [76, 42.9], [74, 43.2], [71, 42.5], [69, 41], [66, 42.9], [62, 43.5], [58.5, 45.5],
  [56, 45], [55.5, 41.3], [53, 42], [52.5, 41.8], [51, 44.5], [50.3, 44.9], [52.7, 45.4], [53.2, 46.7], [49.2, 46.4], [48, 47.2],
];

const CITIES: { name: string; lon: number; lat: number; fact: string }[] = [
  { name: 'Астана', lon: 71.45, lat: 51.17, fact: 'Қазақстанның астанасы, Есіл өзенінің бойында.' },
  { name: 'Алматы', lon: 76.95, lat: 43.24, fact: 'Ең үлкен қала, Іле Алатауының етегінде.' },
  { name: 'Шымкент', lon: 69.6, lat: 42.3, fact: 'Оңтүстіктегі ірі қала.' },
  { name: 'Ақтөбе', lon: 57.2, lat: 50.3, fact: 'Батыс Қазақстандағы ірі қала.' },
  { name: 'Атырау', lon: 51.9, lat: 47.1, fact: 'Жайық өзені Каспийге құятын жерде орналасқан.' },
  { name: 'Өскемен', lon: 82.6, lat: 49.95, fact: 'Шығыс Қазақстан, Ертіс өзенінің бойында.' },
  { name: 'Павлодар', lon: 76.95, lat: 52.3, fact: 'Ертіс бойындағы солтүстік қала.' },
  { name: 'Қарағанды', lon: 73.1, lat: 49.8, fact: 'Елдің ортасындағы кенді өлке.' },
  { name: 'Ақтау', lon: 51.2, lat: 43.65, fact: 'Каспий теңізінің жағасындағы қала.' },
  { name: 'Түркістан', lon: 68.25, lat: 43.3, fact: 'Қожа Ахмет Ясауи кесенесі осында.' },
  { name: 'Қостанай', lon: 63.6, lat: 53.2, fact: 'Солтүстіктегі астықты өлке.' },
  { name: 'Петропавл', lon: 69.15, lat: 54.87, fact: 'Ең солтүстіктегі облыс орталығы.' },
  { name: 'Орал', lon: 51.37, lat: 51.23, fact: 'Жайық өзенінің бойындағы батыс қала.' },
  { name: 'Қызылорда', lon: 65.5, lat: 44.85, fact: 'Сырдария өзенінің бойында.' },
  { name: 'Тараз', lon: 71.37, lat: 42.9, fact: 'Ежелгі Ұлы Жібек жолындағы қала.' },
];

const W = 700;
const H = 420;
const px = (lon: number) => ((lon - 45.5) / (88 - 45.5)) * W;
const py = (lat: number) => ((56 - lat) / (56 - 40.5)) * H;
const ROUNDS = 8;

export function KzMap({ child, onFinish }: GameProps) {
  const [game, setGame] = useState(0);
  const order = useMemo(() => sample(CITIES, ROUNDS), [game]);
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const done = round >= ROUNDS;
  const target = order[Math.min(round, ROUNDS - 1)];
  const shown = useMemo(() => shuffle(CITIES), [game]);
  const path = BORDER.map(([lo, la], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(' ') + ' Z';

  function pick(name: string) {
    if (done || msg?.ok) return;
    if (name === target.name) {
      playCue('success', child.a11y.sound);
      const first = wrong.length === 0;
      if (first) setScore((s) => s + 1);
      setMsg({ ok: true, t: `Дұрыс! ${target.name} — ${target.fact}` });
      window.setTimeout(() => {
        setMsg(null);
        setWrong([]);
        const n = round + 1;
        setRound(n);
        if (n >= ROUNDS) onFinish(4 + score + (first ? 1 : 0));
      }, 1800);
    } else {
      playCue('retry', child.a11y.sound);
      setWrong((w) => [...w, name]);
      setMsg({ ok: false, t: `Бұл — ${name}. ${target.name} басқа жерде. ${wrong.length >= 1 ? 'Кеңес: ' + target.fact : ''}` });
    }
  }

  return (
    <div className="stack">
      <p className="muted" style={{ fontWeight: 600 }} aria-live="polite">
        {done ? `Ойын аяқталды: ${score} / ${ROUNDS} бірден табылды.` : `Сұрақ ${round + 1} / ${ROUNDS} · Бірден тапқаның: ${score}`}
      </p>
      {!done && (
        <h2 style={{ margin: 0 }}>
          📍 <span className="grad-text">{target.name}</span> қаласы қайда?
        </h2>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="game-svg" role="group" aria-label="Қазақстанның схемалық картасы">
        <rect width={W} height={H} fill="var(--sky-soft)" rx="16" />
        <path d={path} fill="#bfe3c4" stroke="#3f7d58" strokeWidth="3" />
        <ellipse cx={px(51)} cy={py(44)} rx="14" ry="40" fill="#8fc8ff" opacity="0.8" aria-hidden="true" />
        <text x={px(49.3)} y={py(41.8)} fontSize="11" fill="#2b5a8a" aria-hidden="true">
          Каспий
        </text>
        {shown.map((c) => {
          const isTarget = msg?.ok && c.name === target.name;
          const isWrong = wrong.includes(c.name);
          return (
            <g
              key={c.name}
              transform={`translate(${px(c.lon)} ${py(c.lat)})`}
              role="button"
              tabIndex={0}
              aria-label={done || isWrong || isTarget ? c.name : 'Қала нүктесі'}
              className="map-city"
              onClick={() => pick(c.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(c.name))}
            >
              <circle r="16" fill="transparent" />
              <circle r={c.name === 'Астана' ? 9 : 7} fill={isTarget ? '#35c98a' : isWrong ? '#ff9a6b' : '#5145d8'} stroke="#fff" strokeWidth="2.5" />
              {(done || isWrong || isTarget) && (
                <text y="-13" textAnchor="middle" fontSize="13" fontWeight="700" fill="#101b3d" paintOrder="stroke" stroke="#fff" strokeWidth="3">
                  {c.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {msg && (
        <div className={`feedback ${msg.ok ? 'good' : 'try'}`} role="status">
          {msg.t}
        </div>
      )}
      <p className="muted small" style={{ margin: 0 }}>
        Карта — схемалық, қалалардың орны нақты координаттармен көрсетілген.
      </p>
      {done && (
        <button
          className="btn big"
          onClick={() => {
            setGame((g) => g + 1);
            setRound(0);
            setScore(0);
            setWrong([]);
            setMsg(null);
          }}
        >
          Қайта ойнау
        </button>
      )}
    </div>
  );
}
