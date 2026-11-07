import type { Page } from '@playwright/test';

/** Сынақ деректері: әкімші, ата-ана, мұғалім, прогресі бар бір бала */
export async function seed(page: Page, opts: { theme?: string; session?: 'child' | 'parent' | 'teacher' | 'admin' | null } = {}) {
  await page.goto('/');
  await page.evaluate(async ({ theme, session }) => {
    const enc = new TextEncoder();
    const h = async (t: string) =>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(t))))
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
    const adults = [
      { id: 'u1', role: 'admin', name: 'Әкімші', username: 'admin', salt: 's', passHash: await h('s:admin12345'), createdAt: 1 },
      { id: 'u2', role: 'parent', name: 'Гүлнар', username: 'gulnar', salt: 's', passHash: await h('s:parent123'), createdAt: 1 },
      { id: 'u3', role: 'teacher', name: 'Айнұр', username: 'ainur', salt: 's', passHash: await h('s:teacher123'), createdAt: 1 },
    ];
    const now = Date.now();
    const attempts = Array.from({ length: 40 }, (_, i) => ({
      t: now - (i % 5) * 86400000 - i * 60000,
      subject: ['math', 'kazakh', 'world', 'life'][i % 4],
      level: 1,
      topic: ['count', 'firstletter', 'animals', 'emotions'][i % 4],
      correct: true,
      firstTry: i % 3 !== 0,
      hints: i % 2,
      ms: 8000,
    }));
    const child = {
      id: 'c1', name: 'Дана', birthYear: 2017, avatar: '🐼', picPass: ['🍎', '⭐', '🐟'], parentIds: ['u2'], teacherIds: ['u3'],
      settings: { dailyLimitMin: 0, breakEveryMin: 0, lessonSize: 6, focusSubject: null },
      a11y: { fontScale: 1, theme: theme ?? 'soft', readableFont: false, reduceMotion: true, sound: false, autoRead: false, simple: false },
      createdAt: now,
    };
    const progress = {
      childId: 'c1', levels: { math: 2, kazakh: 1, world: 1, life: 2, english: 1 }, levelHistory: [], stars: 60, spentStars: 10,
      village: ['flower', 'tree', 'yurt', 'sheep'], attempts, moods: [], seconds: {}, gamesPlayed: {}, gamesByDay: {}, lessonsDone: { math: 2 },
    };
    localStorage.setItem('qadam.db.v1', JSON.stringify({ version: 1, adults, children: [child], progress: { c1: progress }, notes: [] }));
    localStorage.setItem('qadam.a11y.adult', JSON.stringify({ fontScale: 1, theme: theme ?? 'soft', readableFont: false, reduceMotion: true, sound: false, autoRead: false, simple: false }));
    const map: Record<string, unknown> = { child: { kind: 'child', id: 'c1' }, parent: { kind: 'adult', id: 'u2' }, teacher: { kind: 'adult', id: 'u3' }, admin: { kind: 'adult', id: 'u1' } };
    if (session) sessionStorage.setItem('qadam.session', JSON.stringify(map[session]));
    else sessionStorage.removeItem('qadam.session');
  }, { theme: opts.theme ?? 'soft', session: opts.session ?? null });
}
