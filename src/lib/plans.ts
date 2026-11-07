/* Тапсырма мен ЖДБ мақсатының орындалуы — нақты әрекеттерден есептеледі */
import { getSubject } from '../content';
import { today } from './date';
import type { Assignment, Goal, Progress } from './types';

export function topicTitle(subject: string, topic: string | null) {
  if (!topic) return 'кез келген тақырып';
  for (const l of getSubject(subject)?.levels ?? []) {
    const t = l.topics.find((x) => x.id === topic);
    if (t) return t.title;
  }
  return topic;
}

/** Тақырып қай деңгейде бар: баланың деңгейіне ең жақынын таңдаймыз */
export function topicLevel(subject: string, topic: string, childLevel: number) {
  const levels = (getSubject(subject)?.levels ?? []).filter((l) => l.topics.some((t) => t.id === topic)).map((l) => l.level);
  if (!levels.length) return childLevel;
  return levels.reduce((best, l) => (Math.abs(l - childLevel) < Math.abs(best - childLevel) ? l : best), levels[0]);
}

export function assignmentStatus(a: Assignment, p: Progress | undefined) {
  const done = (p?.attempts ?? []).filter((x) => x.t >= a.createdAt && x.subject === a.subject && (!a.topic || x.topic === a.topic)).length;
  const finished = done >= a.count;
  const overdue = !finished && today() > a.due;
  return { done: Math.min(done, a.count), finished, overdue };
}

export function goalStatus(g: Goal, p: Progress | undefined) {
  const recent = (p?.attempts ?? []).filter((x) => x.subject === g.subject && x.topic === g.topic).slice(-10);
  const pct = recent.length ? Math.round((100 * recent.filter((x) => x.firstTry).length) / recent.length) : 0;
  const achieved = recent.length >= 8 && pct >= g.targetPct;
  return { pct, n: recent.length, achieved, overdue: !achieved && today() > g.due };
}
