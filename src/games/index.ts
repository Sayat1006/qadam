import type { ComponentType } from 'react';
import { gameMeta, type GameMeta } from './meta';
import { Bazaar } from './Bazaar';
import { Caravan } from './Caravan';
import { Memory } from './Memory';
import type { GameProps } from './types';
import { Yurt } from './Yurt';
import { Asyq } from './Asyq';
import { Togyz } from './Togyz';
import { KzMap } from './KzMap';
import { Emotions } from './Emotions';

const COMPONENTS: Record<string, ComponentType<GameProps>> = {
  memory: Memory,
  caravan: Caravan,
  yurt: Yurt,
  bazaar: Bazaar,
  asyq: Asyq,
  togyz: Togyz,
  map: KzMap,
  emotions: Emotions,
};

export interface GameInfo extends GameMeta {
  Component: ComponentType<GameProps>;
}

export const games: GameInfo[] = gameMeta.map((m) => ({ ...m, Component: COMPONENTS[m.id] }));
