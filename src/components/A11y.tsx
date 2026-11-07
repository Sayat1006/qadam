import { useEffect, useState } from 'react';
import { canInstall, isIos, isStandalone, onInstallChange, promptInstall } from '../lib/pwa';
import { defaultA11y } from '../lib/db';
import type { A11ySettings } from '../lib/types';
import { setVoicePrefs, speak, type VoiceKind } from '../lib/media';
import { downloadVoice, isDownloaded, ISSAI_VOICES, piperSupported, removeVoice, type IssaiVoice } from '../lib/piper';
import { Modal, Seg } from './ui';

const ADULT_KEY = 'qadam.a11y.adult';

export function applyA11y(s: A11ySettings) {
  const r = document.documentElement;
  r.style.setProperty('--scale', String(s.fontScale));
  r.dataset.theme = s.theme;
  r.dataset.readable = String(s.readableFont);
  r.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
  r.dataset.simple = String(s.simple);
  setVoicePrefs((s.voice ?? 'browser') as VoiceKind, s.speechRate ?? 1);
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
            { v: 'default', l: 'Авто' },
            { v: 'soft', l: 'Жарық' },
            { v: 'dark', l: 'Қараңғы' },
            { v: 'contrast', l: 'Жоғары контраст' },
          ]}
        />
      </div>
      <label className="check">
        <input type="checkbox" checked={value.readableFont} onChange={(e) => set('readableFont', e.target.checked)} />
        Оқуға жеңіл қаріп (кең аралық)
      </label>
      <VoicePicker value={value.voice ?? 'browser'} rate={value.speechRate ?? 1} onVoice={(v) => set('voice', v)} onRate={(r) => set('speechRate', r)} />
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
      <InstallRow />
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

const SAMPLE = 'Сәлем! Мен — Ботамын. Бүгін 3 + 2 = 5 екенін бірге есептейміз.';

/** Дауыс таңдау: браузер дауысы немесе ISSAI дауыстары (құрылғыға бір рет жүктеледі) */
function VoicePicker({ value, rate, onVoice, onRate }: { value: string; rate: number; onVoice: (v: string) => void; onRate: (r: number) => void }) {
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<{ id: IssaiVoice; loaded: number; total: number } | null>(null);
  const [err, setErr] = useState('');
  const supported = piperSupported();

  useEffect(() => {
    if (!supported) return;
    let alive = true;
    Promise.all(ISSAI_VOICES.map(async (v) => [v.id, await isDownloaded(v.id)] as const)).then((r) => alive && setHave(Object.fromEntries(r)));
    return () => {
      alive = false;
    };
  }, [supported, busy]);

  async function get(id: IssaiVoice) {
    setErr('');
    setBusy({ id, loaded: 0, total: 0 });
    try {
      await downloadVoice(id, (loaded, total) => setBusy({ id, loaded, total }));
      onVoice(id);
    } catch (e) {
      setErr('Дауыс жүктелмеді. Интернетті тексеріп, қайта көріңіз.' + (e instanceof Error ? ` (${e.message})` : ''));
    }
    setBusy(null);
  }

  const mb = (n: number) => `${(n / 1048576).toFixed(1)} МБ`;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="small" style={{ fontWeight: 800, margin: 0 }}>
        Дауыс
      </p>
      <p className="muted small" style={{ margin: 0 }}>
        ISSAI қазақ дауыстары құрылғыңызға бір рет жүктеледі, содан кейін интернетсіз де жұмыс істейді. Дауыстар: ISSAI, Назарбаев Университеті · KazakhTTS2.
      </p>
      <div className="voice-list" role="radiogroup" aria-label="Дауыс">
        <label className={`voice-opt ${value === 'browser' ? 'on' : ''}`}>
          <input type="radio" name="voice" checked={value === 'browser'} onChange={() => onVoice('browser')} />
          <span>
            <strong>Құрылғы дауысы</strong>
            <span className="muted small"> · жүктеуді қажет етпейді</span>
          </span>
        </label>
        {ISSAI_VOICES.map((v) => {
          const ok = have[v.id];
          const loading = busy?.id === v.id;
          return (
            <div key={v.id} className={`voice-opt ${value === v.id ? 'on' : ''}`}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, cursor: ok ? 'pointer' : 'default' }}>
                <input type="radio" name="voice" checked={value === v.id} disabled={!ok} onChange={() => onVoice(v.id)} />
                <span>
                  <strong>ISSAI · {v.label}</strong>
                  <span className="muted small"> · {v.note}</span>
                </span>
              </label>
              {!supported ? (
                <span className="muted small">Бұл браузерде қолжетімсіз</span>
              ) : loading ? (
                <span className="small" aria-live="polite">
                  {busy.total ? `${Math.round((100 * busy.loaded) / busy.total)}% · ${mb(busy.total)}` : mb(busy.loaded)}
                </span>
              ) : ok ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    await removeVoice(v.id);
                    if (value === v.id) onVoice('browser');
                    setHave((h) => ({ ...h, [v.id]: false }));
                  }}
                >
                  Жою
                </button>
              ) : (
                <button type="button" className="btn secondary" disabled={!!busy} onClick={() => get(v.id)}>
                  Жүктеу
                </button>
              )}
            </div>
          );
        })}
      </div>
      {busy && (
        <div className="bar" role="progressbar" aria-label="Дауыс жүктелуде" aria-valuemin={0} aria-valuemax={100} aria-valuenow={busy.total ? Math.round((100 * busy.loaded) / busy.total) : 0}>
          <span style={{ width: `${busy.total ? (100 * busy.loaded) / busy.total : 5}%` }} />
        </div>
      )}
      {err && (
        <p className="error small" role="alert">
          {err}
        </p>
      )}
      <div className="row">
        <Seg
          label="Дауыс жылдамдығы"
          value={rate}
          onChange={onRate}
          options={[
            { v: 0.8, l: 'Баяу' },
            { v: 1, l: 'Қалыпты' },
          ]}
        />
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setVoicePrefs(value as VoiceKind, rate);
            speak(SAMPLE);
          }}
        >
          🔊 Тыңдап көру
        </button>
      </div>
    </div>
  );
}

/** «Телефонға орнату»: Android/компьютерде — жүйелік терезе, iPhone-да — нұсқаулық */
function InstallRow() {
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);
  if (typeof window === 'undefined' || isStandalone()) return null;
  if (canInstall())
    return (
      <button type="button" className="btn secondary" onClick={() => promptInstall()}>
        📲 Телефонға орнату (интернетсіз де ашылады)
      </button>
    );
  if (isIos())
    return (
      <p className="muted small" style={{ margin: 0 }}>
        📲 iPhone-ға орнату: Safari-де «Бөлісу» батырмасын басып, «Басты экранға қосу» таңдаңыз.
      </p>
    );
  return null;
}
