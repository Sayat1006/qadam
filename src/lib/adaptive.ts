/*
 * Бейімделу алгоритмі.
 * - Сабақ = N тапсырма. Әлсіз тақырыптар жиірек шығады.
 * - 2-деңгейден бастап әр сабаққа алдыңғы деңгейден 1 қайталау тапсырмасы қосылады (аралық қайталау).
 * - Деңгей көтеру: ағымдағы деңгейде кемінде 8 тапсырма + соңғы 6 тапсырманың 5-еуі бірінші реттен дұрыс.
 * - Жылдам жол: пәндегі алғашқы 6 тапсырманың бәрі бірінші реттен дұрыс болса — бірден келесі деңгей
 *   (бастапқы деңгей тым жеңіл болып қалмас үшін).
 * - Деңгей ешқашан автоматты түрде төмендемейді; оның орнына ересектерге «қолдау қажет» белгісі шығады.
 */
import { getSubject } from '../content';
import type { Task } from '../content/types';
import { pick, shuffle } from './random';
import type { Attempt } from './types';

export interface LessonItem {
  task: Task;
  level: number;
  review: boolean;
}

function taskKey(t: Task) {
  const base = t.prompt + '|' + (t.visual ? JSON.stringify(t.visual) : '');
  if (t.kind === 'choice') return base + t.answer;
  if (t.kind === 'numpad') return base + t.answer;
  if (t.kind === 'order') return base + t.items.map((i) => i.label).join();
  if (t.kind === 'sort') return base + t.items.map((i) => i.label).join();
  return base + t.pairs.map((p) => p[0].label).join();
}

export function topicAccuracy(attempts: Attempt[], subject: string, level: number) {
  const map: Record<string, { n: number; ok: number }> = {};
  attempts
    .filter((a) => a.subject === subject && a.level === level)
    .slice(-60)
    .forEach((a) => {
      map[a.topic] ??= { n: 0, ok: 0 };
      map[a.topic].n++;
      if (a.firstTry) map[a.topic].ok++;
    });
  return map;
}

export function buildLesson(subjectId: string, level: number, attempts: Attempt[], size: number): LessonItem[] {
  const subject = getSubject(subjectId);
  if (!subject) return [];
  const lvl = subject.levels.find((l) => l.level === level) ?? subject.levels[0];
  const acc = topicAccuracy(attempts, subjectId, lvl.level);

  // Салмақ: аз жаттыққан немесе қиын тақырыптар жиірек
  const weighted = lvl.topics.flatMap((t) => {
    const s = acc[t.id];
    const rate = s && s.n ? s.ok / s.n : 0.5;
    const w = s && s.n >= 3 && rate > 0.85 ? 1 : rate < 0.6 ? 3 : 2;
    return Array(w).fill(t);
  });

  const items: LessonItem[] = [];
  const seen = new Set<string>();
  let lastTopic = '';
  let guard = 0;
  const mainCount = level > 1 ? size - 1 : size;
  while (items.length < mainCount && guard++ < 200) {
    const topic = pick(weighted);
    if (topic.id === lastTopic && lvl.topics.length > 1) continue;
    const task = topic.gen();
    const k = taskKey(task);
    if (seen.has(k)) continue;
    seen.add(k);
    lastTopic = topic.id;
    items.push({ task, level: lvl.level, review: false });
  }

  if (level > 1) {
    const prev = subject.levels.find((l) => l.level === level - 1);
    if (prev) {
      const task = pick(prev.topics).gen();
      const pos = Math.floor(items.length / 2);
      items.splice(pos, 0, { task, level: prev.level, review: true });
    }
  }
  return items;
}

export type LevelDecision = 'up' | 'stay';

export function decideLevel(attempts: Attempt[], subject: string, level: number, maxLevel: number): LevelDecision {
  if (level >= maxLevel) return 'stay';
  const inSubject = attempts.filter((a) => a.subject === subject);
  const atLevel = inSubject.filter((a) => a.level === level);

  // Жылдам жол
  if (inSubject.length >= 6 && inSubject.length <= 12) {
    const first6 = inSubject.slice(0, 6);
    if (first6.every((a) => a.firstTry) && atLevel.length >= 6 && atLevel.slice(0, 6).every((a) => a.firstTry)) {
      return 'up';
    }
  }
  if (atLevel.length < 8) return 'stay';
  const last6 = atLevel.slice(-6);
  return last6.filter((a) => a.firstTry).length >= 5 ? 'up' : 'stay';
}

export interface SubjectSummary {
  subject: string;
  level: number;
  total: number;
  recentAccuracy: number | null; // соңғы 20 тапсырма, %
  strong: string[];
  weak: string[];
  needsSupport: boolean;
  avgHints: number;
}

export function summarize(attempts: Attempt[], subjectId: string, level: number): SubjectSummary {
  const subject = getSubject(subjectId)!;
  const all = attempts.filter((a) => a.subject === subjectId);
  const recent = all.slice(-20);
  const titleOf = (topic: string) => {
    for (const l of subject.levels) {
      const t = l.topics.find((x) => x.id === topic);
      if (t) return t.title;
    }
    return topic;
  };
  const byTopic: Record<string, { n: number; ok: number }> = {};
  all.slice(-80).forEach((a) => {
    byTopic[a.topic] ??= { n: 0, ok: 0 };
    byTopic[a.topic].n++;
    if (a.firstTry) byTopic[a.topic].ok++;
  });
  const strong: string[] = [];
  const weak: string[] = [];
  Object.entries(byTopic).forEach(([t, s]) => {
    if (s.n < 3) return;
    const r = s.ok / s.n;
    if (r >= 0.8) strong.push(titleOf(t));
    else if (r < 0.55) weak.push(titleOf(t));
  });
  const recentAccuracy = recent.length ? Math.round((100 * recent.filter((a) => a.firstTry).length) / recent.length) : null;
  const last10 = all.slice(-10);
  const needsSupport = last10.length >= 8 && last10.filter((a) => a.firstTry).length / last10.length < 0.4;
  const avgHints = recent.length ? recent.reduce((s, a) => s + a.hints, 0) / recent.length : 0;
  return { subject: subjectId, level, total: all.length, recentAccuracy, strong: [...new Set(strong)], weak: [...new Set(weak)], needsSupport, avgHints };
}

export function shuffleOptions<T>(arr: T[]) {
  return shuffle(arr);
}
