/* Дауыстап оқу (TTS) және жұмсақ дыбыс белгілері */
import { isLatin, normalizeKk } from './kkspeech';
import { synthesize, type IssaiVoice } from './piper';

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

/* ---------- ISSAI дауысы: браузердің өзінде (Piper) ---------- */

export type VoiceKind = 'browser' | IssaiVoice;
let voicePref: VoiceKind = 'browser';
let ratePref = 1;
export function setVoicePrefs(v: VoiceKind | undefined, rate = 1) {
  voicePref = v && v !== ('female' as string) && v !== ('male' as string) ? v : 'browser';
  ratePref = rate;
}
export function currentVoice() {
  return voicePref;
}

const cache = new Map<string, Promise<string | null>>();
let current: HTMLAudioElement | null = null;
let token = 0;

function issaiAudio(text: string, v: IssaiVoice): Promise<string | null> {
  const key = `${v}|${ratePref}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // ratePref < 1 → баяуырақ (length_scale үлкейеді)
  const p = synthesize(text, v, ratePref < 1 ? 1 / ratePref : 1)
    .then((blob) => URL.createObjectURL(blob))
    .catch(() => null);
  cache.set(key, p);
  if (cache.size > 120) {
    const first = cache.keys().next().value as string;
    cache.get(first)?.then((u) => u && URL.revokeObjectURL(u));
    cache.delete(first);
  }
  p.then((u) => !u && cache.delete(key));
  return p;
}

/** Батырманың үстіне келгенде дыбысты алдын ала дайындау */
export function prefetchSpeech(text: string) {
  if (voicePref === 'browser' || !text || isLatin(text)) return;
  const clean = normalizeKk(text);
  if (clean) void issaiAudio(clean, voicePref);
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
  // Ағылшын мәтіні және ISSAI дауысы таңдалмаса — браузер дауысы
  if (latin || voicePref === 'browser') return browserSpeak(clean, latin ? 'en-US' : lang, rate * ratePref);
  const my = ++token;
  const v = voicePref;
  issaiAudio(clean, v).then((url) => {
    if (my !== token) return; // басқа мәтін басылды
    if (!url) return browserSpeak(clean, lang, rate * ratePref);
    const a = new Audio(url);
    current = a;
    a.play().catch(() => browserSpeak(clean, lang, rate * ratePref));
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
