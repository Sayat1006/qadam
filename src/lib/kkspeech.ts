/*
 * Мәтінді дауыстауға дайындау: ISSAI синтезаторы тек әріп пен тыныс белгісін
 * қабылдайды, сондықтан сандар мен белгілер қазақша сөзге айналдырылады.
 */
const UNITS = ['нөл', 'бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз'];
const TENS = ['', 'он', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'];

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const out: string[] = [];
  if (h) out.push(h === 1 ? 'жүз' : `${UNITS[h]} жүз`);
  if (t) out.push(TENS[t]);
  if (u) out.push(UNITS[u]);
  return out.join(' ');
}

export function kkNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n < 0) return 'минус ' + kkNumber(-n);
  if (n === 0) return 'нөл';
  if (n >= 1_000_000_000) return String(n).split('').map((d) => UNITS[+d]).join(' ');
  const mln = Math.floor(n / 1_000_000);
  const th = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const out: string[] = [];
  if (mln) out.push(`${below1000(mln)} миллион`);
  if (th) out.push(th === 1 ? 'мың' : `${below1000(th)} мың`);
  if (rest) out.push(below1000(rest));
  return out.join(' ');
}

const BACK = /[аоұыяю]/;
const FRONT = /[әеөүіэи]/;

/** Шығыс септік: екі → екіден, үш → үштен, он → оннан */
function ablative(word: string): string {
  let back = true;
  for (let i = word.length - 1; i >= 0; i--) {
    if (BACK.test(word[i])) {
      back = true;
      break;
    }
    if (FRONT.test(word[i])) {
      back = false;
      break;
    }
  }
  const last = word[word.length - 1];
  const vowel = /[аәеиоөуұүыіэюя]/.test(last);
  const suf = vowel || /[рлзжйу]/.test(last) ? 'да' : /[мнң]/.test(last) ? 'на' : 'та';
  return word + suf.replace('а', back ? 'а' : 'е') + 'н';
}

function harmonyBack(word: string) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (BACK.test(word[i])) return true;
    if (FRONT.test(word[i])) return false;
  }
  return true;
}
const VOICELESS = /[птксшқфхцчщ]$/;

/** Сан сөзіне жалғауды үндестік бойынша қайта жалғау: «он бес» + «-де» → «он бесте» */
function attachSuffix(word: string, suffix: string): string {
  const back = harmonyBack(word);
  const sfx = suffix.toLowerCase();
  if (/^(да|де|та|те)$/.test(sfx)) return word + (VOICELESS.test(word) ? 'т' : 'д') + (back ? 'а' : 'е');
  if (/^(дан|ден|тан|тен|нан|нен)$/.test(sfx)) return ablative(word);
  if (/^(ға|ге|қа|ке)$/.test(sfx)) return word + (VOICELESS.test(word) ? (back ? 'қа' : 'ке') : back ? 'ға' : 'ге');
  return word + ' ' + suffix;
}

export function isLatin(text: string) {
  return /[a-z]/i.test(text) && !/[а-яәғқңөұүһі]/i.test(text);
}

export function normalizeKk(input: string): string {
  let s = input
    // эмодзилер
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ')
    .replace(/[«»"“”]/g, '');
  // уақыт 9:15 (жалғауымен: 9:15-де → тоғыз он бесте)
  const timeWords = (h: string, m: string) => `${kkNumber(+h)}${+m ? ' ' + kkNumber(+m) : ''}`;
  s = s.replace(/\b(\d{1,2}):(\d{2})-([а-яәғқңөұүһі]+)/gi, (_, h, m, suf) => attachSuffix(timeWords(h, m), suf));
  s = s.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => timeWords(h, m));
  // сан + жалғау: 5-ке, 10-нан
  s = s.replace(/(\d+)-(да|де|та|те|дан|ден|тан|тен|нан|нен|ға|ге|қа|ке)(?![а-яәғқңөұүһі])/gi, (_, n, suf) => attachSuffix(kkNumber(+n), suf));
  // бөлшек 3/4 → төрттен үш
  s = s.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, a, b) => `${ablative(kkNumber(+b))} ${kkNumber(+a)}`);
  // ақша, пайыз
  s = s.replace(/(\d)\s*₸/g, '$1 теңге').replace(/₸/g, 'теңге').replace(/(\d)\s*%/g, '$1 пайыз');
  // амалдар (айналасында бос орын бар кезде)
  s = s
    .replace(/\s\+\s/g, ' қосу ')
    .replace(/\s[−–-]\s/g, ' алу ')
    .replace(/\s[×x]\s/g, ' көбейту ')
    .replace(/\s:\s/g, ' бөлу ')
    .replace(/=\s*\?/g, ' тең неше')
    .replace(/\s=\s/g, ' тең ')
    .replace(/\s>\s/g, ' үлкен ')
    .replace(/\s<\s/g, ' кіші ')
    .replace(/\?\s*,/g, 'неше,')
    .replace(/,\s*\?/g, ', неше')
    .replace(/\+\s*\?/g, 'қосу неше')
    .replace(/(^|\s)\?(?=\s)/g, '$1неше');
  // «5-деңгей» → «бесінші деңгей» емес, қарапайым: «бес деңгей»
  s = s.replace(/(\d+)-(?=[а-яәғқңөұүһі])/gi, '$1 ');
  // қалған сандар
  s = s.replace(/\d+/g, (d) => kkNumber(parseInt(d, 10)));
  // қалған белгілер
  s = s.replace(/[_→↻✓✕•·]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
