import { describe, expect, it } from 'vitest';
import { badges, levelProgress, streaks } from '../achievements';
import { today } from '../date';
import type { Progress } from '../types';

function prog(over: Partial<Progress> = {}): Progress {
  return {
    childId: 'c', levels: { math: 1 }, levelHistory: [], stars: 0, spentStars: 0, village: [], attempts: [], moods: [],
    seconds: {}, gamesPlayed: {}, gamesByDay: {}, lessonsDone: {}, ...over,
  };
}
const day = (k: number) => {
  const d = new Date();
  d.setDate(d.getDate() - k);
  return today(d);
};

describe('streaks', () => {
  it('бүгін мен кеше оқыса — 2 күн', () => {
    expect(streaks(prog({ seconds: { [day(0)]: 300, [day(1)]: 300 } })).current).toBe(2);
  });
  it('бүгін әлі оқымаса — кешеден санайды', () => {
    expect(streaks(prog({ seconds: { [day(1)]: 300, [day(2)]: 300, [day(3)]: 300 } })).current).toBe(3);
  });
  it('1 минуттан аз уақыт есептелмейді', () => {
    expect(streaks(prog({ seconds: { [day(0)]: 30 } })).current).toBe(0);
  });
  it('ең ұзақ серияны табады', () => {
    expect(streaks(prog({ seconds: { [day(10)]: 99, [day(9)]: 99, [day(8)]: 99, [day(0)]: 99 } })).best).toBe(3);
  });
});

describe('badges', () => {
  it('бос прогресте ешбір белгі ашылмайды', () => {
    expect(badges(prog()).filter((b) => b.done)).toHaveLength(0);
  });
  it('бірінші сабақ белгісі нақты сабақтан кейін ашылады', () => {
    expect(badges(prog({ lessonsDone: { math: 1 } })).find((b) => b.id === 'first')!.done).toBe(true);
  });
});

describe('levelProgress', () => {
  it('0-ден 100%-ға дейін', () => {
    expect(levelProgress(prog(), 'math').value).toBe(0);
    const attempts = Array.from({ length: 8 }, (_, i) => ({ t: i, subject: 'math', level: 1, topic: 'x', correct: true, firstTry: true, hints: 0, ms: 1 }));
    expect(levelProgress(prog({ attempts }), 'math').value).toBe(100);
  });
});
