import { numberDistractors, shuffle } from '../lib/random';
import type { Opt } from './types';

export const opt = (label: string, emoji?: string, id?: string): Opt => ({ id: id ?? label, label, emoji });

/** Сан жауабы үшін 3 нұсқа (дұрыс + 2 алаңдатқыш) */
export function numOptions(answer: number, count = 3, min = 0, spread = 3): Opt[] {
  return shuffle([answer, ...numberDistractors(answer, count - 1, min, spread)]).map((n) => opt(String(n)));
}

/** Мәтін нұсқалары: дұрыс жауап + алаңдатқыштар, араласқан түрде */
export function textOptions(answer: string, wrong: string[], emojis: Record<string, string> = {}): Opt[] {
  return shuffle([answer, ...wrong]).map((l) => opt(l, emojis[l]));
}
