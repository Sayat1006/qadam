import { useTitle } from '../../components/kit';
import { useEffect, useState } from 'react';
import { Bota } from '../../components/ui';
import { speak } from '../../lib/media';
import { useChild } from './ChildShell';

const PHASE_MS = 4000;

export function Calm() {
  useTitle('Тыныштық бұрышы');
  const { child } = useChild();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0); // жұп — дем алу, тақ — дем шығару
  const inhale = phase % 2 === 0;
  const count = Math.floor(phase / 2);
  const setCount = (n: number) => setPhase(n * 2);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setPhase((p) => p + 1), PHASE_MS);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && child.a11y.autoRead) speak(inhale ? 'Дем ал' : 'Дем шығар');
  }, [inhale, running, child.a11y.autoRead]);

  useEffect(() => {
    if (count >= 5) setRunning(false);
  }, [count]);

  return (
    <div className="stack center" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>Тыныштық бұрышы</h1>
      <Bota text="Бірге тыныс алайық. Шеңбер үлкейгенде — мұрныңмен баяу дем ал. Кішірейгенде — аузыңмен баяу дем шығар." />
      <div className={`breath ${running && inhale ? 'in' : ''}`} aria-hidden="true">
        {running ? (inhale ? '🌸' : '🌷') : '🌱'}
      </div>
      <p style={{ fontSize: '1.6rem', fontWeight: 800 }} aria-live="polite">
        {running ? (inhale ? 'Дем ал... 1, 2, 3, 4' : 'Дем шығар... 1, 2, 3, 4') : count >= 5 ? 'Жарайсың! Денең тынышталды 🌿' : 'Дайын болсаң, баста'}
      </p>
      <p className="muted">Тыныс саны: {count} / 5</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        {!running ? (
          <button
            className="btn big"
            onClick={() => {
              setCount(0);
              setRunning(true);
            }}
          >
            {count >= 5 ? 'Тағы бір рет' : 'Бастау'}
          </button>
        ) : (
          <button className="btn big secondary" onClick={() => setRunning(false)}>
            Тоқтату
          </button>
        )}
      </div>
    </div>
  );
}
