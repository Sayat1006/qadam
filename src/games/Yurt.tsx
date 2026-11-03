import { useMemo, useState } from 'react';
import { playCue, speak } from '../lib/media';
import { shuffle } from '../lib/random';
import type { GameProps } from './types';

const STEPS = [
  { id: 'kerege', label: 'Кереге', e: '🪵', info: 'Кереге — киіз үйдің айналма қабырғасы. Ол торлы ағаштан жасалады.' },
  { id: 'esik', label: 'Есік', e: '🚪', info: 'Есік керегенің арасына орнатылады. Есікті әдетте күн шығыс жаққа қаратады.' },
  { id: 'shanyrak', label: 'Шаңырақ пен уықтар', e: '⭕', info: 'Шаңырақ — үйдің төбесіндегі дөңгелек. Уықтар керегені шаңыраққа жалғайды.' },
  { id: 'kiiz', label: 'Туырлық пен үзік (киіз)', e: '🧶', info: 'Киізбен үйдің сырты жабылады. Киіз жылуды сақтайды.' },
  { id: 'tundik', label: 'Түндік', e: '🟫', info: 'Түндік шаңыраққа жабылады. Оны ашса — жарық пен ауа кіреді.' },
];

function YurtSvg({ step }: { step: number }) {
  const show = (i: number) => (step > i ? 1 : 0.1);
  const uyk = Array.from({ length: 9 }, (_, i) => 60 + i * 30);
  return (
    <svg className="yurt-svg" viewBox="0 0 360 250" role="img" aria-label={`Киіз үй: ${step} бөлігі орнатылды`}>
      <rect x="0" y="220" width="360" height="30" fill="var(--primary-soft)" />
      <g className="yurt-part" opacity={show(0)}>
        <rect x="60" y="150" width="240" height="70" fill="none" stroke="#9a6b3a" strokeWidth="4" />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} stroke="#9a6b3a" strokeWidth="3">
            <line x1={60 + i * 20} y1="150" x2={80 + i * 20} y2="220" />
            <line x1={80 + i * 20} y1="150" x2={60 + i * 20} y2="220" />
          </g>
        ))}
      </g>
      <g className="yurt-part" opacity={show(2)}>
        {uyk.map((x) => (
          <line key={x} x1={x} y1="150" x2={180 + (x - 180) * 0.2} y2="72" stroke="#b07a3f" strokeWidth="4" />
        ))}
        <ellipse cx="180" cy="70" rx="28" ry="9" fill="none" stroke="#7a4b1f" strokeWidth="6" />
      </g>
      <g className="yurt-part" opacity={show(3)}>
        <path d="M58 150 Q 70 98 152 72 L208 72 Q 290 98 302 150 Z" fill="#f4ecdb" stroke="#8a7a5c" strokeWidth="3" />
        <rect x="58" y="150" width="244" height="70" fill="#efe4cc" stroke="#8a7a5c" strokeWidth="3" />
        <path d="M58 168 H302" stroke="#c0703f" strokeWidth="6" />
        <path d="M70 120 Q180 100 290 120" stroke="#c0703f" strokeWidth="4" fill="none" />
      </g>
      <g className="yurt-part" opacity={show(1)}>
        <rect x="160" y="165" width="40" height="55" rx="3" fill="#c0703f" stroke="#7a4b1f" strokeWidth="3" />
        <path d="M168 180 h24 M168 196 h24" stroke="#f2c14e" strokeWidth="3" />
      </g>
      <g className="yurt-part" opacity={show(4)}>
        <ellipse cx="180" cy="66" rx="32" ry="10" fill="#8a6a4a" />
      </g>
    </svg>
  );
}

export function Yurt({ child, onFinish }: GameProps) {
  const [step, setStep] = useState(0);
  const [bad, setBad] = useState<string | null>(null);
  const [info, setInfo] = useState('Киіз үйді дұрыс ретпен тұрғыз. Алдымен не орнатылады?');
  const [mistakes, setMistakes] = useState(0);
  const [game, setGame] = useState(0);
  const cards = useMemo(() => shuffle(STEPS), [game]);
  const finished = step >= STEPS.length;

  function choose(id: string) {
    if (finished) return;
    if (STEPS[step].id === id) {
      playCue('success', child.a11y.sound);
      const s = STEPS[step];
      setInfo(s.info);
      if (child.a11y.autoRead) speak(s.info);
      setBad(null);
      const ns = step + 1;
      setStep(ns);
      if (ns === STEPS.length) {
        playCue('celebrate', child.a11y.sound);
        onFinish(5 + Math.max(0, 3 - mistakes));
      }
    } else {
      setBad(id);
      setMistakes((m) => m + 1);
      playCue('retry', child.a11y.sound);
      setInfo(step === 0 ? 'Алдымен үйдің қабырғасын орнату керек.' : `Ойлан: «${STEPS[step - 1].label}» орнатылды. Енді не керек?`);
    }
  }

  return (
    <div className="stack">
      <YurtSvg step={step} />
      <div className={`feedback ${finished ? 'good' : 'try'}`} role="status">
        <span aria-hidden="true">{finished ? '🌟' : '🐪'}</span>
        <span>{finished ? 'Киіз үй дайын! Қонақтарды шақыруға болады. ' + info : info}</span>
      </div>
      {!finished ? (
        <div className="options">
          {cards.map((c) => {
            const used = STEPS.findIndex((s) => s.id === c.id) < step;
            return (
              <button key={c.id} className={`opt ${used ? 'correct' : ''} ${bad === c.id ? 'wrong' : ''}`} onClick={() => choose(c.id)} disabled={used}>
                <span className="oe" aria-hidden="true">
                  {c.e}
                </span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          className="btn big"
          onClick={() => {
            setStep(0);
            setMistakes(0);
            setGame((g) => g + 1);
            setInfo('Киіз үйді тағы бір рет тұрғызайық!');
          }}
        >
          Қайта тұрғызу
        </button>
      )}
    </div>
  );
}
