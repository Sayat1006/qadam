import { pick, rand, sample, shuffle } from '../lib/random';
import { opt, textOptions } from './helpers';
import type { Subject, Task } from './types';

/** Сөздік: сөз, сурет, буындар */
export const words = [
  { w: 'алма', e: '🍎', s: ['ал', 'ма'] },
  { w: 'мысық', e: '🐱', s: ['мы', 'сық'] },
  { w: 'ит', e: '🐶', s: ['ит'] },
  { w: 'үй', e: '🏠', s: ['үй'] },
  { w: 'күн', e: '☀️', s: ['күн'] },
  { w: 'ай', e: '🌙', s: ['ай'] },
  { w: 'бала', e: '🧒', s: ['ба', 'ла'] },
  { w: 'доп', e: '⚽', s: ['доп'] },
  { w: 'кітап', e: '📖', s: ['кі', 'тап'] },
  { w: 'балық', e: '🐟', s: ['ба', 'лық'] },
  { w: 'қоян', e: '🐰', s: ['қо', 'ян'] },
  { w: 'аю', e: '🐻', s: ['а', 'ю'] },
  { w: 'түйе', e: '🐫', s: ['тү', 'йе'] },
  { w: 'жылқы', e: '🐴', s: ['жыл', 'қы'] },
  { w: 'сиыр', e: '🐄', s: ['си', 'ыр'] },
  { w: 'қой', e: '🐑', s: ['қой'] },
  { w: 'гүл', e: '🌸', s: ['гүл'] },
  { w: 'ағаш', e: '🌳', s: ['а', 'ғаш'] },
  { w: 'нан', e: '🍞', s: ['нан'] },
  { w: 'сүт', e: '🥛', s: ['сүт'] },
  { w: 'құс', e: '🐦', s: ['құс'] },
  { w: 'көлік', e: '🚗', s: ['кө', 'лік'] },
  { w: 'қасық', e: '🥄', s: ['қа', 'сық'] },
  { w: 'жұлдыз', e: '⭐', s: ['жұл', 'дыз'] },
  { w: 'көбелек', e: '🦋', s: ['кө', 'бе', 'лек'] },
  { w: 'тасбақа', e: '🐢', s: ['тас', 'ба', 'қа'] },
  { w: 'қарындаш', e: '✏️', s: ['қа', 'рын', 'даш'] },
  { w: 'сағат', e: '⏰', s: ['са', 'ғат'] },
  { w: 'піл', e: '🐘', s: ['піл'] },
  { w: 'арыстан', e: '🦁', s: ['а', 'рыс', 'тан'] },
  { w: 'түлкі', e: '🦊', s: ['түл', 'кі'] },
  { w: 'қасқыр', e: '🐺', s: ['қас', 'қыр'] },
  { w: 'тышқан', e: '🐭', s: ['тыш', 'қан'] },
  { w: 'ешкі', e: '🐐', s: ['еш', 'кі'] },
  { w: 'бүркіт', e: '🦅', s: ['бүр', 'кіт'] },
  { w: 'жаңбыр', e: '🌧️', s: ['жаң', 'быр'] },
  { w: 'қар', e: '❄️', s: ['қар'] },
  { w: 'әтеш', e: '🐓', s: ['ә', 'теш'] },
  { w: 'сәбіз', e: '🥕', s: ['сә', 'біз'] },
];

const LETTERS = 'АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯ'.split('');
const VOWELS = new Set('аәеёиоөуұүыіэюя'.split(''));
const KZ_SPECIAL = 'ӘҒҚҢӨҰҮҺІ'.split('');

/* ---------- 1-деңгей: дыбыс пен әріп ---------- */

function firstLetter(): Task {
  const w = pick(words);
  const first = w.w[0].toUpperCase();
  const pool = LETTERS.filter((l) => l !== first && !'ЁЪЬЩЦЭФХҺЧ'.includes(l));
  return {
    kind: 'choice',
    topic: 'firstletter',
    prompt: `Суретте не бейнеленген? Бұл сөз қай әріптен басталады?`,
    visual: { type: 'emoji', value: w.e, size: 'xl' },
    options: textOptions(first, sample(pool, 2)),
    answer: first,
    hints: [
      'Сурет атауын дауыстап, баяу айтып көр.',
      `Бұл — «${w.w}». Алғашқы дыбысқа құлақ сал.`,
      `«${w.w}» сөзі ${first} әрпінен басталады.`,
    ],
  };
}

function findVowel(): Task {
  const vowelsU = 'АӘЕОӨҰҮЫІ'.split('');
  const consonants = 'БДЖЗКҚЛМНПРСТШ'.split('');
  const v = pick(vowelsU);
  const cs = sample(consonants, 2);
  return {
    kind: 'choice',
    topic: 'vowels',
    prompt: 'Дауысты дыбысты белгілейтін әріпті тап.',
    options: textOptions(v, cs),
    answer: v,
    hints: [
      'Дауысты дыбысты созып айтуға болады: а-а-а, о-о-о.',
      'Әр әріпті созып айтып көр. Қайсысы ұзақ созылады?',
      `${v} — дауысты дыбыс.`,
    ],
  };
}

function kzLetter(): Task {
  const l = pick(KZ_SPECIAL.filter((x) => words.some((w) => w.w.toUpperCase().includes(x))));
  const w = pick(words.filter((x) => x.w.toUpperCase().includes(l)));
  const others = sample(
    words.filter((x) => !x.w.toUpperCase().includes(l)),
    2,
  );
  const options = shuffle([w, ...others]).map((x) => opt(x.w, x.e));
  return {
    kind: 'choice',
    topic: 'kzletters',
    prompt: `Қай сөзде ${l} әрпі бар?`,
    options,
    answer: w.w,
    hints: [
      `${l} — қазақ тіліне тән әріп.`,
      'Әр сөзді әріптеп оқып шық.',
      `«${w.w}» сөзінде ${l} бар.`,
    ],
  };
}

/* ---------- 2-деңгей: буын ---------- */

function countSyllables(): Task {
  const w = pick(words);
  const n = w.s.length;
  return {
    kind: 'choice',
    topic: 'syllables',
    prompt: `«${w.w}» сөзінде неше буын бар?`,
    visual: { type: 'emoji', value: w.e, size: 'lg' },
    options: [opt('1'), opt('2'), opt('3')],
    answer: String(n),
    hints: [
      'Сөзді айтып, әр буынға алақаныңды соқ.',
      'Сөзде қанша дауысты дыбыс болса, сонша буын болады.',
      `${w.s.join(' - ')} — ${n} буын.`,
    ],
  };
}

function buildFromSyllables(): Task {
  const w = pick(words.filter((x) => x.s.length >= 2));
  return {
    kind: 'order',
    topic: 'syllableorder',
    prompt: `Буындарды ретімен басып, «${w.e}» сөзін құра.`,
    visual: { type: 'emoji', value: w.e, size: 'lg' },
    items: w.s.map((s, i) => opt(s, undefined, `${i}-${s}`)),
    hints: ['Сурет атауын баяу айт.', `Сөз «${w.s[0]}» буынынан басталады.`, `Дұрыс жауап: ${w.s.join('-')}.`],
  };
}

/* ---------- 3-деңгей: сөз оқу ---------- */

function readWord(): Task {
  const w = pick(words);
  const others = sample(
    words.filter((x) => x !== w),
    2,
  );
  return {
    kind: 'choice',
    topic: 'readword',
    prompt: 'Сөзді оқы да, сәйкес суретті тап.',
    visual: { type: 'text', value: w.w.toUpperCase() },
    layout: 'big',
    options: shuffle([w, ...others]).map((x) => opt(x.e, undefined, x.w)),
    answer: w.w,
    hints: ['Сөзді буынға бөліп оқы.', `${w.s.join(' - ')}`, `Бұл — ${w.e}.`],
  };
}

function buildWord(): Task {
  const w = pick(words.filter((x) => x.w.length >= 3 && x.w.length <= 5));
  return {
    kind: 'order',
    topic: 'buildword',
    prompt: `Әріптерді ретімен басып, сөзді құра.`,
    visual: { type: 'emoji', value: w.e, size: 'lg' },
    items: w.w.split('').map((ch, i) => opt(ch.toUpperCase(), undefined, `${i}-${ch}`)),
    hints: ['Сурет атауын баяу, дыбыстап айт.', `Бірінші әріп — ${w.w[0].toUpperCase()}.`, `Сөз: ${w.w.toUpperCase()}.`],
  };
}

function missingLetter(): Task {
  const w = pick(words.filter((x) => x.w.length >= 3));
  const idx = rand(0, w.w.length - 1);
  const ch = w.w[idx];
  const masked = w.w.slice(0, idx) + '_' + w.w.slice(idx + 1);
  const isV = VOWELS.has(ch);
  const pool = (isV ? 'аәеоөұүыі' : 'бдгжзкқлмнңпрстш').split('').filter((x) => x !== ch);
  return {
    kind: 'choice',
    topic: 'missingletter',
    prompt: 'Қай әріп түсіп қалған?',
    visual: { type: 'text', value: `${w.e} ${masked.toUpperCase()}` },
    options: textOptions(ch.toUpperCase(), sample(pool, 2).map((x) => x.toUpperCase())),
    answer: ch.toUpperCase(),
    hints: ['Сурет атауын дауыстап айт.', `Сөз — «${w.w}». Бос орынға қай дыбыс келеді?`, `Түсіп қалған әріп: ${ch.toUpperCase()}.`],
  };
}

/* ---------- 4-деңгей: көптік жалғау, сөйлем ---------- */

const BACK = new Set('аоұыяю'.split(''));
const FRONT = new Set('әеөүіэи'.split(''));

export function plural(word: string): string {
  let back = true;
  for (let i = word.length - 1; i >= 0; i--) {
    const c = word[i];
    if (BACK.has(c)) {
      back = true;
      break;
    }
    if (FRONT.has(c)) {
      back = false;
      break;
    }
  }
  const last = word[word.length - 1];
  let type: 'l' | 'd' | 't';
  if (VOWELS.has(last) || 'руй'.includes(last)) type = 'l';
  else if ('лмнңзж'.includes(last)) type = 'd';
  else type = 't';
  const suf = { l: back ? 'лар' : 'лер', d: back ? 'дар' : 'дер', t: back ? 'тар' : 'тер' }[type];
  return word + suf;
}

function pluralTask(): Task {
  const w = pick(words.filter((x) => !['күн', 'ай', 'қар', 'сүт', 'нан', 'жаңбыр'].includes(x.w)));
  const right = plural(w.w);
  const back = right.endsWith('ар');
  const all = back ? ['лар', 'дар', 'тар'] : ['лер', 'дер', 'тер'];
  const wrong = all.map((s) => w.w + s).filter((x) => x !== right);
  return {
    kind: 'choice',
    topic: 'plural',
    prompt: `«${w.w}» сөзін көпше түрде дұрыс жаз.`,
    visual: { type: 'emoji', value: `${w.e}${w.e}${w.e}`, size: 'lg' },
    options: textOptions(right, wrong),
    answer: right,
    hints: [
      'Сөздің соңғы дыбысына қара: дауысты ма, қатаң ба, үнді ме?',
      back ? 'Бұл — жуан сөз (а, о, ұ, ы), сондықтан -лар, -дар, -тар.' : 'Бұл — жіңішке сөз (ә, е, ө, ү, і), сондықтан -лер, -дер, -тер.',
      `Дұрысы: ${right}.`,
    ],
  };
}

const sentences = [
  ['Бала', 'кітап', 'оқиды.'],
  ['Мысық', 'сүт', 'ішеді.'],
  ['Апам', 'нан', 'пісірді.'],
  ['Құс', 'аспанда', 'ұшады.'],
  ['Біз', 'мектепке', 'барамыз.'],
  ['Ит', 'үйді', 'күзетеді.'],
  ['Мен', 'алма', 'жеймін.'],
  ['Ерлан', 'доп', 'ойнайды.'],
  ['Көктемде', 'гүлдер', 'ашылады.'],
  ['Әкем', 'жұмысқа', 'кетті.'],
];

function sentenceOrder(): Task {
  const s = pick(sentences);
  return {
    kind: 'order',
    topic: 'sentence',
    prompt: 'Сөздерді ретімен басып, сөйлем құра.',
    items: s.map((x, i) => opt(x, undefined, `${i}-${x}`)),
    hints: [
      'Сөйлем кім немесе не туралы екенін ойла — ол бірінші тұрады.',
      `Сөйлем «${s[0]}» сөзінен басталады. Нүкте қойылған сөз — соңында.`,
      `Дұрыс сөйлем: ${s.join(' ')}`,
    ],
  };
}

const sentencePics = [
  { s: 'Бала доп ойнап жүр.', e: '⚽', wrong: ['🍞', '🛏️'] },
  { s: 'Қыз гүл суарып тұр.', e: '🌸', wrong: ['🚗', '🐟'] },
  { s: 'Ата балық аулап отыр.', e: '🎣', wrong: ['📖', '🍎'] },
  { s: 'Апа шай құйып отыр.', e: '🍵', wrong: ['⚽', '🐴'] },
  { s: 'Мысық төсекте ұйықтап жатыр.', e: '😴', wrong: ['🏃', '🍦'] },
  { s: 'Далада қар жауып тұр.', e: '❄️', wrong: ['☀️', '🌸'] },
];

function sentencePic(): Task {
  const s = pick(sentencePics);
  return {
    kind: 'choice',
    topic: 'readsentence',
    prompt: 'Сөйлемді оқы. Оған қай сурет сәйкес келеді?',
    visual: { type: 'text', value: s.s },
    layout: 'big',
    options: shuffle([s.e, ...s.wrong]).map((e) => opt(e)),
    answer: s.e,
    hints: ['Сөйлемді баяу, сөзбе-сөз оқы.', 'Сөйлемде не істеліп жатыр? Сол әрекетті тап.', `Сәйкес сурет: ${s.e}`],
  };
}

/* ---------- 5-деңгей: мәтінмен жұмыс, мағына ---------- */

const texts = [
  {
    text: 'Айгүл бақшаға барды. Онда қызыл алма өсіп тұр екен. Айгүл үш алма теріп, анасына әкелді. Анасы қуанып, қызына рахмет айтты.',
    qs: [
      { q: 'Айгүл қайда барды?', a: 'бақшаға', w: ['дүкенге', 'мектепке'] },
      { q: 'Айгүл неше алма терді?', a: 'үш', w: ['бір', 'бес'] },
      { q: 'Анасы не айтты?', a: 'рахмет', w: ['кешір', 'сау бол'] },
    ],
  },
  {
    text: 'Күз келді. Ағаштардың жапырағы сарғайды. Құстар жылы жаққа ұшып кетті. Күн суытқандықтан, Ерлан жылы күртешесін киді.',
    qs: [
      { q: 'Қай жыл мезгілі туралы айтылған?', a: 'күз', w: ['көктем', 'жаз'] },
      { q: 'Құстар қайда ұшты?', a: 'жылы жаққа', w: ['тауға', 'қалаға'] },
      { q: 'Ерлан неге күртеше киді?', a: 'күн суытқандықтан', w: ['жаңбыр жауғандықтан', 'мерекеге барғандықтан'] },
    ],
  },
  {
    text: 'Нұрлан ағасымен балық аулауға барды. Олар өзеннің жағасында ұзақ отырды. Ақыры Нұрлан үлкен балық ұстады. Ағасы оны мақтады.',
    qs: [
      { q: 'Нұрлан кіммен барды?', a: 'ағасымен', w: ['әкесімен', 'досымен'] },
      { q: 'Олар қайда отырды?', a: 'өзеннің жағасында', w: ['үйде', 'орманда'] },
      { q: 'Ағасы не істеді?', a: 'мақтады', w: ['ұрсты', 'ұйықтады'] },
    ],
  },
  {
    text: 'Мадина мектепке ерте келді. Сыныпта ешкім жоқ еді. Ол гүлдерді суарып, тақтаны сүртті. Мұғалім келіп, Мадинаның еңбегін көріп, қуанды.',
    qs: [
      { q: 'Мадина мектепке қашан келді?', a: 'ерте', w: ['кеш', 'түсте'] },
      { q: 'Мадина не істеді?', a: 'гүлдерді суарды', w: ['доп ойнады', 'тамақ ішті'] },
      { q: 'Мұғалім неге қуанды?', a: 'Мадинаның еңбегін көрді', w: ['сыйлық алды', 'демалысқа шықты'] },
    ],
  },
];

function textTask(): Task {
  const t = pick(texts);
  const q = pick(t.qs);
  return {
    kind: 'choice',
    topic: 'textread',
    prompt: q.q,
    visual: { type: 'text', value: t.text },
    layout: 'list',
    options: textOptions(q.a, q.w),
    answer: q.a,
    hints: ['Мәтінді тағы бір рет баяу оқы.', 'Сұрақтағы негізгі сөзді мәтіннен ізде.', `Жауабы: ${q.a}.`],
  };
}

const antonyms: [string, string][] = [
  ['үлкен', 'кіші'],
  ['ыстық', 'суық'],
  ['ұзын', 'қысқа'],
  ['ақ', 'қара'],
  ['жоғары', 'төмен'],
  ['ашық', 'жабық'],
  ['тез', 'баяу'],
  ['ауыр', 'жеңіл'],
  ['жақын', 'алыс'],
  ['күндіз', 'түнде'],
  ['көңілді', 'мұңды'],
];

function antonymTask(): Task {
  const [a, b] = pick(antonyms);
  const reverse = rand(0, 1) === 1;
  const q = reverse ? b : a;
  const ans = reverse ? a : b;
  const wrong = sample(
    antonyms.filter(([x]) => x !== a).map(([x, y]) => (rand(0, 1) ? x : y)),
    2,
  );
  return {
    kind: 'choice',
    topic: 'antonyms',
    prompt: `«${q}» сөзіне мағынасы қарама-қарсы сөзді тап.`,
    options: textOptions(ans, wrong),
    answer: ans,
    hints: [
      'Қарама-қарсы сөз — мүлдем керісінше мағына (мысалы, күлу — жылау).',
      `«${q}» болмаса, онда қандай болады?`,
      `«${q}» — «${ans}».`,
    ],
  };
}

function matchAntonyms(): Task {
  const pairs = sample(antonyms, 4);
  return {
    kind: 'match',
    topic: 'antonympairs',
    prompt: 'Қарама-қарсы мағыналы сөздерді жұптастыр.',
    pairs: pairs.map(([a, b]) => [opt(a, undefined, 'a-' + a), opt(b, undefined, 'b-' + b)]),
    hints: ['Алдымен бір сөзді таңда, сосын оның қарама-қарсысын бас.', `Мысалы: «${pairs[0][0]}» — «${pairs[0][1]}».`, pairs.map((p) => p.join(' — ')).join('; ')],
  };
}

export const kazakh: Subject = {
  id: 'kazakh',
  title: 'Қазақ тілі',
  emoji: '🔤',
  color: '#c0703f',
  about: 'Сауат ашу, дыбыс пен әріп, оқу, сөйлем, мәтінді түсіну',
  homeTip: 'Күн сайын 5 минут бірге кітап оқыңыз. Көшедегі жазуларды, азық-түлік қаптамасындағы сөздерді бірге оқып көріңіз.',
  levels: [
    {
      level: 1,
      title: 'Дыбыс пен әріп',
      goal: 'Сөздің бірінші дыбысын ажырату, дауысты дыбыстарды тану, қазақ тіліне тән әріптер',
      topics: [
        { id: 'firstletter', title: 'Бірінші әріп', gen: firstLetter },
        { id: 'vowels', title: 'Дауысты дыбыстар', gen: findVowel },
        { id: 'kzletters', title: 'Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, І', gen: kzLetter },
      ],
    },
    {
      level: 2,
      title: 'Буын әлемі',
      goal: 'Сөзді буынға бөлу, буындардан сөз құрау',
      topics: [
        { id: 'syllables', title: 'Буын санау', gen: countSyllables },
        { id: 'syllableorder', title: 'Буыннан сөз', gen: buildFromSyllables },
        { id: 'firstletter', title: 'Бірінші әріп', gen: firstLetter },
      ],
    },
    {
      level: 3,
      title: 'Сөз оқимын',
      goal: 'Сөзді оқып түсіну, әріптерден сөз құрау, түсіп қалған әріпті табу',
      topics: [
        { id: 'readword', title: 'Сөз оқу', gen: readWord },
        { id: 'buildword', title: 'Сөз құрау', gen: buildWord },
        { id: 'missingletter', title: 'Түсіп қалған әріп', gen: missingLetter },
      ],
    },
    {
      level: 4,
      title: 'Сөйлем құраймын',
      goal: 'Сөйлем құрау, сөйлемді оқып түсіну, көптік жалғауы',
      topics: [
        { id: 'sentence', title: 'Сөйлем құрау', gen: sentenceOrder },
        { id: 'readsentence', title: 'Сөйлем оқу', gen: sentencePic },
        { id: 'plural', title: 'Көптік жалғау', gen: pluralTask },
      ],
    },
    {
      level: 5,
      title: 'Мәтінмен жұмыс',
      goal: 'Шағын мәтінді оқып, сұраққа жауап беру; қарама-қарсы мағыналы сөздер',
      topics: [
        { id: 'textread', title: 'Мәтін оқу', gen: textTask },
        { id: 'antonyms', title: 'Қарама-қарсы сөздер', gen: antonymTask },
        { id: 'antonympairs', title: 'Сөз жұптары', gen: matchAntonyms },
      ],
    },
  ],
};
