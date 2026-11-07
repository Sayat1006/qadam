import { describe, expect, it } from 'vitest';
import { buildLesson, decideLevel, summarize } from '../adaptive';
import type { Attempt } from '../types';

const at = (n: number, ok: boolean, level = 1, subject = 'math', topic = 'count'): Attempt[] =>
  Array.from({ length: n }, (_, i) => ({ t: i, subject, level, topic, correct: true, firstTry: ok, hints: 0, ms: 1000 }));

describe('decideLevel', () => {
  it('жылдам жол: алғашқы 6 тапсырма қатесіз → көтеріледі', () => {
    expect(decideLevel(at(6, true), 'math', 1, 5)).toBe('up');
  });
  it('8 тапсырмадан аз болса, қалады', () => {
    expect(decideLevel([...at(3, false), ...at(4, true)], 'math', 1, 5)).toBe('stay');
  });
  it('соңғы 6-ның 5-еуі бірден дұрыс → көтеріледі', () => {
    const a = [...at(4, false), ...at(1, false), ...at(5, true)];
    expect(decideLevel(a, 'math', 1, 5)).toBe('up');
  });
  it('соңғы 6-ның 4-еуі ғана → қалады', () => {
    const a = [...at(4, false), ...at(2, false), ...at(4, true)];
    expect(decideLevel(a, 'math', 1, 5)).toBe('stay');
  });
  it('ең жоғары деңгейде көтерілмейді', () => {
    expect(decideLevel(at(20, true, 5), 'math', 5, 5)).toBe('stay');
  });
});

describe('buildLesson', () => {
  it('сұралған мөлшерде сабақ құрады, 2+ деңгейде бір қайталау бар', () => {
    const items = buildLesson('math', 3, [], 6);
    expect(items).toHaveLength(6);
    expect(items.filter((i) => i.review)).toHaveLength(1);
    expect(items.find((i) => i.review)!.level).toBe(2);
  });
  it('1-деңгейде қайталау жоқ', () => {
    expect(buildLesson('kazakh', 1, [], 5).some((i) => i.review)).toBe(false);
  });
});

describe('summarize', () => {
  it('қиын тақырыпты «көмек керек» деп белгілейді', () => {
    const s = summarize(at(10, false), 'math', 1);
    expect(s.needsSupport).toBe(true);
    expect(s.weak.length).toBeGreaterThan(0);
  });
});
