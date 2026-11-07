/*
 * Деректер қабаты.
 * MVP: барлық дерек осы құрылғының браузерінде (localStorage) сақталады.
 * 2-кезеңде осы модульдің функциялары Supabase шақыруларымен ауыстырылады —
 * интерфейс (функция атаулары) өзгермейді.
 */
import { useSyncExternalStore } from 'react';
import type { A11ySettings, Adult, Assignment, Child, ContentFlag, ChildSettings, DB, Goal, Progress, Role, Session } from './types';

const KEY = 'qadam.db.v1';
const SESSION_KEY = 'qadam.session';
const MAX_ATTEMPTS = 3000;

export const defaultA11y: A11ySettings = {
  fontScale: 1,
  theme: 'default',
  readableFont: false,
  reduceMotion: false,
  sound: true,
  autoRead: false,
  simple: false,
};

export const defaultChildSettings: ChildSettings = {
  dailyLimitMin: 45,
  breakEveryMin: 15,
  lessonSize: 6,
  focusSubject: null,
};

function empty(): DB {
  return { version: 1, adults: [], children: [], progress: {}, notes: [] };
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* жеке режим немесе толы жад — деректер тек жадта қалады */
  }
}

function load(): DB {
  const raw = safeGet(localStorage, KEY);
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as DB;
    if (parsed.version !== 1) return empty();
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

let db: DB = load();
let session: Session | null = (() => {
  const raw = safeGet(sessionStorage, SESSION_KEY);
  try {
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
})();

const listeners = new Set<() => void>();
let snapshot = { db, session };

function emit() {
  snapshot = { db, session };
  listeners.forEach((l) => l());
}

function commit(next: DB) {
  db = next;
  safeSet(localStorage, KEY, JSON.stringify(db));
  emit();
}

export function mutate(fn: (draft: DB) => void) {
  const draft: DB = structuredClone(db);
  fn(draft);
  commit(draft);
}

export function getDB() {
  return db;
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
  );
}

// Басқа қойындыда өзгерсе — жаңарту
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    db = load();
    emit();
  }
});

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* ---------------- Құпиясөз ---------------- */

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt: string) {
  return sha256(salt + ':' + password);
}

/* ---------------- Сессия ---------------- */

export function setSession(s: Session | null) {
  session = s;
  safeSet(sessionStorage, SESSION_KEY, s ? JSON.stringify(s) : null);
  emit();
}

export function hasAdmin() {
  return db.adults.some((a) => a.role === 'admin');
}

export async function loginAdult(username: string, password: string): Promise<Adult | null> {
  const u = db.adults.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!u) return null;
  const h = await hashPassword(password, u.salt);
  if (h !== u.passHash) return null;
  setSession({ kind: 'adult', id: u.id });
  return u;
}

export function loginChild(childId: string, picPass: string[], via?: string): boolean {
  const c = db.children.find((x) => x.id === childId);
  if (!c) return false;
  if (!via && c.picPass.join('|') !== picPass.join('|')) return false;
  setSession({ kind: 'child', id: c.id, via });
  return true;
}

export function logout() {
  setSession(null);
}

/* ---------------- Әкімші әрекеттері ---------------- */

export async function createAdult(input: { role: Role; name: string; username: string; password: string }) {
  const username = input.username.trim();
  if (db.adults.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Бұл логин бос емес');
  }
  const salt = uid();
  const passHash = await hashPassword(input.password, salt);
  const adult: Adult = {
    id: uid('u_'),
    role: input.role,
    name: input.name.trim(),
    username,
    salt,
    passHash,
    createdAt: Date.now(),
  };
  mutate((d) => {
    d.adults.push(adult);
  });
  return adult;
}

export async function resetPassword(adultId: string, password: string) {
  const salt = uid();
  const passHash = await hashPassword(password, salt);
  mutate((d) => {
    const a = d.adults.find((x) => x.id === adultId);
    if (a) {
      a.salt = salt;
      a.passHash = passHash;
    }
  });
}

export function deleteAdult(adultId: string) {
  mutate((d) => {
    d.adults = d.adults.filter((a) => a.id !== adultId);
    d.children.forEach((c) => {
      c.parentIds = c.parentIds.filter((x) => x !== adultId);
      c.teacherIds = c.teacherIds.filter((x) => x !== adultId);
    });
  });
}

export function emptyProgress(childId: string, startLevel: number, subjects: string[]): Progress {
  const levels: Record<string, number> = {};
  subjects.forEach((s) => (levels[s] = startLevel));
  return {
    childId,
    levels,
    levelHistory: [],
    stars: 0,
    spentStars: 0,
    village: [],
    attempts: [],
    moods: [],
    seconds: {},
    gamesPlayed: {},
    gamesByDay: {},
    lessonsDone: {},
  };
}

export function createChild(
  input: Omit<Child, 'id' | 'createdAt' | 'settings' | 'a11y'> & { startLevel: number },
  subjects: string[],
) {
  const { startLevel, ...rest } = input;
  const child: Child = {
    ...rest,
    id: uid('c_'),
    createdAt: Date.now(),
    settings: { ...defaultChildSettings },
    a11y: { ...defaultA11y },
  };
  mutate((d) => {
    d.children.push(child);
    d.progress[child.id] = emptyProgress(child.id, startLevel, subjects);
  });
  return child;
}

export function updateChild(childId: string, fn: (c: Child) => void) {
  mutate((d) => {
    const c = d.children.find((x) => x.id === childId);
    if (c) fn(c);
  });
}

export function deleteChild(childId: string) {
  mutate((d) => {
    d.children = d.children.filter((c) => c.id !== childId);
    delete d.progress[childId];
    d.notes = d.notes.filter((n) => n.childId !== childId);
    d.goals = (d.goals ?? []).filter((g) => g.childId !== childId);
    d.assignments = (d.assignments ?? []).map((a) => ({ ...a, childIds: a.childIds.filter((x) => x !== childId) }));
  });
}

export function updateProgress(childId: string, fn: (p: Progress) => void) {
  mutate((d) => {
    const p = d.progress[childId];
    if (!p) return;
    fn(p);
    if (p.attempts.length > MAX_ATTEMPTS) p.attempts = p.attempts.slice(-MAX_ATTEMPTS);
  });
}

export function addNote(childId: string, authorId: string, text: string) {
  mutate((d) => {
    d.notes.push({ id: uid('n_'), childId, authorId, text: text.trim(), t: Date.now() });
  });
}

export function addAssignment(a: Omit<Assignment, 'id' | 'createdAt'>) {
  mutate((d) => {
    d.assignments = [...(d.assignments ?? []), { ...a, id: uid('a_'), createdAt: Date.now() }];
  });
}
export function removeAssignment(id: string) {
  mutate((d) => {
    d.assignments = (d.assignments ?? []).filter((x) => x.id !== id);
  });
}
export function addGoal(g: Omit<Goal, 'id' | 'createdAt'>) {
  mutate((d) => {
    d.goals = [...(d.goals ?? []), { ...g, id: uid('g_'), createdAt: Date.now() }];
  });
}
export function removeGoal(id: string) {
  mutate((d) => {
    d.goals = (d.goals ?? []).filter((x) => x.id !== id);
  });
}

export function addFlag(f: Omit<ContentFlag, 'id' | 't'>) {
  mutate((d) => {
    d.contentFlags = [...(d.contentFlags ?? []), { ...f, id: uid('f_'), t: Date.now() }];
  });
}
export function resolveFlag(id: string) {
  mutate((d) => {
    d.contentFlags = (d.contentFlags ?? []).map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f));
  });
}

export function exportJSON() {
  return JSON.stringify(db, null, 2);
}

export function importJSON(text: string) {
  const parsed = JSON.parse(text) as DB;
  if (parsed.version !== 1 || !Array.isArray(parsed.adults)) throw new Error('Файл пішімі дұрыс емес');
  commit({ ...empty(), ...parsed });
}

/* ---------------- Көмекші ---------------- */

export { today } from './date';

export function childrenFor(adult: Adult | undefined) {
  if (!adult) return [];
  if (adult.role === 'admin') return db.children;
  if (adult.role === 'parent') return db.children.filter((c) => c.parentIds.includes(adult.id));
  return db.children.filter((c) => c.teacherIds.includes(adult.id));
}
