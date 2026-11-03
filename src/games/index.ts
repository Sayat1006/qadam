import type { ComponentType } from 'react';
import { Bazaar } from './Bazaar';
import { Caravan } from './Caravan';
import { Memory } from './Memory';
import type { GameProps } from './types';
import { Yurt } from './Yurt';

export interface GameInfo {
  id: string;
  title: string;
  emoji: string;
  skill: string;
  about: string;
  Component: ComponentType<GameProps>;
}

export const games: GameInfo[] = [
  { id: 'memory', title: 'Жұбын тап', emoji: '🃏', skill: 'Есте сақтау · Оқу', about: 'Жабық карталардан бірдей жұпты тап.', Component: Memory },
  { id: 'caravan', title: 'Әріп керуені', emoji: '🐫', skill: 'Қазақ тілі', about: 'Түйелерге әріптерді ретімен артып, сөз құра.', Component: Caravan },
  { id: 'yurt', title: 'Киіз үй тұрғыз', emoji: '⛺', skill: 'Реттілік · Мәдениет', about: 'Киіз үйдің бөліктерін дұрыс ретпен орната біл.', Component: Yurt },
  { id: 'bazaar', title: 'Сауда базары', emoji: '🛒', skill: 'Математика · Өмірлік дағды', about: 'Тиындармен дәл бағасын төле.', Component: Bazaar },
];
