import { describe, expect, it } from 'vitest';
import { weekStart, weeklyChallenges } from '../challenges';
import type { Progress } from '../types';

const base: Progress = { childId: 'c', levels: {}, levelHistory: [], stars: 0, spentStars: 0, village: [], attempts: [], moods: [], seconds: {}, gamesPlayed: {}, gamesByDay: {}, lessonsDone: {} };

describe('апталық сын-тегеурін', () => {
  it('апта дүйсенбіден басталады', () => {
    expect(weekStart(new Date(2026, 10, 7)).getDay()).toBe(1); // сенбі → дүйсенбі
    expect(weekStart(new Date(2026, 10, 9)).getDate()).toBe(9); // дүйсенбі өзі
  });
  it('әр аптада 3 түрлі тапсырма', () => {
    const w = weeklyChallenges(base, new Date(2026, 10, 7));
    expect(w.list).toHaveLength(3);
    expect(new Set(w.list.map((c) => c.id)).size).toBe(3);
    expect(w.allDone).toBe(false);
  });
  it('өткен аптаның әрекеттері есептелмейді', () => {
    const now = new Date(2026, 10, 7, 12);
    const old = new Date(2026, 9, 20).getTime();
    const p: Progress = { ...base, lessonLog: Array.from({ length: 10 }, (_, i) => ({ t: old + i, subject: 'math', perfect: true })) };
    expect(weeklyChallenges(p, now).list.every((c) => c.cur === 0)).toBe(true);
  });
});
