import { pick, rand, sample, shuffle } from '../lib/random';
import { numOptions, opt, textOptions } from './helpers';
import type { Subject, Task } from './types';

const names = [
  { n: 'Айгүл', loc: 'Айгүлде', dat: 'Айгүлге' },
  { n: 'Ерлан', loc: 'Ерланда', dat: 'Ерланға' },
  { n: 'Дана', loc: 'Данада', dat: 'Данаға' },
  { n: 'Әли', loc: 'Әлиде', dat: 'Әлиге' },
  { n: 'Аружан', loc: 'Аружанда', dat: 'Аружанға' },
  { n: 'Санжар', loc: 'Санжарда', dat: 'Санжарға' },
  { n: 'Мадина', loc: 'Мадинада', dat: 'Мадинаға' },
  { n: 'Нұрлан', loc: 'Нұрланда', dat: 'Нұрланға' },
];

const things = [
  { w: 'алма', e: '🍎' },
  { w: 'доп', e: '⚽' },
  { w: 'кітап', e: '📖' },
  { w: 'қарындаш', e: '✏️' },
  { w: 'гүл', e: '🌸' },
  { w: 'кәмпит', e: '🍬' },
  { w: 'балық', e: '🐟' },
  { w: 'жұлдыз', e: '⭐' },
];

/* ---------- 1-деңгей: 0–10 сандар ---------- */

function countTask(): Task {
  const t = pick(things);
  const n = rand(2, 10);
  return {
    kind: 'choice',
    topic: 'count',
    prompt: `Неше ${t.w} бар? Санап көр.`,
    visual: { type: 'count', emoji: t.e, n },
    options: numOptions(n, 3, 1, 2),
    answer: String(n),
    hints: [
      'Әр затты саусағыңмен көрсетіп, бір-бірлеп сана.',
      'Заттар бестен топталған. Толық топта 5 зат бар.',
      `Мұнда ${n} ${t.w} бар.`,
    ],
  };
}

function compareGroups(): Task {
  const t = pick(things);
  const a = rand(1, 8);
  let b = rand(1, 8);
  while (b === a) b = rand(1, 8);
  const more = rand(0, 1) === 0;
  const answer = more ? (a > b ? 'A' : 'B') : a < b ? 'A' : 'B';
  return {
    kind: 'choice',
    topic: 'compare',
    prompt: more ? `Қай топта ${t.w} КӨП?` : `Қай топта ${t.w} АЗ?`,
    layout: 'list',
    options: [opt(t.e.repeat(a), undefined, 'A'), opt(t.e.repeat(b), undefined, 'B')],
    answer,
    hints: [
      'Әр топты жеке-жеке сана.',
      `Бірінші топта ${a}, екінші топта ${b}.`,
      more ? `${Math.max(a, b)} саны ${Math.min(a, b)} санынан үлкен.` : `${Math.min(a, b)} саны ${Math.max(a, b)} санынан кіші.`,
    ],
  };
}

function nextNumber(): Task {
  const before = rand(0, 1) === 0;
  const n = before ? rand(1, 10) : rand(0, 9);
  const ans = before ? n - 1 : n + 1;
  return {
    kind: 'choice',
    topic: 'neighbors',
    prompt: before ? `${n} санының алдында қай сан тұрады?` : `${n} санынан кейін қай сан келеді?`,
    visual: { type: 'equation', value: before ? `? , ${n}` : `${n} , ?` },
    options: numOptions(ans, 3, 0, 2),
    answer: String(ans),
    hints: [
      'Санауды 0-ден бастап айтып көр: 0, 1, 2, 3...',
      before ? `Санағанда ${n} санына дейін қай сан айтылады?` : `${n} санын айтқан соң не айтамыз?`,
      `Жауабы: ${ans}.`,
    ],
  };
}

function orderNumbers(): Task {
  const nums = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4).sort((x, y) => x - y);
  return {
    kind: 'order',
    topic: 'order',
    prompt: 'Сандарды кішіден үлкенге қарай ретімен басып шық.',
    items: nums.map((n) => opt(String(n))),
    hints: ['Ең кіші санды тап — ол бірінші тұрады.', `Ең кіші сан — ${nums[0]}.`, `Дұрыс рет: ${nums.join(', ')}.`],
  };
}

/* ---------- 2-деңгей: 10 көлемінде қосу/азайту ---------- */

function addStory(max = 10): Task {
  const p = pick(names);
  const t = pick(things);
  const a = rand(1, max - 2);
  const b = rand(1, max - a);
  return {
    kind: 'numpad',
    topic: 'add10',
    prompt: `${p.loc} ${a} ${t.w} бар еді. ${p.dat} анасы тағы ${b} ${t.w} берді. Барлығы неше ${t.w} болды?`,
    visual: { type: 'equation', value: `${t.e.repeat(a)} + ${t.e.repeat(b)}` },
    answer: a + b,
    hints: [
      'Барлығы деген сөз — қосу керек дегенді білдіреді.',
      `${a} санынан бастап, тағы ${b} рет алға сана.`,
      `${a} + ${b} = ${a + b}`,
    ],
  };
}

function subStory(max = 10): Task {
  const p = pick(names);
  const t = pick(things);
  const a = rand(3, max);
  const b = rand(1, a - 1);
  return {
    kind: 'numpad',
    topic: 'sub10',
    prompt: `${p.loc} ${a} ${t.w} бар еді. Ол ${b} ${t.w} досына берді. Неше ${t.w} қалды?`,
    visual: { type: 'equation', value: `${a} − ${b} = ?` },
    answer: a - b,
    hints: [
      'Берді, қалды деген сөздер — азайту керек дегенді білдіреді.',
      `${a} санынан бастап, ${b} рет артқа сана.`,
      `${a} − ${b} = ${a - b}`,
    ],
  };
}

function composition(): Task {
  const total = rand(4, 10);
  const a = rand(1, total - 1);
  return {
    kind: 'choice',
    topic: 'composition',
    prompt: `${total} саны ${a} және қандай саннан тұрады?`,
    visual: { type: 'equation', value: `${a} + ? = ${total}` },
    options: numOptions(total - a, 3, 0, 2),
    answer: String(total - a),
    hints: [
      `${a} санына неше қосса, ${total} болады?`,
      `${a} санынан ${total} санына дейін санап көр.`,
      `${a} + ${total - a} = ${total}`,
    ],
  };
}

const shapes = [
  { w: 'дөңгелек', e: '⚪' },
  { w: 'үшбұрыш', e: '🔺' },
  { w: 'шаршы', e: '🟩' },
  { w: 'ромб', e: '🔷' },
];

function shapeTask(): Task {
  const s = pick(shapes);
  const others = shapes.filter((x) => x !== s).map((x) => x.w);
  return {
    kind: 'choice',
    topic: 'shapes',
    prompt: 'Бұл қандай пішін?',
    visual: { type: 'emoji', value: s.e, size: 'xl' },
    options: textOptions(s.w, sample(others, 2)),
    answer: s.w,
    hints: [
      'Пішіннің неше бұрышы бар екенін сана.',
      s.w === 'дөңгелек' ? 'Бұл пішіннің бұрышы жоқ.' : s.w === 'үшбұрыш' ? 'Бұл пішіннің 3 бұрышы бар.' : 'Бұл пішіннің 4 бұрышы бар.',
      `Бұл — ${s.w}.`,
    ],
  };
}

/* ---------- 3-деңгей: 20 көлемінде, теңге ---------- */

function add20(): Task {
  const a = rand(5, 9);
  const b = rand(11 - a, 9);
  const toTen = 10 - a;
  return {
    kind: 'numpad',
    topic: 'add20',
    prompt: 'Есепте:',
    visual: { type: 'equation', value: `${a} + ${b} = ?` },
    answer: a + b,
    hints: [
      'Алдымен 10-ға дейін толтыр.',
      `${a} + ${toTen} = 10. Енді қалған ${b - toTen} санын қос.`,
      `10 + ${b - toTen} = ${a + b}`,
    ],
  };
}

function sub20(): Task {
  const a = rand(11, 18);
  const b = rand(a - 9, 9);
  const toTen = a - 10;
  return {
    kind: 'numpad',
    topic: 'sub20',
    prompt: 'Есепте:',
    visual: { type: 'equation', value: `${a} − ${b} = ?` },
    answer: a - b,
    hints: [
      'Алдымен 10-ға дейін азайт.',
      toTen < b ? `${a} − ${toTen} = 10. Енді 10-нан тағы ${b - toTen} азайт.` : `${a} − ${b} — артқа санап көр.`,
      `${a} − ${b} = ${a - b}`,
    ],
  };
}

function missing20(): Task {
  const total = rand(11, 20);
  const a = rand(2, total - 2);
  return {
    kind: 'numpad',
    topic: 'missing',
    prompt: 'Жасырын санды тап:',
    visual: { type: 'equation', value: `${a} + ? = ${total}` },
    answer: total - a,
    hints: [
      'Жасырын сан — қосқанда жетпей тұрған бөлік.',
      `${total} − ${a} есебін шығарып көр.`,
      `${a} + ${total - a} = ${total}`,
    ],
  };
}

function compareSign(): Task {
  const a = rand(5, 20);
  const r = rand(0, 4);
  const b = r === 0 ? a : rand(5, 20);
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return {
    kind: 'choice',
    topic: 'signs',
    prompt: 'Қандай белгі қойылады?',
    visual: { type: 'equation', value: `${a}  ?  ${b}` },
    options: [opt('>'), opt('<'), opt('=')],
    answer: sign,
    hints: [
      'Белгінің ашық жағы үлкен санға қарайды: 5 > 3.',
      `Қайсысы үлкен: ${a} ме, ${b} ме?`,
      `${a} ${sign} ${b}`,
    ],
  };
}

const coinSets = [1, 2, 5, 10, 20, 50, 100, 200];

function coinsSum(maxTotal: number): Task {
  let values: number[] = [];
  let guard = 0;
  do {
    const k = rand(2, 4);
    values = Array.from({ length: k }, () => pick(coinSets.filter((c) => c <= maxTotal / 2)));
  } while (values.reduce((s, v) => s + v, 0) > maxTotal && guard++ < 50);
  values.sort((x, y) => y - x);
  const total = values.reduce((s, v) => s + v, 0);
  return {
    kind: 'numpad',
    topic: 'coins',
    prompt: 'Әмиянда барлығы неше теңге бар?',
    visual: { type: 'coins', values },
    answer: total,
    unit: '₸',
    hints: [
      'Ең үлкен тиыннан бастап қос.',
      `${values.join(' + ')} = ?`,
      `Барлығы ${total} теңге.`,
    ],
  };
}

/* ---------- 4-деңгей: 100 көлемінде, сағат, топтар ---------- */

function add100(): Task {
  const regroup = rand(0, 1) === 1;
  const a1 = regroup ? rand(2, 9) : rand(0, 8);
  const b1 = regroup ? rand(10 - a1, 9) : rand(1, 9 - a1);
  const a = rand(1, 5) * 10 + a1;
  const b = rand(1, 3) * 10 + b1;
  const at = Math.floor(a / 10) * 10;
  const bt = Math.floor(b / 10) * 10;
  return {
    kind: 'numpad',
    topic: 'add100',
    prompt: 'Есепте:',
    visual: { type: 'equation', value: `${a} + ${b} = ?` },
    answer: a + b,
    hints: [
      'Ондықтарды бөлек, бірліктерді бөлек қос.',
      `Ондықтар: ${at} + ${bt} = ${at + bt}. Бірліктер: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`,
      `${a} + ${b} = ${a + b}`,
    ],
  };
}

function sub100(): Task {
  const a = rand(30, 99);
  const b = rand(11, a - 5);
  return {
    kind: 'numpad',
    topic: 'sub100',
    prompt: 'Есепте:',
    visual: { type: 'equation', value: `${a} − ${b} = ?` },
    answer: a - b,
    hints: [
      'Алдымен ондықтарды, сосын бірліктерді азайт.',
      `${a} − ${Math.floor(b / 10) * 10} = ${a - Math.floor(b / 10) * 10}. Енді тағы ${b % 10} азайт.`,
      `${a} − ${b} = ${a - b}`,
    ],
  };
}

const fmtTime = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

function clockTask(): Task {
  const h = rand(1, 12);
  const m = pick([0, 30]);
  const right = fmtTime(h, m);
  const wrongs = new Set<string>();
  wrongs.add(fmtTime(h, m === 0 ? 30 : 0));
  wrongs.add(fmtTime((h % 12) + 1, m));
  wrongs.add(fmtTime(h === 1 ? 12 : h - 1, m));
  return {
    kind: 'choice',
    topic: 'clock',
    prompt: 'Сағат нешені көрсетіп тұр?',
    visual: { type: 'clock', h, m },
    options: textOptions(right, sample([...wrongs].filter((w) => w !== right), 2)),
    answer: right,
    hints: [
      'Қысқа тіл — сағатты, ұзын тіл — минутты көрсетеді.',
      m === 0 ? 'Ұзын тіл 12-де тұр — демек, толық сағат.' : 'Ұзын тіл 6-да тұр — демек, жарты сағат (30 минут).',
      `Сағат ${right}.`,
    ],
  };
}

function groupsTask(): Task {
  const t = pick(things);
  const g = rand(2, 5);
  const e = rand(2, 5);
  return {
    kind: 'numpad',
    topic: 'groups',
    prompt: `${g} себет бар. Әр себетте ${e} ${t.w} бар. Барлығы неше ${t.w}?`,
    visual: { type: 'groups', emoji: t.e, groups: g, each: e },
    answer: g * e,
    hints: [
      'Әр себеттегі санды қайта-қайта қос.',
      `${Array(g).fill(e).join(' + ')} = ?`,
      `${g} × ${e} = ${g * e}`,
    ],
  };
}

function twoStep(): Task {
  const t = pick(things);
  const a = rand(20, 60);
  const b = rand(5, Math.min(19, a - 5));
  const c = rand(5, 20);
  return {
    kind: 'numpad',
    topic: 'twostep',
    prompt: `Дүкенде ${a} ${t.w} болды. Таңертең ${b} ${t.w} сатылды, кешке тағы ${c} ${t.w} әкелді. Қазір дүкенде неше ${t.w} бар?`,
    answer: a - b + c,
    hints: [
      'Есепті екі қадаммен шығар: алдымен «сатылды», сосын «әкелді».',
      `1-қадам: ${a} − ${b} = ${a - b}. 2-қадам: ${a - b} + ${c} = ?`,
      `${a} − ${b} + ${c} = ${a - b + c}`,
    ],
  };
}

function placeValue(): Task {
  const n = rand(11, 99);
  const askTens = rand(0, 1) === 0;
  const ans = askTens ? Math.floor(n / 10) : n % 10;
  return {
    kind: 'choice',
    topic: 'placevalue',
    prompt: askTens ? `${n} санында неше ондық бар?` : `${n} санында неше бірлік бар?`,
    visual: { type: 'equation', value: String(n) },
    options: textOptions(String(ans), [String(askTens ? n % 10 : Math.floor(n / 10)), String((ans + 3) % 10)].filter((x, i, arr) => x !== String(ans) && arr.indexOf(x) === i)),
    answer: String(ans),
    hints: [
      'Екі таңбалы санның бірінші цифры — ондықтар, екіншісі — бірліктер.',
      `${n} = ${Math.floor(n / 10) * 10} + ${n % 10}`,
      askTens ? `${Math.floor(n / 10)} ондық.` : `${n % 10} бірлік.`,
    ],
  };
}

/* ---------- 5-деңгей: көбейту, бөлу, бөлшек, уақыт ---------- */

function multTask(): Task {
  const a = rand(2, 9);
  const b = rand(2, 9);
  return {
    kind: 'numpad',
    topic: 'mult',
    prompt: 'Көбейтуді есепте:',
    visual: { type: 'equation', value: `${a} × ${b} = ?` },
    answer: a * b,
    hints: [
      `${a} × ${b} дегеніміз — ${a} санын ${b} рет қосу.`,
      b > 2 ? `${a} × ${b - 1} = ${a * (b - 1)}. Оған тағы ${a} қос.` : `${a} + ${a} = ?`,
      `${a} × ${b} = ${a * b}`,
    ],
  };
}

function divStory(): Task {
  const t = pick(things);
  const kids = rand(2, 6);
  const each = rand(2, 8);
  return {
    kind: 'numpad',
    topic: 'div',
    prompt: `${kids * each} ${t.w} ${kids} балаға тең бөлінді. Әр балаға неше ${t.w} тиді?`,
    visual: { type: 'equation', value: `${kids * each} : ${kids} = ?` },
    answer: each,
    hints: [
      'Тең бөлу — бәріне бірдей беру.',
      `Қандай санды ${kids}-ке көбейтсе, ${kids * each} шығады? ${kids} × ? = ${kids * each}`,
      `${kids * each} : ${kids} = ${each}`,
    ],
  };
}

const fracs: [number, number][] = [
  [1, 2],
  [1, 3],
  [1, 4],
  [3, 4],
  [2, 3],
];

function fractionTask(): Task {
  const [f, p] = pick(fracs);
  const right = `${f}/${p}`;
  const others = fracs.map(([a, b]) => `${a}/${b}`).filter((x) => x !== right);
  return {
    kind: 'choice',
    topic: 'fraction',
    prompt: 'Дөңгелектің қандай бөлігі боялған?',
    visual: { type: 'fraction', parts: p, filled: f },
    options: textOptions(right, sample(others, 2)),
    answer: right,
    hints: [
      'Төменгі сан — барлық бөлік саны, жоғарғы сан — боялған бөлік саны.',
      `Дөңгелек ${p} тең бөлікке бөлінген. Неше бөлігі боялған?`,
      `Жауабы: ${right}.`,
    ],
  };
}

const goods = [
  { w: 'нан', e: '🍞', min: 150, max: 290 },
  { w: 'сүт', e: '🥛', min: 300, max: 480 },
  { w: 'дәптер', e: '📒', min: 80, max: 220 },
  { w: 'балмұздақ', e: '🍦', min: 180, max: 350 },
  { w: 'алма (1 кг)', e: '🍎', min: 350, max: 490 },
];

function changeTask(): Task {
  const g = pick(goods);
  const price = Math.round(rand(g.min, g.max) / 10) * 10;
  const paid = price < 500 ? 500 : 1000;
  return {
    kind: 'numpad',
    topic: 'change',
    prompt: `${g.e} ${g.w} ${price} теңге тұрады. Сен ${paid} теңге бердің. Сатушы саған қанша қайтарым береді?`,
    answer: paid - price,
    unit: '₸',
    hints: [
      'Қайтарым = берген ақша − заттың бағасы.',
      `${paid} − ${price} = ? Алдымен ${price} санын жақын жүздікке дейін толтыр.`,
      `${paid} − ${price} = ${paid - price} теңге.`,
    ],
  };
}

function durationTask(): Task {
  const h = rand(8, 15);
  const sm = pick([0, 15, 30]);
  const dur = pick([20, 30, 40, 45]);
  const total = h * 60 + sm + dur;
  const right = fmtTime(Math.floor(total / 60), total % 60);
  const w1 = fmtTime(Math.floor((total + 10) / 60), (total + 10) % 60);
  const w2 = fmtTime(Math.floor((total - 15) / 60), (total - 15) % 60);
  return {
    kind: 'choice',
    topic: 'duration',
    prompt: `Үйірме сағат ${fmtTime(h, sm)}-де басталып, ${dur} минутқа созылады. Ол қашан бітеді?`,
    visual: { type: 'clock', h: h > 12 ? h - 12 : h, m: sm },
    options: shuffle([opt(right), opt(w1), opt(w2)]),
    answer: right,
    hints: [
      'Басталу уақытына ұзақтықты қос.',
      `${fmtTime(h, sm)} + ${dur} минут. 60 минут = 1 сағат.`,
      `Үйірме ${right}-де бітеді.`,
    ],
  };
}


/* ---------- 6-деңгей: бөлшек, ондық бөлшек, пайыз, аудан ---------- */

const dec = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');

function fracSameDen(): Task {
  const n = pick([5, 6, 7, 8, 9, 10, 12]);
  const a = rand(1, n - 2);
  const b = rand(1, n - 1 - a);
  const plus = rand(0, 1) === 1;
  const [x, y] = plus ? [a, b] : [a + b, b];
  const ans = plus ? a + b : a;
  const right = `${ans}/${n}`;
  const wrong = new Set([`${ans}/${n * 2}`, `${plus ? ans + 1 : ans - 1 || ans + 2}/${n}`, `${x + y}/${n + n}`]);
  wrong.delete(right);
  return {
    kind: 'choice',
    topic: 'fracops',
    prompt: plus ? 'Бөлшектерді қос:' : 'Бөлшектерді азайт:',
    visual: { type: 'equation', value: `${x}/${n} ${plus ? '+' : '−'} ${y}/${n} = ?` },
    options: textOptions(right, sample([...wrong], 2)),
    answer: right,
    hints: [
      'Бөлімдері бірдей бөлшектерде тек алымдарын қосамыз немесе азайтамыз.',
      `Бөлім өзгермейді: ${n}. Алымдар: ${x} ${plus ? '+' : '−'} ${y} = ?`,
      `Жауабы: ${right}.`,
    ],
  };
}

function decimalAdd(): Task {
  const a = rand(10, 89) / 10;
  const b = rand(10, 59) / 10;
  const plus = rand(0, 1) === 1 || a <= b;
  const ans = plus ? a + b : a - b;
  const right = dec(ans);
  const wrong = [dec(ans + 0.1), dec(ans + 1), dec(Math.max(0.1, ans - 0.1))].filter((w) => w !== right);
  return {
    kind: 'choice',
    topic: 'decimals',
    prompt: 'Ондық бөлшектермен есепте:',
    visual: { type: 'equation', value: `${dec(a)} ${plus ? '+' : '−'} ${dec(b)} = ?` },
    options: textOptions(right, sample([...new Set(wrong)], 2)),
    answer: right,
    hints: [
      'Бүтін бөлігін бөлек, ондық бөлігін бөлек есепте.',
      'Үтірді үтірдің астына қойып, бағанмен есептеуге болады.',
      `Жауабы: ${right}.`,
    ],
  };
}

function percentOf(): Task {
  const pct = pick([10, 20, 25, 50, 75]);
  const base = pick([40, 60, 80, 100, 120, 200, 240, 400, 600, 800]);
  const ans = (base * pct) / 100;
  if (!Number.isInteger(ans)) return percentOf();
  return {
    kind: 'numpad',
    topic: 'percent',
    prompt: `${base} санының ${pct} пайызын тап.`,
    visual: { type: 'equation', value: `${base} · ${pct}% = ?` },
    answer: ans,
    hints: [
      '1 пайыз — санның жүзден бір бөлігі.',
      pct === 50 ? 'Елу пайыз — жартысы.' : pct === 25 ? 'Жиырма бес пайыз — төрттен бірі.' : `${base} : 100 × ${pct} = ?`,
      `Жауабы: ${ans}.`,
    ],
  };
}

function rectangle(): Task {
  const a = rand(3, 15);
  const b = rand(2, 9);
  const area = rand(0, 1) === 1;
  return {
    kind: 'numpad',
    topic: 'area',
    prompt: area
      ? `Тіктөртбұрыштың ұзындығы ${a} см, ені ${b} см. Оның ауданы неше шаршы сантиметр?`
      : `Тіктөртбұрыштың ұзындығы ${a} см, ені ${b} см. Оның периметрі неше сантиметр?`,
    answer: area ? a * b : 2 * (a + b),
    unit: area ? 'см²' : 'см',
    hints: [
      area ? 'Аудан = ұзындық × ен.' : 'Периметр — барлық қабырғаның қосындысы: (ұзындық + ен) × 2.',
      area ? `${a} × ${b} = ?` : `(${a} + ${b}) × 2 = ?`,
      `Жауабы: ${area ? a * b : 2 * (a + b)}.`,
    ],
  };
}

function orderOps(): Task {
  const a = rand(2, 20);
  const b = rand(2, 9);
  const c = rand(2, 9);
  const first = rand(0, 1) === 1;
  const ans = first ? a + b * c : b * c - Math.min(a, b * c - 1);
  const sub = Math.min(a, b * c - 1);
  return {
    kind: 'numpad',
    topic: 'orderops',
    prompt: 'Амалдардың ретін сақтап есепте:',
    visual: { type: 'equation', value: first ? `${a} + ${b} × ${c} = ?` : `${b} × ${c} − ${sub} = ?` },
    answer: ans,
    hints: [
      'Алдымен көбейту мен бөлу, сосын қосу мен азайту орындалады.',
      `Алдымен: ${b} × ${c} = ${b * c}.`,
      `Жауабы: ${ans}.`,
    ],
  };
}

/* ---------- 7-деңгей: теңдеу, теріс сан, пропорция ---------- */

function equation(): Task {
  const mul = rand(0, 1) === 1;
  const x = rand(2, mul ? 12 : 60);
  const a = rand(2, mul ? 9 : 40);
  const b = mul ? a * x : a + x;
  return {
    kind: 'numpad',
    topic: 'equation',
    prompt: 'Теңдеуді шеш, x неге тең?',
    visual: { type: 'equation', value: mul ? `${a} · x = ${b}` : `x + ${a} = ${b}` },
    answer: x,
    hints: [
      mul ? 'Белгісіз көбейткішті табу үшін көбейтіндіні белгілі көбейткішке бөлеміз.' : 'Белгісіз қосылғышты табу үшін қосындыдан белгілі қосылғышты азайтамыз.',
      mul ? `x = ${b} : ${a}` : `x = ${b} − ${a}`,
      `x = ${x}`,
    ],
  };
}

const neg = (n: number) => (n < 0 ? `−${-n}` : String(n));

function negatives(): Task {
  const a = -rand(1, 12);
  const b = rand(1, 15);
  const ans = a + b;
  const right = neg(ans);
  const wrong = [neg(-ans), neg(ans + 1), neg(ans - 2)].filter((w, i, arr) => w !== right && arr.indexOf(w) === i);
  return {
    kind: 'choice',
    topic: 'negatives',
    prompt: 'Есепте (сан түзуін елестет):',
    visual: { type: 'equation', value: `${neg(a)} + ${b} = ?` },
    options: textOptions(right, wrong.slice(0, 2)),
    answer: right,
    hints: [
      'Теріс саннан бастап, сан түзуімен оңға қарай жүр.',
      `${neg(a)} нүктесінен оңға қарай ${b} қадам жаса.`,
      `Жауабы: ${right}.`,
    ],
  };
}

function proportion(): Task {
  const t = pick([
    { w: 'дәптер', e: '📒' },
    { w: 'қарындаш', e: '✏️' },
    { w: 'кітап', e: '📕' },
  ]);
  const price = rand(3, 30) * 10;
  const n1 = rand(2, 5);
  let n2 = rand(2, 9);
  while (n2 === n1) n2 = rand(2, 9);
  return {
    kind: 'numpad',
    topic: 'proportion',
    prompt: `${t.e} ${n1} ${t.w} ${price * n1} теңге тұрады. ${n2} ${t.w} қанша тұрады?`,
    answer: price * n2,
    unit: '₸',
    hints: [
      'Алдымен біреуінің бағасын тап.',
      `Біреуі: ${price * n1} : ${n1} = ${price}. Енді ${price} × ${n2} = ?`,
      `Жауабы: ${price * n2} теңге.`,
    ],
  };
}

function discount(): Task {
  const price = pick([400, 600, 800, 1000, 1200, 2000, 2400]);
  const pct = pick([10, 20, 25, 50]);
  const ans = price - (price * pct) / 100;
  return {
    kind: 'numpad',
    topic: 'discount',
    prompt: `Ойыншықтың бағасы ${price} теңге. Дүкен ${pct} пайыз жеңілдік жасады. Жаңа баға қанша?`,
    answer: ans,
    unit: '₸',
    hints: [
      'Алдымен жеңілдіктің мөлшерін тап, сосын бағадан азайт.',
      `Жеңілдік: ${price} · ${pct}% = ${(price * pct) / 100}.`,
      `${price} − ${(price * pct) / 100} = ${ans} теңге.`,
    ],
  };
}

export const math: Subject = {
  id: 'math',
  title: 'Математика',
  emoji: '🔢',
  color: '#4f7cac',
  about: 'Сан, санау, есептер, пішін, ақша мен уақыт',
  homeTip: 'Дүкенде бірге бағаларды оқып, тиындарды санаңыз. Ас үйде қасықтарды, алмаларды санауды ойынға айналдырыңыз.',
  levels: [
    {
      level: 1,
      title: 'Сан әлемі',
      goal: '10-ға дейін санау, сандарды салыстыру және ретімен қою',
      topics: [
        { id: 'count', title: 'Санау', gen: countTask },
        { id: 'compare', title: 'Көп пе, аз ба?', gen: compareGroups },
        { id: 'neighbors', title: 'Көрші сандар', gen: nextNumber },
        { id: 'order', title: 'Ретімен қою', gen: orderNumbers },
      ],
    },
    {
      level: 2,
      title: 'Қосу мен азайту',
      goal: '10 көлемінде мәтінді есептер шығару, сан құрамы, пішіндер',
      topics: [
        { id: 'add10', title: 'Қосу', gen: () => addStory(10) },
        { id: 'sub10', title: 'Азайту', gen: () => subStory(10) },
        { id: 'composition', title: 'Сан құрамы', gen: composition },
        { id: 'shapes', title: 'Пішіндер', gen: shapeTask },
      ],
    },
    {
      level: 3,
      title: '20 көлемі және теңге',
      goal: 'Ондықтан аттап қосу-азайту, белгісіз сан, тиындарды санау',
      topics: [
        { id: 'add20', title: '10-нан аттап қосу', gen: add20 },
        { id: 'sub20', title: '10-нан аттап азайту', gen: sub20 },
        { id: 'missing', title: 'Жасырын сан', gen: missing20 },
        { id: 'signs', title: '>, <, =', gen: compareSign },
        { id: 'coins', title: 'Тиын санау', gen: () => coinsSum(50) },
      ],
    },
    {
      level: 4,
      title: '100 көлемі, сағат, топтар',
      goal: 'Екі таңбалы сандар, сағатты білу, көбейтуге дайындық, екі қадамды есеп',
      topics: [
        { id: 'add100', title: '100 көлемінде қосу', gen: add100 },
        { id: 'sub100', title: '100 көлемінде азайту', gen: sub100 },
        { id: 'placevalue', title: 'Ондық пен бірлік', gen: placeValue },
        { id: 'clock', title: 'Сағат', gen: clockTask },
        { id: 'groups', title: 'Тең топтар', gen: groupsTask },
        { id: 'twostep', title: 'Екі қадамды есеп', gen: twoStep },
      ],
    },
    {
      level: 5,
      title: 'Көбейту, бөлу, бөлшек',
      goal: 'Көбейту кестесі, тең бөлу, бөлшекті тану, қайтарымды есептеу, уақыт ұзақтығы',
      topics: [
        { id: 'mult', title: 'Көбейту кестесі', gen: multTask },
        { id: 'div', title: 'Тең бөлу', gen: divStory },
        { id: 'fraction', title: 'Бөлшек', gen: fractionTask },
        { id: 'change', title: 'Қайтарым', gen: changeTask },
        { id: 'duration', title: 'Уақыт ұзақтығы', gen: durationTask },
        { id: 'coins200', title: 'Ақша санау', gen: () => coinsSum(500) },
      ],
    },
    {
      level: 6,
      title: 'Бөлшек, ондық бөлшек, пайыз',
      goal: 'Бөлімдері бірдей бөлшектер, ондық бөлшек, санның пайызы, аудан мен периметр, амалдар реті',
      topics: [
        { id: 'fracops', title: 'Бөлшектермен амалдар', gen: fracSameDen },
        { id: 'decimals', title: 'Ондық бөлшек', gen: decimalAdd },
        { id: 'percent', title: 'Пайыз', gen: percentOf },
        { id: 'area', title: 'Аудан мен периметр', gen: rectangle },
        { id: 'orderops', title: 'Амалдар реті', gen: orderOps },
      ],
    },
    {
      level: 7,
      title: 'Теңдеу және теріс сандар',
      goal: 'Қарапайым теңдеу, теріс сандар, пропорция, жеңілдікті есептеу',
      topics: [
        { id: 'equation', title: 'Теңдеу', gen: equation },
        { id: 'negatives', title: 'Теріс сандар', gen: negatives },
        { id: 'proportion', title: 'Пропорция', gen: proportion },
        { id: 'discount', title: 'Жеңілдік', gen: discount },
      ],
    },
  ],
};
