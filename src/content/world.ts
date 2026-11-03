import { pick, sample, shuffle } from '../lib/random';
import { opt, textOptions } from './helpers';
import type { Subject, Task } from './types';

/* ---------- Көмекші конструкторлар ---------- */

interface Q {
  q: string;
  a: string;
  w: string[];
  e?: string; // көрнекі сурет
  why?: string;
  em?: Record<string, string>; // нұсқаларға сурет
}

export function bank(topic: string, qs: Q[]) {
  return (): Task => {
    const x = pick(qs);
    return {
      kind: 'choice',
      topic,
      prompt: x.q,
      visual: x.e ? { type: 'emoji', value: x.e, size: 'xl' } : undefined,
      options: textOptions(x.a, sample(x.w, Math.min(2, x.w.length)), x.em),
      answer: x.a,
      explain: x.why,
      hints: ['Сұрақты тағы бір рет мұқият оқы немесе тыңда.', x.why ?? 'Күнделікті өміріңнен мысал есіңе түсір.', `Дұрыс жауап: ${x.a}.`],
    };
  };
}

export function sorter(
  topic: string,
  prompt: string,
  groups: { id: string; label: string; emoji: string }[],
  items: { label: string; emoji: string; group: string }[],
  n = 6,
  rule = '',
) {
  return (): Task => {
    const per = Math.ceil(n / groups.length);
    const chosen = shuffle(groups.flatMap((g) => sample(items.filter((i) => i.group === g.id), per)));
    return {
      kind: 'sort',
      topic,
      prompt,
      groups: groups.map((g) => opt(g.label, g.emoji, g.id)),
      items: chosen.map((i) => ({ ...opt(i.label, i.emoji, i.label), group: i.group })),
      hints: ['Әр суретке қарап, ол туралы не білетініңді ойла.', rule || 'Бір топқа ұқсас заттар жиналады.', 'Қате болса, қайта таңдай аласың.'],
    };
  };
}

export function sequence(topic: string, prompt: string, seqs: { label: string; emoji?: string }[][], take?: number) {
  return (): Task => {
    let s = pick(seqs);
    if (take && s.length > take) {
      const start = Math.floor(Math.random() * (s.length - take + 1));
      s = s.slice(start, start + take);
    }
    return {
      kind: 'order',
      topic,
      prompt,
      items: s.map((x, i) => opt(x.label, x.emoji, `${i}-${x.label}`)),
      hints: ['Не бірінші болатынын ойла.', `Бірінші — «${s[0].label}».`, `Дұрыс рет: ${s.map((x) => x.label).join(' → ')}.`],
    };
  };
}

export function matcher(topic: string, prompt: string, pairs: [string, string, string?][], n = 4) {
  return (): Task => {
    const ps = sample(pairs, n);
    return {
      kind: 'match',
      topic,
      prompt,
      pairs: ps.map(([a, b, e]) => [opt(a, e, 'a-' + a), opt(b, undefined, 'b-' + b)]),
      hints: ['Сол жақтан біреуін таңда, сосын оған сәйкесін оң жақтан бас.', `Мысалы: ${ps[0][0]} — ${ps[0][1]}.`, ps.map((p) => `${p[0]} — ${p[1]}`).join('; ')],
    };
  };
}

/* ---------- Мазмұн ---------- */

const animals = sorter(
  'animals',
  'Жануарларды топқа бөл: үй жануарлары және жабайы жануарлар.',
  [
    { id: 'home', label: 'Үй жануарлары', emoji: '🏡' },
    { id: 'wild', label: 'Жабайы жануарлар', emoji: '🌲' },
  ],
  [
    { label: 'сиыр', emoji: '🐄', group: 'home' },
    { label: 'қой', emoji: '🐑', group: 'home' },
    { label: 'жылқы', emoji: '🐴', group: 'home' },
    { label: 'түйе', emoji: '🐫', group: 'home' },
    { label: 'ешкі', emoji: '🐐', group: 'home' },
    { label: 'мысық', emoji: '🐱', group: 'home' },
    { label: 'тауық', emoji: '🐔', group: 'home' },
    { label: 'қасқыр', emoji: '🐺', group: 'wild' },
    { label: 'түлкі', emoji: '🦊', group: 'wild' },
    { label: 'аю', emoji: '🐻', group: 'wild' },
    { label: 'арыстан', emoji: '🦁', group: 'wild' },
    { label: 'піл', emoji: '🐘', group: 'wild' },
    { label: 'қоян', emoji: '🐰', group: 'wild' },
  ],
  6,
  'Үй жануарлары адаммен бірге тұрады, адам оларға қарайды. Жабайы жануарлар орманда, далада өз бетімен тіршілік етеді.',
);

const fruitVeg = sorter(
  'fruitveg',
  'Жемістер мен көкөністерді бөліп сал.',
  [
    { id: 'fruit', label: 'Жемістер', emoji: '🧺' },
    { id: 'veg', label: 'Көкөністер', emoji: '🥗' },
  ],
  [
    { label: 'алма', emoji: '🍎', group: 'fruit' },
    { label: 'алмұрт', emoji: '🍐', group: 'fruit' },
    { label: 'банан', emoji: '🍌', group: 'fruit' },
    { label: 'жүзім', emoji: '🍇', group: 'fruit' },
    { label: 'шие', emoji: '🍒', group: 'fruit' },
    { label: 'қарбыз', emoji: '🍉', group: 'fruit' },
    { label: 'сәбіз', emoji: '🥕', group: 'veg' },
    { label: 'қияр', emoji: '🥒', group: 'veg' },
    { label: 'картоп', emoji: '🥔', group: 'veg' },
    { label: 'қызанақ', emoji: '🍅', group: 'veg' },
    { label: 'пияз', emoji: '🧅', group: 'veg' },
    { label: 'қырыққабат', emoji: '🥬', group: 'veg' },
  ],
  6,
  'Жемістер көбіне тәтті, ағашта немесе бұтада өседі. Көкөністер бақшада, жерде немесе жер астында өседі.',
);

const animalSounds = bank('sounds', [
  { q: 'Ит қалай дыбыс шығарады?', a: 'үреді', w: ['мияулайды', 'кісінейді', 'маңырайды'], e: '🐶' },
  { q: 'Мысық қалай дыбыс шығарады?', a: 'мияулайды', w: ['үреді', 'мөңірейді', 'кісінейді'], e: '🐱' },
  { q: 'Жылқы қалай дыбыс шығарады?', a: 'кісінейді', w: ['мияулайды', 'үреді', 'маңырайды'], e: '🐴' },
  { q: 'Қой қалай дыбыс шығарады?', a: 'маңырайды', w: ['кісінейді', 'үреді', 'мияулайды'], e: '🐑' },
  { q: 'Сиыр қалай дыбыс шығарады?', a: 'мөңірейді', w: ['мияулайды', 'кісінейді', 'үреді'], e: '🐄' },
  { q: 'Жануардың төлі кім? Сиырдың баласы —', a: 'бұзау', w: ['қозы', 'құлын', 'лақ'], e: '🐄' },
  { q: 'Қойдың баласы —', a: 'қозы', w: ['бұзау', 'бота', 'құлын'], e: '🐑' },
  { q: 'Жылқының баласы —', a: 'құлын', w: ['лақ', 'қозы', 'бота'], e: '🐴' },
  { q: 'Түйенің баласы —', a: 'бота', w: ['құлын', 'бұзау', 'қозы'], e: '🐫' },
]);

const seasonsQ = bank('seasons', [
  { q: 'Суретте қай жыл мезгілі?', a: 'қыс', w: ['жаз', 'көктем', 'күз'], e: '⛄❄️' },
  { q: 'Суретте қай жыл мезгілі?', a: 'көктем', w: ['қыс', 'күз', 'жаз'], e: '🌷🐣' },
  { q: 'Суретте қай жыл мезгілі?', a: 'жаз', w: ['қыс', 'күз', 'көктем'], e: '☀️🏖️' },
  { q: 'Суретте қай жыл мезгілі?', a: 'күз', w: ['жаз', 'көктем', 'қыс'], e: '🍂🍁' },
  { q: 'Қай мезгілде ағаштар жапырағын төгеді?', a: 'күзде', w: ['жазда', 'көктемде'], e: '🍂' },
  { q: 'Қай мезгілде қар жауады?', a: 'қыста', w: ['жазда', 'күзде'], e: '❄️' },
  { q: 'Наурыз мерекесі қай мезгілде тойланады?', a: 'көктемде', w: ['қыста', 'күзде'], e: '🌷', why: 'Наурыз — 22 наурызда, көктемде тойланады.' },
]);

const seasonsOrder = sequence('seasonorder', 'Жыл мезгілдерін ретімен қой (қыстан бастап).', [
  [
    { label: 'қыс', emoji: '❄️' },
    { label: 'көктем', emoji: '🌷' },
    { label: 'жаз', emoji: '☀️' },
    { label: 'күз', emoji: '🍂' },
  ],
]);

const dayParts = sequence('dayparts', 'Тәулік бөліктерін ретімен қой.', [
  [
    { label: 'таң', emoji: '🌅' },
    { label: 'күндіз', emoji: '☀️' },
    { label: 'кеш', emoji: '🌇' },
    { label: 'түн', emoji: '🌙' },
  ],
]);

const weekDays = sequence(
  'weekdays',
  'Апта күндерін ретімен қой.',
  [
    [
      { label: 'Дүйсенбі' },
      { label: 'Сейсенбі' },
      { label: 'Сәрсенбі' },
      { label: 'Бейсенбі' },
      { label: 'Жұма' },
      { label: 'Сенбі' },
      { label: 'Жексенбі' },
    ],
  ],
  4,
);

const senses = matcher('senses', 'Мүше мен оның қызметін жұптастыр.', [
  ['көз', 'көреміз', '👁️'],
  ['құлақ', 'естиміз', '👂'],
  ['мұрын', 'иіс сеземіз', '👃'],
  ['тіл', 'дәм татамыз', '👅'],
  ['қол', 'ұстаймыз', '✋'],
  ['аяқ', 'жүреміз', '🦶'],
]);

const professions = matcher('jobs', 'Мамандық пен оның жұмысын жұптастыр.', [
  ['дәрігер', 'науқасты емдейді', '👩‍⚕️'],
  ['мұғалім', 'балаларды оқытады', '👩‍🏫'],
  ['аспаз', 'тамақ пісіреді', '🧑‍🍳'],
  ['өрт сөндіруші', 'өртті сөндіреді', '🧑‍🚒'],
  ['құрылысшы', 'үй салады', '👷'],
  ['жүргізуші', 'көлік жүргізеді', '🚌'],
  ['шаштараз', 'шаш қияды', '💇'],
]);

const weather = bank('weather', [
  { q: 'Далада жаңбыр жауып тұр. Сыртқа не алып шығасың?', a: 'қолшатыр', w: ['күнқағар көзілдірік', 'шана'], e: '🌧️', em: { қолшатыр: '☂️', 'күнқағар көзілдірік': '🕶️', шана: '🛷' } },
  { q: 'Аяз, қар жауып тұр. Не киесің?', a: 'тон мен бөрік', w: ['шорт пен футболка', 'жүзу киімі'], e: '❄️' },
  { q: 'Күн ыстық. Не кию керек?', a: 'панама', w: ['жүн қолғап', 'тон'], e: '☀️' },
  { q: 'Жел соғып, суық болып тұр. Не кию керек?', a: 'күртеше', w: ['шорт', 'тәпішке'], e: '🌬️' },
]);

const plantGrowth = sequence('plantgrowth', 'Өсімдік қалай өседі? Ретімен қой.', [
  [
    { label: 'тұқым', emoji: '🫘' },
    { label: 'өскін', emoji: '🌱' },
    { label: 'гүл', emoji: '🌼' },
    { label: 'жеміс', emoji: '🍎' },
  ],
  [
    { label: 'жұмыртқа', emoji: '🥚' },
    { label: 'балапан', emoji: '🐣' },
    { label: 'тауық', emoji: '🐔' },
  ],
]);

const waterStates = bank('water', [
  { q: 'Су қатып қалса, ол неге айналады?', a: 'мұзға', w: ['буға', 'құмға'], e: '🧊', why: 'Суық кезде су қатып, қатты мұзға айналады.' },
  { q: 'Су қайнаса, неге айналады?', a: 'буға', w: ['мұзға', 'тасқа'], e: '♨️', why: 'Ыстық кезде су буланып, ауаға көтеріледі.' },
  { q: 'Мұзды жылы жерге қойса, не болады?', a: 'ериді', w: ['үлкейеді', 'жанып кетеді'], e: '🧊', why: 'Жылыда мұз еріп, қайтадан суға айналады.' },
  { q: 'Бұлттан не жауады?', a: 'жаңбыр', w: ['құм', 'жапырақ'], e: '☁️' },
]);

const kazakhstan = bank('kazakhstan', [
  { q: 'Қазақстанның астанасы қай қала?', a: 'Астана', w: ['Алматы', 'Шымкент', 'Ақтөбе'], e: '🏙️' },
  { q: 'Қазақстанның ең үлкен қаласы қайсы?', a: 'Алматы', w: ['Түркістан', 'Павлодар', 'Атырау'], e: '🏔️' },
  { q: 'Қазақстанның Туында не бейнеленген?', a: 'күн мен қыран', w: ['ай мен жұлдыз', 'ағаш пен өзен'], e: '🇰🇿' },
  { q: 'Тәуелсіздік күні қашан тойланады?', a: '16 желтоқсан', w: ['8 наурыз', '1 қыркүйек'], e: '🎉' },
  { q: 'Қазақтың ұлттық баспанасы —', a: 'киіз үй', w: ['зәулім үй', 'шатыр'], e: '⛺' },
  { q: 'Қазақтың ұлттық музыкалық аспабы —', a: 'домбыра', w: ['гитара', 'скрипка'], e: '🪕' },
]);

const livingSort = sorter(
  'living',
  'Тірі және өлі табиғатқа бөл.',
  [
    { id: 'alive', label: 'Тірі табиғат', emoji: '🌱' },
    { id: 'notalive', label: 'Өлі табиғат', emoji: '🪨' },
  ],
  [
    { label: 'ағаш', emoji: '🌳', group: 'alive' },
    { label: 'мысық', emoji: '🐱', group: 'alive' },
    { label: 'құс', emoji: '🐦', group: 'alive' },
    { label: 'гүл', emoji: '🌸', group: 'alive' },
    { label: 'балық', emoji: '🐟', group: 'alive' },
    { label: 'саңырауқұлақ', emoji: '🍄', group: 'alive' },
    { label: 'тас', emoji: '🪨', group: 'notalive' },
    { label: 'су', emoji: '💧', group: 'notalive' },
    { label: 'құм', emoji: '🏜️', group: 'notalive' },
    { label: 'бұлт', emoji: '☁️', group: 'notalive' },
    { label: 'тау', emoji: '⛰️', group: 'notalive' },
  ],
  6,
  'Тірі табиғат тыныс алады, қоректенеді, өседі, көбейеді.',
);

const causeEffect = bank('cause', [
  { q: 'Гүлді ұзақ уақыт суармаса, не болады?', a: 'солып қалады', w: ['тез өседі', 'түсі өзгермейді'], e: '🥀', why: 'Өсімдікке тіршілік ету үшін су керек.' },
  { q: 'Қоқысты өзенге тастаса, не болады?', a: 'су ластанады', w: ['су тазарады', 'балық көбейеді'], e: '🏞️', why: 'Қоқыс суды ластап, балықтарға зиян келтіреді.' },
  { q: 'Құстарға қыста қалай көмектесуге болады?', a: 'жемсауыт іліп, дән салу', w: ['ұясын бұзу', 'қуып жіберу'], e: '🐦' },
  { q: 'Біз қай планетада тұрамыз?', a: 'Жер', w: ['Марс', 'Ай'], e: '🌍' },
  { q: 'Жерге жылу мен жарық беретін жұлдыз —', a: 'Күн', w: ['Ай', 'Шолпан'], e: '☀️' },
  { q: 'Күн қай жақтан шығады?', a: 'шығыстан', w: ['батыстан', 'солтүстіктен'], e: '🌅' },
  { q: 'Неге тісті күніне екі рет тазалау керек?', a: 'тіс ауырмас үшін', w: ['тіс ағаруы үшін ғана', 'уақыт өткізу үшін'], e: '🪥' },
]);

export const world: Subject = {
  id: 'world',
  title: 'Дүниетану',
  emoji: '🌍',
  color: '#3f7d58',
  about: 'Жануарлар, өсімдіктер, жыл мезгілдері, адам, Қазақстан, табиғат құбылыстары',
  homeTip: 'Серуенде көрген ағаш, құс, бұлт туралы сұрақ қойыңыз: «Бұл тірі ме? Неге?». Ауа райына қарай киінуді баламен бірге таңдаңыз.',
  levels: [
    {
      level: 1,
      title: 'Мені қоршаған әлем',
      goal: 'Үй және жабайы жануарларды, жемістер мен көкөністерді ажырату',
      topics: [
        { id: 'animals', title: 'Жануарлар', gen: animals },
        { id: 'fruitveg', title: 'Жеміс пен көкөніс', gen: fruitVeg },
        { id: 'sounds', title: 'Жануарлар мен төлдері', gen: animalSounds },
      ],
    },
    {
      level: 2,
      title: 'Уақыт пен мезгіл',
      goal: 'Жыл мезгілдері, тәулік бөліктері, апта күндері',
      topics: [
        { id: 'seasons', title: 'Жыл мезгілдері', gen: seasonsQ },
        { id: 'seasonorder', title: 'Мезгілдер реті', gen: seasonsOrder },
        { id: 'dayparts', title: 'Тәулік', gen: dayParts },
        { id: 'weekdays', title: 'Апта күндері', gen: weekDays },
      ],
    },
    {
      level: 3,
      title: 'Адам және оның өмірі',
      goal: 'Сезім мүшелері, мамандықтар, ауа райына қарай киіну',
      topics: [
        { id: 'senses', title: 'Сезім мүшелері', gen: senses },
        { id: 'jobs', title: 'Мамандықтар', gen: professions },
        { id: 'weather', title: 'Ауа райы мен киім', gen: weather },
      ],
    },
    {
      level: 4,
      title: 'Табиғат пен Отан',
      goal: 'Өсу кезеңдері, судың күйлері, Қазақстан туралы білім',
      topics: [
        { id: 'plantgrowth', title: 'Өсу кезеңдері', gen: plantGrowth },
        { id: 'water', title: 'Су қасиеттері', gen: waterStates },
        { id: 'kazakhstan', title: 'Менің Қазақстаным', gen: kazakhstan },
      ],
    },
    {
      level: 5,
      title: 'Себеп пен салдар',
      goal: 'Тірі және өлі табиғат, табиғаттағы себеп-салдар, ғарыш туралы алғашқы түсінік',
      topics: [
        { id: 'living', title: 'Тірі ме, өлі ме?', gen: livingSort },
        { id: 'cause', title: 'Неге? Не болады?', gen: causeEffect },
        { id: 'kazakhstan', title: 'Менің Қазақстаным', gen: kazakhstan },
      ],
    },
  ],
};
