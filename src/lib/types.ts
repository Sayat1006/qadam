export type Role = 'admin' | 'parent' | 'teacher';

export interface Adult {
  id: string;
  role: Role;
  name: string;
  username: string;
  passHash: string;
  salt: string;
  createdAt: number;
}

export type ThemeName = 'default' | 'soft' | 'contrast' | 'dark';

export interface A11ySettings {
  fontScale: number; // 1, 1.25, 1.5, 2
  theme: ThemeName;
  readableFont: boolean; // дислексияға ыңғайлы: кең аралық
  reduceMotion: boolean;
  sound: boolean;
  autoRead: boolean; // тапсырманы автоматты түрде дауыстап оқу
  simple: boolean; // қарапайым интерфейс: декорсыз, бір мақсат
  voice?: string; // 'browser' немесе ISSAI дауысы (kk_KZ-…)
  speechRate?: number; // дауыс жылдамдығы
}

export interface ChildSettings {
  dailyLimitMin: number; // 0 = шектеусіз
  breakEveryMin: number; // 0 = еске салмау
  lessonSize: number; // бір сабақтағы тапсырма саны
  focusSubject: string | null; // мұғалім ұсынған пән
}

export interface Child {
  id: string;
  name: string;
  birthYear: number;
  avatar: string;
  picPass: string[]; // 3 сурет-пароль
  parentIds: string[];
  teacherIds: string[];
  settings: ChildSettings;
  a11y: A11ySettings;
  createdAt: number;
}

export interface Attempt {
  t: number;
  subject: string;
  level: number;
  topic: string;
  correct: boolean; // ақыры дұрыс орындады ма
  firstTry: boolean; // бірінші реттен дұрыс па
  hints: number;
  ms: number;
}

export type MoodId = 'great' | 'good' | 'ok' | 'sad' | 'angry';

export interface Mood {
  date: string; // YYYY-MM-DD
  mood: MoodId;
}

export interface Progress {
  childId: string;
  levels: Record<string, number>;
  levelHistory: { t: number; subject: string; level: number; by: string }[];
  stars: number;
  spentStars: number;
  village: string[];
  attempts: Attempt[];
  moods: Mood[];
  seconds: Record<string, number>; // күн → секунд
  gamesPlayed: Record<string, number>;
  gamesByDay: Record<string, number>;
  lessonsDone: Record<string, number>; // пән → аяқталған сабақ саны
  perfectLessons?: number; // қатесіз аяқталған сабақтар
  seenBadges?: string[]; // хабарланған белгілер
  placement?: Record<string, { level: number; t: number }>; // бастапқы диагностика нәтижесі
  lastLesson?: { subject: string; level: number; t: number; score: number; total: number };
}

export interface Note {
  id: string;
  childId: string;
  authorId: string;
  text: string;
  t: number;
}

export interface DB {
  version: 1;
  adults: Adult[];
  children: Child[];
  progress: Record<string, Progress>;
  notes: Note[];
}

export type Session =
  | { kind: 'adult'; id: string }
  | { kind: 'child'; id: string; via?: string };
