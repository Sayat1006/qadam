import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { canSpeak, speak } from '../lib/media';

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link className="brand" to={to}>
      <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--primary)" />
        <path d="M18 44c4-10 10-16 22-20M30 46c3-7 8-11 16-13" stroke="var(--primary-ink)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="20" cy="20" r="5" fill="var(--accent)" />
      </svg>
      Qadam
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

export function SpeakButton({ text, label = 'Тыңдау', lang }: { text: string; label?: string; lang?: string }) {
  if (!canSpeak()) return null;
  return (
    <button type="button" className="btn secondary icon" onClick={() => speak(text, lang)} aria-label={`${label}: ${text}`} title={label}>
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
