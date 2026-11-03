import { useEffect, useState } from 'react';
import { defaultA11y } from '../lib/db';
import type { A11ySettings } from '../lib/types';
import { Modal, Seg } from './ui';

const ADULT_KEY = 'qadam.a11y.adult';

export function applyA11y(s: A11ySettings) {
  const r = document.documentElement;
  r.style.setProperty('--scale', String(s.fontScale));
  r.dataset.theme = s.theme === 'dark' ? 'default' : s.theme;
  r.dataset.readable = String(s.readableFont);
  r.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
  r.dataset.simple = String(s.simple);
}

export function loadAdultA11y(): A11ySettings {
  try {
    const raw = localStorage.getItem(ADULT_KEY);
    return raw ? { ...defaultA11y, ...JSON.parse(raw) } : { ...defaultA11y };
  } catch {
    return { ...defaultA11y };
  }
}
export function saveAdultA11y(s: A11ySettings) {
  try {
    localStorage.setItem(ADULT_KEY, JSON.stringify(s));
  } catch {
    /* */
  }
}

export function A11yForm({ value, onChange }: { value: A11ySettings; onChange: (s: A11ySettings) => void }) {
  const set = <K extends keyof A11ySettings>(k: K, v: A11ySettings[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="stack">
      <div>
        <p className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
          Әріп өлшемі
        </p>
        <Seg
          label="Әріп өлшемі"
          value={value.fontScale}
          onChange={(v) => set('fontScale', v)}
          options={[
            { v: 1, l: 'А' },
            { v: 1.25, l: 'А+' },
            { v: 1.5, l: 'А++' },
            { v: 2, l: 'А+++' },
          ]}
        />
      </div>
      <div>
        <p className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
          Түс тақырыбы
        </p>
        <Seg
          label="Түс тақырыбы"
          value={value.theme}
          onChange={(v) => set('theme', v)}
          options={[
            { v: 'default', l: 'Қараңғы' },
            { v: 'soft', l: 'Жарық' },
            { v: 'contrast', l: 'Жоғары контраст' },
          ]}
        />
      </div>
      <label className="check">
        <input type="checkbox" checked={value.readableFont} onChange={(e) => set('readableFont', e.target.checked)} />
        Оқуға жеңіл қаріп (кең аралық)
      </label>
      <label className="check">
        <input type="checkbox" checked={value.autoRead} onChange={(e) => set('autoRead', e.target.checked)} />
        Тапсырманы автоматты түрде дауыстап оқу
      </label>
      <label className="check">
        <input type="checkbox" checked={value.sound} onChange={(e) => set('sound', e.target.checked)} />
        Дыбыс белгілері
      </label>
      <label className="check">
        <input type="checkbox" checked={value.reduceMotion} onChange={(e) => set('reduceMotion', e.target.checked)} />
        Анимацияны өшіру
      </label>
      <label className="check">
        <input type="checkbox" checked={value.simple} onChange={(e) => set('simple', e.target.checked)} />
        Қарапайым интерфейс (артық безендірусіз)
      </label>
    </div>
  );
}

export function A11yButton({ value, onChange }: { value: A11ySettings; onChange: (s: A11ySettings) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn secondary icon" onClick={() => setOpen(true)} aria-label="Көрініс пен дыбыс баптаулары" title="Баптаулар">
        <span aria-hidden="true" style={{ fontSize: '1.3rem' }}>
          ⚙️
        </span>
      </button>
      {open && (
        <Modal title="Көрініс пен дыбыс" onClose={() => setOpen(false)}>
          <A11yForm value={value} onChange={onChange} />
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => setOpen(false)}>
              Дайын
            </button>
            <button className="btn secondary" onClick={() => onChange({ ...defaultA11y })}>
              Бастапқы күйге қайтару
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Ересектерге арналған қолжетімділік күйі (осы құрылғыда сақталады) */
export function useAdultA11y() {
  const [s, setS] = useState<A11ySettings>(loadAdultA11y);
  useEffect(() => {
    applyA11y(s);
    saveAdultA11y(s);
  }, [s]);
  return [s, setS] as const;
}
