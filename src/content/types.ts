export interface Opt {
  id: string;
  label: string;
  emoji?: string;
}

interface Base {
  topic: string;
  prompt: string;
  /** Тапсырманың үстінде көрсетілетін көрнекі бөлік (эмодзи, сан, мәтін) */
  visual?: Visual;
  /** 3 сатылы кеңес: еске салу → жетелеу → көрсету */
  hints: string[];
  /** Дұрыс жауаптан кейінгі қысқа түсіндірме */
  explain?: string;
}

export type Visual =
  | { type: 'emoji'; value: string; size?: 'lg' | 'xl' }
  | { type: 'count'; emoji: string; n: number } // санауға арналған топтар (5-тен)
  | { type: 'groups'; emoji: string; groups: number; each: number } // көбейту
  | { type: 'equation'; value: string }
  | { type: 'text'; value: string } // оқу мәтіні
  | { type: 'clock'; h: number; m: number }
  | { type: 'coins'; values: number[] }
  | { type: 'fraction'; parts: number; filled: number };

export type Task =
  | (Base & { kind: 'choice'; options: Opt[]; answer: string; layout?: 'big' | 'list' })
  | (Base & { kind: 'numpad'; answer: number; unit?: string })
  | (Base & { kind: 'order'; items: Opt[] }) // items — дұрыс ретпен
  | (Base & { kind: 'sort'; groups: Opt[]; items: (Opt & { group: string })[] })
  | (Base & { kind: 'match'; pairs: [Opt, Opt][] });

export interface Topic {
  id: string;
  title: string;
  gen: () => Task;
}

export interface Level {
  level: number;
  title: string;
  goal: string; // ата-анаға түсінікті мақсат
  topics: Topic[];
}

export interface Subject {
  id: string;
  title: string;
  emoji: string;
  color: string;
  about: string;
  homeTip: string; // ата-анаға үйдегі кеңес
  speechLang?: string; // мазмұн тілі (дауыстау үшін), әдепкі — қазақ тілі
  levels: Level[];
}

export interface UpcomingSubject {
  id: string;
  title: string;
  emoji: string;
  stage: string;
}
