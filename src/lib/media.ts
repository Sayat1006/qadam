/* Дауыстап оқу (TTS) және жұмсақ дыбыс белгілері */

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
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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

export function speak(text: string, lang = 'kk-KZ', rate = 0.85) {
  if (!canSpeak() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, ''));
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

export function stopSpeaking() {
  try {
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
