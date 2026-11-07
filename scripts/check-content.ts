/* Мазмұн генераторларын тексеру: әр тақырыпты көп рет іске қосып, қателерді іздейді */
import { subjects } from '../src/content';
import { plural } from '../src/content/kazakh';
import type { Task } from '../src/content/types';

const problems: string[] = [];
const RUNS = 400;

function check(t: Task, where: string) {
  const text = JSON.stringify(t);
  if (/undefined|NaN|null/.test(text)) problems.push(`${where}: undefined/NaN/null: ${t.prompt}`);
  if (t.hints.length < 3) problems.push(`${where}: кеңес аз`);
  switch (t.kind) {
    case 'choice': {
      const ids = t.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length) problems.push(`${where}: қайталанған нұсқа ${ids.join(',')} — ${t.prompt}`);
      const labels = t.options.map((o) => o.label);
      if (new Set(labels).size !== labels.length) problems.push(`${where}: бірдей нұсқа мәтіні ${labels.join(',')}`);
      if (!ids.includes(t.answer)) problems.push(`${where}: жауап нұсқада жоқ (${t.answer})`);
      if (t.options.length < 2) problems.push(`${where}: нұсқа аз`);
      break;
    }
    case 'numpad':
      if (!Number.isInteger(t.answer) || t.answer < 0 || t.answer > 99999) problems.push(`${where}: сан жауап дұрыс емес ${t.answer} — ${t.prompt}`);
      break;
    case 'order':
      if (t.items.length < 2) problems.push(`${where}: элемент аз`);
      if (new Set(t.items.map((i) => i.id)).size !== t.items.length) problems.push(`${where}: id қайталанды`);
      break;
    case 'sort':
      if (t.items.length < 2) problems.push(`${where}: элемент аз`);
      for (const g of t.groups) if (!t.items.some((i) => i.group === g.id)) problems.push(`${where}: бос топ ${g.id}`);
      if (new Set(t.items.map((i) => i.id)).size !== t.items.length) problems.push(`${where}: id қайталанды`);
      break;
    case 'match': {
      const r = t.pairs.map((p) => p[1].label);
      if (new Set(r).size !== r.length) problems.push(`${where}: оң жақ бірдей`);
      break;
    }
  }
}

let total = 0;
for (const s of subjects) {
  if (s.levels.length < 5) problems.push(`${s.id}: деңгей саны ${s.levels.length}`);
  for (const l of s.levels) {
    for (const tp of l.topics) {
      for (let i = 0; i < RUNS; i++) {
        try {
          check(tp.gen(), `${s.id}/L${l.level}/${tp.id}`);
        } catch (e) {
          problems.push(`${s.id}/L${l.level}/${tp.id}: ҚАТЕ ${(e as Error).message}`);
        }
        total++;
      }
    }
  }
}

const expect: Record<string, string> = {
  ит: 'иттер', алма: 'алмалар', мысық: 'мысықтар', үй: 'үйлер', гүл: 'гүлдер', қоян: 'қояндар', аю: 'аюлар',
  жұлдыз: 'жұлдыздар', көлік: 'көліктер', түйе: 'түйелер', қой: 'қойлар', сиыр: 'сиырлар', піл: 'пілдер', әтеш: 'әтештер', сәбіз: 'сәбіздер',
};
for (const [w, p] of Object.entries(expect)) if (plural(w) !== p) problems.push(`plural(${w}) = ${plural(w)}, күтілген ${p}`);

const uniq = [...new Set(problems)];
console.log(`Тексерілген тапсырма: ${total}. Мәселе: ${uniq.length}`);
uniq.slice(0, 40).forEach((p) => console.log(' - ' + p));
process.exit(uniq.length ? 1 : 0);
