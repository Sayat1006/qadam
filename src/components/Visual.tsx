import type { Visual as V } from '../content/types';
import { SpeakButton } from './ui';

function Clock({ h, m }: { h: number; m: number }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  const hand = (angle: number, len: number) => {
    const r = ((angle - 90) * Math.PI) / 180;
    return { x2: 100 + len * Math.cos(r), y2: 100 + len * Math.sin(r) };
  };
  return (
    <svg className="clock-svg" viewBox="0 0 200 200" role="img" aria-label={`Сағат тілдері: ${h} сағат ${m} минут`}>
      <circle cx="100" cy="100" r="92" fill="var(--surface)" stroke="var(--ink)" strokeWidth="6" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        return (
          <text key={i} x={100 + 72 * Math.cos(a)} y={100 + 72 * Math.sin(a) + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--ink)">
            {i + 1}
          </text>
        );
      })}
      <line x1="100" y1="100" {...hand(hourAngle, 45)} stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
      <line x1="100" y1="100" {...hand(minAngle, 68)} stroke="var(--sky)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="var(--ink)" />
    </svg>
  );
}

function Fraction({ parts, filled }: { parts: number; filled: number }) {
  const slices = Array.from({ length: parts }, (_, i) => {
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const r = 80;
    const d = `M100 100 L${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} A${r} ${r} 0 ${parts === 1 ? 1 : 0} 1 ${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)} Z`;
    return <path key={i} d={d} fill={i < filled ? 'var(--accent)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth="4" />;
  });
  return (
    <svg className="clock-svg" viewBox="0 0 200 200" role="img" aria-label={`Дөңгелек ${parts} бөлікке бөлінген, ${filled} бөлігі боялған`}>
      {slices}
    </svg>
  );
}

export function Coin({ v, big }: { v: number; big?: boolean }) {
  return (
    <span className={`coin ${v >= 500 ? 'note' : ''} ${big ? 'big' : ''}`} aria-label={`${v} теңге`}>
      {v}₸
    </span>
  );
}

export function Visual({ v }: { v?: V }) {
  if (!v) return null;
  switch (v.type) {
    case 'emoji':
      return (
        <div className="visual" aria-hidden="true">
          <span className={v.size === 'xl' ? 'emoji-xl' : 'emoji-lg'}>{v.value}</span>
        </div>
      );
    case 'count': {
      const groups: number[] = [];
      for (let left = v.n; left > 0; left -= 5) groups.push(Math.min(5, left));
      return (
        <div className="visual">
          <div className="count-grid" role="img" aria-label={`${v.n} зат`}>
            {groups.map((g, i) => (
              <div className="count-group" key={i}>
                {Array.from({ length: g }, (_, j) => (
                  <span key={j}>{v.emoji}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'groups':
      return (
        <div className="visual">
          <div className="count-grid" role="img" aria-label={`${v.groups} топ, әрқайсысында ${v.each}`}>
            {Array.from({ length: v.groups }, (_, i) => (
              <div className="basket" key={i}>
                {v.emoji.repeat(v.each)}
              </div>
            ))}
          </div>
        </div>
      );
    case 'equation':
      return (
        <div className="visual">
          <span className="equation">{v.value}</span>
        </div>
      );
    case 'text': {
      const isWord = v.value.length < 24;
      return (
        <div className="visual">
          <div className={`reading ${isWord ? 'word' : ''}`}>{v.value}</div>
          {!isWord && (
            <span style={{ marginLeft: 8 }}>
              <SpeakButton text={v.value} label="Мәтінді тыңдау" />
            </span>
          )}
        </div>
      );
    }
    case 'clock':
      return (
        <div className="visual">
          <Clock h={v.h} m={v.m} />
        </div>
      );
    case 'coins':
      return (
        <div className="visual">
          <div className="coins">
            {v.values.map((c, i) => (
              <Coin key={i} v={c} />
            ))}
          </div>
        </div>
      );
    case 'fraction':
      return (
        <div className="visual">
          <Fraction parts={v.parts} filled={v.filled} />
        </div>
      );
  }
}
