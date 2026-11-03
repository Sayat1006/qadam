/*
 * «Менің ауылым» — суретті дала көрінісі (SVG).
 * Аспан нақты уақытқа қарай өзгереді, нысандар өз орнына (тереңдікпен) қойылады.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type Phase = 'morning' | 'day' | 'evening' | 'night';

export function phaseNow(d = new Date()): Phase {
  const h = d.getHours();
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}

const SKY: Record<Phase, [string, string, string]> = {
  morning: ['#ffd9b8', '#ffc4d6', '#c9dcff'],
  day: ['#8ec5ff', '#b8dcff', '#e6f3ff'],
  evening: ['#4b3fd1', '#c96bb0', '#ffb37a'],
  night: ['#0b1238', '#1b2366', '#2c3a8a'],
};
const GROUND: Record<Phase, [string, string]> = {
  morning: ['#a9d98b', '#7fbf6a'],
  day: ['#9bd87c', '#6fbf5a'],
  evening: ['#7aa86a', '#4f7f4e'],
  night: ['#2d4a45', '#1d332f'],
};

/** Нысан түрлері және олардың далада тұратын орындары (x, y — жердегі нүкте) */
export const SLOTS: Record<string, [number, number][]> = {
  rainbow: [[500, 0]],
  eagle: [
    [0, 0],
    [0, 1],
  ],
  school: [[700, 300]],
  tree: [
    [90, 322],
    [190, 302],
    [880, 318],
    [950, 352],
    [580, 292],
    [300, 298],
    [40, 380],
  ],
  house: [
    [160, 362],
    [262, 345],
  ],
  yurt: [
    [500, 372],
    [345, 382],
    [640, 352],
  ],
  apple: [
    [820, 385],
    [890, 430],
    [760, 360],
  ],
  well: [[600, 430]],
  horse: [
    [730, 420],
    [800, 455],
  ],
  camel: [
    [245, 425],
    [160, 450],
  ],
  sheep: [
    [420, 438],
    [470, 455],
    [380, 465],
    [525, 448],
    [450, 488],
    [340, 495],
  ],
  flower: [
    [110, 525],
    [250, 540],
    [415, 528],
    [600, 543],
    [760, 526],
    [905, 538],
    [60, 480],
    [330, 548],
    [680, 505],
    [960, 495],
  ],
};

const HORIZON = 262;
const TUFTS: [number, number][] = Array.from({ length: 34 }, (_, i) => [((i * 263) % 980) + 10, 300 + ((i * 97) % 250)]);
const depth = (y: number) => 0.42 + ((y - HORIZON) / (560 - HORIZON)) * 0.8;

/* ---------- Нысандардың суреттері (0,0 — жерге тиетін нүкте) ---------- */

function Shadow({ w = 60 }: { w?: number }) {
  return <ellipse cx="0" cy="2" rx={w / 2} ry={w / 9} fill="#000" opacity="0.16" />;
}

function Smoke({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <circle key={i} className="v-smoke" style={{ animationDelay: `${i * 1.3}s` }} cx="0" cy="0" r="7" fill="#e9eef7" />
      ))}
    </g>
  );
}

function Tree({ night }: { night: boolean }) {
  return (
    <g className="v-sway">
      <Shadow w={70} />
      <rect x="-6" y="-46" width="12" height="48" rx="4" fill={night ? '#3b2a1f' : '#7a5232'} />
      <circle cx="0" cy="-70" r="32" fill={night ? '#1f4a36' : '#3f9b52'} />
      <circle cx="-22" cy="-52" r="22" fill={night ? '#1b4030' : '#378a48'} />
      <circle cx="22" cy="-54" r="24" fill={night ? '#22513b' : '#46a95a'} />
      <circle cx="-8" cy="-84" r="16" fill={night ? '#2a5d45' : '#5cc06c'} opacity="0.9" />
    </g>
  );
}

function AppleTree({ night }: { night: boolean }) {
  return (
    <g className="v-sway">
      <Tree night={night} />
      {[
        [-14, -66],
        [12, -78],
        [20, -52],
        [-24, -48],
        [2, -58],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#e53d3d" stroke="#a51f1f" strokeWidth="1" />
      ))}
    </g>
  );
}

function Yurt({ night }: { night: boolean }) {
  return (
    <g>
      <Shadow w={120} />
      <path d="M-56 0 V-38 H56 V0 Z" fill="#f4ecdb" stroke="#b9a988" strokeWidth="2" />
      <path d="M-60 -36 Q-50 -78 -14 -88 L14 -88 Q50 -78 60 -36 Z" fill="#fbf5e8" stroke="#b9a988" strokeWidth="2" />
      <path d="M-56 -26 H56" stroke="#c0703f" strokeWidth="6" />
      <path d="M-44 -60 Q0 -72 44 -60" stroke="#c0703f" strokeWidth="4" fill="none" />
      <ellipse cx="0" cy="-88" rx="16" ry="4" fill="#8a6a4a" />
      <Smoke x={0} y={-92} />
      <rect x="-12" y="-30" width="24" height="30" rx="2" fill={night ? '#ffd77a' : '#c0703f'} stroke="#7a4b1f" strokeWidth="2" />
      <path d="M-6 -22 h12 M-6 -14 h12" stroke={night ? '#e0a63a' : '#f2c14e'} strokeWidth="2" />
    </g>
  );
}

function House({ night }: { night: boolean }) {
  const win = night ? '#ffd77a' : '#bfe3ff';
  return (
    <g>
      <Shadow w={110} />
      <rect x="-48" y="-62" width="96" height="62" fill="#fdf3e1" stroke="#c9b48a" strokeWidth="2" />
      <path d="M-58 -60 L0 -102 L58 -60 Z" fill="#d9573c" stroke="#a33d27" strokeWidth="2" />
      <rect x="26" y="-104" width="12" height="24" fill="#8b5a3c" />
      <Smoke x={32} y={-106} />
      <rect x="-36" y="-48" width="22" height="20" fill={win} stroke="#8b5a3c" strokeWidth="2" />
      <rect x="14" y="-48" width="22" height="20" fill={win} stroke="#8b5a3c" strokeWidth="2" />
      <rect x="-9" y="-32" width="18" height="32" fill="#8b5a3c" />
    </g>
  );
}

function School({ night }: { night: boolean }) {
  const win = night ? '#ffd77a' : '#bfe3ff';
  return (
    <g>
      <Shadow w={190} />
      <rect x="-90" y="-80" width="180" height="80" fill="#fff7ea" stroke="#c9b48a" strokeWidth="2" />
      <path d="M-98 -78 H98 L86 -96 H-86 Z" fill="#4b6fd8" />
      {[-70, -40, 30, 60].map((x) => (
        <rect key={x} x={x - 9} y="-66" width="18" height="18" fill={win} stroke="#7a8aa8" strokeWidth="1.5" />
      ))}
      <rect x="-14" y="-40" width="28" height="40" fill="#7a5232" />
      <rect x="-30" y="-94" width="60" height="14" rx="3" fill="#fff" />
      <text x="0" y="-83.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#2b2a8f" fontFamily="Inter, Arial, sans-serif">
        МЕКТЕП
      </text>
      <line x1="80" y1="-96" x2="80" y2="-150" stroke="#9aa3b5" strokeWidth="3" />
      <rect className="v-flag" x="80" y="-150" width="36" height="22" fill="#00afca" />
      <circle cx="98" cy="-139" r="5" fill="#fec50c" />
    </g>
  );
}

function Well() {
  return (
    <g>
      <Shadow w={70} />
      <rect x="-26" y="-26" width="52" height="26" rx="6" fill="#9aa3b5" stroke="#6b7487" strokeWidth="2" />
      <path d="M-26 -18 H26 M-26 -9 H26" stroke="#7d8698" strokeWidth="1.5" />
      <rect x="-24" y="-66" width="5" height="42" fill="#7a5232" />
      <rect x="19" y="-66" width="5" height="42" fill="#7a5232" />
      <path d="M-34 -62 L0 -82 L34 -62 Z" fill="#c0703f" />
      <rect x="-3" y="-58" width="6" height="14" fill="#5a6b9a" />
    </g>
  );
}

function Flower({ i }: { i: number }) {
  const c = ['#ff6b8a', '#ffd24d', '#b78cff', '#ff9f5a', '#ffffff'][i % 5];
  return (
    <g className="v-sway">
      <path d="M0 0 V-22" stroke="#3f9b52" strokeWidth="3" />
      <path d="M0 -10 q8 -6 12 0" stroke="#3f9b52" strokeWidth="3" fill="none" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-30" rx="5" ry="9" fill={c} transform={`rotate(${a} 0 -24)`} />
      ))}
      <circle cx="0" cy="-24" r="4.5" fill="#f2a10a" />
    </g>
  );
}

function Animal({ e, size, cls }: { e: string; size: number; cls: string }) {
  return (
    <g className={cls}>
      <Shadow w={size * 0.9} />
      <text x="0" y="0" textAnchor="middle" fontSize={size} style={{ dominantBaseline: 'auto' }}>
        {e}
      </text>
    </g>
  );
}

function renderItem(type: string, i: number, night: boolean): ReactNode {
  switch (type) {
    case 'tree':
      return <Tree night={night} />;
    case 'apple':
      return <AppleTree night={night} />;
    case 'yurt':
      return <Yurt night={night} />;
    case 'house':
      return <House night={night} />;
    case 'school':
      return <School night={night} />;
    case 'well':
      return <Well />;
    case 'flower':
      return <Flower i={i} />;
    case 'sheep':
      return <Animal e="🐑" size={44} cls="v-graze" />;
    case 'horse':
      return <Animal e="🐎" size={60} cls="v-graze slow" />;
    case 'camel':
      return <Animal e="🐫" size={66} cls="v-graze slow" />;
    default:
      return null;
  }
}

export interface Placed {
  key: string;
  type: string;
  x: number;
  y: number;
  i: number;
}

export function placeItems(village: string[]): Placed[] {
  const used: Record<string, number> = {};
  const out: Placed[] = [];
  village.forEach((type, n) => {
    const slots = SLOTS[type];
    if (!slots) return;
    const k = used[type] ?? 0;
    if (k >= slots.length) return;
    used[type] = k + 1;
    const [x, y] = slots[k];
    out.push({ key: `${type}-${k}`, type, x, y, i: n });
  });
  return out;
}

export function VillageScene({ village, fresh, onTap }: { village: string[]; fresh?: string | null; onTap?: (p: Placed) => void }) {
  const [phase, setPhase] = useState<Phase>(phaseNow);
  const [jump, setJump] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setPhase(phaseNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const night = phase === 'night';
  const placed = useMemo(() => placeItems(village), [village]);
  const ground = placed.filter((p) => p.type !== 'rainbow' && p.type !== 'eagle').sort((a, b) => a.y - b.y);
  const eagles = placed.filter((p) => p.type === 'eagle');
  const rainbow = placed.some((p) => p.type === 'rainbow');
  const [s1, s2, s3] = SKY[phase];
  const [g1, g2] = GROUND[phase];

  const stars = useMemo(
    () => Array.from({ length: 60 }, (_, i) => [(i * 137) % 1000, ((i * 71) % 220) + 6, (i % 3) * 0.5 + 0.8] as const),
    [],
  );

  return (
    <svg className={`vscene ${phase}`} viewBox="0 0 1000 560" role="img" aria-label={`Ауыл көрінісі: ${placed.length} нысан`}>
      <defs>
        <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s1} />
          <stop offset="0.6" stopColor={s2} />
          <stop offset="1" stopColor={s3} />
        </linearGradient>
        <linearGradient id="vGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g1} />
          <stop offset="1" stopColor={g2} />
        </linearGradient>
        <linearGradient id="vRiver" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={night ? '#2b4a8a' : '#6fc3ff'} />
          <stop offset="1" stopColor={night ? '#3b5fa8' : '#a7e0ff'} />
        </linearGradient>
        <radialGradient id="vSun">
          <stop offset="0" stopColor="#fff6c9" />
          <stop offset="0.5" stopColor="#ffd24d" />
          <stop offset="1" stopColor="#ffb02e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Аспан */}
      <rect width="1000" height="560" fill="url(#vSky)" />
      {night &&
        stars.map(([x, y, r], i) => <circle key={i} className="v-star" style={{ animationDelay: `${(i % 7) * 0.4}s` }} cx={x} cy={y} r={r} fill="#fff" />)}
      {night ? (
        <g>
          <circle cx="840" cy="80" r="30" fill="#fff8dc" />
          <circle cx="854" cy="72" r="28" fill={s1} />
        </g>
      ) : (
        <circle cx={phase === 'morning' ? 160 : phase === 'evening' ? 860 : 820} cy={phase === 'day' ? 90 : 190} r="70" fill="url(#vSun)" />
      )}
      {rainbow && (
        <g className="v-rainbow" opacity={night ? 0.35 : 0.85}>
          {['#ff5a5a', '#ff9f43', '#ffd93d', '#5ad37a', '#4ab3ff', '#7b6cff'].map((c, i) => (
            <path key={c} d={`M ${170 + i * 14} ${HORIZON + 4} A ${330 - i * 14} ${230 - i * 12} 0 0 1 ${830 - i * 14} ${HORIZON + 4}`} fill="none" stroke={c} strokeWidth="13" />
          ))}
        </g>
      )}

      {/* Бұлттар */}
      {!night &&
        [
          [120, 70, 1],
          [520, 50, 0.8],
          [760, 130, 1.1],
        ].map(([x, y, s], i) => (
          <g key={i} className="v-cloud" style={{ animationDelay: `${-i * 14}s` }}>
            <g transform={`translate(${x} ${y}) scale(${s})`} opacity={phase === 'evening' ? 0.6 : 0.95}>
              <ellipse cx="0" cy="0" rx="48" ry="20" fill="#fff" />
              <ellipse cx="-30" cy="6" rx="30" ry="16" fill="#fff" />
              <ellipse cx="32" cy="6" rx="34" ry="16" fill="#fff" />
            </g>
          </g>
        ))}

      {/* Таулар (Алатау) */}
      <path d="M0 262 L90 170 L160 220 L260 120 L350 205 L430 150 L520 230 L610 140 L700 215 L790 130 L880 200 L1000 150 V262 Z" fill={night ? '#26306b' : '#8aa2d8'} opacity="0.9" />
      <path d="M260 120 L232 150 L250 146 L266 156 L284 142 Z M610 140 L586 166 L604 162 L618 172 L634 160 Z M790 130 L766 158 L782 152 L798 164 L814 150 Z" fill="#fff" opacity={night ? 0.5 : 0.95} />
      <path d="M0 262 Q150 220 300 246 T620 238 T1000 236 V262 Z" fill={night ? '#22403a' : '#7fb88a'} />

      {/* Жер */}
      <rect y={HORIZON} width="1000" height={560 - HORIZON} fill="url(#vGround)" />
      {/* Өзен */}
      <path className="v-river" d="M1000 278 C 820 284, 760 300, 640 296 S 380 286, 250 300 S 60 318, 0 316 L0 330 C 70 332, 200 314, 300 312 S 600 312, 680 310 S 860 296, 1000 292 Z" fill="url(#vRiver)" />
      {/* Жол */}
      <path d="M470 560 C 480 470, 540 420, 560 330 L 584 330 C 576 420, 540 480, 560 560 Z" fill={night ? '#4a5a4d' : '#e2cf9b'} opacity="0.7" />

      {/* Шөп пен тас (безендіру) */}
      {TUFTS.map(([x, y], i) => {
        const sc = depth(y);
        return i % 5 === 0 ? (
          <ellipse key={i} cx={x} cy={y} rx={9 * sc} ry={5 * sc} fill={night ? '#3c4a52' : '#a9b2a4'} opacity="0.8" />
        ) : (
          <path key={i} d={`M${x - 8 * sc} ${y} q${4 * sc} ${-14 * sc} ${6 * sc} 0 q${2 * sc} ${-18 * sc} ${4 * sc} 0 q${4 * sc} ${-12 * sc} ${6 * sc} 0 Z`} fill={night ? '#2f5a48' : '#5daa4c'} opacity="0.9" />
        );
      })}

      {/* Нысандар (алыстағысы — кіші) */}
      <g className={night ? 'v-night' : phase === 'evening' ? 'v-dusk' : ''}>
      {ground.map((p) => {
        const sc = depth(p.y);
        return (
          <g
            key={p.key}
            transform={`translate(${p.x} ${p.y}) scale(${sc})`}
            className={`v-item ${fresh === p.key ? 'v-new' : ''} ${jump === p.key ? 'v-jump' : ''}`}
            onClick={() => {
              setJump(p.key);
              window.setTimeout(() => setJump(null), 600);
              onTap?.(p);
            }}
          >
            {renderItem(p.type, p.i, night)}
          </g>
        );
      })}
      </g>

      {/* Бүркіттер аспанда */}
      {eagles.map((p, k) => (
        <g key={p.key} className="v-eagle" style={{ animationDelay: `${-k * 9}s` }}>
          <text x="0" y={110 + k * 50} fontSize={k ? 34 : 44}>
            🦅
          </text>
        </g>
      ))}

      {placed.length === 0 && (
        <g>
          <rect x="320" y="400" width="360" height="56" rx="28" fill="#fff" opacity="0.85" />
          <text x="500" y="435" textAnchor="middle" fontSize="20" fontWeight="700" fill="#2b2a8f" fontFamily="Inter, Arial, sans-serif">
            Бос дала… Алғашқы гүліңді отырғыз!
          </text>
        </g>
      )}
    </svg>
  );
}
