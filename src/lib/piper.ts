/*
 * ISSAI қазақ дауыстары — браузердің өзінде (Piper / VITS, onnxruntime-web).
 * Модельдер ISSAI-дің KazakhTTS2 корпусында үйретілген (rhasspy/piper-voices).
 * - Phonemizer (espeak-ng) мен ONNX runtime біздің сайтта: /piper/, /ort/
 * - Дауыс моделі тек пайдаланушы «Жүктеу» батырмасын басқанда HuggingFace-тен
 *   бір рет жүктеліп, браузердің Cache Storage-інде сақталады (офлайн жұмыс істейді).
 */

export type IssaiVoice = 'kk_KZ-raya-x_low' | 'kk_KZ-iseke-x_low' | 'kk_KZ-issai-high';
export type EnVoice = 'en_US-amy-low';
export type PiperVoice = IssaiVoice | EnVoice;

export const EN_VOICES: { id: EnVoice; label: string; note: string }[] = [{ id: 'en_US-amy-low', label: 'Amy (ағылшын)', note: 'жеңіл модель' }];

export const ISSAI_VOICES: { id: IssaiVoice; label: string; note: string }[] = [
  { id: 'kk_KZ-raya-x_low', label: 'Raya', note: 'жеңіл модель' },
  { id: 'kk_KZ-iseke-x_low', label: 'Iseke', note: 'жеңіл модель' },
  { id: 'kk_KZ-issai-high', label: 'ISSAI', note: 'жоғары сапа, үлкен файл' },
];

const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';
const PATHS: Record<PiperVoice, string> = {
  'en_US-amy-low': 'en/en_US/amy/low/en_US-amy-low.onnx',
  'kk_KZ-raya-x_low': 'kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx',
  'kk_KZ-iseke-x_low': 'kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx',
  'kk_KZ-issai-high': 'kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx',
};
const CACHE = 'qadam-issai-voices-v1';

interface VoiceConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map?: Record<string, number>;
}

export function piperSupported() {
  return typeof window !== 'undefined' && 'caches' in window && typeof WebAssembly === 'object';
}

async function cacheGet(url: string) {
  try {
    const c = await caches.open(CACHE);
    return (await c.match(url)) ?? null;
  } catch {
    return null;
  }
}

export async function isDownloaded(v: PiperVoice) {
  const url = `${HF}/${PATHS[v]}`;
  return !!(await cacheGet(url)) && !!(await cacheGet(url + '.json'));
}

/** Модельді жүктеу (прогреспен), Cache Storage-ке сақтау */
export async function downloadVoice(v: PiperVoice, onProgress?: (loaded: number, total: number) => void) {
  const url = `${HF}/${PATHS[v]}`;
  const c = await caches.open(CACHE);
  const cfg = await fetch(url + '.json');
  if (!cfg.ok) throw new Error(`Баптау файлы жүктелмеді (${cfg.status})`);
  await c.put(url + '.json', cfg);

  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`Модель жүктелмеді (${r.status})`);
  const total = Number(r.headers.get('content-length')) || 0;
  const reader = r.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  await c.put(url, new Response(new Blob(chunks), { headers: { 'Content-Type': 'application/octet-stream' } }));
}

export async function removeVoice(v: PiperVoice) {
  const url = `${HF}/${PATHS[v]}`;
  const c = await caches.open(CACHE);
  await c.delete(url);
  await c.delete(url + '.json');
  sessions.delete(v);
}

/* ---------- Синтез ---------- */

type Ort = typeof import('onnxruntime-web/wasm');
let ortP: Promise<Ort> | null = null;
function ort() {
  ortP ??= import('onnxruntime-web/wasm').then((m) => {
    m.env.wasm.wasmPaths = '/ort/';
    m.env.wasm.numThreads = 1;
    return m;
  });
  return ortP;
}

const sessions = new Map<PiperVoice, Promise<{ session: import('onnxruntime-web').InferenceSession; cfg: VoiceConfig }>>();
function loadSession(v: PiperVoice) {
  let p = sessions.get(v);
  if (!p) {
    p = (async () => {
      const url = `${HF}/${PATHS[v]}`;
      const [mr, cr] = await Promise.all([cacheGet(url), cacheGet(url + '.json')]);
      if (!mr || !cr) throw new Error('not-downloaded');
      const cfg = (await cr.json()) as VoiceConfig;
      const o = await ort();
      const session = await o.InferenceSession.create(new Uint8Array(await mr.arrayBuffer()), { executionProviders: ['wasm'] });
      return { session, cfg };
    })();
    p.catch(() => sessions.delete(v));
    sessions.set(v, p);
  }
  return p;
}

/* espeak-ng модулі бір рет жасалып, қайта қолданылады (18 МБ деректі әр жолы оқымау үшін) */
type PhonemizeModule = { callMain: (args: string[]) => void };
let modP: Promise<PhonemizeModule> | null = null;
let onLine: ((line: string) => void) | null = null;
let onErr: ((line: string) => void) | null = null;
let queue: Promise<unknown> = Promise.resolve();

function phonemizer() {
  modP ??= import('../vendor/piper_phonemize.js').then(({ createPiperPhonemize }) =>
    createPiperPhonemize({
      print: (line: string) => onLine?.(line),
      printErr: (line: string) => onErr?.(line),
      locateFile: (f: string) => (f.endsWith('.wasm') ? '/piper/piper_phonemize.wasm' : f.endsWith('.data') ? '/piper/piper_phonemize.data' : f),
    }),
  );
  modP.catch(() => (modP = null));
  return modP;
}

/** espeak-ng арқылы мәтінді фонема id-леріне айналдыру (кезекпен, бір модульде) */
export function phonemize(text: string, espeakVoice: string): Promise<number[]> {
  const job = queue.then(async () => {
    const mod = await phonemizer();
    return new Promise<number[]>((resolve, reject) => {
      onLine = (line) => {
        try {
          resolve(JSON.parse(line).phoneme_ids as number[]);
        } catch (e) {
          reject(e);
        }
      };
      onErr = (line) => reject(new Error(line));
      try {
        mod.callMain(['-l', espeakVoice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
      } catch (e) {
        // Emscripten бағдарлама аяқталғанда ExitStatus лақтыруы мүмкін — нәтиже print арқылы келеді
        if (!(e && typeof e === 'object' && 'status' in e)) reject(e);
      }
    });
  });
  queue = job.catch(() => undefined);
  return job;
}

function toWav(samples: Float32Array, rate: number) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/** Мәтінді WAV дыбысқа айналдыру. lengthScale > 1 — баяуырақ */
export async function synthesize(text: string, v: PiperVoice, lengthScale = 1): Promise<Blob> {
  const { session, cfg } = await loadSession(v);
  const o = await ort();
  const ids = await phonemize(text, cfg.espeak.voice);
  const feeds: Record<string, import('onnxruntime-web').Tensor> = {
    input: new o.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    input_lengths: new o.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new o.Tensor('float32', Float32Array.from([cfg.inference.noise_scale, cfg.inference.length_scale * lengthScale, cfg.inference.noise_w]), [3]),
  };
  if (cfg.speaker_id_map && Object.keys(cfg.speaker_id_map).length) feeds.sid = new o.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const out = await session.run(feeds);
  const data = out.output.data as Float32Array;
  return toWav(data, cfg.audio.sample_rate);
}
