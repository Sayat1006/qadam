import { pick, rand, sample, shuffle } from '../lib/random';
import { opt } from './helpers';
import type { Subject, Task } from './types';
import { bank, matcher, sorter } from './world';

const parts = matcher('pcparts', 'Құрылғы мен оның қызметін жұптастыр.', [
  ['пернетақта', 'мәтін тереміз', '⌨️'],
  ['тінтуір', 'нұсқағышты басқарамыз', '🖱️'],
  ['монитор', 'суретті көреміз', '🖥️'],
  ['динамик', 'дыбыс шығарады', '🔊'],
  ['принтер', 'қағазға басып шығарады', '🖨️'],
  ['микрофон', 'дауысты жазады', '🎙️'],
]);

/* Код-тұлпар: 3×3 тордағы жолды командамен табу */
const ARROWS = { R: '→', U: '↑', L: '←', D: '↓' } as const;
function routeTask(): Task {
  // Бастау — төменгі сол жақ (0,2); мақсат кездейсоқ
  let gx = 0;
  let gy = 2;
  while (gx === 0 && gy === 2) {
    gx = rand(0, 2);
    gy = rand(0, 2);
  }
  const moves: (keyof typeof ARROWS)[] = [...Array(gx).fill('R'), ...Array(2 - gy).fill('U')];
  const right = moves.map((m) => ARROWS[m]).join(' ');
  const grid = [0, 1, 2]
    .map((y) => [0, 1, 2].map((x) => (x === 0 && y === 2 ? '🐎' : x === gx && y === gy ? '🌾' : '⬜')).join(''))
    .join('\n');
  const wrongs = new Set<string>();
  const alt = shuffle(moves).map((m) => ARROWS[m]).join(' ');
  if (alt !== right) wrongs.add(alt);
  wrongs.add([...moves, 'R' as const].map((m) => ARROWS[m]).join(' '));
  wrongs.add(moves.map((m) => (m === 'R' ? ARROWS.L : ARROWS.D)).join(' '));
  if (moves.length > 1) wrongs.add(moves.slice(1).map((m) => ARROWS[m]).join(' '));
  wrongs.delete(right);
  const options = shuffle([right, ...sample([...wrongs].filter(Boolean), 2)]).map((x) => opt(x));
  return {
    kind: 'choice',
    topic: 'route',
    prompt: 'Код-тұлпар: тұлпар 🐎 шөпке 🌾 жетуі үшін қандай командалар керек? (Бір команда — бір шаршы.)',
    visual: { type: 'text', value: grid },
    options,
    answer: right,
    hints: ['Алдымен оңға қанша шаршы жүру керегін сана, сосын жоғары.', `Оңға: ${gx}, жоғары: ${2 - gy}.`, `Жауабы: ${right}`],
  };
}

const safety = bank('netsafety', [
  { q: 'Құпиясөзіңді кімге айтуға болады?', a: 'ата-анама ғана', w: ['досыма', 'интернеттегі таныс емес адамға'], e: '🔑' },
  { q: 'Ойында бейтаныс адам үйіңнің мекенжайын сұрады. Не істейсің?', a: 'айтпаймын, ересекке хабарлаймын', w: ['айтамын', 'суретімді жіберемін'], e: '🎮' },
  { q: 'Түсініксіз сілтеме келді: «Тегін сыйлық ал!» Не істейсің?', a: 'баспаймын, ересекке көрсетемін', w: ['бірден басамын', 'достарыма жіберемін'], e: '🎁' },
  { q: 'Экран алдында ұзақ отырғанда не істеу керек?', a: 'үзіліс жасап, көзді демалдыру', w: ['экранға жақынырақ отыру', 'жарықты өшіру'], e: '👀' },
]);

const fileTypes = sorter(
  'files',
  'Файлдарды түріне қарай бөл.',
  [
    { id: 'img', label: 'Сурет', emoji: '🖼️' },
    { id: 'txt', label: 'Мәтін', emoji: '📄' },
    { id: 'snd', label: 'Дыбыс', emoji: '🎵' },
  ],
  [
    { label: 'аю.jpg', emoji: '🖼️', group: 'img' },
    { label: 'ауыл.png', emoji: '🖼️', group: 'img' },
    { label: 'шығарма.docx', emoji: '📄', group: 'txt' },
    { label: 'тізім.txt', emoji: '📄', group: 'txt' },
    { label: 'ән.mp3', emoji: '🎵', group: 'snd' },
    { label: 'домбыра.wav', emoji: '🎵', group: 'snd' },
  ],
  6,
  'Файлдың түрін нүктеден кейінгі кеңейтуі көрсетеді: .jpg, .txt, .mp3.',
);

function pattern(): Task {
  const sets = [
    ['🔴', '🔵'],
    ['🔺', '🟩', '🟩'],
    ['⭐', '🌙', '☀️'],
    ['1', '2', '3'],
  ];
  const p = pick(sets);
  const len = p.length * 2 + rand(0, p.length - 1);
  const seq = Array.from({ length: len }, (_, i) => p[i % p.length]);
  const ans = p[len % p.length];
  const others = [...new Set(sets.flat())].filter((x) => x !== ans);
  return {
    kind: 'choice',
    topic: 'pattern',
    prompt: 'Заңдылықты тап: келесі не болады?',
    visual: { type: 'equation', value: seq.join(' ') + ' ?' },
    options: shuffle([ans, ...sample(p.filter((x) => x !== ans).concat(others), 2)]).filter((x, i, a) => a.indexOf(x) === i).map((x) => opt(x)),
    answer: ans,
    hints: ['Қайталанып тұрған бөлікті тап.', `Қайталанатын бөлік: ${p.join(' ')}.`, `Жауабы: ${ans}`],
  };
}

const conditions = bank('ifthen', [
  { q: 'Егер жаңбыр жауса, қолшатыр аламыз. Жаңбыр жауып тұр. Не істейміз?', a: 'қолшатыр аламыз', w: ['қолшатыр алмаймыз', 'үйден шықпаймыз'], e: '☔' },
  { q: 'Егер бағдаршамда жасыл жанса, жүреміз, әйтпесе тоқтаймыз. Қызыл жанып тұр. Не істейміз?', a: 'тоқтаймыз', w: ['жүреміз', 'жүгіреміз'], e: '🚦' },
  { q: '«→ командасын 3 рет қайтала» дегеніміз не?', a: '→ → →', w: ['→', '→ ↑ →'], e: '🔁' },
  { q: 'Егер сан жұп болса, 🍎 саламыз, әйтпесе 🍐. Сан — 7. Не саламыз?', a: '🍐', w: ['🍎', 'ештеңе'], e: '🔢' },
]);

export const digital: Subject = {
  id: 'digital',
  title: 'Цифрлық сауаттылық',
  emoji: '💻',
  color: '#5a6b9a',
  about: 'Компьютер, алгоритм, Код-тұлпар, қауіпсіз интернет, файлдар, логика',
  homeTip: 'Баламен бірге «робот» ойнаңыз: ол сізге «2 қадам алға, бұрыл» деп команда берсін. Интернеттегі қауіпсіздік ережелерін бірге талқылаңыз.',
  levels: [
    { level: 1, title: 'Компьютер', goal: 'Компьютер бөліктерін және олардың қызметін білу', topics: [
      { id: 'pcparts', title: 'Құрылғылар', gen: parts },
      { id: 'pattern', title: 'Заңдылық', gen: pattern },
    ] },
    { level: 2, title: 'Код-тұлпар', goal: 'Командалар тізбегін құрау (алғашқы алгоритм)', topics: [
      { id: 'route', title: 'Код-тұлпар', gen: routeTask },
      { id: 'pattern', title: 'Заңдылық', gen: pattern },
    ] },
    { level: 3, title: 'Қауіпсіз интернет', goal: 'Құпиясөз, жеке дерек, күдікті сілтеме', topics: [
      { id: 'netsafety', title: 'Қауіпсіздік', gen: safety },
      { id: 'route', title: 'Код-тұлпар', gen: routeTask },
    ] },
    { level: 4, title: 'Файлдар', goal: 'Файл түрлерін ажырату', topics: [
      { id: 'files', title: 'Файл түрлері', gen: fileTypes },
      { id: 'netsafety', title: 'Қауіпсіздік', gen: safety },
    ] },
    { level: 5, title: 'Логика мен шарт', goal: '«Егер… онда…» шарты, қайталау, заңдылық', topics: [
      { id: 'ifthen', title: 'Шарт пен қайталау', gen: conditions },
      { id: 'route', title: 'Код-тұлпар', gen: routeTask },
      { id: 'pattern', title: 'Заңдылық', gen: pattern },
    ] },
  ],
};
