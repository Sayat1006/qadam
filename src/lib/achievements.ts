/* Жетістіктер мен серия — тек нақты сақталған деректерден есептеледі */
import { subjects } from '../content';
import { today } from './date';
import type { Progress } from './types';

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  done: boolean;
  progress: number; // 0..1
  hint: string; // қанша қалды
}

export function activeDays(p: Progress): Set<string> {
  const s = new Set<string>();
  Object.entries(p.seconds).forEach(([d, sec]) => sec >= 60 && s.add(d));
  p.attempts.forEach((a) => s.add(today(new Date(a.t))));
  return s;
}

export function streaks(p: Progress) {
  const days = activeDays(p);
  const d = new Date();
  let current = 0;
  // бүгін әлі оқымаса — кешеден бастап санаймыз
  if (!days.has(today(d))) d.setDate(d.getDate() - 1);
  while (days.has(today(d))) {
    current++;
    d.setDate(d.getDate() - 1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const cur = new Date(k + 'T12:00');
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return { current, best, todayDone: days.has(today()) };
}

export function badges(p: Progress): Badge[] {
  const lessons = Object.values(p.lessonsDone).reduce((a, b) => a + b, 0);
  const perfect = p.perfectLessons ?? 0;
  const autoUps = p.levelHistory.filter((h) => h.by === 'auto').length;
  const maxLevel = Math.max(1, ...Object.values(p.levels));
  const { best } = streaks(p);
  const games = Object.values(p.gamesPlayed).reduce((a, b) => a + b, 0);
  const practiced = new Set(p.attempts.map((a) => a.subject)).size;
  const mk = (id: string, icon: string, title: string, desc: string, cur: number, goal: number, unit: string): Badge => ({
    id,
    icon,
    title,
    desc,
    done: cur >= goal,
    progress: Math.min(1, cur / goal),
    hint: cur >= goal ? 'Ашылды' : `${Math.min(cur, goal)} / ${goal} ${unit}`,
  });
  return [
    mk('first', '👣', 'Бірінші қадам', 'Алғашқы сабақты аяқта', lessons, 1, 'сабақ'),
    mk('perfect', '⭐', 'Алғашқы жетістік', 'Бір сабақты қатесіз орында', perfect, 1, 'сабақ'),
    mk('levelup', '🌿', 'Жаңа деңгей', 'Кез келген пәнде деңгей көтер', autoUps, 1, 'рет'),
    mk('level3', '🌳', 'Күрделі тапсырмалар', '3-деңгейге жет', maxLevel, 3, 'деңгей'),
    mk('streak3', '🔥', 'Үш күн қатар', '3 күн қатарынан оқы', best, 3, 'күн'),
    mk('streak7', '🦅', 'Жеке мақсат', '7 күн қатарынан оқы', best, 7, 'күн'),
    mk('tasks100', '💯', 'Жүз тапсырма', '100 тапсырма орында', p.attempts.length, 100, 'тапсырма'),
    mk('allsubj', '🧭', 'Зерттеуші', `${subjects.length} пәннің бәрін байқап көр`, practiced, subjects.length, 'пән'),
    mk('games5', '🎮', 'Ойыншы', '5 ойын ойна', games, 5, 'ойын'),
    mk('village', '⛺', 'Ауыл иесі', 'Ауылыңа 5 нысан қос', p.village.length, 5, 'нысан'),
    mk('lessons10', '📚', 'Оқырман', '10 сабақ аяқта', lessons, 10, 'сабақ'),
    mk('perfect5', '🏆', 'Шебер', '5 сабақты қатесіз орында', perfect, 5, 'сабақ'),
  ];
}

/** Ағымдағы деңгейдегі келесі деңгейге дейінгі прогресс (бейімделу ережесімен бірдей) */
export function levelProgress(p: Progress, subject: string) {
  const level = p.levels[subject] ?? 1;
  const at = p.attempts.filter((a) => a.subject === subject && a.level === level);
  const last6 = at.slice(-6).filter((a) => a.firstTry).length;
  const volume = Math.min(1, at.length / 8);
  const quality = Math.min(1, last6 / 5);
  return { level, value: Math.round(100 * Math.min(volume, quality)), tasks: at.length, last6 };
}
