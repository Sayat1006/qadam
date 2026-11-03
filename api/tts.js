/*
 * Қазақша дауыстау: ISSAI Soyle API (soyle.nu.edu.kz) арқылы.
 * Кілт тек серверде сақталады: Vercel → Settings → Environment Variables → SOYLE_TOKEN.
 * Жауап Vercel CDN-де кэштеледі — бірдей сөйлем қайта синтезделмейді (таңба үнемделеді).
 */
const SOYLE_URL = 'https://soyle.nu.edu.kz/external-api/v1/translate/text/';
const MAX_LEN = 400;
const ALLOWED = /^(https?:\/\/)?(localhost(:\d+)?|qadamda\.vercel\.app|[a-z0-9-]+\.vercel\.app)(\/|$)/i;

function detectType(bytes) {
  const b = bytes.subarray(0, 4);
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return 'audio/wav';
  if (b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return 'audio/ogg';
  if ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  return 'audio/wav';
}

export async function GET(request) {
  const url = new URL(request.url);
  const text = (url.searchParams.get('text') || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
  const voice = url.searchParams.get('voice') === 'male' ? 'male' : 'female';
  const lang = url.searchParams.get('lang') === 'eng' ? 'eng' : 'kaz';

  if (!text) return new Response('text required', { status: 400 });
  const token = process.env.SOYLE_TOKEN;
  if (!token) return new Response('tts not configured', { status: 503, headers: { 'Cache-Control': 'no-store' } });

  // Тек өз сайтымыздан келген сұраныстар (бөтен сайттар таңба лимитін жұмсамасын)
  const from = request.headers.get('origin') || request.headers.get('referer') || '';
  if (from && !ALLOWED.test(from.replace(/^https?:\/\//, ''))) return new Response('forbidden', { status: 403 });

  let r;
  try {
    r = await fetch(SOYLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ source_language: lang, target_language: lang, text, output_format: 'audio', output_voice: voice }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return new Response('upstream unreachable', { status: 504, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!r.ok) {
    const status = r.status === 401 || r.status === 403 ? 502 : r.status === 402 ? 402 : 502;
    return new Response(`upstream ${r.status}`, { status, headers: { 'Cache-Control': 'no-store' } });
  }
  const data = await r.json().catch(() => ({}));
  const enc = typeof data.audio === 'string' ? data.audio.trim() : '';
  if (!enc) return new Response('empty audio', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  const bytes = /^[0-9a-f]+$/i.test(enc) ? Buffer.from(enc, 'hex') : Buffer.from(enc.replace(/^data:[^,]+,/, ''), 'base64');

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': detectType(bytes),
      'Cache-Control': 'public, max-age=604800, s-maxage=31536000, immutable',
    },
  });
}
