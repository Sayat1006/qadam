/*
 * 3D hero ораушы: three.js тек қажет болғанда (компьютер, WebGL бар,
 * анимация өшірілмеген) динамикалық түрде жүктеледі. Қалған жағдайда және
 * жүктелгенге дейін жеңіл CSS-3D нұсқасы көрсетіледі.
 */
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../components/kit';

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function isDark() {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark' || t === 'contrast') return true;
  if (t === 'soft') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'fallback' | 'webgl'>('fallback');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const lowCpu = (navigator.hardwareConcurrency ?? 8) < 4;
    if (!wide || lowCpu || prefersReducedMotion() || !canUseWebGL() || document.documentElement.dataset.simple === 'true') return;
    let handle: { dispose: () => void } | null = null;
    let cancelled = false;
    setMode('webgl');
    import('./heroScene')
      .then(({ createHeroScene }) => {
        if (cancelled || !canvasRef.current) return;
        handle = createHeroScene(canvasRef.current, { dark: isDark() });
        setReady(true);
      })
      .catch(() => setMode('fallback'));
    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, []);

  return (
    <div className="hero3d" aria-hidden="true">
      {mode === 'webgl' && <canvas ref={canvasRef} className={`hero3d-canvas ${ready ? 'ready' : ''}`} />}
      {(!ready || mode === 'fallback') && <CssScene />}
    </div>
  );
}

/** Жеңіл нұсқа: CSS 3D трансформациялары */
function CssScene() {
  return (
    <div className="css3d">
      <div className="css3d-stage">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="css3d-step" style={{ ['--i' as string]: i }} />
        ))}
        <span className="css3d-orb" />
        <span className="css3d-ring" />
      </div>
      <span className="css3d-chip c1">Ә</span>
      <span className="css3d-chip c2">π</span>
      <span className="css3d-chip c3">+</span>
      <span className="css3d-chip c4">ABC</span>
      <span className="css3d-book b1" />
      <span className="css3d-book b2" />
    </div>
  );
}
