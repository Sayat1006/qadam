/* Дауыстап оқу (TTS) және жұмсақ дыбыс белгілері */
import { isLatin, normalizeKk } from './kkspeech';

let voices: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  try {
    voices = window.speechSynthesis?.getVoices() ?? [];
  } catch {
    voices = [];
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function canSpeak() {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
}

/** Қазақ дауысы болса — соны, болмаса орыс дауысын (кирилл мәтінін оқи алады) таңдайды */
function pickVoice(lang: string) {
  const want = lang.slice(0, 2);
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(want)) ||
    (want === 'kk' ? voices.find((v) => v.lang.toLowerCase().startsWith('ru')) : undefined) ||
    null
  );
}

/* ---------- ISSAI (Soyle) дауысы: /api/tts арқылы ---------- */

export type VoiceKind = 'female' | 'male';
let voicePref: VoiceKind = 'female';
let ratePref = 1;
export function setVoicePrefs(v: VoiceKind, rate = 1) {
  voicePref = v;
  ratePref = rate;
}

// Сервер дауысы қолжетімсіз болса (кілт жоқ, лимит біткен) — сессия бойы браузер дауысын қолданамыз
let remoteState: 'unknown' | 'ok' | 'off' = 'unknown';
export function remoteVoiceState() {
  return remoteState;
}
const cache = new Map<string, Promise<string | null>>();
let current: HTMLAudioElement | null = null;
let token = 0;

function remoteUrl(text: string, lang: 'kaz' | 'eng') {
  return `/api/tts?lang=${lang}&voice=${voicePref}&text=${encodeURIComponent(text)}`;
}

function fetchAudio(text: string, lang: 'kaz' | 'eng'): Promise<string | null> {
  const key = `${lang}|${voicePref}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetch(remoteUrl(text, lang))
    .then(async (r) => {
      if (r.status === 503 || r.status === 402 || r.status === 403) {
        remoteState = 'off';
        return null;
      }
      if (!r.ok || !(r.headers.get('content-type') || '').startsWith('audio/')) return null;
      remoteState = 'ok';
      return URL.createObjectURL(await r.blob());
    })
    .catch(() => null);
  cache.set(key, p);
  if (cache.size > 150) {
    const first = cache.keys().next().value as string;
    cache.get(first)?.then((u) => u && URL.revokeObjectURL(u));
    cache.delete(first);
  }
  p.then((u) => !u && cache.delete(key));
  return p;
}

/** Дауысты алдын ала жүктеу (тапсырма ашылғанда) */
export function prefetchSpeech(text: string) {
  if (remoteState === 'off' || !text) return;
  const latin = isLatin(text);
  const clean = latin ? text : normalizeKk(text);
  if (clean) void fetchAudio(clean, latin ? 'eng' : 'kaz');
}

function browserSpeak(text: string, lang: string, rate: number) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = lang;
    u.rate = rate;
    window.speechSynthesis.speak(u);
  } catch {
    /* дауыс қолжетімсіз */
  }
}

export function speak(text: string, lang = 'kk-KZ', rate = 0.85) {
  if (typeof window === 'undefined' || !text) return;
  stopSpeaking();
  const latin = isLatin(text) || lang.startsWith('en');
  const clean = latin ? text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '') : normalizeKk(text);
  if (!clean) return;
  const browserLang = latin ? 'en-US' : lang;
  if (remoteState === 'off') return browserSpeak(clean, browserLang, rate);
  const my = ++token;
  fetchAudio(clean, latin ? 'eng' : 'kaz').then((url) => {
    if (my !== token) return; // басқа мәтін басылды
    if (!url) return browserSpeak(clean, browserLang, rate);
    const a = new Audio(url);
    a.playbackRate = ratePref;
    current = a;
    a.play().catch(() => browserSpeak(clean, browserLang, rate));
  });
}

export function stopSpeaking() {
  token++;
  try {
    current?.pause();
    current = null;
    window.speechSynthesis?.cancel();
  } catch {
    /* */
  }
}

let ctx: AudioContext | null = null;
function tone(freq: number, start: number, dur: number, vol = 0.12) {
  if (!ctx) ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

export type Cue = 'success' | 'retry' | 'tap' | 'celebrate';

export function playCue(cue: Cue, enabled: boolean) {
  if (!enabled) return;
  try {
    if (cue === 'success') {
      tone(523, 0, 0.18);
      tone(784, 0.12, 0.25);
    } else if (cue === 'retry') {
      tone(330, 0, 0.25, 0.07);
    } else if (cue === 'tap') {
      tone(660, 0, 0.06, 0.05);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3));
    }
  } catch {
    /* дыбыс қолжетімсіз */
  }
}
