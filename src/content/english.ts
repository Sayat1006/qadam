import { pick, sample, shuffle } from '../lib/random';
import { opt, textOptions } from './helpers';
import { matcher } from './world';
import type { Subject, Task } from './types';

type W = { en: string; kk: string; e: string };

const animals: W[] = [
  { en: 'cat', kk: 'мысық', e: '🐱' },
  { en: 'dog', kk: 'ит', e: '🐶' },
  { en: 'horse', kk: 'жылқы', e: '🐴' },
  { en: 'cow', kk: 'сиыр', e: '🐄' },
  { en: 'fish', kk: 'балық', e: '🐟' },
  { en: 'bird', kk: 'құс', e: '🐦' },
  { en: 'rabbit', kk: 'қоян', e: '🐰' },
  { en: 'bear', kk: 'аю', e: '🐻' },
];
const food: W[] = [
  { en: 'apple', kk: 'алма', e: '🍎' },
  { en: 'bread', kk: 'нан', e: '🍞' },
  { en: 'milk', kk: 'сүт', e: '🥛' },
  { en: 'banana', kk: 'банан', e: '🍌' },
  { en: 'egg', kk: 'жұмыртқа', e: '🥚' },
  { en: 'water', kk: 'су', e: '💧' },
];
const colors: W[] = [
  { en: 'red', kk: 'қызыл', e: '🟥' },
  { en: 'blue', kk: 'көк', e: '🟦' },
  { en: 'green', kk: 'жасыл', e: '🟩' },
  { en: 'yellow', kk: 'сары', e: '🟨' },
  { en: 'black', kk: 'қара', e: '⬛' },
  { en: 'white', kk: 'ақ', e: '⬜' },
];
const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const family: W[] = [
  { en: 'mother', kk: 'ана', e: '👩' },
  { en: 'father', kk: 'әке', e: '👨' },
  { en: 'sister', kk: 'әпке / қарындас', e: '👧' },
  { en: 'brother', kk: 'аға / іні', e: '👦' },
  { en: 'grandmother', kk: 'әже', e: '👵' },
  { en: 'grandfather', kk: 'ата', e: '👴' },
];

function pictureToWord(topic: string, list: W[]): () => Task {
  return () => {
    const w = pick(list);
    const wrong = sample(
      list.filter((x) => x !== w).map((x) => x.en),
      2,
    );
    return {
      kind: 'choice',
      topic,
      prompt: 'Суретке сәйкес ағылшын сөзін таңда.',
      visual: { type: 'emoji', value: w.e, size: 'xl' },
      options: textOptions(w.en, wrong),
      answer: w.en,
      hints: ['Тыңдау батырмасын басып, сөздерді естіп көр.', `Қазақша бұл — «${w.kk}».`, `Ағылшынша: ${w.en}.`],
    };
  };
}

function wordToPicture(topic: string, list: W[]): () => Task {
  return () => {
    const w = pick(list);
    const others = sample(
      list.filter((x) => x !== w),
      2,
    );
    return {
      kind: 'choice',
      topic,
      prompt: `Қай сурет «${w.en}»?`,
      layout: 'big',
      visual: { type: 'text', value: w.en },
      options: shuffle([w, ...others]).map((x) => opt(x.e, undefined, x.en)),
      answer: w.en,
      hints: ['Сөзді дауыстап оқып көр.', `«${w.en}» — қазақша «${w.kk}».`, `Жауабы: ${w.e}`],
    };
  };
}

function numberWord(): Task {
  const n = Math.floor(Math.random() * 10) + 1;
  return {
    kind: 'choice',
    topic: 'numbers',
    prompt: 'Бұл сан ағылшынша қалай аталады?',
    visual: { type: 'equation', value: String(n) },
    options: textOptions(numbers[n - 1], sample(numbers.filter((x) => x !== numbers[n - 1]), 2)),
    answer: numbers[n - 1],
    hints: ['One, two, three... деп санап көр.', `${n} санына дейін ағылшынша сана.`, `${n} — ${numbers[n - 1]}.`],
  };
}

const phrases = [
  { s: ['I', 'have', 'a', 'cat.'], kk: 'Менде мысық бар.' },
  { s: ['I', 'like', 'apples.'], kk: 'Мен алманы жақсы көремін.' },
  { s: ['This', 'is', 'my', 'mother.'], kk: 'Бұл — менің анам.' },
  { s: ['The', 'ball', 'is', 'red.'], kk: 'Доп қызыл.' },
  { s: ['I', 'am', 'ten.'], kk: 'Мен он жастамын.' },
  { s: ['My', 'name', 'is', 'Dana.'], kk: 'Менің атым — Дана.' },
];

function phraseOrder(): Task {
  const p = pick(phrases);
  return {
    kind: 'order',
    topic: 'phrases',
    prompt: `Сөйлем құра: «${p.kk}»`,
    items: p.s.map((x, i) => opt(x, undefined, `${i}-${x}`)),
    hints: ['Ағылшын сөйлемі кім? деген сөзден басталады.', `Бірінші сөз: ${p.s[0]}.`, p.s.join(' ')],
  };
}

const greetings = [
  { q: 'Таңертең амандасқанда не дейміз?', a: 'Good morning!', w: ['Good night!', 'Goodbye!'] },
  { q: 'Қоштасқанда не дейміз?', a: 'Goodbye!', w: ['Hello!', 'Thank you!'] },
  { q: '«Рахмет» ағылшынша қалай?', a: 'Thank you!', w: ['Sorry!', 'Hello!'] },
  { q: '«Сенің атың кім?» ағылшынша қалай?', a: "What's your name?", w: ['How old are you?', 'Where are you?'] },
  { q: '«Сен неше жастасың?» ағылшынша қалай?', a: 'How old are you?', w: ["What's your name?", 'How are you?'] },
];

function greetingTask(): Task {
  const g = pick(greetings);
  return {
    kind: 'choice',
    topic: 'greetings',
    prompt: g.q,
    layout: 'list',
    options: textOptions(g.a, g.w),
    answer: g.a,
    hints: ['Әр нұсқаны тыңдап көр.', 'Қай жағдайда айтылатынын елестет.', `Жауабы: ${g.a}`],
  };
}

export const english: Subject = {
  id: 'english',
  title: 'Ағылшын тілі',
  emoji: '🇬🇧',
  color: '#b5485d',
  about: 'Алғашқы сөздер, сандар, түстер, отбасы, қарапайым сөйлемдер',
  homeTip: 'Үйдегі заттарға ағылшынша атауын жазып, жапсырма жапсырыңыз (door, table, cup). Күніне 3 жаңа сөз жеткілікті.',
  levels: [
    {
      level: 1,
      title: 'Жануарлар',
      goal: 'Жануарлардың ағылшынша атауын тану',
      topics: [
        { id: 'animals', title: 'Animals', gen: pictureToWord('animals', animals) },
        { id: 'animals2', title: 'Тыңда да тап', gen: wordToPicture('animals2', animals) },
      ],
    },
    {
      level: 2,
      title: 'Тағам мен түстер',
      goal: 'Тағам мен түс атауларын тану',
      topics: [
        { id: 'food', title: 'Food', gen: pictureToWord('food', food) },
        { id: 'colors', title: 'Colors', gen: pictureToWord('colors', colors) },
      ],
    },
    {
      level: 3,
      title: 'Сандар мен отбасы',
      goal: '1–10 сандары, отбасы мүшелері',
      topics: [
        { id: 'numbers', title: 'Numbers', gen: numberWord },
        { id: 'family', title: 'Family', gen: pictureToWord('family', family) },
        {
          id: 'familymatch',
          title: 'Жұптастыр',
          gen: matcher('familymatch', 'Ағылшын сөзін қазақша аудармасымен жұптастыр.', family.map((f) => [f.en, f.kk, f.e] as [string, string, string])),
        },
      ],
    },
    {
      level: 4,
      title: 'Сәлемдесу',
      goal: 'Сәлемдесу, қоштасу, алғыс айту, танысу',
      topics: [
        { id: 'greetings', title: 'Greetings', gen: greetingTask },
        { id: 'colors', title: 'Colors', gen: wordToPicture('colors', colors) },
      ],
    },
    {
      level: 5,
      title: 'Алғашқы сөйлемдер',
      goal: 'Қарапайым ағылшын сөйлемдерін құрау',
      topics: [
        { id: 'phrases', title: 'Sentences', gen: phraseOrder },
        { id: 'greetings', title: 'Greetings', gen: greetingTask },
      ],
    },
  ],
};
