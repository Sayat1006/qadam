import { useEffect, useState } from 'react';
import { playCue, speak } from '../lib/media';
import { botMove, HOLES, initial, legalMoves, move, WIN, type TogyzState } from './togyz';
import type { GameProps } from './types';

function Pit({ n, label, onClick, active, last }: { n: number; label: string; onClick?: () => void; active?: boolean; last?: boolean }) {
  const dots = Math.min(n, 15);
  const content = (
    <>
      <span className="pit-dots" aria-hidden="true">
        {Array.from({ length: dots }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <strong className="pit-n">{n}</strong>
    </>
  );
  return onClick ? (
    <button className={`pit ${active ? 'active' : ''} ${last ? 'last' : ''}`} onClick={onClick} disabled={!active} aria-label={`${label}: ${n} құмалақ`}>
      {content}
    </button>
  ) : (
    <div className={`pit ${last ? 'last' : ''}`} role="img" aria-label={`${label}: ${n} құмалақ`}>
      {content}
    </div>
  );
}

export function Togyz({ child, onFinish }: GameProps) {
  const [s, setS] = useState<TogyzState>(initial);
  const [msg, setMsg] = useState('Сен төменгі қатарда ойнайсың. Отауды таңда: құмалақтар оңға қарай таратылады.');
  const [reported, setReported] = useState(false);
  const mine = legalMoves(s, 0);

  useEffect(() => {
    if (s.over || s.turn !== 1) return;
    const id = window.setTimeout(() => {
      const m = botMove(s);
      const ns = move(s, m);
      const gain = ns.kazan[1] - s.kazan[1];
      setMsg(gain > 0 ? `Бота ${gain} құмалақ ұтып алды. Енді сенің кезегің.` : 'Бота жүрді. Енді сенің кезегің.');
      setS(ns);
    }, child.a11y.reduceMotion ? 200 : 900);
    return () => window.clearTimeout(id);
  }, [s, child.a11y.reduceMotion]);

  useEffect(() => {
    if (!s.over || reported) return;
    setReported(true);
    const win = s.kazan[0] > s.kazan[1];
    const text = win ? `Жеңдің! Сенде ${s.kazan[0]}, Ботада ${s.kazan[1]} құмалақ.` : s.kazan[0] === s.kazan[1] ? 'Тең түстік!' : `Бота бұл жолы жеңді: ${s.kazan[1]} пен ${s.kazan[0]}. Тағы ойнайық!`;
    setMsg(text);
    playCue(win ? 'celebrate' : 'success', child.a11y.sound);
    if (child.a11y.autoRead) speak(text);
    onFinish(win ? 10 : 5);
  }, [s, reported, child.a11y, onFinish]);

  function play(i: number) {
    const ns = move(s, i);
    const gain = ns.kazan[0] - s.kazan[0];
    playCue(gain > 0 ? 'success' : 'tap', child.a11y.sound);
    setMsg(gain > 0 ? `Керемет! ${gain} құмалақ ұттың (соңғы отауда жұп сан болды).` : 'Бота ойланып жатыр…');
    setS(ns);
  }

  // Отаулар: Бота — жоғарыда оңнан солға (9..5), бала — төменде солдан оңға (0..4)
  const top = [9, 8, 7, 6, 5];
  const bottom = [0, 1, 2, 3, 4];
  return (
    <div className="stack">
      <div className="togyz-board">
        <div className="kazan" aria-label={`Ботаның қазаны: ${s.kazan[1]}`}>
          🐪 Бота: <strong>{s.kazan[1]}</strong>
        </div>
        <div className="pits">
          {top.map((i) => (
            <Pit key={i} n={s.board[i]} label={`Ботаның ${i - HOLES + 1}-отауы`} last={s.last === i} />
          ))}
        </div>
        <div className="pits">
          {bottom.map((i) => (
            <Pit key={i} n={s.board[i]} label={`Сенің ${i + 1}-отауың`} onClick={() => play(i)} active={!s.over && s.turn === 0 && mine.includes(i)} last={s.last === i} />
          ))}
        </div>
        <div className="kazan" aria-label={`Сенің қазаның: ${s.kazan[0]}`}>
          🧒 Сен: <strong>{s.kazan[0]}</strong>
        </div>
      </div>
      <div className={`feedback ${s.over && s.kazan[0] > s.kazan[1] ? 'good' : 'try'}`} role="status" aria-live="polite">
        {msg}
      </div>
      <details className="card">
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Ереже</summary>
        <ul className="check-list" style={{ marginTop: 10 }}>
          <li>Өз отауыңды таңда: барлық құмалақты алып, сол отаудан бастап біреуден тастайсың.</li>
          <li>Соңғы құмалақ Ботаның отауына түсіп, онда жұп сан болса — бәрі сенікі.</li>
          <li>{WIN} құмалақ жинаған жеңеді. Бұл — ұлттық тоғызқұмалақтың балаларға арналған қысқа нұсқасы.</li>
        </ul>
      </details>
      {s.over && (
        <button
          className="btn big"
          onClick={() => {
            setS(initial());
            setReported(false);
            setMsg('Жаңа ойын! Отауыңды таңда.');
          }}
        >
          Қайта ойнау
        </button>
      )}
    </div>
  );
}
