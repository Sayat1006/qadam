import { pick, sample, shuffle } from '../lib/random';
import { opt, textOptions } from './helpers';
import type { Subject, Task } from './types';
import { matcher } from './world';

type W = { ru: string; kk: string; e: string; g: 'он' | 'она' | 'оно'; pl: string };

const words: W[] = [
  { ru: 'кот', kk: 'мысық', e: '🐱', g: 'он', pl: 'коты' },
  { ru: 'дом', kk: 'үй', e: '🏠', g: 'он', pl: 'дома' },
  { ru: 'стол', kk: 'үстел', e: '🪑', g: 'он', pl: 'столы' },
  { ru: 'мяч', kk: 'доп', e: '⚽', g: 'он', pl: 'мячи' },
  { ru: 'книга', kk: 'кітап', e: '📖', g: 'она', pl: 'книги' },
  { ru: 'машина', kk: 'көлік', e: '🚗', g: 'она', pl: 'машины' },
  { ru: 'рыба', kk: 'балық', e: '🐟', g: 'она', pl: 'рыбы' },
  { ru: 'ручка', kk: 'қалам', e: '🖊️', g: 'она', pl: 'ручки' },
  { ru: 'окно', kk: 'терезе', e: '🪟', g: 'оно', pl: 'окна' },
  { ru: 'яблоко', kk: 'алма', e: '🍎', g: 'оно', pl: 'яблоки' },
  { ru: 'солнце', kk: 'күн', e: '☀️', g: 'оно', pl: 'солнца' },
  { ru: 'молоко', kk: 'сүт', e: '🥛', g: 'оно', pl: '' },
];

function firstLetter(): Task {
  const w = pick(words);
  const first = w.ru[0].toUpperCase();
  const pool = 'АБВГДЕКЛМНОПРСТУ'.split('').filter((x) => x !== first);
  return {
    kind: 'choice',
    topic: 'ru-letter',
    prompt: 'С какой буквы начинается слово? (Сөз қай әріптен басталады?)',
    visual: { type: 'emoji', value: w.e, size: 'xl' },
    options: textOptions(first, sample(pool, 2)),
    answer: first,
    hints: [`Қазақша бұл — «${w.kk}». Орысша қалай аталады?`, `Орысша: «${w.ru}».`, `Буква: ${first}.`],
  };
}

function pictureWord(): Task {
  const w = pick(words);
  const others = sample(words.filter((x) => x !== w), 2);
  return {
    kind: 'choice',
    topic: 'ru-words',
    prompt: 'Выбери слово к картинке. (Суретке сәйкес сөзді таңда.)',
    visual: { type: 'emoji', value: w.e, size: 'xl' },
    options: textOptions(w.ru, others.map((o) => o.ru)),
    answer: w.ru,
    hints: [`Қазақша: «${w.kk}».`, `Сөз «${w.ru[0]}» әрпінен басталады.`, `Ответ: ${w.ru}.`],
  };
}

function gender(): Task {
  const w = pick(words);
  return {
    kind: 'choice',
    topic: 'ru-gender',
    prompt: `Какое слово подходит: он, она или оно? «${w.ru}»`,
    visual: { type: 'emoji', value: w.e, size: 'lg' },
    options: [opt('он'), opt('она'), opt('оно')],
    answer: w.g,
    hints: [
      'Сөздің соңына қара: дауыссыз — он, -а/-я — она, -о/-е — оно.',
      `«${w.ru}» сөзі «${w.ru.slice(-1)}» әрпімен аяқталады.`,
      `${w.g} — ${w.ru}.`,
    ],
  };
}

function pluralTask(): Task {
  const w = pick(words.filter((x) => x.pl));
  const wrong = [w.ru + 'ы', w.ru + 'и', w.ru + 'а', w.ru.slice(0, -1) + 'ы'].filter((x) => x !== w.pl && x !== w.ru);
  return {
    kind: 'choice',
    topic: 'ru-plural',
    prompt: `Один — «${w.ru}». А много?`,
    visual: { type: 'emoji', value: w.e.repeat(3), size: 'lg' },
    options: textOptions(w.pl, sample([...new Set(wrong)], 2)),
    answer: w.pl,
    hints: ['Көпше түрде сөздің соңы өзгереді: -ы, -и, -а.', `Айтып көр: «много ...»`, `Правильно: ${w.pl}.`],
  };
}

const sentences = [
  ['Я', 'люблю', 'читать', 'книги.'],
  ['Мама', 'готовит', 'вкусный', 'обед.'],
  ['Кот', 'пьёт', 'молоко.'],
  ['Мы', 'идём', 'в', 'школу.'],
  ['Летом', 'светит', 'солнце.'],
];

function sentenceOrder(): Task {
  const s = pick(sentences);
  return {
    kind: 'order',
    topic: 'ru-sentence',
    prompt: 'Составь предложение. (Сөйлем құра.)',
    items: s.map((x, i) => opt(x, undefined, `${i}-${x}`)),
    hints: ['Сөйлем бас әріппен басталады.', `Первое слово: «${s[0]}».`, s.join(' ')],
  };
}

const antonyms = matcher('ru-antonyms', 'Соедини слова-противоположности. (Қарама-қарсы сөздерді жұптастыр.)', [
  ['большой', 'маленький'],
  ['день', 'ночь'],
  ['горячий', 'холодный'],
  ['высокий', 'низкий'],
  ['быстро', 'медленно'],
  ['весёлый', 'грустный'],
]);

const translate = (): Task => {
  const pairs = sample(words, 4);
  return {
    kind: 'match',
    topic: 'ru-translate',
    prompt: 'Орысша сөзді қазақша аудармасымен жұптастыр.',
    pairs: shuffle(pairs).map((w) => [opt(w.ru, w.e, 'a-' + w.ru), opt(w.kk, undefined, 'b-' + w.kk)]),
    hints: ['Суретке қара.', `Мысалы: ${pairs[0].ru} — ${pairs[0].kk}.`, pairs.map((p) => `${p.ru} — ${p.kk}`).join('; ')],
  };
};

export const russian: Subject = {
  id: 'russian',
  title: 'Орыс тілі',
  emoji: '🇷🇺',
  color: '#4b6fd8',
  about: 'Әріптер, алғашқы сөздер, род, көпше түр, сөйлем',
  homeTip: 'Үйдегі заттарды орысша атап ойнаңыз: «Это стол. Это окно.» Мультфильмдерді орысша бірге көріңіз.',
  speechLang: 'ru-RU',
  levels: [
    { level: 1, title: 'Буквы', goal: 'Сөздің бірінші әрпін табу', topics: [
      { id: 'ru-letter', title: 'Первая буква', gen: firstLetter },
      { id: 'ru-words', title: 'Слова', gen: pictureWord },
    ] },
    { level: 2, title: 'Слова', goal: 'Суретке сәйкес орысша сөзді тану, аудару', topics: [
      { id: 'ru-words', title: 'Слова', gen: pictureWord },
      { id: 'ru-translate', title: 'Перевод', gen: translate },
    ] },
    { level: 3, title: 'Он, она, оно', goal: 'Зат есімнің родын анықтау', topics: [
      { id: 'ru-gender', title: 'Род', gen: gender },
      { id: 'ru-translate', title: 'Перевод', gen: translate },
    ] },
    { level: 4, title: 'Один и много', goal: 'Көпше түрді жасау', topics: [
      { id: 'ru-plural', title: 'Множественное число', gen: pluralTask },
      { id: 'ru-gender', title: 'Род', gen: gender },
    ] },
    { level: 5, title: 'Предложения', goal: 'Сөйлем құрау, қарама-қарсы сөздер', topics: [
      { id: 'ru-sentence', title: 'Предложение', gen: sentenceOrder },
      { id: 'ru-antonyms', title: 'Антонимы', gen: antonyms },
    ] },
  ],
};
