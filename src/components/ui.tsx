import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { canSpeak, prefetchSpeech, speak } from '../lib/media';

export function Brand({ to = '/' }: { to?: string }) {
  const gid = 'brandG' + useId().replace(/:/g, '');
  return (
    <Link className="brand" to={to}>
      <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5145D8" />
            <stop offset="1" stopColor="#4388FF" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gid})`} />
        <path d="M16 44h10V34h10V24h12" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="48" cy="18" r="5" fill="#FFCA70" />
      </svg>
      <span className="brand-word">QADAM</span>
    </Link>
  );
}

export function Modal({ title, onClose, children, labelId = 'modal-title' }: { title: string; onClose?: () => void; children: ReactNode; labelId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('button, [href], input, select, textarea');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeRef.current) closeRef.current();
      if (e.key === 'Tab' && el) {
        const f = el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea');
        if (!f.length) return;
        const a = f[0];
        const b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelId} ref={ref}>
        <h2 id={labelId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** Hero блок: көк фон, ішінде бұлыңғыр жарқыл (декор) */
export function Hero({ children, className = '', glow = 'right', as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; glow?: 'right' | 'center'; as?: 'section' | 'div'; 'aria-labelledby'?: string; 'aria-label'?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <Tag className={`hero ${className}`} {...rest}>
      <svg className={`hero-blob ${glow === 'center' ? 'center' : ''}`} viewBox="0 0 600 400" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`hb${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
        </defs>
        <g filter={`url(#hb${id})`}>
          <circle cx="300" cy="200" r="120" fill="var(--hero-glow)" opacity="0.55" />
          <ellipse cx="280" cy="190" rx="250" ry="38" fill="var(--hero-deep)" opacity="0.8" transform="rotate(-22 280 190)" />
          <ellipse cx="240" cy="250" rx="180" ry="30" fill="var(--hero-deep)" opacity="0.6" transform="rotate(-18 240 250)" />
          <circle cx="400" cy="120" r="70" fill="var(--hero-glow)" opacity="0.35" />
        </g>
      </svg>
      <div className="hero-body">{children}</div>
    </Tag>
  );
}

export function SpeakButton({ text, label = 'Тыңдау', lang }: { text: string; label?: string; lang?: string }) {
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className="btn secondary icon"
      onPointerEnter={() => prefetchSpeech(text)}
      onFocus={() => prefetchSpeech(text)}
      onClick={() => speak(text, lang)}
      aria-label={`${label}: ${text}`}
      title={label}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}

export function Bota({ children, text, mood = '🐪' }: { children?: ReactNode; text?: string; mood?: string }) {
  return (
    <div className="bota">
      <div className="bota-face bounce" aria-hidden="true">
        {mood}
      </div>
      <div className="bubble" role="status">
        {text ? <p>{text}</p> : children}
      </div>
      {text && <SpeakButton text={text} />}
    </div>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map((o) => (
        <button key={String(o.v)} type="button" aria-pressed={o.v === value} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Bar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
