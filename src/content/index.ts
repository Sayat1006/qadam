import { english } from './english';
import { kazakh } from './kazakh';
import { life } from './life';
import { math } from './math';
import type { Subject, UpcomingSubject } from './types';
import { world } from './world';

export const subjects: Subject[] = [math, kazakh, world, life, english];
export const subjectIds = subjects.map((s) => s.id);

export const getSubject = (id: string) => subjects.find((s) => s.id === id);

/** Жоспардағы пәндер — құрылымы дайын, мазмұны келесі кезеңде қосылады */
export const upcoming: UpcomingSubject[] = [
  { id: 'reading', title: 'Әдебиеттік оқу', emoji: '📚', stage: '1–4 сынып' },
  { id: 'russian', title: 'Орыс тілі', emoji: '🇷🇺', stage: '1–9 сынып' },
  { id: 'science', title: 'Жаратылыстану', emoji: '🔬', stage: '1–6 сынып' },
  { id: 'digital', title: 'Цифрлық сауаттылық / Информатика', emoji: '💻', stage: '1–9 сынып' },
  { id: 'history', title: 'Қазақстан тарихы', emoji: '🏛️', stage: '5–9 сынып' },
  { id: 'geography', title: 'География', emoji: '🗺️', stage: '6–9 сынып' },
  { id: 'biology', title: 'Биология', emoji: '🧬', stage: '7–9 сынып' },
  { id: 'physics', title: 'Физика', emoji: '🧲', stage: '7–9 сынып' },
  { id: 'chemistry', title: 'Химия', emoji: '⚗️', stage: '8–9 сынып' },
  { id: 'art', title: 'Көркем еңбек', emoji: '🎨', stage: '1–9 сынып' },
  { id: 'music', title: 'Музыка', emoji: '🎵', stage: '1–6 сынып' },
  { id: 'selfknowledge', title: 'Өзін-өзі тану', emoji: '💛', stage: '1–9 сынып' },
];

export const LEVEL_NAMES: Record<number, { name: string; icon: string }> = {
  1: { name: 'Тұқым', icon: '🌱' },
  2: { name: 'Өскін', icon: '🌿' },
  3: { name: 'Бәйтерек', icon: '🌳' },
  4: { name: 'Тұлпар', icon: '🐎' },
  5: { name: 'Қыран', icon: '🦅' },
};
