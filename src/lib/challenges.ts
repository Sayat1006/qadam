/* Апталық сын-тегеуріндер — тек нақты әрекеттерден есептеледі */
import { today } from './date';
import type { Progress } from './types';

export function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // дүйсенбі = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export interface Challenge {
  id: string;
  icon: string;
  title: string;
  cur: number;
  goal: number;
  done: boolean;
}

type Def = { id: string; icon: string; title: string; goal: number; calc: (p: Progress, from: number) => number };

const DEFS: Def[] = [
  { id: 'lessons5', icon: '📚', title: '5 сабақ аяқта', goal: 5, calc: (p, f) => (p.lessonLog ?? []).filter((l) => l.t >= f).length },
  { id: 'subjects3', icon: '🧭', title: '3 түрлі пәннен сабақ оқы', goal: 3, calc: (p, f) => new Set((p.lessonLog ?? []).filter((l) => l.t >= f).map((l) => l.subject)).size },
  { id: 'perfect1', icon: '⭐', title: '1 сабақты қатесіз орында', goal: 1, calc: (p, f) => (p.lessonLog ?? []).filter((l) => l.t >= f && l.perfect).length },
  { id: 'games3', icon: '🎮', title: '3 ойын ойна', goal: 3, calc: (p, f) => Object.entries(p.gamesByDay).filter(([d]) => d >= today(new Date(f))).reduce((a, [, n]) => a + n, 0) },
  { id: 'days4', icon: '🔥', title: '4 күн оқы', goal: 4, calc: (p, f) => new Set(p.attempts.filter((a) => a.t >= f).map((a) => today(new Date(a.t)))).size },
  { id: 'tasks40', icon: '✅', title: '40 тапсырма орында', goal: 40, calc: (p, f) => p.attempts.filter((a) => a.t >= f).length },
];

/** Аптаға 3 сын-тегеурін, апта сайын өзгереді (аптаның күніне қарай тұрақты) */
export function weeklyChallenges(p: Progress, now = new Date()) {
  const ws = weekStart(now);
  const key = today(ws);
  const seed = Math.floor(ws.getTime() / 604800000);
  const picked = [0, 1, 2].map((k) => DEFS[(seed * 7 + k * 2) % DEFS.length]);
  const uniq = picked.filter((d, i) => picked.findIndex((x) => x.id === d.id) === i);
  while (uniq.length < 3) uniq.push(DEFS.find((d) => !uniq.includes(d))!);
  const list: Challenge[] = uniq.map((d) => {
    const cur = Math.min(d.goal, d.calc(p, ws.getTime()));
    return { id: d.id, icon: d.icon, title: d.title, cur, goal: d.goal, done: cur >= d.goal };
  });
  const allDone = list.every((c) => c.done);
  const claimed = (p.claimedWeeks ?? []).includes(key);
  return { week: key, list, allDone, claimed };
}

export const WEEK_REWARD_STARS = 15;
